import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Miniflare } from "miniflare";
import {
  collectStaticCatalogBundles,
  seedPublishedProgramBundles,
} from "../app/catalog/d1-repository.ts";
import { createRuntimeCatalogRepository } from "../app/catalog/runtime-repository.ts";
import { catalogRepository } from "../content/catalog.ts";
import { practicalSpreadsheetsProgram } from "../content/programs/practical-spreadsheets.ts";

/**
 * The enrollment-to-completion release journey.
 *
 * This runs against the real built worker (`dist/server/index.js`) on a real
 * D1 binding, so it exercises routing, authentication, the mutation contract,
 * the projections and the read models exactly as a deployment would. The
 * companion release-browser-journey test drives this built Worker through
 * real Chrome, including localStorage, controls, refreshes, and a second
 * browser context.
 */
async function journeyEnvironment(d1Persist) {
  const modulesRoot = fileURLToPath(new URL("../dist/server/", import.meta.url));
  const moduleFiles = (
    await readdir(modulesRoot, { recursive: true, withFileTypes: true })
  )
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => resolve(entry.parentPath, entry.name))
    .sort();
  const entryPoint = resolve(modulesRoot, "index.js");
  const workerModules = [
    entryPoint,
    ...moduleFiles.filter((file) => file !== entryPoint),
  ].map((path) => ({ type: "ESModule", path }));

  const miniflare = new Miniflare({
    ...(d1Persist ? { d1Persist } : {}),
    workers: [
      {
        name: "course-atlas",
        modules: workerModules,
        modulesRoot,
        compatibilityDate: "2026-05-15",
        compatibilityFlags: ["nodejs_compat"],
        d1Databases: ["DB"],
        serviceBindings: { ASSETS: "test-assets" },
      },
      {
        name: "test-assets",
        modules: true,
        compatibilityDate: "2026-05-15",
        script:
          "export default { fetch() { return new Response('Not found', { status: 404 }); } }",
      },
    ],
  });
  return {
    miniflare,
    database: await miniflare.getD1Database("DB", "course-atlas"),
  };
}

async function phase6DatabaseEnvironment(d1Persist) {
  const miniflare = new Miniflare({
    d1Persist,
    modules: true,
    script: "export default { fetch() { return new Response('ok'); } }",
    d1Databases: ["DB"],
  });
  const database = await miniflare.getD1Database("DB");
  const migrationRoot = new URL("../drizzle/", import.meta.url);
  const migrationFiles = (await readdir(migrationRoot))
    .filter((file) => /^000[0-4]_.+\.sql$/u.test(file))
    .sort();
  assert.equal(
    migrationFiles.length,
    5,
    "The deployed Phase 6 schema must be represented by migrations 0000–0004.",
  );
  for (const file of migrationFiles) {
    const sql = await readFile(new URL(file, migrationRoot), "utf8");
    for (const statement of sql
      .split("--> statement-breakpoint")
      .map((value) => value.trim())
      .filter(Boolean)) {
      const result = await database.prepare(statement).run();
      assert.notEqual(result.success, false, result.error ?? statement);
    }
  }
  return { miniflare, database };
}

const PROGRAM_VERSION_ID = "prv_practical_spreadsheets_2026_1";
const COURSE_VERSION_ID = "crv_practical_spreadsheets_2026_1";
const REQUIREMENT_GROUP_ID = "req_spreadsheets_complete_course";
const UNIT_IDS = [
  "unt_spreadsheets_01",
  "unt_spreadsheets_02",
  "unt_spreadsheets_03",
  "unt_spreadsheets_04",
  "unt_spreadsheets_05",
  "unt_spreadsheets_06",
  "unt_spreadsheets_07",
  "unt_spreadsheets_08",
];
/** Units whose kind or assessment kind demands a produced artifact. */
const PROJECT_UNIT_IDS = [
  "unt_spreadsheets_04",
  "unt_spreadsheets_06",
  "unt_spreadsheets_08",
];
const ASSESSMENTS = [
  { id: "asv_spreadsheets_reconciliation_2026_1", unitId: "unt_spreadsheets_04" },
  { id: "asv_spreadsheets_capstone_2026_1", unitId: "unt_spreadsheets_08" },
];

/** One learner, reached from two different devices. */
const learnerHeaders = {
  accept: "application/json",
  "content-type": "application/json",
  "oai-authenticated-user-id": "acct_release_journey_learner",
  "oai-authenticated-user-email": "journey@example.test",
};
/**
 * The learner-view routes read the real clock, exactly as a deployment does.
 * Anchoring enrollment to today keeps the journey deterministic whenever it
 * runs, instead of quietly passing only on some weekdays.
 */
const TODAY = new Date().toISOString().slice(0, 10);
const ALL_STUDY_DAYS = [0, 1, 2, 3, 4, 5, 6];
const DEVICE_A = "device-journey-laptop";
const DEVICE_B = "device-journey-phone";

function progressQuery(clientImportId) {
  const query = new URL("http://localhost/api/learner-progress");
  query.searchParams.set("programVersionId", PROGRAM_VERSION_ID);
  query.searchParams.set("clientImportId", clientImportId);
  query.searchParams.set("returnTo", "/programs/practical-spreadsheets");
  return query;
}

async function readProgress(miniflare, clientImportId) {
  const response = await miniflare.dispatchFetch(progressQuery(clientImportId), {
    headers: learnerHeaders,
  });
  const payload = await response.json();
  assert.equal(response.status, 200, JSON.stringify(payload));
  return payload;
}

/**
 * A device may not write until it has declared what to do with any local
 * progress. A brand-new device has none, so it consents to cloud-only.
 */
async function resolveCloudOnlyImport(miniflare, deviceId, expectedOwnerKey) {
  const response = await miniflare.dispatchFetch(
    "http://localhost/api/learner-progress/import",
    {
      method: "POST",
      headers: { ...learnerHeaders, origin: "http://localhost" },
      body: JSON.stringify({
        schemaVersion: 3,
        storageNamespace: "course-atlas-progress-v3",
        clientImportId: deviceId,
        deviceId,
        expectedOwnerKey,
        disposition: "cloud",
        activeProgramVersionId: PROGRAM_VERSION_ID,
        programs: {},
      }),
    },
  );
  const payload = await response.json();
  assert.equal(response.status, 200, JSON.stringify(payload));
  assert.equal(payload.receipt.disposition, "cloud");
  return payload;
}

/** Signs a device in and clears its import gate in one step. */
async function joinDevice(miniflare, deviceId) {
  const initial = await readProgress(miniflare, deviceId);
  assert.equal(initial.authenticated, true);
  await resolveCloudOnlyImport(miniflare, deviceId, initial.ownerKey);
  return readProgress(miniflare, deviceId);
}

async function mutate(miniflare, { deviceId, clientMutationId, baseRevision, operations }) {
  const response = await miniflare.dispatchFetch(
    "http://localhost/api/learner-progress",
    {
      method: "PATCH",
      headers: { ...learnerHeaders, origin: "http://localhost" },
      body: JSON.stringify({
        schemaVersion: 3,
        programVersionId: PROGRAM_VERSION_ID,
        clientImportId: deviceId,
        deviceId,
        clientMutationId,
        baseRevision,
        operations,
      }),
    },
  );
  const payload = await response.json();
  assert.equal(response.status, 200, JSON.stringify(payload));
  assert.equal(payload.acknowledgedMutationId, clientMutationId);
  return payload;
}

async function readView(miniflare, view) {
  const query = new URL(`http://localhost/api/learner-views/${view}`);
  query.searchParams.set("programVersionId", PROGRAM_VERSION_ID);
  const response = await miniflare.dispatchFetch(query, {
    headers: learnerHeaders,
  });
  const payload = await response.json();
  assert.equal(response.status, 200, JSON.stringify(payload));
  return payload;
}

test("criteria 6 and 12: one learner goes from enrollment to a completed pathway, across a refresh and a second device", async (t) => {
  const { miniflare } = await journeyEnvironment();
  t.after(() => miniflare.dispose());

  // ---- 1. Anonymous learners are turned away with a safe route, not data.
  const anonymous = await miniflare.dispatchFetch(progressQuery(DEVICE_A), {
    headers: { accept: "application/json" },
  });
  assert.equal(anonymous.status, 401);
  assert.deepEqual(await anonymous.json(), {
    authenticated: false,
    signInPath:
      "/signin-with-chatgpt?return_to=%2Fprograms%2Fpractical-spreadsheets",
  });

  // ---- 2. Enrol from the laptop.
  const initial = await joinDevice(miniflare, DEVICE_A);
  assert.equal(initial.progress.revision, 0);

  const enrolled = await mutate(miniflare, {
    deviceId: DEVICE_A,
    clientMutationId: "journey-enroll",
    baseRevision: initial.progress.revision,
    operations: [
      {
        type: "set-enrollment",
        enrollment: {
          startDate: TODAY,
          paceHoursPerWeek: 10,
          preferredStudyDays: ALL_STUDY_DAYS,
          timezone: "UTC",
          enrolledAt: `${TODAY}T09:00:00.000Z`,
          status: "enrolled",
        },
      },
      {
        type: "set-requirement-selection",
        requirementGroupId: REQUIREMENT_GROUP_ID,
        courseVersionIds: [COURSE_VERSION_ID],
      },
    ],
  });
  assert.equal(enrolled.progress.revision, 1);

  // ---- 3. Today hands back real, dated work.
  const today = await readView(miniflare, "today");
  assert.equal(today.authenticated, true);
  assert.equal(today.program.programVersionId, PROGRAM_VERSION_ID);
  assert.ok(today.queue.blocks.length > 0, "Today produced no assignments.");
  for (const block of today.queue.blocks) {
    assert.equal(block.courseVersionId, COURSE_VERSION_ID);
    assert.ok(block.activity.length > 0);
    assert.ok(block.where.length > 0);
    assert.ok(block.produce.length > 0);
    assert.ok(block.plannedMinutes > 0);
  }
  assert.equal(today.queue.isEnrolled, true);
  assert.equal(today.queue.totalUnits, UNIT_IDS.length);
  assert.equal(today.queue.totalCompletedUnits, 0);

  // ---- 4. Do the learning work and submit the project evidence.
  let revision = enrolled.progress.revision;
  for (const [index, learningUnitId] of UNIT_IDS.entries()) {
    const operations = [
      {
        type: "set-unit-completion",
        courseVersionId: COURSE_VERSION_ID,
        learningUnitId,
        completed: true,
      },
    ];
    if (PROJECT_UNIT_IDS.includes(learningUnitId)) {
      operations.push({
        type: "upsert-unit-evidence",
        evidence: {
          learningUnitId,
          courseVersionId: COURSE_VERSION_ID,
          textOrUrl: `https://example.test/journey/${learningUnitId}`,
          updatedAt: "2026-08-20T10:00:00.000Z",
        },
      });
    }
    const applied = await mutate(miniflare, {
      deviceId: DEVICE_A,
      clientMutationId: `journey-unit-${index}`,
      baseRevision: revision,
      operations,
    });
    revision = applied.progress.revision;
  }

  // Learning work alone must not pass the course.
  const beforeAssessments = await readView(miniflare, "record");
  assert.equal(beforeAssessments.record.pathwayRequirementsCompleted, false);
  assert.equal(beforeAssessments.record.courses[0].passed, false);
  assert.equal(
    beforeAssessments.record.courses[0].completedUnits,
    UNIT_IDS.length,
  );
  assert.equal(beforeAssessments.record.courses[0].masteryState, "assessment-due");

  // ---- 5. Sit the assessments. The first checkpoint is machine-checked.
  async function recordAttempt(clientMutationId, attempt) {
    const applied = await mutate(miniflare, {
      deviceId: DEVICE_A,
      clientMutationId,
      baseRevision: revision,
      operations: [
        {
          type: "upsert-assessment-attempt",
          attempt: {
            id: attempt.id,
            assessmentVersionId: attempt.assessmentVersionId,
            courseVersionId: COURSE_VERSION_ID,
            attemptNumber: attempt.attemptNumber,
            status: "evaluated",
            startedAt: `${attempt.day}T09:00:00.000Z`,
            submittedAt: `${attempt.day}T11:00:00.000Z`,
            submissionEvidence: [
              `https://example.test/journey/${attempt.id}`,
            ],
            result: {
              score: attempt.score,
              maximumScore: 100,
              passed: attempt.score >= 60,
              evaluationMethod: attempt.evaluationMethod,
              ...(attempt.feedback ? { feedback: attempt.feedback } : {}),
              evaluatedAt: `${attempt.day}T12:00:00.000Z`,
            },
          },
        },
      ],
    });
    revision = applied.progress.revision;
    return applied;
  }

  await recordAttempt("journey-attempt-reconciliation", {
    id: "journey-attempt-reconciliation-1",
    assessmentVersionId: ASSESSMENTS[0].id,
    attemptNumber: 1,
    score: 88,
    evaluationMethod: "automatic",
    day: "2026-08-21",
  });

  // ---- 6. The capstone is failed first: that is a retry, never a pass.
  await recordAttempt("journey-attempt-capstone-fail", {
    id: "journey-attempt-capstone-1",
    assessmentVersionId: ASSESSMENTS[1].id,
    attemptNumber: 1,
    score: 41,
    evaluationMethod: "self",
    feedback: "Sensitivity analysis missing.",
    day: "2026-08-22",
  });

  const afterFailure = await readView(miniflare, "record");
  assert.equal(afterFailure.record.courses[0].passed, false);
  assert.equal(afterFailure.record.courses[0].masteryState, "retry");
  assert.equal(afterFailure.record.pathwayRequirementsCompleted, false);

  // ---- 7. The retry passes; the failed attempt stays in the history.
  await recordAttempt("journey-attempt-capstone-pass", {
    id: "journey-attempt-capstone-2",
    assessmentVersionId: ASSESSMENTS[1].id,
    attemptNumber: 2,
    score: 91,
    evaluationMethod: "peer",
    day: "2026-08-25",
  });

  // ---- 8. The pathway is now complete, and says so honestly.
  const completed = await readView(miniflare, "record");
  const recordedCourse = completed.record.courses[0];
  assert.equal(recordedCourse.passed, true);
  assert.equal(recordedCourse.masteryState, "passed");
  assert.equal(completed.record.pathwayRequirementsCompleted, true);
  assert.equal(completed.record.requirementEvaluation.satisfied, true);
  assert.equal(completed.record.totals.passedCourses, 1);
  assert.ok(
    recordedCourse.canonicalPath.startsWith(
      "/programs/practical-spreadsheets/courses/",
    ),
    `Course link ${recordedCourse.canonicalPath} is not canonical.`,
  );

  // The failed attempt is preserved beside the passing retry.
  const capstone = recordedCourse.assessments.find(
    (assessment) => assessment.assessmentVersionId === ASSESSMENTS[1].id,
  );
  assert.ok(capstone);
  assert.deepEqual(
    capstone.attempts.map((attempt) => attempt.attemptNumber),
    [1, 2],
  );
  assert.equal(capstone.attempts[0].passed, false);
  assert.equal(capstone.attempts[1].passed, true);

  // Review methods are recorded rather than assumed.
  const reviewStatuses = new Set(
    completed.record.evidence.map((evidence) => evidence.reviewStatus),
  );
  assert.ok(reviewStatuses.has("self-attested"));
  assert.ok(reviewStatuses.has("automatically-checked"));
  assert.ok(reviewStatuses.has("peer-reviewed"));

  // ---- 9. Refresh: a fresh request against the same D1 sees the same state.
  const beforeRefresh = await readProgress(miniflare, DEVICE_A);
  const afterRefresh = await readProgress(miniflare, DEVICE_A);
  assert.equal(afterRefresh.progress.revision, beforeRefresh.progress.revision);
  assert.deepEqual(afterRefresh.progress.enrollment, beforeRefresh.progress.enrollment);
  assert.deepEqual(
    afterRefresh.progress.unitEvidences,
    beforeRefresh.progress.unitEvidences,
  );
  assert.deepEqual(
    afterRefresh.progress.assessmentAttempts,
    beforeRefresh.progress.assessmentAttempts,
  );
  assert.equal(
    Object.keys(afterRefresh.progress.unitEvidences).length,
    PROJECT_UNIT_IDS.length,
  );
  assert.equal(
    Object.keys(afterRefresh.progress.assessmentAttempts).length,
    3,
  );

  // ---- 10. Another device: same learner, no re-enrolment, nothing clobbered.
  // The new device must still declare its own import decision before writing.
  const phoneFirstRead = await readProgress(miniflare, DEVICE_B);
  const blockedPhoneWrite = await miniflare.dispatchFetch(
    "http://localhost/api/learner-progress",
    {
      method: "PATCH",
      headers: { ...learnerHeaders, origin: "http://localhost" },
      body: JSON.stringify({
        schemaVersion: 3,
        programVersionId: PROGRAM_VERSION_ID,
        clientImportId: DEVICE_B,
        deviceId: DEVICE_B,
        clientMutationId: "journey-phone-premature",
        baseRevision: phoneFirstRead.progress.revision,
        operations: [
          {
            type: "set-unit-completion",
            courseVersionId: COURSE_VERSION_ID,
            learningUnitId: UNIT_IDS[0],
            completed: false,
          },
        ],
      }),
    },
  );
  assert.equal(blockedPhoneWrite.status, 409);
  assert.match(
    (await blockedPhoneWrite.json()).error,
    /import choice/i,
  );

  const phone = await joinDevice(miniflare, DEVICE_B);
  assert.equal(phone.progress.revision, beforeRefresh.progress.revision);
  assert.deepEqual(phone.progress.enrollment, beforeRefresh.progress.enrollment);
  assert.deepEqual(
    phone.progress.unitEvidences,
    beforeRefresh.progress.unitEvidences,
  );
  assert.deepEqual(
    phone.progress.courses[COURSE_VERSION_ID].completedUnitIds.slice().sort(),
    [...UNIT_IDS].sort(),
  );

  const phoneRecord = await readView(miniflare, "record");
  assert.equal(phoneRecord.record.pathwayRequirementsCompleted, true);

  // A phone edit lands without destroying laptop evidence...
  const fromPhone = await mutate(miniflare, {
    deviceId: DEVICE_B,
    clientMutationId: "journey-phone-evidence",
    baseRevision: phone.progress.revision,
    operations: [
      {
        type: "upsert-unit-evidence",
        evidence: {
          learningUnitId: "unt_spreadsheets_06",
          courseVersionId: COURSE_VERSION_ID,
          textOrUrl: "https://example.test/journey/revised-from-phone",
          updatedAt: "2026-08-26T08:00:00.000Z",
        },
      },
    ],
  });
  assert.equal(fromPhone.progress.revision, phone.progress.revision + 1);

  // ...and the laptop sees it on its next read.
  const laptopAfterPhone = await readProgress(miniflare, DEVICE_A);
  assert.equal(
    laptopAfterPhone.progress.unitEvidences.unt_spreadsheets_06.textOrUrl,
    "https://example.test/journey/revised-from-phone",
  );
  for (const unitId of PROJECT_UNIT_IDS.filter(
    (id) => id !== "unt_spreadsheets_06",
  )) {
    assert.equal(
      laptopAfterPhone.progress.unitEvidences[unitId].textOrUrl,
      `https://example.test/journey/${unitId}`,
      `Evidence for ${unitId} was lost when the phone wrote.`,
    );
  }
  assert.equal(
    Object.keys(laptopAfterPhone.progress.assessmentAttempts).length,
    3,
  );

  // A stale device is told to rebase rather than silently overwriting.
  const stale = await miniflare.dispatchFetch(
    "http://localhost/api/learner-progress",
    {
      method: "PATCH",
      headers: { ...learnerHeaders, origin: "http://localhost" },
      body: JSON.stringify({
        schemaVersion: 3,
        programVersionId: PROGRAM_VERSION_ID,
        clientImportId: DEVICE_A,
        deviceId: DEVICE_A,
        clientMutationId: "journey-stale-write",
        baseRevision: phone.progress.revision - 1,
        operations: [
          {
            type: "set-unit-completion",
            courseVersionId: COURSE_VERSION_ID,
            learningUnitId: "unt_spreadsheets_01",
            completed: false,
          },
        ],
      }),
    },
  );
  const stalePayload = await stale.json();
  assert.equal(stale.status, 409, JSON.stringify(stalePayload));
  assert.equal(stalePayload.conflict, true);
  assert.equal(stalePayload.reason, "revision");

  const finalRecord = await readView(miniflare, "record");
  assert.equal(finalRecord.record.pathwayRequirementsCompleted, true);
  assert.equal(finalRecord.record.courses[0].completedUnits, UNIT_IDS.length);
});

test("criterion 11: learner views stay scoped to the active learner's program", async (t) => {
  const { miniflare, database } = await journeyEnvironment();
  t.after(() => miniflare.dispose());

  const initial = await joinDevice(miniflare, DEVICE_A);
  await mutate(miniflare, {
    deviceId: DEVICE_A,
    clientMutationId: "scope-enroll",
    baseRevision: initial.progress.revision,
    operations: [
      {
        type: "set-enrollment",
        enrollment: {
          startDate: TODAY,
          paceHoursPerWeek: 10,
          preferredStudyDays: ALL_STUDY_DAYS,
          timezone: "UTC",
          enrolledAt: `${TODAY}T09:00:00.000Z`,
          status: "enrolled",
        },
      },
    ],
  });

  const today = await readView(miniflare, "today");
  const record = await readView(miniflare, "record");

  // The catalog holds six programs; a learner page may only carry the one.
  const publications = await database
    .prepare("SELECT COUNT(*) AS total FROM catalog_bundles")
    .first();
  assert.ok(
    publications.total >= 6,
    `Expected a multi-program catalog, found ${publications.total}.`,
  );

  for (const [name, payload] of [
    ["today", today],
    ["record", record],
  ]) {
    const serialized = JSON.stringify(payload);
    for (const foreignSlug of [
      "computer-science",
      "electrical-engineering",
      "mechanical-engineering",
      "physics",
      "mathematics",
    ]) {
      assert.ok(
        !serialized.includes(foreignSlug),
        `The ${name} view leaked the ${foreignSlug} catalog.`,
      );
    }
    assert.ok(
      !serialized.includes("prv_course_atlas_ee"),
      `The ${name} view leaked another program version.`,
    );
  }

  assert.ok(
    JSON.stringify(today).length < 128_000,
    "The Today payload exceeded its budget.",
  );
  assert.ok(
    JSON.stringify(record).length < 256_000,
    "The record payload exceeded its budget.",
  );
});

test("criterion 10: the deployed Phase 6 D1 schema upgrades additively to the current release", async (t) => {
  const persistRoot = await mkdtemp(join(tmpdir(), "course-atlas-phase6-upgrade-"));
  t.after(() => rm(persistRoot, { recursive: true, force: true }));

  const legacy = await phase6DatabaseEnvironment(persistRoot);
  let legacyOpen = true;
  t.after(async () => {
    if (legacyOpen) await legacy.miniflare.dispose();
  });
  const phase6Bundles = catalogRepository.listPrograms().flatMap((program) =>
    catalogRepository
      .listVersions(program.slug)
      .filter(
        (version) =>
          !(program.slug === "computer-science" && version === "1.2.0"),
      )
      .map((version) => catalogRepository.loadBySlug(program.slug, version))
      .filter(Boolean),
  );
  assert.equal(phase6Bundles.length, 7);
  await seedPublishedProgramBundles(legacy.database, phase6Bundles);

  const learnerId = "lrn_release_phase6_upgrade_fixture";
  const projectUnitId = PROJECT_UNIT_IDS[0];
  await legacy.database.batch([
    legacy.database
      .prepare("INSERT INTO learners (id) VALUES (?)")
      .bind(learnerId),
    legacy.database
      .prepare(
        `INSERT INTO learner_program_progress (
           learner_id, program_version_id, bundle_id
         ) VALUES (?, ?, ?)`,
      )
      .bind(learnerId, PROGRAM_VERSION_ID, practicalSpreadsheetsProgram.id),
    legacy.database
      .prepare(
        `INSERT INTO learner_program_states (
           learner_id, program_version_id, revision, enrollment_status,
           start_date, pace_hours_per_week, study_days_json,
           timezone, enrolled_at
         ) VALUES (?, ?, 3, 'enrolled', ?, 10, '[1,2,3,4,5]', 'UTC', ?)`,
      )
      .bind(learnerId, PROGRAM_VERSION_ID, TODAY, `${TODAY}T09:00:00.000Z`),
    legacy.database
      .prepare(
        `INSERT INTO learner_unit_states (
           learner_id, program_version_id, course_version_id,
           learning_unit_id, status, completed_at
         ) VALUES (?, ?, ?, ?, 'completed', ?)`,
      )
      .bind(
        learnerId,
        PROGRAM_VERSION_ID,
        COURSE_VERSION_ID,
        UNIT_IDS[0],
        `${TODAY}T10:00:00.000Z`,
      ),
    legacy.database
      .prepare(
        `INSERT INTO learner_unit_evidence (
           learner_id, program_version_id, course_version_id,
           learning_unit_id, status, text_or_url, submitted_at
         ) VALUES (?, ?, ?, ?, 'active', ?, ?)`,
      )
      .bind(
        learnerId,
        PROGRAM_VERSION_ID,
        COURSE_VERSION_ID,
        projectUnitId,
        "https://example.test/release/phase6-evidence",
        `${TODAY}T10:05:00.000Z`,
      ),
  ]);

  const oldPublications = await legacy.database
    .prepare(
      `SELECT id, program_version_id, payload_hash
       FROM catalog_bundles
       ORDER BY id`,
    )
    .all();
  assert.equal(oldPublications.results.length, 7);
  await legacy.miniflare.dispose();
  legacyOpen = false;

  const current = await journeyEnvironment(persistRoot);
  t.after(() => current.miniflare.dispose());
  const response = await current.miniflare.dispatchFetch(
    "http://localhost/programs/practical-spreadsheets",
    { headers: { accept: "text/html" } },
  );
  assert.equal(response.status, 200);

  const preserved = await current.database
    .prepare(
      `SELECT id, program_version_id, payload_hash
       FROM catalog_bundles
       WHERE id IN (${oldPublications.results.map(() => "?").join(", ")})
       ORDER BY id`,
    )
    .bind(...oldPublications.results.map((row) => row.id))
    .all();
  assert.deepEqual(preserved.results, oldPublications.results);
  assert.equal(
    (
      await current.database
        .prepare(
          `SELECT COUNT(*) AS count
           FROM catalog_bundles
           WHERE canonical_slug = 'computer-science'
             AND semantic_version = '1.2.0'`,
        )
        .first()
    ).count,
    1,
    "The additive upgrade did not publish Computer Science 1.2.",
  );
  assert.deepEqual(
    await current.database
      .prepare(
        `SELECT revision, enrollment_status, start_date, pace_hours_per_week,
                study_days_json, timezone
         FROM learner_program_states
         WHERE learner_id = ? AND program_version_id = ?`,
      )
      .bind(learnerId, PROGRAM_VERSION_ID)
      .first(),
    {
      revision: 3,
      enrollment_status: "enrolled",
      start_date: TODAY,
      pace_hours_per_week: 10,
      study_days_json: "[1,2,3,4,5]",
      timezone: "UTC",
    },
  );
  assert.deepEqual(
    await current.database
      .prepare(
        `SELECT status, completed_at
         FROM learner_unit_states
         WHERE learner_id = ? AND program_version_id = ?
           AND course_version_id = ? AND learning_unit_id = ?`,
      )
      .bind(learnerId, PROGRAM_VERSION_ID, COURSE_VERSION_ID, UNIT_IDS[0])
      .first(),
    { status: "completed", completed_at: `${TODAY}T10:00:00.000Z` },
  );
  assert.equal(
    (
      await current.database
        .prepare(
          `SELECT text_or_url
           FROM learner_unit_evidence
           WHERE learner_id = ? AND program_version_id = ?
             AND course_version_id = ? AND learning_unit_id = ?`,
        )
        .bind(learnerId, PROGRAM_VERSION_ID, COURSE_VERSION_ID, projectUnitId)
        .first()
    ).text_or_url,
    "https://example.test/release/phase6-evidence",
  );
  assert.deepEqual(
    (await current.database.prepare("PRAGMA foreign_key_check").all()).results,
    [],
  );
});

test("criterion 10 restart guard: a current installation restarts without disturbing its publications or learner state", async (t) => {
  // A genuine restart: two Miniflare instances over one persisted D1
  // directory, exactly as a redeploy meets an existing database.
  const persistRoot = await mkdtemp(join(tmpdir(), "course-atlas-journey-"));
  t.after(() => rm(persistRoot, { recursive: true, force: true }));

  const first = await journeyEnvironment(persistRoot);
  const initial = await joinDevice(first.miniflare, DEVICE_A);
  const enrolledState = await mutate(first.miniflare, {
    deviceId: DEVICE_A,
    clientMutationId: "upgrade-enroll",
    baseRevision: initial.progress.revision,
    operations: [
      {
        type: "set-enrollment",
        enrollment: {
          startDate: TODAY,
          paceHoursPerWeek: 10,
          preferredStudyDays: ALL_STUDY_DAYS,
          timezone: "UTC",
          enrolledAt: `${TODAY}T09:00:00.000Z`,
          status: "enrolled",
        },
      },
      {
        type: "set-unit-completion",
        courseVersionId: COURSE_VERSION_ID,
        learningUnitId: UNIT_IDS[0],
        completed: true,
      },
      {
        type: "upsert-unit-evidence",
        evidence: {
          learningUnitId: PROJECT_UNIT_IDS[0],
          courseVersionId: COURSE_VERSION_ID,
          textOrUrl: "https://example.test/journey/pre-upgrade",
          updatedAt: `${TODAY}T10:00:00.000Z`,
        },
      },
    ],
  });

  const publicationsBefore = await first.database
    .prepare(
      `SELECT program_version_id, payload_hash, seeded_at
       FROM catalog_bundles
       ORDER BY program_version_id`,
    )
    .all();
  assert.ok(
    publicationsBefore.results.length >= 6,
    `Expected the full catalog to be seeded, found ${publicationsBefore.results.length}.`,
  );

  const html = await first.miniflare.dispatchFetch(
    "http://localhost/programs/practical-spreadsheets",
    { headers: { accept: "text/html" } },
  );
  assert.equal(html.status, 200);
  await first.miniflare.dispose();

  // Restart against the same database.
  const second = await journeyEnvironment(persistRoot);
  t.after(() => second.miniflare.dispose());

  const restarted = await readProgress(second.miniflare, DEVICE_A);
  const publicationsAfter = await second.database
    .prepare(
      `SELECT program_version_id, payload_hash, seeded_at
       FROM catalog_bundles
       ORDER BY program_version_id`,
    )
    .all();

  assert.deepEqual(
    publicationsAfter.results,
    publicationsBefore.results,
    "A restart rewrote or re-seeded an immutable publication.",
  );
  assert.equal(restarted.progress.revision, enrolledState.progress.revision);
  assert.deepEqual(
    restarted.progress.enrollment,
    enrolledState.progress.enrollment,
  );
  assert.deepEqual(
    restarted.progress.courses[COURSE_VERSION_ID].completedUnitIds,
    [UNIT_IDS[0]],
  );
  assert.equal(
    restarted.progress.unitEvidences[PROJECT_UNIT_IDS[0]].textOrUrl,
    "https://example.test/journey/pre-upgrade",
  );

  // The restarted deployment still serves and still writes.
  const afterRestartHtml = await second.miniflare.dispatchFetch(
    "http://localhost/programs/practical-spreadsheets",
    { headers: { accept: "text/html" } },
  );
  assert.equal(afterRestartHtml.status, 200);
  const continued = await mutate(second.miniflare, {
    deviceId: DEVICE_A,
    clientMutationId: "upgrade-continue",
    baseRevision: restarted.progress.revision,
    operations: [
      {
        type: "set-unit-completion",
        courseVersionId: COURSE_VERSION_ID,
        learningUnitId: UNIT_IDS[1],
        completed: true,
      },
    ],
  });
  assert.deepEqual(
    continued.progress.courses[COURSE_VERSION_ID].completedUnitIds.slice().sort(),
    [UNIT_IDS[0], UNIT_IDS[1]].sort(),
  );
});


/**
 * Counts D1 round trips, not prepared statements. Cloudflare bills each D1
 * call as a subrequest and caps them per request, so a batch of fifty
 * statements costs one — which is the number a release has to stay under.
 */
function withRoundTripSpy(database) {
  const calls = [];
  const record = (label) => calls.push(label);
  return {
    calls,
    database: {
      ...database,
      batch(statements) {
        record(`batch(${statements.length})`);
        return database.batch(statements);
      },
      exec(sql) {
        record("exec");
        return database.exec(sql);
      },
      prepare(sql) {
        const statement = database.prepare(sql);
        const label = sql.trim().split(/\s+/u).slice(0, 4).join(" ");
        return new Proxy(statement, {
          get(target, property, receiver) {
            const value = Reflect.get(target, property, receiver);
            if (property === "bind") {
              return (...args) => {
                const bound = target.bind(...args);
                return new Proxy(bound, this);
              };
            }
            if (
              property === "run" ||
              property === "all" ||
              property === "first" ||
              property === "raw"
            ) {
              return (...args) => {
                record(label);
                return value.apply(target, args);
              };
            }
            return typeof value === "function" ? value.bind(target) : value;
          },
        });
      },
    },
  };
}

test("criterion 10 budget: a cold-start upgrade costs what is new, not the whole catalog", async (t) => {
  // Production hung because every cold isolate re-seeded, re-projected and
  // re-shadow-verified all eight publications — 5.5 MB of curriculum — on the
  // request path, and cleared its singleton on failure so the next request did
  // it again. The upgrade has to scale with the new content, not the catalog.
  const persistRoot = await mkdtemp(join(tmpdir(), "course-atlas-budget-"));
  t.after(() => rm(persistRoot, { recursive: true, force: true }));

  const legacy = await phase6DatabaseEnvironment(persistRoot);
  t.after(() => legacy.miniflare.dispose());

  const allBundles = collectStaticCatalogBundles(catalogRepository);
  const currentComputerScience = allBundles
    .filter((bundle) => bundle.program.canonicalSlug === "computer-science")
    .sort((left, right) =>
      left.programVersion.version.localeCompare(right.programVersion.version),
    )
    .at(-1);
  assert.ok(currentComputerScience);

  // The deployed database holds the previous release: everything except the
  // newest Computer Science publication.
  const deployed = allBundles.filter(
    (bundle) => bundle.id !== currentComputerScience.id,
  );
  await seedPublishedProgramBundles(legacy.database, deployed);

  const spy = withRoundTripSpy(legacy.database);
  const started = Date.now();
  await createRuntimeCatalogRepository({
    database: spy.database,
    staticRepository: catalogRepository,
    shadowScope: "seeded",
  });
  const elapsed = Date.now() - started;

  // The new publication really landed: assert the stored row, not the shape of
  // the calls that wrote it.
  const stored = await legacy.database
    .prepare("SELECT payload_hash FROM catalog_bundles WHERE id = ?")
    .bind(currentComputerScience.id)
    .first();
  assert.ok(stored, "The new publication was never written.");
  const breakdown = new Map();
  for (const sql of spy.calls) {
    const key = (sql.trim().split(/\s+/u).slice(0, 4).join(" ")).slice(0, 60);
    breakdown.set(key, (breakdown.get(key) ?? 0) + 1);
  }
  console.error(
    [...breakdown.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
      .map(([k, v]) => `${String(v).padStart(5)}  ${k}`).join("\n"),
  );
  assert.ok(
    spy.calls.length < 200,
    `Cold-start upgrade made ${spy.calls.length} D1 round trips against a 1,000 subrequest ceiling; the budget is 200.`,
  );
  assert.ok(
    elapsed < 20_000,
    `Cold-start upgrade took ${elapsed}ms; a Worker request cannot wait that long.`,
  );

  // A second cold start against the now-current database must be near-free:
  // nothing is missing, so nothing is prepared, projected or verified.
  const warm = withRoundTripSpy(legacy.database);
  const warmStarted = Date.now();
  await createRuntimeCatalogRepository({
    database: warm.database,
    staticRepository: catalogRepository,
    shadowScope: "seeded",
  });
  const warmElapsed = Date.now() - warmStarted;
  assert.equal(
    warm.calls.filter((label) =>
      label.includes("INSERT INTO catalog_bundle_payload_chunks"),
    ).length,
    0,
    "A steady-state cold start rewrote publication chunks.",
  );
  assert.ok(
    warmElapsed < elapsed,
    `A steady-state start (${warmElapsed}ms) should cost less than an upgrade (${elapsed}ms).`,
  );
});
