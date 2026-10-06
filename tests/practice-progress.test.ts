import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { Miniflare } from "miniflare";
import type { D1DatabaseLike } from "../app/catalog/d1-contract";
import { seedPublishedProgramBundles } from "../app/catalog/d1-repository";
import {
  D1LearnerProgressRepository,
  LearnerProgressValidationError,
} from "../app/catalog/learner-progress-repository";
import { skillIdsForUnit } from "../app/domain/practice/registry";
import type {
  CloudProgramProgress,
  PracticeRound,
} from "../app/learner-progress-contract";
import { ProgressRequestError } from "../app/learner-progress-api";
import { parseProgressMutationOperation } from "../app/progress-mutation-parser";
import {
  applyProgressOperations,
  mergeCloudSnapshotWithPending,
} from "../app/progress-storage";
import { computerScienceBundleV1 } from "../content/programs/computer-science";

const bundle = computerScienceBundleV1;
const programmingI = bundle.courseVersions.find((course) =>
  course.title.startsWith("Programming I:"),
);
assert.ok(programmingI);
const firstUnit = bundle.learningUnits
  .filter((unit) => unit.courseVersionId === programmingI.id)
  .sort((a, b) => a.order - b.order)[0];
assert.ok(firstUnit);
const [firstSkill] = skillIdsForUnit(firstUnit.id);
assert.ok(firstSkill);

function practiceRound(
  id: string,
  overrides: Partial<PracticeRound> = {},
): PracticeRound {
  return {
    id,
    skillId: firstSkill as string,
    mode: "check",
    level: 1,
    questionCount: 2,
    correctCount: 2,
    durationSeconds: 75,
    studyDate: "2026-09-01",
    completedAt: "2026-09-01T09:30:00.000Z",
    courseVersionId: programmingI!.id,
    learningUnitId: firstUnit!.id,
    ...overrides,
  };
}

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

test("the API accepts a well-formed practice round and refuses anything else", () => {
  const round = practiceRound("prc-parse-0001");
  assert.deepEqual(
    parseProgressMutationOperation({ type: "record-practice-round", round }, 0),
    { type: "record-practice-round", round },
  );
  const refused = (changes: Record<string, unknown>) =>
    assert.throws(
      () =>
        parseProgressMutationOperation(
          { type: "record-practice-round", round: { ...round, ...changes } },
          0,
        ),
      ProgressRequestError,
      JSON.stringify(changes),
    );
  refused({ skillId: "py.not-a-skill" });
  refused({ correctCount: 3 });
  refused({ level: 11 });
  refused({ mode: "exam" });
  refused({ studyDate: "2026-02-30" });
  refused({ courseVersionId: "unt_wrong-prefix" });
  refused({ score: 100 });
});

test("a recorded round is append-only on the device and survives a cloud refresh", () => {
  const first = practiceRound("prc-local-0001");
  const recorded = applyProgressOperations({}, [
    { type: "record-practice-round", round: first },
  ]);
  assert.deepEqual(recorded.practiceRounds, { [first.id]: first });
  const rewritten = applyProgressOperations(recorded, [
    { type: "record-practice-round", round: { ...first, correctCount: 0 } },
  ]);
  assert.equal(
    rewritten.practiceRounds?.[first.id]?.correctCount,
    2,
    "the first record of an id wins",
  );

  const cloud: CloudProgramProgress = {
    programVersionId: bundle.programVersion.id,
    revision: 3,
    enrollment: null,
    requirementSelections: {},
    courses: {},
    unitEvidences: {},
    assessmentAttempts: {},
    scheduleEntries: {},
    prerequisiteWaivers: {},
    practiceRounds: { [first.id]: first },
    history: [],
  };
  const pending = practiceRound("prc-local-0002", {
    completedAt: "2026-09-01T10:00:00.000Z",
  });
  const merged = mergeCloudSnapshotWithPending(
    {
      pendingMutations: [
        {
          schemaVersion: 3,
          programVersionId: bundle.programVersion.id,
          clientImportId: "import-practice-test",
          deviceId: "device-practice-test",
          clientMutationId: "mutation-practice-pending",
          baseRevision: 3,
          operations: [{ type: "record-practice-round", round: pending }],
          createdAt: "2026-09-01T10:00:01.000Z",
        },
      ],
    },
    cloud,
  );
  assert.deepEqual(Object.keys(merged.practiceRounds ?? {}).sort(), [
    first.id,
    pending.id,
  ]);
  const legacy = mergeCloudSnapshotWithPending(undefined, {
    ...cloud,
    practiceRounds:
      undefined as unknown as CloudProgramProgress["practiceRounds"],
  });
  assert.deepEqual(
    legacy.practiceRounds,
    {},
    "a response from before practice existed has no rounds",
  );
});

test("practice rounds persist in D1, replay idempotently, and cannot be rewritten", async (t) => {
  const { database, miniflare } = await createDatabase();
  t.after(() => miniflare.dispose());
  await seedPublishedProgramBundles(database, [bundle]);
  const repository = new D1LearnerProgressRepository(database);
  const learner = await repository.resolveLearner({
    provider: "test",
    subject: "practice-learner",
  });
  const programVersionId = bundle.programVersion.id;
  const rounds = [
    practiceRound("prc-d1-0001"),
    practiceRound("prc-d1-0002", {
      mode: "practice",
      correctCount: 1,
      completedAt: "2026-09-01T09:40:00.000Z",
    }),
    practiceRound("prc-d1-0003", {
      learningUnitId: undefined,
      completedAt: "2026-09-01T09:50:00.000Z",
    }),
  ];
  const { learningUnitId: _dropped, ...withoutUnit } =
    rounds[2] as PracticeRound;
  void _dropped;
  rounds[2] = withoutUnit;

  const request = {
    learnerId: learner.learnerId,
    programVersionId,
    deviceId: "device-practice-d1",
    clientMutationId: "mutation-practice-d1-1",
    baseRevision: 0,
    operations: rounds.map((round) => ({
      type: "record-practice-round" as const,
      round,
    })),
  };
  const applied = await repository.applyMutation(request);
  assert.equal(applied.resultRevision, 1);
  assert.deepEqual(
    applied.progress.practiceRounds,
    Object.fromEntries(rounds.map((round) => [round.id, round])),
  );
  assert.equal(
    applied.progress.history.filter((entry) => entry.entityType === "practice")
      .length,
    3,
    "each round leaves a history event",
  );

  const replay = await repository.applyMutation(request);
  assert.equal(replay.alreadyApplied, true);
  assert.equal(Object.keys(replay.progress.practiceRounds).length, 3);

  await assert.rejects(
    repository.applyMutation({
      ...request,
      clientMutationId: "mutation-practice-d1-rewrite",
      baseRevision: 1,
      operations: [
        {
          type: "record-practice-round",
          round: { ...(rounds[0] as PracticeRound), correctCount: 0 },
        },
      ],
    }),
    LearnerProgressValidationError,
  );
  await assert.rejects(
    repository.applyMutation({
      ...request,
      clientMutationId: "mutation-practice-d1-foreign",
      baseRevision: 1,
      operations: [
        {
          type: "record-practice-round",
          round: practiceRound("prc-d1-0004", {
            courseVersionId:
              "crv_not-in-this-program" as PracticeRound["courseVersionId"],
          }),
        },
      ],
    }),
    LearnerProgressValidationError,
  );
  const unchanged = await repository.loadProgress(
    learner.learnerId,
    programVersionId,
  );
  assert.equal(unchanged.revision, 1, "refused rounds change nothing");
});

test("a signed-out device's practice merges into the account on import", async (t) => {
  const { database, miniflare } = await createDatabase();
  t.after(() => miniflare.dispose());
  await seedPublishedProgramBundles(database, [bundle]);
  const repository = new D1LearnerProgressRepository(database);
  const learner = await repository.resolveLearner({
    provider: "test",
    subject: "practice-import",
  });
  const programVersionId = bundle.programVersion.id;
  const rounds = [
    practiceRound("prc-import-0001"),
    practiceRound("prc-import-0002", {
      completedAt: "2026-09-02T08:00:00.000Z",
      studyDate: "2026-09-02",
    }),
  ];
  const input = {
    learnerId: learner.learnerId,
    clientImportId: "import-practice-0001",
    storageNamespace: "course-atlas-progress-v3",
    disposition: "merged" as const,
    programs: [{ programVersionId, courses: [], practiceRounds: rounds }],
  };
  await repository.importLocalProgress(input);
  const progress = await repository.loadProgress(
    learner.learnerId,
    programVersionId,
  );
  assert.deepEqual(Object.keys(progress.practiceRounds).sort(), [
    "prc-import-0001",
    "prc-import-0002",
  ]);
  const again = await repository.importLocalProgress(input);
  assert.equal(
    again.clientImportId,
    "import-practice-0001",
    "retrying the import is idempotent",
  );
  assert.equal(
    Object.keys(
      (await repository.loadProgress(learner.learnerId, programVersionId))
        .practiceRounds,
    ).length,
    2,
  );

  await assert.rejects(
    repository.importLocalProgress({
      ...input,
      clientImportId: "import-practice-0002",
      programs: [
        {
          programVersionId,
          courses: [],
          practiceRounds: [
            practiceRound("prc-import-bad", { skillId: "py.unknown" }),
          ],
        },
      ],
    }),
    LearnerProgressValidationError,
  );
});
