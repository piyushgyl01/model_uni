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
    if (!context) return anonymousProgressResponse("/today");
    const view = await learnerReadModels(context).getTodayView(
      context.learner.learnerId,
      programVersionId,
    );
    return noStoreJson({ authenticated: true, ...view });
  } catch (error) {
    return learnerViewErrorResponse(error);
  }
}
