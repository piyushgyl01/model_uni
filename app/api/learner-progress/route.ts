import type {
  ConcentrationId,
  CourseVersionId,
  LearningUnitId,
  ProgramVersionId,
} from "../../domain/catalog";
import type {
  ProgressMutationOperation,
  ProgressPatchRequest,
} from "../../learner-progress-contract";
import {
  LearnerProgressRevisionConflictError,
} from "../../catalog/learner-progress-repository";
import {
  anonymousProgressResponse,
  authenticatedProgressPayload,
  badProgressRequest,
  getAuthenticatedLearner,
  noStoreJson,
  progressErrorResponse,
  readBoundedJson,
  rejectCrossOriginMutation,
  rejectUnknownKeys,
  requireClientImportId,
  requireObject,
  requirePrefixedId,
} from "../../learner-progress-api";
import { parseProgressPatchRequest } from "../../progress-mutation-parser";

export const dynamic = "force-dynamic";

interface LegacyCourseUpdate {
  readonly courseVersionId: CourseVersionId;
  readonly completedUnitIds: readonly LearningUnitId[];
}

interface LegacyProgressPatch {
  readonly programVersionId: ProgramVersionId;
  readonly clientImportId: string;
  readonly courseUpdates: readonly LegacyCourseUpdate[];
  readonly selectedConcentrationId?: ConcentrationId | null;
}

function safeReturnTo(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/";
}

function requestReturnTo(request: Request) {
  const referer = request.headers.get("referer");
  if (!referer) return "/";
  try {
    const requestUrl = new URL(request.url);
    const refererUrl = new URL(referer);
    if (refererUrl.origin !== requestUrl.origin) return "/";
    return `${refererUrl.pathname}${refererUrl.search}${refererUrl.hash}`;
  } catch {
    return "/";
  }
}

function parseProgramVersionId(value: unknown) {
  const id = requirePrefixedId(value, "programVersionId");
  if (!id.startsWith("prv_")) {
    badProgressRequest("programVersionId must start with prv_.");
  }
  return id as ProgramVersionId;
}

/**
 * Temporary compatibility for already-open v2 tabs. A v2 payload is a stale,
 * whole-course snapshot, so it can safely add completions but cannot prove
 * that a missing unit is an intentional undo. Treating absence as deletion
 * would let an old tab erase work saved by a newer device.
 */
function parseLegacyPatchRequest(value: unknown): LegacyProgressPatch {
  const object = requireObject(value, "legacy progress update");
  rejectUnknownKeys(
    object,
    [
      "programVersionId",
      "clientImportId",
      "courseUpdates",
      "concentrationUpdate",
    ],
    "legacy progress update",
  );
  const courseUpdatesValue = object.courseUpdates;
  if (courseUpdatesValue !== undefined && !Array.isArray(courseUpdatesValue)) {
    badProgressRequest("courseUpdates must be an array.");
  }
  const seenCourses = new Set<string>();
  let unitCount = 0;
  const courseUpdates = (courseUpdatesValue ?? []).map((item, index) => {
    const update = requireObject(item, `courseUpdates[${index}]`);
    rejectUnknownKeys(
      update,
      ["courseVersionId", "completedUnitIds"],
      `courseUpdates[${index}]`,
    );
    const courseVersionId = requirePrefixedId(
      update.courseVersionId,
      `courseUpdates[${index}].courseVersionId`,
    );
    if (!courseVersionId.startsWith("crv_")) {
      badProgressRequest(
        `courseUpdates[${index}].courseVersionId must start with crv_.`,
      );
    }
    if (seenCourses.has(courseVersionId)) {
      badProgressRequest(`courseUpdates duplicates ${courseVersionId}.`);
    }
    seenCourses.add(courseVersionId);
    if (!Array.isArray(update.completedUnitIds)) {
      badProgressRequest(
        `courseUpdates[${index}].completedUnitIds must be an array.`,
      );
    }
    const completedUnitIds = [
      ...new Set(
        update.completedUnitIds.map((unitId, unitIndex) => {
          unitCount += 1;
          if (unitCount > 5_000) {
            badProgressRequest("Progress update contains too many units.");
          }
          const id = requirePrefixedId(
            unitId,
            `courseUpdates[${index}].completedUnitIds[${unitIndex}]`,
          );
          if (!id.startsWith("unt_")) {
            badProgressRequest("Completed unit IDs must start with unt_.");
          }
          return id as LearningUnitId;
        }),
      ),
    ];
    return {
      courseVersionId: courseVersionId as CourseVersionId,
      completedUnitIds,
    };
  });

  let selectedConcentrationId: ConcentrationId | null | undefined;
  if (object.concentrationUpdate !== undefined) {
    const update = requireObject(
      object.concentrationUpdate,
      "concentrationUpdate",
    );
    rejectUnknownKeys(
      update,
      ["selectedConcentrationId"],
      "concentrationUpdate",
    );
    if (update.selectedConcentrationId === null) {
      selectedConcentrationId = null;
    } else {
      const id = requirePrefixedId(
        update.selectedConcentrationId,
        "concentrationUpdate.selectedConcentrationId",
      );
      if (!id.startsWith("con_")) {
        badProgressRequest("selectedConcentrationId must start with con_.");
      }
      selectedConcentrationId = id as ConcentrationId;
    }
  }
  if (courseUpdates.length === 0 && selectedConcentrationId === undefined) {
    badProgressRequest("Progress update does not contain a change.");
  }
  return {
    programVersionId: parseProgramVersionId(object.programVersionId),
    clientImportId: requireClientImportId(object.clientImportId),
    courseUpdates,
    ...(selectedConcentrationId !== undefined
      ? { selectedConcentrationId }
      : {}),
  };
}

function legacyOperations(
  legacy: LegacyProgressPatch,
  currentCourses: Readonly<
    Record<string, { readonly completedUnitIds: readonly LearningUnitId[] }>
  >,
) {
  const operations: ProgressMutationOperation[] = [];
  for (const update of legacy.courseUpdates) {
    const before = new Set(
      currentCourses[update.courseVersionId]?.completedUnitIds ?? [],
    );
    const after = new Set(update.completedUnitIds);
    for (const unitId of after) {
      if (before.has(unitId)) continue;
      operations.push({
        type: "set-unit-completion",
        courseVersionId: update.courseVersionId,
        learningUnitId: unitId,
        completed: true,
      });
    }
  }
  if (legacy.selectedConcentrationId !== undefined) {
    operations.push({
      type: "set-concentration",
      selectedConcentrationId: legacy.selectedConcentrationId,
    });
  }
  return operations;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const programVersionId = parseProgramVersionId(
      url.searchParams.get("programVersionId"),
    );
    const clientImportId = requireClientImportId(
      url.searchParams.get("clientImportId"),
    );
    const returnTo = safeReturnTo(url.searchParams.get("returnTo"));
    const context = await getAuthenticatedLearner();
    if (!context) return anonymousProgressResponse(returnTo);
    return noStoreJson(
      await authenticatedProgressPayload(
        context,
        programVersionId,
        clientImportId,
        returnTo,
      ),
    );
  } catch (error) {
    return progressErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    rejectCrossOriginMutation(request);
    const context = await getAuthenticatedLearner();
    if (!context) return anonymousProgressResponse("/");
    const raw = await readBoundedJson(request);
    const object = requireObject(raw, "progress update");
    const isV3 = object.schemaVersion === 3;
    const parsed = isV3
      ? parseProgressPatchRequest(object)
      : parseLegacyPatchRequest(object);
    const receipt = await context.repository.getProgressImport(
      context.learner.learnerId,
      parsed.clientImportId,
    );
    if (!receipt) {
      return noStoreJson(
        { error: "Resolve the local progress import choice before saving." },
        { status: 409 },
      );
    }

    let update: ProgressPatchRequest;
    if (isV3) {
      update = parsed as ProgressPatchRequest;
    } else {
      const legacy = parsed as LegacyProgressPatch;
      const current = await context.repository.loadProgress(
        context.learner.learnerId,
        legacy.programVersionId,
      );
      const operations = legacyOperations(legacy, current.courses);
      if (operations.length === 0) {
        return noStoreJson(
          await authenticatedProgressPayload(
            context,
            legacy.programVersionId,
            legacy.clientImportId,
            requestReturnTo(request),
          ),
        );
      }
      update = {
        schemaVersion: 3,
        programVersionId: legacy.programVersionId,
        clientImportId: legacy.clientImportId,
        deviceId: "legacy-v2-client",
        clientMutationId: `legacy-${crypto.randomUUID()}`,
        baseRevision: current.revision,
        operations,
      };
    }

    try {
      const applied = await context.repository.applyMutation({
        learnerId: context.learner.learnerId,
        programVersionId: update.programVersionId,
        deviceId: update.deviceId,
        clientMutationId: update.clientMutationId,
        baseRevision: update.baseRevision,
        operations: update.operations,
      });
      return noStoreJson(
        await authenticatedProgressPayload(
          context,
          update.programVersionId,
          update.clientImportId,
          requestReturnTo(request),
          applied.mutationId,
        ),
      );
    } catch (error) {
      if (error instanceof LearnerProgressRevisionConflictError) {
        const current = await authenticatedProgressPayload(
          context,
          update.programVersionId,
          update.clientImportId,
          requestReturnTo(request),
        );
        return noStoreJson(
          { conflict: true, reason: "revision", progress: current.progress },
          { status: 409 },
        );
      }
      throw error;
    }
  } catch (error) {
    return progressErrorResponse(error);
  }
}
