import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { Miniflare } from "miniflare";
import type { D1DatabaseLike } from "../app/catalog/d1-contract";
import {
  D1LearnerProgressRepository,
  LearnerProgressRevisionConflictError,
  LearnerProgressValidationError,
} from "../app/catalog/learner-progress-repository";
import { seedPublishedProgramBundles } from "../app/catalog/d1-repository";
import { computerScienceBundleV1 } from "../content/programs/computer-science";
import { practicalSpreadsheetsProgram } from "./fixtures/practical-spreadsheets";

async function createDatabase() {
  const miniflare = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('ok'); } }",
    d1Databases: ["DB"],
  });
  const database = (await miniflare.getD1Database(
    "DB",
  )) as unknown as D1DatabaseLike;
  await database.prepare("PRAGMA foreign_keys = ON").run();

  const migrations = (await readdir(new URL("../drizzle/", import.meta.url)))
    .filter((file) => /^\d{4}_.+\.sql$/.test(file))
    .sort();
  for (const file of migrations) {
    const migration = await readFile(
      new URL(`../drizzle/${file}`, import.meta.url),
      "utf8",
    );
    for (const statement of migration
      .split("--> statement-breakpoint")
      .map((value) => value.trim())
      .filter(Boolean)) {
      const result = await database.prepare(statement).run();
      assert.notEqual(result.success, false, result.error ?? statement);
    }
  }
  return { database, miniflare };
}

test("revisioned learner mutations round-trip rich state without destructive replacement", async (t) => {
  const { database, miniflare } = await createDatabase();
  t.after(() => miniflare.dispose());
  await seedPublishedProgramBundles(database, [practicalSpreadsheetsProgram]);

  const repository = new D1LearnerProgressRepository(database);
  const learner = await repository.resolveLearner({
    provider: "test",
    subject: "phase-3-learner",
  });
  const programVersionId = practicalSpreadsheetsProgram.programVersion.id;
  const courseVersionId = practicalSpreadsheetsProgram.courseVersions[0].id;
  const unit = practicalSpreadsheetsProgram.learningUnits[0];
  const assessment = practicalSpreadsheetsProgram.assessmentVersions[0];
  assert.ok(unit);
  assert.ok(assessment);

  const initial = await repository.loadProgress(
    learner.learnerId,
    programVersionId,
  );
  assert.equal(initial.revision, 0);
  assert.equal(initial.enrollment, null);

  const request = {
    learnerId: learner.learnerId,
    programVersionId,
    deviceId: "device-phase-3-a",
    clientMutationId: "mutation-phase-3-rich-state",
    baseRevision: 0,
    operations: [
      {
        type: "set-enrollment" as const,
        enrollment: {
          startDate: "2026-08-10",
          paceHoursPerWeek: 20,
          preferredStudyDays: [1, 2, 3, 4, 5] as const,
          timezone: "Asia/Kolkata",
          enrolledAt: "2026-08-08T10:00:00.000Z",
          status: "enrolled" as const,
        },
      },
      {
        type: "set-unit-completion" as const,
        courseVersionId,
        learningUnitId: unit.id,
        completed: true,
      },
      {
        type: "upsert-unit-evidence" as const,
        evidence: {
          courseVersionId,
          learningUnitId: unit.id,
          textOrUrl: "https://example.test/workbook",
        },
      },
      {
        type: "upsert-assessment-attempt" as const,
        attempt: {
          id: "aat_phase_3_attempt_1",
          assessmentVersionId: assessment.id,
          courseVersionId,
          attemptNumber: 1,
          status: "draft" as const,
          startedAt: "2026-08-08T10:30:00.000Z",
          submissionEvidence: [],
        },
      },
      {
        type: "upsert-schedule-entry" as const,
        entry: {
          id: "lse_phase_3_entry_1",
          subject: { kind: "learningUnit" as const, id: unit.id },
          scheduledDate: "2026-08-10",
          plannedMinutes: 90,
          position: 0,
          source: "manual" as const,
          status: "planned" as const,
        },
      },
    ],
  };
  const applied = await repository.applyMutation(request);
  assert.equal(applied.resultRevision, 1);
  assert.equal(applied.alreadyApplied, false);
  assert.equal(applied.progress.enrollment?.startDate, "2026-08-10");
  assert.deepEqual(applied.progress.enrollment?.preferredStudyDays, [1, 2, 3, 4, 5]);
  assert.deepEqual(
    applied.progress.courses[courseVersionId].completedUnitIds,
    [unit.id],
  );
  assert.equal(
    applied.progress.unitEvidences[unit.id].textOrUrl,
    "https://example.test/workbook",
  );
  assert.equal(
    applied.progress.assessmentAttempts.aat_phase_3_attempt_1.status,
    "draft",
  );
  assert.equal(
    applied.progress.scheduleEntries.lse_phase_3_entry_1.plannedMinutes,
    90,
  );
  assert.equal(applied.progress.history.length, 5);

  const replay = await repository.applyMutation(request);
  assert.equal(replay.alreadyApplied, true);
  assert.equal(replay.resultRevision, 1);
  assert.equal(replay.progress.history.length, 5);

  await assert.rejects(
    repository.applyMutation({
      ...request,
      clientMutationId: "mutation-phase-3-stale",
      operations: [
        {
          type: "set-unit-completion",
          courseVersionId,
          learningUnitId: unit.id,
          completed: false,
        },
      ],
    }),
    LearnerProgressRevisionConflictError,
  );
  assert.equal(
    (
      await repository.loadProgress(learner.learnerId, programVersionId)
    ).unitEvidences[unit.id].textOrUrl,
    "https://example.test/workbook",
  );
});

test("undo operations retain tombstones and append history", async (t) => {
  const { database, miniflare } = await createDatabase();
  t.after(() => miniflare.dispose());
  await seedPublishedProgramBundles(database, [practicalSpreadsheetsProgram]);

  const repository = new D1LearnerProgressRepository(database);
  const learner = await repository.resolveLearner({
    provider: "test",
    subject: "phase-3-undo",
  });
  const programVersionId = practicalSpreadsheetsProgram.programVersion.id;
  const courseVersionId = practicalSpreadsheetsProgram.courseVersions[0].id;
  const unit = practicalSpreadsheetsProgram.learningUnits[0];
  assert.ok(unit);

  await repository.applyMutation({
    learnerId: learner.learnerId,
    programVersionId,
    deviceId: "device-undo",
    clientMutationId: "mutation-complete-and-evidence",
    baseRevision: 0,
    operations: [
      {
        type: "set-unit-completion",
        courseVersionId,
        learningUnitId: unit.id,
        completed: true,
      },
      {
        type: "upsert-unit-evidence",
        evidence: {
          courseVersionId,
          learningUnitId: unit.id,
          textOrUrl: "first submission",
        },
      },
    ],
  });
  const undone = await repository.applyMutation({
    learnerId: learner.learnerId,
    programVersionId,
    deviceId: "device-undo",
    clientMutationId: "mutation-reopen-and-delete-evidence",
    baseRevision: 1,
    operations: [
      {
        type: "set-unit-completion",
        courseVersionId,
        learningUnitId: unit.id,
        completed: false,
      },
      {
        type: "delete-unit-evidence",
        courseVersionId,
        learningUnitId: unit.id,
      },
    ],
  });

  assert.equal(undone.progress.revision, 2);
  assert.deepEqual(
    undone.progress.courses[courseVersionId].completedUnitIds,
    [],
  );
  assert.equal(undone.progress.unitEvidences[unit.id], undefined);
  assert.deepEqual(
    undone.progress.history.map((entry) => entry.eventType),
    [
      "unit-completed",
      "evidence-upserted",
      "unit-reopened",
      "evidence-deleted",
    ],
  );

  const rows = await database
    .prepare(
      `SELECT status FROM learner_unit_states
       WHERE learner_id = ? AND program_version_id = ? AND learning_unit_id = ?`,
    )
    .bind(learner.learnerId, programVersionId, unit.id)
    .all<{ status: string }>();
  assert.deepEqual(rows.results, [{ status: "tombstoned" }]);
});

test("v3 local import round-trips every learner entity and replays idempotently", async (t) => {
  const { database, miniflare } = await createDatabase();
  t.after(() => miniflare.dispose());
  await seedPublishedProgramBundles(database, [computerScienceBundleV1]);

  const repository = new D1LearnerProgressRepository(database);
  const learner = await repository.resolveLearner({
    provider: "test",
    subject: "phase-3-rich-import",
  });
  const programVersionId = computerScienceBundleV1.programVersion.id;
  const concentration = computerScienceBundleV1.concentrations[0];
  assert.ok(concentration);
  const concentrationRequirement =
    computerScienceBundleV1.programVersion.requirements.find(
      (requirement) =>
        requirement.rule.selectionConstraint === "same concentration",
    );
  assert.ok(concentrationRequirement);
  const concentrationOptions = concentrationRequirement.options.filter(
    (option) => option.concentrationId === concentration.id,
  );
  assert.equal(concentrationOptions.length, 2);

  const course = computerScienceBundleV1.courseVersions.find(
    (candidate) => candidate.prerequisites.length > 0,
  );
  assert.ok(course);
  const prerequisite = course.prerequisites[0];
  assert.ok(prerequisite);
  const unit = computerScienceBundleV1.learningUnits.find(
    (candidate) => candidate.courseVersionId === course.id,
  );
  const assessment = computerScienceBundleV1.assessmentVersions.find(
    (candidate) => candidate.courseVersionId === course.id,
  );
  assert.ok(unit);
  assert.ok(assessment);

  const importInput = {
    learnerId: learner.learnerId,
    clientImportId: "import-phase-3-every-entity",
    storageNamespace: "course-atlas-progress-v3",
    disposition: "merged" as const,
    deviceId: "device-rich-import",
    programs: [
      {
        programVersionId,
        selectedConcentrationId: concentration.id,
        enrollment: {
          startDate: "2026-08-10",
          paceHoursPerWeek: 40,
          preferredStudyDays: [1, 2, 3, 4, 5] as const,
          timezone: "Asia/Kolkata",
          enrolledAt: "2026-08-08T12:00:00.000Z",
          status: "enrolled" as const,
          updatedAt: "2026-08-08T12:00:00.000Z",
        },
        requirementSelections: {
          [concentrationRequirement.id]: concentrationOptions.map(
            (option) => option.courseVersionId,
          ),
        },
        courses: [
          {
            courseVersionId: course.id,
            completedUnitIds: [unit.id],
            updatedAt: "2026-08-08T12:10:00.000Z",
          },
        ],
        unitEvidences: [
          {
            courseVersionId: course.id,
            learningUnitId: unit.id,
            textOrUrl: "https://example.test/imported-evidence",
            updatedAt: "2026-08-08T12:15:00.000Z",
          },
        ],
        assessmentAttempts: [
          {
            id: "aat_phase_3_imported",
            assessmentVersionId: assessment.id,
            courseVersionId: course.id,
            attemptNumber: 1,
            status: "evaluated" as const,
            startedAt: "2026-08-08T12:20:00.000Z",
            submittedAt: "2026-08-08T12:30:00.000Z",
            submissionEvidence: ["https://example.test/assessment"],
            result: {
              score: assessment.maximumScore * 0.8,
              maximumScore: assessment.maximumScore,
              passed: true,
              evaluationMethod: "self" as const,
              feedback: "Imported self-assessment",
              evaluatedAt: "2026-08-08T12:40:00.000Z",
            },
            updatedAt: "2026-08-08T12:40:00.000Z",
          },
        ],
        scheduleEntries: [
          {
            id: "lse_phase_3_imported",
            subject: { kind: "learningUnit" as const, id: unit.id },
            scheduledDate: "2026-08-10",
            startTime: "09:30",
            plannedMinutes: 120,
            position: 0,
            source: "manual" as const,
            status: "completed" as const,
            completedAt: "2026-08-10T06:00:00.000Z",
            updatedAt: "2026-08-10T06:00:00.000Z",
          },
        ],
        prerequisiteWaivers: [
          {
            id: "lpw_phase_3_imported",
            courseVersionId: course.id,
            prerequisiteCourseVersionId: prerequisite.courseVersionId,
            basis: "prior_learning" as const,
            reason: "Equivalent prior coursework",
            evidence: "https://example.test/prior-coursework",
            grantedAt: "2026-08-08T12:05:00.000Z",
            updatedAt: "2026-08-08T12:05:00.000Z",
          },
        ],
      },
    ],
  };

  const receipt = await repository.importLocalProgress(importInput);
  assert.equal(receipt.importedUnitCount, 1);
  const imported = await repository.loadProgress(
    learner.learnerId,
    programVersionId,
  );
  assert.equal(imported.revision, 1);
  assert.equal(imported.enrollment?.paceHoursPerWeek, 40);
  assert.equal(imported.selectedConcentrationId, concentration.id);
  assert.deepEqual(
    imported.requirementSelections[concentrationRequirement.id],
    concentrationOptions.map((option) => option.courseVersionId),
  );
  assert.deepEqual(imported.courses[course.id].completedUnitIds, [unit.id]);
  assert.equal(
    imported.unitEvidences[unit.id].textOrUrl,
    "https://example.test/imported-evidence",
  );
  assert.equal(
    imported.assessmentAttempts.aat_phase_3_imported.result?.score,
    assessment.maximumScore * 0.8,
  );
  assert.equal(
    imported.scheduleEntries.lse_phase_3_imported.status,
    "completed",
  );
  assert.equal(
    imported.prerequisiteWaivers.lpw_phase_3_imported.basis,
    "prior_learning",
  );
  assert.deepEqual(
    imported.history.map((entry) => entry.eventType),
    ["local-progress-imported"],
  );

  const replayedReceipt = await repository.importLocalProgress(importInput);
  assert.equal(replayedReceipt.payloadHash, receipt.payloadHash);
  const replayed = await repository.loadProgress(
    learner.learnerId,
    programVersionId,
  );
  assert.equal(replayed.revision, 1);
  assert.equal(replayed.history.length, 1);
  assert.equal(
    replayed.unitEvidences[unit.id].textOrUrl,
    "https://example.test/imported-evidence",
  );
});

test("rebased mutations cannot regress terminal learner lifecycles or change stable subjects", async (t) => {
  const { database, miniflare } = await createDatabase();
  t.after(() => miniflare.dispose());
  await seedPublishedProgramBundles(database, [practicalSpreadsheetsProgram]);

  const repository = new D1LearnerProgressRepository(database);
  const learner = await repository.resolveLearner({
    provider: "test",
    subject: "phase-3-lifecycle-guards",
  });
  const programVersionId = practicalSpreadsheetsProgram.programVersion.id;
  const courseVersionId = practicalSpreadsheetsProgram.courseVersions[0].id;
  const [firstUnit, secondUnit] = practicalSpreadsheetsProgram.learningUnits;
  const assessment = practicalSpreadsheetsProgram.assessmentVersions[0];
  assert.ok(firstUnit);
  assert.ok(secondUnit);
  assert.ok(assessment);

  const terminalEntries = [
    {
      id: "lse_lifecycle_completed",
      status: "completed" as const,
      completedAt: "2026-08-09T09:00:00.000Z",
    },
    { id: "lse_lifecycle_cancelled", status: "cancelled" as const },
    { id: "lse_lifecycle_skipped", status: "skipped" as const },
    { id: "lse_lifecycle_carried", status: "carried" as const },
  ];
  await repository.applyMutation({
    learnerId: learner.learnerId,
    programVersionId,
    deviceId: "device-lifecycle-cloud",
    clientMutationId: "mutation-lifecycle-terminal-cloud-state",
    baseRevision: 0,
    operations: [
      {
        type: "upsert-assessment-attempt",
        attempt: {
          id: "aat_lifecycle_submitted",
          assessmentVersionId: assessment.id,
          courseVersionId,
          attemptNumber: 1,
          status: "submitted",
          startedAt: "2026-08-09T07:00:00.000Z",
          submittedAt: "2026-08-09T08:00:00.000Z",
          submissionEvidence: ["cloud submission"],
        },
      },
      ...terminalEntries.map((entry, position) => ({
        type: "upsert-schedule-entry" as const,
        entry: {
          id: entry.id,
          subject: { kind: "learningUnit" as const, id: firstUnit.id },
          scheduledDate: "2026-08-09",
          plannedMinutes: 60,
          position,
          source: "manual" as const,
          status: entry.status,
          ...(entry.completedAt ? { completedAt: entry.completedAt } : {}),
        },
      })),
    ],
  });

  await assert.rejects(
    repository.applyMutation({
      learnerId: learner.learnerId,
      programVersionId,
      deviceId: "device-lifecycle-stale",
      clientMutationId: "mutation-lifecycle-submitted-to-draft",
      baseRevision: 1,
      operations: [
        {
          type: "upsert-assessment-attempt",
          attempt: {
            id: "aat_lifecycle_submitted",
            assessmentVersionId: assessment.id,
            courseVersionId,
            attemptNumber: 1,
            status: "draft",
            startedAt: "2026-08-09T07:00:00.000Z",
            submissionEvidence: [],
          },
        },
      ],
    }),
    LearnerProgressValidationError,
  );

  await assert.rejects(
    repository.applyMutation({
      learnerId: learner.learnerId,
      programVersionId,
      deviceId: "device-lifecycle-stale",
      clientMutationId: "mutation-lifecycle-terminal-schedules-to-planned",
      baseRevision: 1,
      operations: terminalEntries.map((entry, position) => ({
        type: "upsert-schedule-entry" as const,
        entry: {
          id: entry.id,
          subject: { kind: "learningUnit" as const, id: firstUnit.id },
          scheduledDate: "2099-12-31",
          plannedMinutes: 1,
          position,
          source: "manual" as const,
          status: "planned" as const,
          updatedAt: "2099-12-31T23:59:59.000Z",
        },
      })),
    }),
    LearnerProgressValidationError,
  );

  await assert.rejects(
    repository.applyMutation({
      learnerId: learner.learnerId,
      programVersionId,
      deviceId: "device-lifecycle-stale",
      clientMutationId: "mutation-lifecycle-attempt-identity-change",
      baseRevision: 1,
      operations: [
        {
          type: "upsert-assessment-attempt",
          attempt: {
            id: "aat_lifecycle_submitted",
            assessmentVersionId: assessment.id,
            courseVersionId,
            attemptNumber: 2,
            status: "submitted",
            startedAt: "2026-08-09T07:00:00.000Z",
            submittedAt: "2026-08-09T08:00:00.000Z",
            submissionEvidence: ["stale submission"],
          },
        },
      ],
    }),
    LearnerProgressValidationError,
  );

  const planned = await repository.applyMutation({
    learnerId: learner.learnerId,
    programVersionId,
    deviceId: "device-lifecycle-cloud",
    clientMutationId: "mutation-lifecycle-add-planned-entry",
    baseRevision: 1,
    operations: [
      {
        type: "upsert-schedule-entry",
        entry: {
          id: "lse_lifecycle_planned",
          subject: { kind: "learningUnit", id: firstUnit.id },
          scheduledDate: "2026-08-10",
          plannedMinutes: 60,
          position: 0,
          source: "manual",
          status: "planned",
        },
      },
    ],
  });
  assert.equal(planned.resultRevision, 2);

  await assert.rejects(
    repository.applyMutation({
      learnerId: learner.learnerId,
      programVersionId,
      deviceId: "device-lifecycle-stale",
      clientMutationId: "mutation-lifecycle-change-schedule-subject",
      baseRevision: 2,
      operations: [
        {
          type: "upsert-schedule-entry",
          entry: {
            id: "lse_lifecycle_planned",
            subject: { kind: "learningUnit", id: secondUnit.id },
            scheduledDate: "2026-08-10",
            plannedMinutes: 60,
            position: 0,
            source: "manual",
            status: "planned",
          },
        },
      ],
    }),
    LearnerProgressValidationError,
  );

  const evaluated = await repository.applyMutation({
    learnerId: learner.learnerId,
    programVersionId,
    deviceId: "device-lifecycle-cloud",
    clientMutationId: "mutation-lifecycle-evaluate-attempt",
    baseRevision: 2,
    operations: [
      {
        type: "set-assessment-result",
        assessmentAttemptId: "aat_lifecycle_submitted",
        result: {
          score: assessment.maximumScore,
          maximumScore: assessment.maximumScore,
          passed: true,
          evaluationMethod: "self",
          feedback: "Cloud evaluation",
          evaluatedAt: "2026-08-09T10:00:00.000Z",
        },
      },
    ],
  });
  assert.equal(evaluated.progress.revision, 3);

  await assert.rejects(
    repository.applyMutation({
      learnerId: learner.learnerId,
      programVersionId,
      deviceId: "device-lifecycle-stale",
      clientMutationId: "mutation-lifecycle-rewrite-evaluation",
      baseRevision: 3,
      operations: [
        {
          type: "set-assessment-result",
          assessmentAttemptId: "aat_lifecycle_submitted",
          result: {
            score: 0,
            maximumScore: assessment.maximumScore,
            passed: false,
            evaluationMethod: "self",
            evaluatedAt: "2099-12-31T23:59:59.000Z",
          },
        },
      ],
    }),
    LearnerProgressValidationError,
  );

  const unchanged = await repository.loadProgress(
    learner.learnerId,
    programVersionId,
  );
  assert.equal(unchanged.revision, 3);
  assert.equal(
    unchanged.assessmentAttempts.aat_lifecycle_submitted.status,
    "evaluated",
  );
  assert.equal(
    unchanged.assessmentAttempts.aat_lifecycle_submitted.result?.score,
    assessment.maximumScore,
  );
  for (const entry of terminalEntries) {
    assert.equal(unchanged.scheduleEntries[entry.id].status, entry.status);
  }
  assert.deepEqual(
    unchanged.scheduleEntries.lse_lifecycle_planned.subject,
    { kind: "learningUnit", id: firstUnit.id },
  );
});

test("v3 import is insert-only for non-commutative state even with future client clocks", async (t) => {
  const { database, miniflare } = await createDatabase();
  t.after(() => miniflare.dispose());
  await seedPublishedProgramBundles(database, [computerScienceBundleV1]);

  const repository = new D1LearnerProgressRepository(database);
  const learner = await repository.resolveLearner({
    provider: "test",
    subject: "phase-3-import-cloud-wins",
  });
  const programVersionId = computerScienceBundleV1.programVersion.id;
  const concentration = computerScienceBundleV1.concentrations[0];
  const concentrationRequirement =
    computerScienceBundleV1.programVersion.requirements.find(
      (requirement) =>
        requirement.rule.selectionConstraint === "same concentration",
    );
  assert.ok(concentration);
  assert.ok(concentrationRequirement);
  const selectedOptions = concentrationRequirement.options.filter(
    (option) => option.concentrationId === concentration.id,
  );
  const course = computerScienceBundleV1.courseVersions.find(
    (candidate) => candidate.prerequisites.length > 0,
  );
  assert.ok(course);
  const prerequisite = course.prerequisites[0];
  const [firstUnit, secondUnit] = computerScienceBundleV1.learningUnits.filter(
    (unit) => unit.courseVersionId === course.id,
  );
  const assessment = computerScienceBundleV1.assessmentVersions.find(
    (candidate) => candidate.courseVersionId === course.id,
  );
  assert.ok(prerequisite);
  assert.ok(firstUnit);
  assert.ok(secondUnit);
  assert.ok(assessment);

  await repository.importLocalProgress({
    learnerId: learner.learnerId,
    clientImportId: "import-cloud-wins-initial",
    storageNamespace: "course-atlas-progress-v3",
    disposition: "merged",
    programs: [
      {
        programVersionId,
        selectedConcentrationId: concentration.id,
        requirementSelections: {
          [concentrationRequirement.id]: selectedOptions.map(
            (option) => option.courseVersionId,
          ),
        },
        courses: [{ courseVersionId: course.id, completedUnitIds: [] }],
        unitEvidences: [
          {
            courseVersionId: course.id,
            learningUnitId: firstUnit.id,
            textOrUrl: "cloud evidence",
            updatedAt: "2026-08-08T08:00:00.000Z",
          },
        ],
        assessmentAttempts: [
          {
            id: "aat_import_cloud_terminal",
            assessmentVersionId: assessment.id,
            courseVersionId: course.id,
            attemptNumber: 1,
            status: "evaluated",
            startedAt: "2026-08-08T08:00:00.000Z",
            submittedAt: "2026-08-08T09:00:00.000Z",
            submissionEvidence: ["cloud assessment"],
            result: {
              score: assessment.maximumScore,
              maximumScore: assessment.maximumScore,
              passed: true,
              evaluationMethod: "self",
              feedback: "Cloud result",
              evaluatedAt: "2026-08-08T10:00:00.000Z",
            },
            updatedAt: "2026-08-08T10:00:00.000Z",
          },
        ],
        scheduleEntries: [
          {
            id: "lse_import_cloud_terminal",
            subject: { kind: "learningUnit", id: firstUnit.id },
            scheduledDate: "2026-08-08",
            plannedMinutes: 60,
            position: 0,
            source: "manual",
            status: "completed",
            completedAt: "2026-08-08T11:00:00.000Z",
            updatedAt: "2026-08-08T11:00:00.000Z",
          },
        ],
        prerequisiteWaivers: [
          {
            id: "lpw_import_cloud_terminal",
            courseVersionId: course.id,
            prerequisiteCourseVersionId: prerequisite.courseVersionId,
            basis: "review",
            reason: "Cloud-reviewed prior learning",
            grantedAt: "2026-08-08T07:00:00.000Z",
            updatedAt: "2026-08-08T07:00:00.000Z",
          },
        ],
      },
    ],
  });

  const terminal = await repository.applyMutation({
    learnerId: learner.learnerId,
    programVersionId,
    deviceId: "device-import-cloud",
    clientMutationId: "mutation-import-cloud-tombstones",
    baseRevision: 1,
    operations: [
      {
        type: "delete-unit-evidence",
        courseVersionId: course.id,
        learningUnitId: firstUnit.id,
      },
      {
        type: "revoke-prerequisite-waiver",
        prerequisiteWaiverId: "lpw_import_cloud_terminal",
        revokedAt: "2026-08-09T07:00:00.000Z",
      },
    ],
  });
  assert.equal(terminal.progress.revision, 2);

  await assert.rejects(
    repository.applyMutation({
      learnerId: learner.learnerId,
      programVersionId,
      deviceId: "device-import-stale",
      clientMutationId: "mutation-import-resurrect-waiver",
      baseRevision: 2,
      operations: [
        {
          type: "grant-prerequisite-waiver",
          waiver: {
            id: "lpw_import_cloud_terminal",
            courseVersionId: course.id,
            prerequisiteCourseVersionId: prerequisite.courseVersionId,
            basis: "manual",
            reason: "Stale client tries to restore it",
            grantedAt: "2026-08-08T07:00:00.000Z",
            updatedAt: "2099-12-31T23:59:59.000Z",
          },
        },
      ],
    }),
    LearnerProgressValidationError,
  );

  await repository.importLocalProgress({
    learnerId: learner.learnerId,
    clientImportId: "import-cloud-wins-future-clock",
    storageNamespace: "course-atlas-progress-v3",
    disposition: "merged",
    programs: [
      {
        programVersionId,
        selectedConcentrationId: concentration.id,
        requirementSelections: {},
        courses: [{ courseVersionId: course.id, completedUnitIds: [] }],
        unitEvidences: [
          {
            courseVersionId: course.id,
            learningUnitId: firstUnit.id,
            textOrUrl: "future stale evidence",
            updatedAt: "2099-12-31T23:59:59.000Z",
          },
          {
            courseVersionId: course.id,
            learningUnitId: secondUnit.id,
            textOrUrl: "new evidence",
            updatedAt: "2099-12-31T23:59:59.000Z",
          },
        ],
        assessmentAttempts: [
          {
            id: "aat_import_cloud_terminal",
            assessmentVersionId: assessment.id,
            courseVersionId: course.id,
            attemptNumber: 1,
            status: "draft",
            startedAt: "2026-08-08T08:00:00.000Z",
            submissionEvidence: [],
            updatedAt: "2099-12-31T23:59:59.000Z",
          },
          {
            id: "aat_import_new",
            assessmentVersionId: assessment.id,
            courseVersionId: course.id,
            attemptNumber: 2,
            status: "draft",
            startedAt: "2099-12-31T20:00:00.000Z",
            submissionEvidence: [],
            updatedAt: "2099-12-31T20:00:00.000Z",
          },
        ],
        scheduleEntries: [
          {
            id: "lse_import_cloud_terminal",
            subject: { kind: "learningUnit", id: secondUnit.id },
            scheduledDate: "2099-12-31",
            plannedMinutes: 1,
            position: 0,
            source: "manual",
            status: "planned",
            updatedAt: "2099-12-31T23:59:59.000Z",
          },
          {
            id: "lse_import_new",
            subject: { kind: "learningUnit", id: secondUnit.id },
            scheduledDate: "2099-12-30",
            plannedMinutes: 30,
            position: 1,
            source: "manual",
            status: "planned",
            updatedAt: "2099-12-30T20:00:00.000Z",
          },
        ],
        prerequisiteWaivers: [
          {
            id: "lpw_import_cloud_terminal",
            courseVersionId: course.id,
            prerequisiteCourseVersionId: prerequisite.courseVersionId,
            basis: "manual",
            reason: "Future stale waiver",
            grantedAt: "2099-12-31T20:00:00.000Z",
            updatedAt: "2099-12-31T23:59:59.000Z",
          },
          {
            id: "lpw_import_new",
            courseVersionId: course.id,
            prerequisiteCourseVersionId: prerequisite.courseVersionId,
            basis: "manual",
            reason: "A genuinely absent waiver",
            grantedAt: "2099-12-30T20:00:00.000Z",
            updatedAt: "2099-12-30T20:00:00.000Z",
          },
        ],
      },
    ],
  });

  const merged = await repository.loadProgress(
    learner.learnerId,
    programVersionId,
  );
  assert.equal(merged.revision, 3);
  assert.equal(merged.unitEvidences[firstUnit.id], undefined);
  assert.equal(merged.unitEvidences[secondUnit.id].textOrUrl, "new evidence");
  assert.equal(
    merged.assessmentAttempts.aat_import_cloud_terminal.status,
    "evaluated",
  );
  assert.equal(
    merged.assessmentAttempts.aat_import_cloud_terminal.result?.score,
    assessment.maximumScore,
  );
  assert.equal(merged.assessmentAttempts.aat_import_new.status, "draft");
  assert.deepEqual(
    merged.scheduleEntries.lse_import_cloud_terminal.subject,
    { kind: "learningUnit", id: firstUnit.id },
  );
  assert.equal(
    merged.scheduleEntries.lse_import_cloud_terminal.status,
    "completed",
  );
  assert.equal(merged.scheduleEntries.lse_import_new.status, "planned");
  assert.equal(
    merged.prerequisiteWaivers.lpw_import_cloud_terminal.revokedAt,
    "2026-08-09T07:00:00.000Z",
  );
  assert.equal(
    merged.prerequisiteWaivers.lpw_import_cloud_terminal.reason,
    "Cloud-reviewed prior learning",
  );
  assert.equal(
    merged.prerequisiteWaivers.lpw_import_new.reason,
    "A genuinely absent waiver",
  );
});
