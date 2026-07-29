import type {
  ConcentrationId,
  CourseVersionId,
  LearningUnitId,
  ProgramVersionId,
} from "../../../domain/catalog";
import {
  PROGRESS_STORAGE_NAMESPACE,
  type ProgressImportRequest,
} from "../../../learner-progress-contract";
import {
  anonymousProgressResponse,
  badProgressRequest,
  getAuthenticatedLearner,
  noStoreJson,
  progressErrorResponse,
  readBoundedJson,
  rejectCrossOriginMutation,
  requireClientImportId,
  requireObject,
  requirePrefixedId,
} from "../../../learner-progress-api";

export const dynamic = "force-dynamic";

function parseImportRequest(value: unknown): ProgressImportRequest {
  const object = requireObject(value, "progress import");
  if (object.schemaVersion !== 2) {
    badProgressRequest("Only progress schemaVersion 2 can be imported.");
  }
  if (object.storageNamespace !== PROGRESS_STORAGE_NAMESPACE) {
    badProgressRequest("Unsupported progress storage namespace.");
  }
  const clientImportId = requireClientImportId(object.clientImportId);
  if (object.disposition !== "merged" && object.disposition !== "cloud") {
    badProgressRequest('disposition must be "merged" or "cloud".');
  }
  const activeProgramVersionId = requirePrefixedId(
    object.activeProgramVersionId,
    "activeProgramVersionId",
  );
  if (!activeProgramVersionId.startsWith("prv_")) {
    badProgressRequest("activeProgramVersionId must start with prv_.");
  }

  const programsObject = requireObject(object.programs, "programs");
  const programEntries = Object.entries(programsObject);
  if (programEntries.length > 50) {
    badProgressRequest("Progress import contains too many programs.");
  }
  let courseCount = 0;
  let unitCount = 0;
  const programs = Object.fromEntries(
    programEntries.map(([programVersionId, programValue]) => {
      requirePrefixedId(programVersionId, "programVersionId");
      if (!programVersionId.startsWith("prv_")) {
        badProgressRequest("Imported program version IDs must start with prv_.");
      }
      const program = requireObject(
        programValue,
        `programs.${programVersionId}`,
      );
      let selectedConcentrationId: string | undefined;
      if (program.selectedConcentrationId !== undefined) {
        selectedConcentrationId = requirePrefixedId(
          program.selectedConcentrationId,
          `programs.${programVersionId}.selectedConcentrationId`,
        );
        if (!selectedConcentrationId.startsWith("con_")) {
          badProgressRequest("Imported concentration IDs must start with con_.");
        }
      }
      const coursesObject = requireObject(
        program.courses,
        `programs.${programVersionId}.courses`,
      );
      const courses = Object.fromEntries(
        Object.entries(coursesObject).map(([courseVersionId, courseValue]) => {
          courseCount += 1;
          if (courseCount > 500) {
            badProgressRequest("Progress import contains too many courses.");
          }
          requirePrefixedId(courseVersionId, "courseVersionId");
          if (!courseVersionId.startsWith("crv_")) {
            badProgressRequest("Imported course version IDs must start with crv_.");
          }
          const course = requireObject(
            courseValue,
            `programs.${programVersionId}.courses.${courseVersionId}`,
          );
          if (!Array.isArray(course.completedUnitIds)) {
            badProgressRequest(
              `programs.${programVersionId}.courses.${courseVersionId}.completedUnitIds must be an array.`,
            );
          }
          const completedUnitIds = [
            ...new Set(
              course.completedUnitIds.map((unitId, index) => {
                unitCount += 1;
                if (unitCount > 10_000) {
                  badProgressRequest("Progress import contains too many units.");
                }
                const id = requirePrefixedId(
                  unitId,
                  `completedUnitIds[${index}]`,
                );
                if (!id.startsWith("unt_")) {
                  badProgressRequest(
                    "Imported learning unit IDs must start with unt_.",
                  );
                }
                return id;
              }),
            ),
          ];
          return [
            courseVersionId,
            {
              completedUnitIds,
              ...(typeof course.updatedAt === "string"
                ? { updatedAt: course.updatedAt.slice(0, 80) }
                : {}),
            },
          ];
        }),
      );
      return [
        programVersionId,
        {
          selectedConcentrationId,
          courses,
        },
      ];
    }),
  );

  return {
    schemaVersion: 2,
    storageNamespace: PROGRESS_STORAGE_NAMESPACE,
    clientImportId,
    disposition: object.disposition,
    activeProgramVersionId:
      activeProgramVersionId as ProgramVersionId,
    programs,
  };
}

export async function POST(request: Request) {
  try {
    rejectCrossOriginMutation(request);
    const context = await getAuthenticatedLearner();
    if (!context) return anonymousProgressResponse("/");
    const parsed = parseImportRequest(await readBoundedJson(request));
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
        selectedConcentrationId:
          program.selectedConcentrationId as ConcentrationId | undefined,
        courses: Object.entries(program.courses).map(
          ([courseVersionId, course]) => ({
            courseVersionId: courseVersionId as CourseVersionId,
            completedUnitIds:
              course.completedUnitIds as readonly LearningUnitId[],
          }),
        ),
      }),
    );
    const receipt = await context.repository.importLocalProgress({
      learnerId: context.learner.learnerId,
      clientImportId: parsed.clientImportId,
      storageNamespace: parsed.storageNamespace,
      disposition: parsed.disposition,
      programs,
    });

    return noStoreJson({
      confirmed: true,
      alreadyConfirmed: Boolean(existing),
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
