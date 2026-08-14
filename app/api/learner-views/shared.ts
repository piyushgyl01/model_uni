import type { ProgramVersionId } from "../../domain/catalog";
import {
  LearnerReadModelDataError,
  LearnerReadModelNotFoundError,
  LearnerReadModelRepository,
} from "../../catalog/learner-read-model-repository";
import {
  badProgressRequest,
  noStoreJson,
  progressErrorResponse,
  requirePrefixedId,
  type AuthenticatedLearnerContext,
} from "../../learner-progress-api";

export function learnerReadModels(context: AuthenticatedLearnerContext) {
  return new LearnerReadModelRepository(context.repository);
}

export function requestedProgramVersionId(url: URL) {
  const id = requirePrefixedId(
    url.searchParams.get("programVersionId"),
    "programVersionId",
  );
  if (!id.startsWith("prv_")) {
    badProgressRequest("programVersionId must start with prv_.");
  }
  return id as ProgramVersionId;
}

export function learnerViewErrorResponse(error: unknown) {
  if (error instanceof LearnerReadModelNotFoundError) {
    return noStoreJson({ error: error.message }, { status: 404 });
  }
  if (error instanceof LearnerReadModelDataError) {
    console.error("Learner read model failed", error);
    return noStoreJson(
      { error: "The learner view is temporarily unavailable." },
      { status: 503 },
    );
  }
  return progressErrorResponse(error);
}
