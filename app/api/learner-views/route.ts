import {
  anonymousProgressResponse,
  getAuthenticatedLearner,
  noStoreJson,
} from "../../learner-progress-api";
import {
  learnerReadModels,
  learnerViewErrorResponse,
} from "./shared";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const context = await getAuthenticatedLearner();
    if (!context) return anonymousProgressResponse("/today");
    const programs = await learnerReadModels(context).listLearnerPrograms(
      context.learner.learnerId,
    );
    return noStoreJson({ authenticated: true, programs });
  } catch (error) {
    return learnerViewErrorResponse(error);
  }
}
