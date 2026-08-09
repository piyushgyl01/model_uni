import type {
  AssessmentAttempt,
  AssessmentResult,
  LearnerEnrollment,
  PrerequisiteWaiver,
  ProgressMutationOperation,
  ProgressPatchRequest,
  ScheduleEntry,
  ScheduleEntrySubject,
  StudyDay,
  UnitEvidence,
} from "./learner-progress-contract";
import {
  PROGRESS_SCHEMA_VERSION,
} from "./learner-progress-contract";
import type {
  AssessmentVersionId,
  ConcentrationId,
  CourseVersionId,
  LearningUnitId,
  ProgramVersionId,
  RequirementGroupId,
} from "./domain/catalog";
import {
  badProgressRequest,
  rejectUnknownKeys,
  requireBoolean,
  requireClientImportId,
  requireFiniteNumber,
  requireIsoDate,
  requireIsoDateTime,
  requireObject,
  requirePrefixedId,
  requireString,
} from "./learner-progress-api";

const CLIENT_ENTITY_ID = /^[A-Za-z0-9._-]{8,180}$/;
const CLOCK_TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function requireClientEntityId(value: unknown, label: string) {
  return requireString(value, label, {
    maxLength: 180,
    pattern: CLIENT_ENTITY_ID,
  });
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

function optionalIsoDateTime(value: unknown, label: string) {
  return value === undefined ? undefined : requireIsoDateTime(value, label);
}

function optionalShortText(
  value: unknown,
  label: string,
  maxLength: number,
) {
  return value === undefined
    ? undefined
    : requireString(value, label, { maxLength });
}

function requireStringList(
  value: unknown,
  label: string,
  maximumItems: number,
  maximumItemLength: number,
) {
  if (!Array.isArray(value)) {
    badProgressRequest(`${label} must be an array.`);
  }
  if (value.length > maximumItems) {
    badProgressRequest(`${label} contains too many entries.`);
  }
  return value.map((item, index) =>
    requireString(item, `${label}[${index}]`, {
      maxLength: maximumItemLength,
    }),
  );
}

function parseEnrollment(value: unknown, label: string): LearnerEnrollment {
  const object = requireObject(value, label);
  rejectUnknownKeys(
    object,
    [
      "startDate",
      "paceHoursPerWeek",
      "preferredStudyDays",
      "timezone",
      "enrolledAt",
      "status",
      "updatedAt",
    ],
    label,
  );
  if (
    object.status !== "enrolled" &&
    object.status !== "paused" &&
    object.status !== "completed"
  ) {
    badProgressRequest(`${label}.status is invalid.`);
  }
  if (!Array.isArray(object.preferredStudyDays)) {
    badProgressRequest(`${label}.preferredStudyDays must be an array.`);
  }
  const days = [
    ...new Set(
      object.preferredStudyDays.map((day, index) =>
        requireFiniteNumber(
          day,
          `${label}.preferredStudyDays[${index}]`,
          { minimum: 0, maximum: 6, integer: true },
        ),
      ),
    ),
  ] as StudyDay[];
  if (days.length === 0 || days.length > 7) {
    badProgressRequest(`${label}.preferredStudyDays must select 1 to 7 days.`);
  }
  const updatedAt = optionalIsoDateTime(
    object.updatedAt,
    `${label}.updatedAt`,
  );
  return {
    startDate: requireIsoDate(object.startDate, `${label}.startDate`),
    paceHoursPerWeek: requireFiniteNumber(
      object.paceHoursPerWeek,
      `${label}.paceHoursPerWeek`,
      { minimum: 0.5, maximum: 168 },
    ),
    preferredStudyDays: days,
    timezone: requireString(object.timezone, `${label}.timezone`, {
      maxLength: 100,
    }),
    enrolledAt: requireIsoDateTime(
      object.enrolledAt,
      `${label}.enrolledAt`,
    ),
    status: object.status,
    ...(updatedAt ? { updatedAt } : {}),
  };
}

function parseEvidence(value: unknown, label: string): UnitEvidence {
  const object = requireObject(value, label);
  rejectUnknownKeys(
    object,
    ["learningUnitId", "courseVersionId", "textOrUrl", "updatedAt"],
    label,
  );
  const updatedAt = optionalIsoDateTime(
    object.updatedAt,
    `${label}.updatedAt`,
  );
  return {
    learningUnitId: requireTypedId(
      object.learningUnitId,
      `${label}.learningUnitId`,
      "unt",
    ) as LearningUnitId,
    courseVersionId: requireTypedId(
      object.courseVersionId,
      `${label}.courseVersionId`,
      "crv",
    ) as CourseVersionId,
    textOrUrl: requireString(object.textOrUrl, `${label}.textOrUrl`, {
      maxLength: 8_000,
    }).trim(),
    ...(updatedAt ? { updatedAt } : {}),
  };
}

function parseAssessmentResult(
  value: unknown,
  label: string,
): AssessmentResult {
  const object = requireObject(value, label);
  rejectUnknownKeys(
    object,
    [
      "score",
      "maximumScore",
      "passed",
      "evaluationMethod",
      "feedback",
      "evaluatedAt",
    ],
    label,
  );
  if (
    object.evaluationMethod !== "self" &&
    object.evaluationMethod !== "automatic" &&
    object.evaluationMethod !== "peer" &&
    object.evaluationMethod !== "instructor"
  ) {
    badProgressRequest(`${label}.evaluationMethod is invalid.`);
  }
  const maximumScore =
    object.maximumScore === undefined
      ? undefined
      : requireFiniteNumber(
          object.maximumScore,
          `${label}.maximumScore`,
          { minimum: Number.EPSILON, maximum: 1_000_000 },
        );
  const score = requireFiniteNumber(object.score, `${label}.score`, {
    minimum: 0,
    maximum: maximumScore ?? 1_000_000,
  });
  const feedback = optionalShortText(
    object.feedback,
    `${label}.feedback`,
    8_000,
  );
  return {
    score,
    ...(maximumScore !== undefined ? { maximumScore } : {}),
    passed: requireBoolean(object.passed, `${label}.passed`),
    evaluationMethod: object.evaluationMethod,
    ...(feedback ? { feedback } : {}),
    evaluatedAt: requireIsoDateTime(
      object.evaluatedAt,
      `${label}.evaluatedAt`,
    ),
  };
}

function parseAssessmentAttempt(
  value: unknown,
  label: string,
): AssessmentAttempt {
  const object = requireObject(value, label);
  rejectUnknownKeys(
    object,
    [
      "id",
      "assessmentVersionId",
      "courseVersionId",
      "attemptNumber",
      "status",
      "startedAt",
      "submittedAt",
      "submissionEvidence",
      "result",
      "updatedAt",
    ],
    label,
  );
  if (
    object.status !== "draft" &&
    object.status !== "submitted" &&
    object.status !== "evaluated" &&
    object.status !== "void"
  ) {
    badProgressRequest(`${label}.status is invalid.`);
  }
  const result =
    object.result === undefined
      ? undefined
      : parseAssessmentResult(object.result, `${label}.result`);
  const submittedAt = optionalIsoDateTime(
    object.submittedAt,
    `${label}.submittedAt`,
  );
  if (object.status === "draft" && (submittedAt || result)) {
    badProgressRequest(
      `${label} cannot have submittedAt or a result while it is a draft.`,
    );
  }
  if (object.status === "submitted" && (!submittedAt || result)) {
    badProgressRequest(
      `${label} must have submittedAt and no result while it is submitted.`,
    );
  }
  if (object.status === "evaluated" && (!submittedAt || !result)) {
    badProgressRequest(
      `${label} must have submittedAt and a result while it is evaluated.`,
    );
  }
  const updatedAt = optionalIsoDateTime(
    object.updatedAt,
    `${label}.updatedAt`,
  );
  return {
    id: requireClientEntityId(object.id, `${label}.id`),
    assessmentVersionId: requireTypedId(
      object.assessmentVersionId,
      `${label}.assessmentVersionId`,
      "asv",
    ) as AssessmentVersionId,
    courseVersionId: requireTypedId(
      object.courseVersionId,
      `${label}.courseVersionId`,
      "crv",
    ) as CourseVersionId,
    attemptNumber: requireFiniteNumber(
      object.attemptNumber,
      `${label}.attemptNumber`,
      { minimum: 1, maximum: 100, integer: true },
    ),
    status: object.status,
    startedAt: requireIsoDateTime(object.startedAt, `${label}.startedAt`),
    ...(submittedAt ? { submittedAt } : {}),
    submissionEvidence: requireStringList(
      object.submissionEvidence,
      `${label}.submissionEvidence`,
      20,
      8_000,
    ),
    ...(result ? { result } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  };
}

function parseScheduleSubject(
  value: unknown,
  label: string,
): ScheduleEntrySubject {
  const object = requireObject(value, label);
  rejectUnknownKeys(object, ["kind", "id"], label);
  if (object.kind === "courseVersion") {
    return {
      kind: object.kind,
      id: requireTypedId(object.id, `${label}.id`, "crv") as CourseVersionId,
    };
  }
  if (object.kind === "learningUnit") {
    return {
      kind: object.kind,
      id: requireTypedId(object.id, `${label}.id`, "unt") as LearningUnitId,
    };
  }
  if (object.kind === "assessmentVersion") {
    return {
      kind: object.kind,
      id: requireTypedId(
        object.id,
        `${label}.id`,
        "asv",
      ) as AssessmentVersionId,
    };
  }
  return badProgressRequest(`${label}.kind is invalid.`);
}

function parseScheduleEntry(value: unknown, label: string): ScheduleEntry {
  const object = requireObject(value, label);
  rejectUnknownKeys(
    object,
    [
      "id",
      "subject",
      "scheduledDate",
      "startTime",
      "plannedMinutes",
      "position",
      "source",
      "originEntryId",
      "status",
      "completedAt",
      "updatedAt",
    ],
    label,
  );
  if (
    object.source !== "manual" &&
    object.source !== "generated" &&
    object.source !== "carry-forward"
  ) {
    badProgressRequest(`${label}.source is invalid.`);
  }
  if (
    object.status !== "planned" &&
    object.status !== "completed" &&
    object.status !== "skipped" &&
    object.status !== "carried" &&
    object.status !== "cancelled"
  ) {
    badProgressRequest(`${label}.status is invalid.`);
  }
  const completedAt = optionalIsoDateTime(
    object.completedAt,
    `${label}.completedAt`,
  );
  if ((object.status === "completed") !== Boolean(completedAt)) {
    badProgressRequest(
      `${label}.completedAt must be present only for completed entries.`,
    );
  }
  const startTime =
    object.startTime === undefined
      ? undefined
      : requireString(object.startTime, `${label}.startTime`, {
          maxLength: 5,
          pattern: CLOCK_TIME,
        });
  const updatedAt = optionalIsoDateTime(
    object.updatedAt,
    `${label}.updatedAt`,
  );
  return {
    id: requireClientEntityId(object.id, `${label}.id`),
    subject: parseScheduleSubject(object.subject, `${label}.subject`),
    scheduledDate: requireIsoDate(
      object.scheduledDate,
      `${label}.scheduledDate`,
    ),
    ...(startTime ? { startTime } : {}),
    plannedMinutes: requireFiniteNumber(
      object.plannedMinutes,
      `${label}.plannedMinutes`,
      { minimum: 1, maximum: 1_440, integer: true },
    ),
    position: requireFiniteNumber(object.position, `${label}.position`, {
      minimum: 0,
      maximum: 100_000,
      integer: true,
    }),
    source: object.source,
    ...(object.originEntryId === undefined
      ? {}
      : {
          originEntryId: requireClientEntityId(
            object.originEntryId,
            `${label}.originEntryId`,
          ),
        }),
    status: object.status,
    ...(completedAt ? { completedAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  };
}

function parseWaiver(value: unknown, label: string): PrerequisiteWaiver {
  const object = requireObject(value, label);
  rejectUnknownKeys(
    object,
    [
      "id",
      "courseVersionId",
      "prerequisiteCourseVersionId",
      "basis",
      "reason",
      "evidence",
      "grantedAt",
      "revokedAt",
      "updatedAt",
    ],
    label,
  );
  if (
    object.basis !== "placement" &&
    object.basis !== "prior_learning" &&
    object.basis !== "review" &&
    object.basis !== "manual"
  ) {
    badProgressRequest(`${label}.basis is invalid.`);
  }
  const evidence = optionalShortText(
    object.evidence,
    `${label}.evidence`,
    8_000,
  );
  const revokedAt = optionalIsoDateTime(
    object.revokedAt,
    `${label}.revokedAt`,
  );
  const updatedAt = optionalIsoDateTime(
    object.updatedAt,
    `${label}.updatedAt`,
  );
  return {
    id: requireClientEntityId(object.id, `${label}.id`),
    courseVersionId: requireTypedId(
      object.courseVersionId,
      `${label}.courseVersionId`,
      "crv",
    ) as CourseVersionId,
    prerequisiteCourseVersionId: requireTypedId(
      object.prerequisiteCourseVersionId,
      `${label}.prerequisiteCourseVersionId`,
      "crv",
    ) as CourseVersionId,
    basis: object.basis,
    reason: requireString(object.reason, `${label}.reason`, {
      maxLength: 4_000,
    }).trim(),
    ...(evidence ? { evidence } : {}),
    grantedAt: requireIsoDateTime(object.grantedAt, `${label}.grantedAt`),
    ...(revokedAt ? { revokedAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  };
}

export function parseProgressMutationOperation(
  value: unknown,
  index: number,
): ProgressMutationOperation {
  const label = `operations[${index}]`;
  const object = requireObject(value, label);
  const type = requireString(object.type, `${label}.type`, { maxLength: 80 });

  switch (type) {
    case "set-enrollment": {
      rejectUnknownKeys(object, ["type", "enrollment"], label);
      return {
        type,
        enrollment:
          object.enrollment === null
            ? null
            : parseEnrollment(object.enrollment, `${label}.enrollment`),
      };
    }
    case "set-concentration": {
      rejectUnknownKeys(
        object,
        ["type", "selectedConcentrationId"],
        label,
      );
      return {
        type,
        selectedConcentrationId:
          object.selectedConcentrationId === null
            ? null
            : (requireTypedId(
                object.selectedConcentrationId,
                `${label}.selectedConcentrationId`,
                "con",
              ) as ConcentrationId),
      };
    }
    case "set-requirement-selection": {
      rejectUnknownKeys(
        object,
        ["type", "requirementGroupId", "courseVersionIds"],
        label,
      );
      if (!Array.isArray(object.courseVersionIds)) {
        badProgressRequest(`${label}.courseVersionIds must be an array.`);
      }
      if (object.courseVersionIds.length > 20) {
        badProgressRequest(`${label}.courseVersionIds has too many values.`);
      }
      const courseVersionIds = [
        ...new Set(
          object.courseVersionIds.map(
            (id, courseIndex) =>
              requireTypedId(
                id,
                `${label}.courseVersionIds[${courseIndex}]`,
                "crv",
              ) as CourseVersionId,
          ),
        ),
      ];
      return {
        type,
        requirementGroupId: requireTypedId(
          object.requirementGroupId,
          `${label}.requirementGroupId`,
          "req",
        ) as RequirementGroupId,
        courseVersionIds,
      };
    }
    case "set-unit-completion": {
      rejectUnknownKeys(
        object,
        ["type", "courseVersionId", "learningUnitId", "completed"],
        label,
      );
      return {
        type,
        courseVersionId: requireTypedId(
          object.courseVersionId,
          `${label}.courseVersionId`,
          "crv",
        ) as CourseVersionId,
        learningUnitId: requireTypedId(
          object.learningUnitId,
          `${label}.learningUnitId`,
          "unt",
        ) as LearningUnitId,
        completed: requireBoolean(object.completed, `${label}.completed`),
      };
    }
    case "upsert-unit-evidence":
      rejectUnknownKeys(object, ["type", "evidence"], label);
      return {
        type,
        evidence: parseEvidence(object.evidence, `${label}.evidence`),
      };
    case "delete-unit-evidence":
      rejectUnknownKeys(
        object,
        ["type", "courseVersionId", "learningUnitId"],
        label,
      );
      return {
        type,
        courseVersionId: requireTypedId(
          object.courseVersionId,
          `${label}.courseVersionId`,
          "crv",
        ) as CourseVersionId,
        learningUnitId: requireTypedId(
          object.learningUnitId,
          `${label}.learningUnitId`,
          "unt",
        ) as LearningUnitId,
      };
    case "upsert-assessment-attempt":
      rejectUnknownKeys(object, ["type", "attempt"], label);
      return {
        type,
        attempt: parseAssessmentAttempt(object.attempt, `${label}.attempt`),
      };
    case "set-assessment-result":
      rejectUnknownKeys(
        object,
        ["type", "assessmentAttemptId", "result"],
        label,
      );
      return {
        type,
        assessmentAttemptId: requireClientEntityId(
          object.assessmentAttemptId,
          `${label}.assessmentAttemptId`,
        ),
        result: parseAssessmentResult(object.result, `${label}.result`),
      };
    case "upsert-schedule-entry":
      rejectUnknownKeys(object, ["type", "entry"], label);
      return {
        type,
        entry: parseScheduleEntry(object.entry, `${label}.entry`),
      };
    case "delete-schedule-entry":
      rejectUnknownKeys(object, ["type", "scheduleEntryId"], label);
      return {
        type,
        scheduleEntryId: requireClientEntityId(
          object.scheduleEntryId,
          `${label}.scheduleEntryId`,
        ),
      };
    case "grant-prerequisite-waiver":
      rejectUnknownKeys(object, ["type", "waiver"], label);
      return {
        type,
        waiver: parseWaiver(object.waiver, `${label}.waiver`),
      };
    case "revoke-prerequisite-waiver":
      rejectUnknownKeys(
        object,
        ["type", "prerequisiteWaiverId", "revokedAt"],
        label,
      );
      return {
        type,
        prerequisiteWaiverId: requireClientEntityId(
          object.prerequisiteWaiverId,
          `${label}.prerequisiteWaiverId`,
        ),
        revokedAt: requireIsoDateTime(
          object.revokedAt,
          `${label}.revokedAt`,
        ),
      };
    default:
      return badProgressRequest(`${label}.type is unsupported.`);
  }
}

export function parseProgressPatchRequest(
  value: unknown,
): ProgressPatchRequest {
  const object = requireObject(value, "progress update");
  rejectUnknownKeys(
    object,
    [
      "schemaVersion",
      "programVersionId",
      "clientImportId",
      "deviceId",
      "clientMutationId",
      "baseRevision",
      "operations",
    ],
    "progress update",
  );
  if (object.schemaVersion !== PROGRESS_SCHEMA_VERSION) {
    badProgressRequest(
      `Only progress schemaVersion ${PROGRESS_SCHEMA_VERSION} can be mutated.`,
    );
  }
  if (!Array.isArray(object.operations)) {
    badProgressRequest("operations must be an array.");
  }
  if (object.operations.length === 0 || object.operations.length > 20) {
    badProgressRequest("operations must contain between 1 and 20 changes.");
  }
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    programVersionId: requireTypedId(
      object.programVersionId,
      "programVersionId",
      "prv",
    ) as ProgramVersionId,
    clientImportId: requireClientImportId(object.clientImportId),
    deviceId: requireClientEntityId(object.deviceId, "deviceId"),
    clientMutationId: requireClientEntityId(
      object.clientMutationId,
      "clientMutationId",
    ),
    baseRevision: requireFiniteNumber(
      object.baseRevision,
      "baseRevision",
      { minimum: 0, maximum: Number.MAX_SAFE_INTEGER, integer: true },
    ),
    operations: object.operations.map(parseProgressMutationOperation),
  };
}
