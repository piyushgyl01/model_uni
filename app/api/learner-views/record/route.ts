import {
  anonymousProgressResponse,
  getAuthenticatedLearner,
  noStoreJson,
} from "../../../learner-progress-api";
import {
  learnerReadModels,
  learnerViewErrorResponse,
  requestedProgramVersionId,
} from "../shared";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const programVersionId = requestedProgramVersionId(url);
    const context = await getAuthenticatedLearner();
    if (!context) return anonymousProgressResponse("/transcript");
    const view = await learnerReadModels(context).getRecordView(
      context.learner.learnerId,
      programVersionId,
    );
    return noStoreJson({ authenticated: true, ...view });
  } catch (error) {
    return learnerViewErrorResponse(error);
  }
}
