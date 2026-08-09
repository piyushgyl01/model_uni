import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import type {
  AssessmentVersionId,
  ConcentrationId,
  CourseVersionId,
  LearningUnitId,
  ProgramVersionId,
  RequirementGroupId,
} from "../app/domain/catalog";
import type {
  AssessmentAttempt,
  CloudProgramProgress,
  PrerequisiteWaiver,
  ScheduleEntry,
} from "../app/learner-progress-contract";
import {
  LEGACY_PROGRESS_STORAGE_NAMESPACE,
  PROGRESS_STORAGE_NAMESPACE,
} from "../app/learner-progress-contract";
import {
  acknowledgePendingMutation,
  applyCloudSnapshot,
  getStoredProgram,
  hasMeaningfulLocalProgress,
  makeImportRequest,
  pendingMutationsForProgram,
  prepareImportWatermark,
  readLocalCourseUnits,
  readProgressStore,
  recordImportResolution,
  rebasePendingMutation,
  resetProgressStorageVolatileStateForTests,
  selectAuthenticatedProgressOwner,
  writeLocalAssessmentAttempt,
  writeLocalConcentration,
  writeLocalCourseUnits,
  writeLocalEnrollment,
  writeLocalPrerequisiteWaiver,
  writeLocalRequirementSelection,
  writeLocalScheduleEntry,
  writeLocalUnitEvidence,
} from "../app/progress-storage";

const programVersionId = "prv_storage_test" as ProgramVersionId;
const courseVersionId = "crv_storage_test" as CourseVersionId;
const firstUnitId = "unt_storage_1" as LearningUnitId;
const secondUnitId = "unt_storage_2" as LearningUnitId;
const thirdUnitId = "unt_storage_3" as LearningUnitId;
const concentrationId = "con_storage_test" as ConcentrationId;
const requirementGroupId = "req_storage_test" as RequirementGroupId;

class MemoryStorage {
  readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

let memory: MemoryStorage;
let idCounter: number;

beforeEach(() => {
  memory = new MemoryStorage();
  idCounter = 0;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: memory,
      crypto: {
        randomUUID: () => `00000000-0000-4000-8000-${String(++idCounter).padStart(12, "0")}`,
      },
      dispatchEvent() {
        return true;
      },
    },
  });
  resetProgressStorageVolatileStateForTests();
});

afterEach(() => {
  resetProgressStorageVolatileStateForTests();
  Reflect.deleteProperty(globalThis, "window");
});

function emptyCloud(revision: number): CloudProgramProgress {
  return {
    programVersionId,
    revision,
    enrollment: null,
    requirementSelections: {},
    courses: {
      [courseVersionId]: { completedUnitIds: [] },
    },
    unitEvidences: {},
    assessmentAttempts: {},
    scheduleEntries: {},
    prerequisiteWaivers: {},
    history: [],
  };
}

test("v2 migration preserves every legacy field and rotates identity", () => {
  memory.setItem(
    LEGACY_PROGRESS_STORAGE_NAMESPACE,
    JSON.stringify({
      schemaVersion: 2,
      clientImportId: "legacy-import-id",
      programs: {
        [programVersionId]: {
          selectedConcentrationId: concentrationId,
          enrollment: {
            startDate: "2026-08-08",
            paceHoursPerWeek: 20,
            enrolledAt: "2026-08-08T00:00:00.000Z",
            status: "enrolled",
          },
          courses: {
            [courseVersionId]: {
              completedUnitIds: [firstUnitId],
              unitEvidences: {
                [firstUnitId]: {
                  unitId: firstUnitId,
                  textOrUrl: "https://example.test/work",
                  updatedAt: "2026-08-09T00:00:00.000Z",
                },
              },
            },
          },
        },
      },
    }),
  );

  const migrated = readProgressStore();
  const program = migrated.programs?.[programVersionId];

  assert.equal(migrated.schemaVersion, 3);
  assert.notEqual(migrated.clientImportId, "legacy-import-id");
  assert.match(migrated.clientImportId ?? "", /^import-/);
  assert.match(migrated.deviceId ?? "", /^device-/);
  assert.equal(program?.selectedConcentrationId, concentrationId);
  assert.deepEqual(program?.courses?.[courseVersionId]?.completedUnitIds, [
    firstUnitId,
  ]);
  assert.equal(
    program?.unitEvidences?.[firstUnitId]?.textOrUrl,
    "https://example.test/work",
  );
  assert.deepEqual(program?.enrollment?.preferredStudyDays, [1, 2, 3, 4, 5]);
  assert.equal(program?.pendingMutations?.length, 0);
  assert.ok(memory.getItem(PROGRESS_STORAGE_NAMESPACE));
  assert.equal(hasMeaningfulLocalProgress(migrated), true);
});

test("course snapshots enqueue only per-unit diffs in order", () => {
  readProgressStore();
  writeLocalCourseUnits(
    programVersionId,
    courseVersionId,
    [firstUnitId, secondUnitId],
    true,
  );
  writeLocalCourseUnits(
    programVersionId,
    courseVersionId,
    [secondUnitId, thirdUnitId],
    true,
  );

  const pending = pendingMutationsForProgram(programVersionId);
  assert.equal(pending.length, 2);
  assert.deepEqual(pending[0].operations, [
    {
      type: "set-unit-completion",
      courseVersionId,
      learningUnitId: firstUnitId,
      completed: true,
    },
    {
      type: "set-unit-completion",
      courseVersionId,
      learningUnitId: secondUnitId,
      completed: true,
    },
  ]);
  assert.deepEqual(pending[1].operations, [
    {
      type: "set-unit-completion",
      courseVersionId,
      learningUnitId: firstUnitId,
      completed: false,
    },
    {
      type: "set-unit-completion",
      courseVersionId,
      learningUnitId: thirdUnitId,
      completed: true,
    },
  ]);
  assert.deepEqual(
    getStoredProgram(programVersionId)?.courses?.[courseVersionId]
      ?.completedUnitIds,
    [secondUnitId, thirdUnitId],
  );
});

test("cloud snapshots remain underneath pending enrollment and evidence", () => {
  readProgressStore();
  writeLocalEnrollment(programVersionId, {
    startDate: "2026-08-08",
    paceHoursPerWeek: 30,
    preferredStudyDays: [1, 3, 5],
    timezone: "Asia/Kolkata",
    enrolledAt: "2026-08-08T00:00:00.000Z",
    status: "enrolled",
  });
  writeLocalUnitEvidence(
    programVersionId,
    courseVersionId,
    firstUnitId,
    "local evidence",
    true,
  );
  const [enrollmentMutation, evidenceMutation] =
    pendingMutationsForProgram(programVersionId);

  applyCloudSnapshot(emptyCloud(7));
  let program = getStoredProgram(programVersionId);
  assert.equal(program?.serverRevision, 7);
  assert.equal(program?.enrollment?.paceHoursPerWeek, 30);
  assert.equal(
    program?.unitEvidences?.[firstUnitId]?.textOrUrl,
    "local evidence",
  );
  assert.deepEqual(
    program?.pendingMutations?.map((mutation) => mutation.clientMutationId),
    [enrollmentMutation.clientMutationId, evidenceMutation.clientMutationId],
  );

  const cloudAfterEnrollment: CloudProgramProgress = {
    ...emptyCloud(8),
    enrollment: program?.enrollment
      ? {
          ...program.enrollment,
          preferredStudyDays: program.enrollment.preferredStudyDays ?? [1, 3, 5],
          timezone: program.enrollment.timezone ?? "Asia/Kolkata",
        }
      : null,
  };
  acknowledgePendingMutation(
    programVersionId,
    enrollmentMutation.clientMutationId,
    cloudAfterEnrollment,
  );
  program = getStoredProgram(programVersionId);
  assert.equal(program?.pendingMutations?.length, 1);
  assert.equal(
    program?.pendingMutations?.[0]?.clientMutationId,
    evidenceMutation.clientMutationId,
  );
  assert.equal(
    program?.unitEvidences?.[firstUnitId]?.textOrUrl,
    "local evidence",
  );

  const replacementId = rebasePendingMutation(
    programVersionId,
    evidenceMutation.clientMutationId,
    8,
  );
  assert.ok(replacementId);
  assert.notEqual(replacementId, evidenceMutation.clientMutationId);
  assert.equal(pendingMutationsForProgram(programVersionId)[0].baseRevision, 8);
});

test("v3 import includes all learner records while cloud-only includes none", () => {
  readProgressStore();
  writeLocalConcentration(programVersionId, concentrationId, true);
  writeLocalRequirementSelection(programVersionId, requirementGroupId, [
    courseVersionId,
  ]);
  writeLocalUnitEvidence(
    programVersionId,
    courseVersionId,
    firstUnitId,
    "portfolio link",
    true,
  );

  const attempt: AssessmentAttempt = {
    id: "attempt-storage-1",
    assessmentVersionId: "asv_storage_test" as AssessmentVersionId,
    courseVersionId,
    attemptNumber: 1,
    status: "submitted",
    startedAt: "2026-08-08T00:00:00.000Z",
    submittedAt: "2026-08-09T00:00:00.000Z",
    submissionEvidence: ["https://example.test/submission"],
  };
  const scheduleEntry: ScheduleEntry = {
    id: "schedule-entry-storage-1",
    subject: { kind: "learningUnit", id: firstUnitId },
    scheduledDate: "2026-08-10",
    plannedMinutes: 90,
    position: 1,
    source: "manual",
    status: "planned",
  };
  const waiver: PrerequisiteWaiver = {
    id: "waiver-storage-1",
    courseVersionId,
    prerequisiteCourseVersionId: "crv_storage_prerequisite" as CourseVersionId,
    basis: "prior_learning",
    reason: "Prior equivalent work",
    grantedAt: "2026-08-08T00:00:00.000Z",
  };
  writeLocalAssessmentAttempt(programVersionId, attempt);
  writeLocalScheduleEntry(programVersionId, scheduleEntry);
  writeLocalPrerequisiteWaiver(programVersionId, waiver);
  assert.equal(
    selectAuthenticatedProgressOwner("owner-storage-test").persisted,
    true,
  );

  const merged = makeImportRequest(programVersionId, "merged");
  const imported = merged.programs[programVersionId];
  assert.equal(merged.schemaVersion, 3);
  assert.equal(imported.selectedConcentrationId, concentrationId);
  assert.deepEqual(imported.requirementSelections[requirementGroupId], [
    courseVersionId,
  ]);
  assert.equal(imported.unitEvidences[firstUnitId].textOrUrl, "portfolio link");
  assert.equal(
    imported.assessmentAttempts[attempt.id].assessmentVersionId,
    attempt.assessmentVersionId,
  );
  assert.equal(
    imported.scheduleEntries[scheduleEntry.id].scheduledDate,
    scheduleEntry.scheduledDate,
  );
  assert.equal(
    imported.prerequisiteWaivers[waiver.id].reason,
    waiver.reason,
  );

  const cloudOnly = makeImportRequest(programVersionId, "cloud");
  assert.deepEqual(cloudOnly.programs, {});
});

test("owner binding fails closed until its consent marker is durable", () => {
  const store = readProgressStore();
  assert.equal(
    selectAuthenticatedProgressOwner("owner-storage-test").persisted,
    true,
  );
  const request = makeImportRequest(programVersionId, "cloud");
  assert.equal(prepareImportWatermark(request), true);
  const originalSetItem = memory.setItem.bind(memory);
  memory.setItem = (key: string, value: string) => {
    if (key === PROGRESS_STORAGE_NAMESPACE) throw new Error("quota exceeded");
    originalSetItem(key, value);
  };
  const receipt = {
    clientImportId: store.clientImportId as string,
    disposition: "cloud" as const,
    importedUnitCount: 0,
    confirmedAt: "2026-08-08T00:00:00.000Z",
  };

  assert.equal(recordImportResolution(receipt).persisted, false);
  // A volatile marker must never make a retry look durably resolved.
  assert.equal(recordImportResolution(receipt).persisted, false);
});

test("an import receipt clears only mutations captured before the request", () => {
  readProgressStore();
  assert.equal(
    selectAuthenticatedProgressOwner("owner-import-race").persisted,
    true,
  );
  assert.equal(
    writeLocalCourseUnits(
      programVersionId,
      courseVersionId,
      [firstUnitId],
      true,
    ),
    true,
  );
  const request = makeImportRequest(programVersionId, "cloud");
  assert.equal(prepareImportWatermark(request), true);

  // This edit happened after the transmitted snapshot and must stay queued.
  assert.equal(
    writeLocalCourseUnits(
      programVersionId,
      courseVersionId,
      [firstUnitId, secondUnitId],
      true,
    ),
    true,
  );
  const resolution = recordImportResolution({
    clientImportId: request.clientImportId,
    disposition: "cloud",
    importedUnitCount: 0,
    confirmedAt: "2026-08-08T00:00:00.000Z",
  });
  assert.equal(resolution.persisted, true);
  assert.equal(pendingMutationsForProgram(programVersionId).length, 1);
  assert.deepEqual(
    readLocalCourseUnits(
      programVersionId,
      courseVersionId,
      new Set([firstUnitId, secondUnitId]),
    ),
    [secondUnitId],
  );
});

test("mutation journals survive a stale cross-tab overwrite and ack race", () => {
  readProgressStore();
  const staleEmptyEnvelope = memory.getItem(PROGRESS_STORAGE_NAMESPACE);
  assert.ok(staleEmptyEnvelope);

  writeLocalCourseUnits(
    programVersionId,
    courseVersionId,
    [firstUnitId],
    true,
  );
  writeLocalUnitEvidence(
    programVersionId,
    courseVersionId,
    secondUnitId,
    "cross-tab evidence",
    true,
  );
  assert.equal(pendingMutationsForProgram(programVersionId).length, 2);

  // Another tab commits a snapshot it read before either mutation. The
  // separately keyed mutation records remain authoritative.
  memory.setItem(PROGRESS_STORAGE_NAMESPACE, staleEmptyEnvelope);
  resetProgressStorageVolatileStateForTests();
  let pending = pendingMutationsForProgram(programVersionId);
  assert.equal(pending.length, 2);
  assert.deepEqual(
    readLocalCourseUnits(
      programVersionId,
      courseVersionId,
      new Set([firstUnitId]),
    ),
    [firstUnitId],
  );
  assert.equal(
    getStoredProgram(programVersionId)?.unitEvidences?.[secondUnitId]?.textOrUrl,
    "cross-tab evidence",
  );

  const staleBeforeAck = memory.getItem(PROGRESS_STORAGE_NAMESPACE);
  assert.ok(staleBeforeAck);
  assert.equal(
    acknowledgePendingMutation(
      programVersionId,
      pending[0].clientMutationId,
      emptyCloud(1),
    ),
    true,
  );
  memory.setItem(PROGRESS_STORAGE_NAMESPACE, staleBeforeAck);
  resetProgressStorageVolatileStateForTests();
  pending = pendingMutationsForProgram(programVersionId);
  assert.equal(pending.length, 1);
  assert.equal(pending[0].operations[0]?.type, "upsert-unit-evidence");
});
