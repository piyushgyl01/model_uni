import type {
  AssessmentAttempt,
  LearnerEnrollment,
  PrerequisiteWaiver,
  ProgressMutationOperation,
  ScheduleEntry,
  UnitEvidence,
} from "../../../learner-progress-contract";
import {
  LEGACY_PROGRESS_STORAGE_NAMESPACE,
  PROGRESS_SCHEMA_VERSION,
  PROGRESS_STORAGE_NAMESPACE,
} from "../../../learner-progress-contract";
import type {
  ConcentrationId,
  CourseVersionId,
  LearningUnitId,
  ProgramVersionId,
  RequirementGroupId,
} from "../../../domain/catalog";
import {
  anonymousProgressResponse,
  badProgressRequest,
  getAuthenticatedLearner,
  noStoreJson,
  progressErrorResponse,
  readBoundedJson,
  rejectCrossOriginMutation,
  rejectUnknownKeys,
  requireClientImportId,
  requireIsoDateTime,
  requireObject,
  requirePrefixedId,
  requireString,
} from "../../../learner-progress-api";
import { parseProgressMutationOperation } from "../../../progress-mutation-parser";

export const dynamic = "force-dynamic";

const CLIENT_ENTITY_ID = /^[A-Za-z0-9._-]{8,180}$/;
const MAX_PROGRAMS = 50;
const MAX_COURSES = 500;
const MAX_UNITS = 10_000;
const MAX_REQUIREMENT_GROUPS = 500;
const MAX_REQUIREMENT_SELECTIONS = 5_000;
const MAX_EVIDENCES = 10_000;
const MAX_ASSESSMENT_ATTEMPTS = 5_000;
const MAX_SCHEDULE_ENTRIES = 10_000;
const MAX_WAIVERS = 1_000;

interface ParsedImportCourse {
  readonly completedUnitIds: readonly LearningUnitId[];
  readonly updatedAt?: string;
}

interface ParsedImportProgram {
  readonly enrollment?: LearnerEnrollment | null;
  readonly selectedConcentrationId?: ConcentrationId;
  readonly requirementSelections: Readonly<
    Record<string, readonly CourseVersionId[]>
  >;
  readonly courses: Readonly<Record<string, ParsedImportCourse>>;
  readonly unitEvidences: Readonly<Record<string, UnitEvidence>>;
  readonly assessmentAttempts: Readonly<Record<string, AssessmentAttempt>>;
  readonly scheduleEntries: Readonly<Record<string, ScheduleEntry>>;
  readonly prerequisiteWaivers: Readonly<Record<string, PrerequisiteWaiver>>;
}

interface ParsedImportRequest {
  readonly schemaVersion: 2 | typeof PROGRESS_SCHEMA_VERSION;
  readonly storageNamespace: string;
  readonly clientImportId: string;
  readonly deviceId?: string;
  readonly expectedOwnerKey?: string;
  readonly disposition: "merged" | "cloud";
  readonly activeProgramVersionId: ProgramVersionId;
  readonly programs: Readonly<Record<string, ParsedImportProgram>>;
}

function requireTypedId<Prefix extends string>(
  value: unknown,
  label: string,
  prefix: Prefix,
) {
  const id = requirePrefixedId(value, label);
  if (!id.startsWith(`${prefix}_`)) {
    badProgressRequest(`${label} must start with ${prefix}_.`);
  }
  return id as `${Prefix}_${string}`;
}

function requireDeviceId(value: unknown) {
  return requireString(value, "deviceId", {
    maxLength: 180,
    pattern: CLIENT_ENTITY_ID,
  });
}

function operationAs<Type extends ProgressMutationOperation["type"]>(
  value: unknown,
  type: Type,
) {
  const operation = parseProgressMutationOperation(value, 0);
  if (operation.type !== type) {
    badProgressRequest(`Imported operation must be ${type}.`);
  }
  return operation as Extract<ProgressMutationOperation, { type: Type }>;
}

function parseConcentration(value: unknown, label: string) {
  const operation = operationAs(
    { type: "set-concentration", selectedConcentrationId: value },
    "set-concentration",
  );
  if (!operation.selectedConcentrationId) {
    badProgressRequest(`${label} cannot be null.`);
  }
  return operation.selectedConcentrationId;
}

function parseCourses(
  value: unknown,
  label: string,
  counters: { courseCount: number; unitCount: number },
) {
  const object = requireObject(value, label);
  return Object.fromEntries(
    Object.entries(object).map(([courseVersionId, courseValue]) => {
      counters.courseCount += 1;
      if (counters.courseCount > MAX_COURSES) {
        badProgressRequest("Progress import contains too many courses.");
      }
      const typedCourseVersionId = requireTypedId(
        courseVersionId,
        `${label}.${courseVersionId}`,
        "crv",
      ) as CourseVersionId;
      const course = requireObject(
        courseValue,
        `${label}.${courseVersionId}`,
      );
      rejectUnknownKeys(
        course,
        ["completedUnitIds", "updatedAt"],
        `${label}.${courseVersionId}`,
      );
      if (!Array.isArray(course.completedUnitIds)) {
        badProgressRequest(
          `${label}.${courseVersionId}.completedUnitIds must be an array.`,
        );
      }
      const completedUnitIds = [
        ...new Set(
          course.completedUnitIds.map((unitId, index) => {
            counters.unitCount += 1;
            if (counters.unitCount > MAX_UNITS) {
              badProgressRequest("Progress import contains too many units.");
            }
            return requireTypedId(
              unitId,
              `${label}.${courseVersionId}.completedUnitIds[${index}]`,
              "unt",
            ) as LearningUnitId;
          }),
        ),
      ];
      return [
        typedCourseVersionId,
        {
          completedUnitIds,
          ...(course.updatedAt === undefined
            ? {}
            : {
                updatedAt: requireIsoDateTime(
                  course.updatedAt,
                  `${label}.${courseVersionId}.updatedAt`,
                ),
              }),
        },
      ];
    }),
  );
}

function parseRequirementSelections(
  value: unknown,
  label: string,
  counters: { requirementGroupCount: number; selectionCount: number },
) {
  const object = requireObject(value, label);
  return Object.fromEntries(
    Object.entries(object).map(([requirementGroupId, courseVersionIds]) => {
      counters.requirementGroupCount += 1;
      if (counters.requirementGroupCount > MAX_REQUIREMENT_GROUPS) {
        badProgressRequest(
          "Progress import contains too many requirement groups.",
        );
      }
      if (!Array.isArray(courseVersionIds)) {
        badProgressRequest(`${label}.${requirementGroupId} must be an array.`);
      }
      counters.selectionCount += courseVersionIds.length;
      if (counters.selectionCount > MAX_REQUIREMENT_SELECTIONS) {
        badProgressRequest(
          "Progress import contains too many requirement selections.",
        );
      }
      const operation = operationAs(
        {
          type: "set-requirement-selection",
          requirementGroupId,
          courseVersionIds,
        },
        "set-requirement-selection",
      );
      return [
        operation.requirementGroupId as RequirementGroupId,
        operation.courseVersionIds,
      ];
    }),
  );
}

function parseRecordWithOperation<RecordType extends { readonly id?: string }>(
  value: unknown,
  label: string,
  options: {
    readonly maximum: number;
    readonly operation: (
      recordValue: unknown,
    ) => ProgressMutationOperation;
    readonly recordFromOperation: (
      operation: ProgressMutationOperation,
    ) => RecordType;
    readonly recordId: (record: RecordType) => string;
  },
) {
  const object = requireObject(value, label);
  const entries = Object.entries(object);
  if (entries.length > options.maximum) {
    badProgressRequest(`${label} contains too many records.`);
  }
  return Object.fromEntries(
    entries.map(([recordId, recordValue]) => {
      const record = options.recordFromOperation(
        options.operation(recordValue),
      );
      if (options.recordId(record) !== recordId) {
        badProgressRequest(`${label}.${recordId} has a mismatched record ID.`);
      }
      return [recordId, record];
    }),
  );
}

function parseV3Program(
  value: unknown,
  label: string,
  counters: {
    courseCount: number;
    unitCount: number;
    requirementGroupCount: number;
    selectionCount: number;
    evidenceCount: number;
    assessmentCount: number;
    scheduleCount: number;
    waiverCount: number;
  },
): ParsedImportProgram {
  const object = requireObject(value, label);
  rejectUnknownKeys(
    object,
    [
      "enrollment",
      "selectedConcentrationId",
      "requirementSelections",
      "courses",
      "unitEvidences",
      "assessmentAttempts",
      "scheduleEntries",
      "prerequisiteWaivers",
    ],
    label,
  );
  const enrollment = operationAs(
    { type: "set-enrollment", enrollment: object.enrollment },
    "set-enrollment",
  ).enrollment;
  const selectedConcentrationId =
    object.selectedConcentrationId === undefined
      ? undefined
      : parseConcentration(
          object.selectedConcentrationId,
          `${label}.selectedConcentrationId`,
        );
  const requirementSelections = parseRequirementSelections(
    object.requirementSelections,
    `${label}.requirementSelections`,
    counters,
  );
  const courses = parseCourses(object.courses, `${label}.courses`, counters);

  const unitEvidencesObject = requireObject(
    object.unitEvidences,
    `${label}.unitEvidences`,
  );
  counters.evidenceCount += Object.keys(unitEvidencesObject).length;
  if (counters.evidenceCount > MAX_EVIDENCES) {
    badProgressRequest("Progress import contains too many evidence records.");
  }
  const unitEvidences = Object.fromEntries(
    Object.entries(unitEvidencesObject).map(([unitId, evidenceValue]) => {
      requireTypedId(unitId, `${label}.unitEvidences.${unitId}`, "unt");
      const operation = operationAs(
        { type: "upsert-unit-evidence", evidence: evidenceValue },
        "upsert-unit-evidence",
      );
      if (operation.evidence.learningUnitId !== unitId) {
        badProgressRequest(
          `${label}.unitEvidences.${unitId} has a mismatched learningUnitId.`,
        );
      }
      return [unitId, operation.evidence];
    }),
  );

  const assessmentAttemptsObject = requireObject(
    object.assessmentAttempts,
    `${label}.assessmentAttempts`,
  );
  counters.assessmentCount += Object.keys(assessmentAttemptsObject).length;
  if (counters.assessmentCount > MAX_ASSESSMENT_ATTEMPTS) {
    badProgressRequest("Progress import contains too many assessment attempts.");
  }
  const assessmentAttempts = parseRecordWithOperation<AssessmentAttempt>(
    assessmentAttemptsObject,
    `${label}.assessmentAttempts`,
    {
      maximum: MAX_ASSESSMENT_ATTEMPTS,
      operation: (recordValue) =>
        parseProgressMutationOperation(
          { type: "upsert-assessment-attempt", attempt: recordValue },
          0,
        ),
      recordFromOperation: (operation) => {
        if (operation.type !== "upsert-assessment-attempt") {
          return badProgressRequest("Imported assessment operation is invalid.");
        }
        return operation.attempt;
      },
      recordId: (record) => record.id,
    },
  );

  const scheduleEntriesObject = requireObject(
    object.scheduleEntries,
    `${label}.scheduleEntries`,
  );
  counters.scheduleCount += Object.keys(scheduleEntriesObject).length;
  if (counters.scheduleCount > MAX_SCHEDULE_ENTRIES) {
    badProgressRequest("Progress import contains too many schedule entries.");
  }
  const scheduleEntries = parseRecordWithOperation<ScheduleEntry>(
    scheduleEntriesObject,
    `${label}.scheduleEntries`,
    {
      maximum: MAX_SCHEDULE_ENTRIES,
      operation: (recordValue) =>
        parseProgressMutationOperation(
          { type: "upsert-schedule-entry", entry: recordValue },
          0,
        ),
      recordFromOperation: (operation) => {
        if (operation.type !== "upsert-schedule-entry") {
          return badProgressRequest("Imported schedule operation is invalid.");
        }
        return operation.entry;
      },
      recordId: (record) => record.id,
    },
  );

  const prerequisiteWaiversObject = requireObject(
    object.prerequisiteWaivers,
    `${label}.prerequisiteWaivers`,
  );
  counters.waiverCount += Object.keys(prerequisiteWaiversObject).length;
  if (counters.waiverCount > MAX_WAIVERS) {
    badProgressRequest("Progress import contains too many prerequisite waivers.");
  }
  const prerequisiteWaivers = parseRecordWithOperation<PrerequisiteWaiver>(
    prerequisiteWaiversObject,
    `${label}.prerequisiteWaivers`,
    {
      maximum: MAX_WAIVERS,
      operation: (recordValue) =>
        parseProgressMutationOperation(
          { type: "grant-prerequisite-waiver", waiver: recordValue },
          0,
        ),
      recordFromOperation: (operation) => {
        if (operation.type !== "grant-prerequisite-waiver") {
          return badProgressRequest("Imported waiver operation is invalid.");
        }
        return operation.waiver;
      },
      recordId: (record) => record.id,
    },
  );

  return {
    enrollment,
    ...(selectedConcentrationId ? { selectedConcentrationId } : {}),
    requirementSelections,
    courses,
    unitEvidences,
    assessmentAttempts,
    scheduleEntries,
    prerequisiteWaivers,
  };
}

function parseV2Program(
  value: unknown,
  label: string,
  counters: { courseCount: number; unitCount: number },
): ParsedImportProgram {
  const object = requireObject(value, label);
  rejectUnknownKeys(object, ["selectedConcentrationId", "courses"], label);
  const selectedConcentrationId =
    object.selectedConcentrationId === undefined
      ? undefined
      : parseConcentration(
          object.selectedConcentrationId,
          `${label}.selectedConcentrationId`,
        );
  return {
    ...(selectedConcentrationId ? { selectedConcentrationId } : {}),
    requirementSelections: {},
    courses: parseCourses(object.courses, `${label}.courses`, counters),
    unitEvidences: {},
    assessmentAttempts: {},
    scheduleEntries: {},
    prerequisiteWaivers: {},
  };
}

function parseImportRequest(value: unknown): ParsedImportRequest {
  const object = requireObject(value, "progress import");
  const schemaVersion = object.schemaVersion;
  if (schemaVersion !== 2 && schemaVersion !== PROGRESS_SCHEMA_VERSION) {
    badProgressRequest("Only progress schemaVersion 2 or 3 can be imported.");
  }
  const isV3 = schemaVersion === PROGRESS_SCHEMA_VERSION;
  rejectUnknownKeys(
    object,
    [
      "schemaVersion",
      "storageNamespace",
      "clientImportId",
      ...(isV3 ? ["deviceId", "expectedOwnerKey"] : []),
      "disposition",
      "activeProgramVersionId",
      "programs",
    ],
    "progress import",
  );
  const requiredNamespace = isV3
    ? PROGRESS_STORAGE_NAMESPACE
    : LEGACY_PROGRESS_STORAGE_NAMESPACE;
  if (object.storageNamespace !== requiredNamespace) {
    badProgressRequest(
      `schemaVersion ${schemaVersion} requires storageNamespace ${requiredNamespace}.`,
    );
  }
  if (object.disposition !== "merged" && object.disposition !== "cloud") {
    badProgressRequest('disposition must be "merged" or "cloud".');
  }
  const activeProgramVersionId = requireTypedId(
    object.activeProgramVersionId,
    "activeProgramVersionId",
    "prv",
  ) as ProgramVersionId;
  const programsObject = requireObject(object.programs, "programs");
  const programEntries = Object.entries(programsObject);
  if (programEntries.length > MAX_PROGRAMS) {
    badProgressRequest("Progress import contains too many programs.");
  }
  if (object.disposition === "cloud" && programEntries.length > 0) {
    badProgressRequest("Cloud-only import must not transmit local programs.");
  }

  const counters = {
    courseCount: 0,
    unitCount: 0,
    requirementGroupCount: 0,
    selectionCount: 0,
    evidenceCount: 0,
    assessmentCount: 0,
    scheduleCount: 0,
    waiverCount: 0,
  };
  const programs = Object.fromEntries(
    programEntries.map(([programVersionId, programValue]) => {
      const typedProgramVersionId = requireTypedId(
        programVersionId,
        `programs.${programVersionId}`,
        "prv",
      ) as ProgramVersionId;
      return [
        typedProgramVersionId,
        isV3
          ? parseV3Program(
              programValue,
              `programs.${programVersionId}`,
              counters,
            )
          : parseV2Program(
              programValue,
              `programs.${programVersionId}`,
              counters,
            ),
      ];
    }),
  );

  return {
    schemaVersion,
    storageNamespace: requiredNamespace,
    clientImportId: requireClientImportId(object.clientImportId),
    ...(isV3
      ? {
          deviceId: requireDeviceId(object.deviceId),
          expectedOwnerKey: requireDeviceId(object.expectedOwnerKey),
        }
      : {}),
    disposition: object.disposition,
    activeProgramVersionId,
    programs,
  };
}

export async function POST(request: Request) {
  try {
    rejectCrossOriginMutation(request);
    const context = await getAuthenticatedLearner();
    if (!context) return anonymousProgressResponse("/");
    const parsed = parseImportRequest(await readBoundedJson(request));
    if (
      parsed.expectedOwnerKey &&
      parsed.expectedOwnerKey !== context.learner.accountId
    ) {
      return noStoreJson(
        { error: "The authenticated account changed before import." },
        { status: 409 },
      );
    }
    const activeBundle =
      await context.repository.catalog.loadByProgramVersionId(
        parsed.activeProgramVersionId,
      );
    if (!activeBundle) {
      badProgressRequest("The active program version is not published.");
    }
    const existing = await context.repository.getProgressImport(
      context.learner.learnerId,
      parsed.clientImportId,
    );
    const programs = Object.entries(parsed.programs).map(
      ([programVersionId, program]) => ({
        programVersionId: programVersionId as ProgramVersionId,
        ...(program.selectedConcentrationId
          ? { selectedConcentrationId: program.selectedConcentrationId }
          : {}),
        courses: Object.entries(program.courses).map(
          ([courseVersionId, course]) => ({
            courseVersionId: courseVersionId as CourseVersionId,
            completedUnitIds: course.completedUnitIds,
            ...(course.updatedAt ? { updatedAt: course.updatedAt } : {}),
          }),
        ),
        ...(program.enrollment !== undefined
          ? { enrollment: program.enrollment }
          : {}),
        requirementSelections: program.requirementSelections,
        unitEvidences: Object.values(program.unitEvidences),
        assessmentAttempts: Object.values(program.assessmentAttempts),
        scheduleEntries: Object.values(program.scheduleEntries),
        prerequisiteWaivers: Object.values(program.prerequisiteWaivers),
      }),
    );
    const receipt = await context.repository.importLocalProgress({
      learnerId: context.learner.learnerId,
      clientImportId: parsed.clientImportId,
      storageNamespace: parsed.storageNamespace,
      disposition: parsed.disposition,
      ...(parsed.deviceId ? { deviceId: parsed.deviceId } : {}),
      programs,
    });

    return noStoreJson({
      confirmed: true,
      alreadyConfirmed: Boolean(existing),
      ownerKey: context.learner.accountId,
      receipt: {
        clientImportId: receipt.clientImportId,
        disposition: receipt.disposition,
        importedUnitCount: receipt.importedUnitCount,
        confirmedAt: receipt.confirmedAt,
      },
    });
  } catch (error) {
    return progressErrorResponse(error);
  }
}
