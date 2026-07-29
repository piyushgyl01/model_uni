import type {
  ConcentrationId,
  CourseVersionId,
  LearningUnitId,
  ProgramVersionId,
} from "../../domain/catalog";
import type { ProgressPatchRequest } from "../../learner-progress-contract";
import {
  anonymousProgressResponse,
  authenticatedProgressPayload,
  badProgressRequest,
  getAuthenticatedLearner,
  noStoreJson,
  progressErrorResponse,
  readBoundedJson,
  rejectCrossOriginMutation,
  requireClientImportId,
  requireObject,
  requirePrefixedId,
} from "../../learner-progress-api";

export const dynamic = "force-dynamic";

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

function parsePatchRequest(value: unknown): ProgressPatchRequest {
  const object = requireObject(value, "progress update");
  const programVersionId = parseProgramVersionId(object.programVersionId);
  const clientImportId = requireClientImportId(object.clientImportId);
  const courseUpdatesValue = object.courseUpdates;
  const courseUpdates: ProgressPatchRequest["courseUpdates"] =
    courseUpdatesValue === undefined
      ? undefined
      : (() => {
          if (!Array.isArray(courseUpdatesValue)) {
            badProgressRequest("courseUpdates must be an array.");
          }
          if (courseUpdatesValue.length > 100) {
            badProgressRequest("courseUpdates contains too many courses.");
          }
          const seenCourses = new Set<string>();
          let unitCount = 0;
          return courseUpdatesValue.map((item, index) => {
            const update = requireObject(
              item,
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
                  const id = requirePrefixedId(
                    unitId,
                    `courseUpdates[${index}].completedUnitIds[${unitIndex}]`,
                  );
                  if (!id.startsWith("unt_")) {
                    badProgressRequest(
                      `courseUpdates[${index}].completedUnitIds[${unitIndex}] must start with unt_.`,
                    );
                  }
                  return id as LearningUnitId;
                }),
              ),
            ];
            unitCount += completedUnitIds.length;
            if (unitCount > 5_000) {
              badProgressRequest("Progress update contains too many units.");
            }
            return {
              courseVersionId: courseVersionId as CourseVersionId,
              completedUnitIds,
            };
          });
        })();

  let concentrationUpdate: ProgressPatchRequest["concentrationUpdate"];
  if (object.concentrationUpdate !== undefined) {
    const update = requireObject(
      object.concentrationUpdate,
      "concentrationUpdate",
    );
    if (update.selectedConcentrationId === null) {
      concentrationUpdate = { selectedConcentrationId: null };
    } else {
      const id = requirePrefixedId(
        update.selectedConcentrationId,
        "concentrationUpdate.selectedConcentrationId",
      );
      if (!id.startsWith("con_")) {
        badProgressRequest("selectedConcentrationId must start with con_.");
      }
      concentrationUpdate = {
        selectedConcentrationId: id as ConcentrationId,
      };
    }
  }

  if (!courseUpdates?.length && !concentrationUpdate) {
    badProgressRequest("Progress update does not contain a change.");
  }
  return {
    programVersionId,
    clientImportId,
    courseUpdates,
    concentrationUpdate,
  };
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
    const payload = await authenticatedProgressPayload(
      context,
      programVersionId,
      clientImportId,
      returnTo,
    );
    return noStoreJson(payload);
  } catch (error) {
    return progressErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    rejectCrossOriginMutation(request);
    const context = await getAuthenticatedLearner();
    if (!context) return anonymousProgressResponse("/");
    const update = parsePatchRequest(await readBoundedJson(request));
    const receipt = await context.repository.getProgressImport(
      context.learner.learnerId,
      update.clientImportId,
    );
    if (!receipt) {
      return noStoreJson(
        { error: "Resolve the local progress import choice before saving." },
        { status: 409 },
      );
    }

    const bundle =
      await context.repository.catalog.loadByProgramVersionId(
        update.programVersionId,
      );
    if (!bundle) {
      badProgressRequest("The requested program version is not published.");
    }
    for (const course of update.courseUpdates ?? []) {
      const publishedCourse = bundle.courseVersions.find(
        (candidate) => candidate.id === course.courseVersionId,
      );
      if (!publishedCourse) {
        badProgressRequest(
          `Course ${course.courseVersionId} is not in this program version.`,
        );
      }
      const allowedUnits = new Set(
        bundle.learningUnits
          .filter(
            (unit) => unit.courseVersionId === course.courseVersionId,
          )
          .map((unit) => unit.id),
      );
      if (
        course.completedUnitIds.some((unitId) => !allowedUnits.has(unitId))
      ) {
        badProgressRequest(
          `A completed unit is not in course ${course.courseVersionId}.`,
        );
      }
    }
    const selectedConcentrationId =
      update.concentrationUpdate?.selectedConcentrationId;
    if (
      selectedConcentrationId &&
      !bundle.concentrations.some(
        (concentration) => concentration.id === selectedConcentrationId,
      )
    ) {
      badProgressRequest(
        "The selected concentration is not in this program version.",
      );
    }

    if (update.courseUpdates?.length) {
      await context.repository.replaceProgramCompletions(
        context.learner.learnerId,
        update.programVersionId,
        update.courseUpdates,
      );
    }
    if (update.concentrationUpdate) {
      await context.repository.setSelectedConcentration(
        context.learner.learnerId,
        update.programVersionId,
        update.concentrationUpdate.selectedConcentrationId as ConcentrationId | null,
      );
    }

    const payload = await authenticatedProgressPayload(
      context,
      update.programVersionId,
      update.clientImportId,
      requestReturnTo(request),
    );
    return noStoreJson(payload);
  } catch (error) {
    return progressErrorResponse(error);
  }
}
