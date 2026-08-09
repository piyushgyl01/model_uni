import type {
  AssessmentVersionId,
  CourseVersionId,
  LearningUnit,
  LearningUnitId,
  PublishedAssessmentVersion,
  PublishedProgramBundle,
} from "./catalog";
import type { AssessmentAttempt } from "../learner-progress-contract";
import type { StoredProgramProgress } from "../progress-storage";
import { resolveLearnerPath } from "./learner-path";

export type CourseMasteryState =
  | "not-started"
  | "studying"
  | "assessment-due"
  | "submitted"
  | "evaluated"
  | "passed"
  | "retry";

export const COURSE_MASTERY_STATE_LABELS: Readonly<
  Record<CourseMasteryState, string>
> = {
  "not-started": "Not started",
  studying: "Studying",
  "assessment-due": "Assessment due",
  submitted: "Submitted",
  evaluated: "Evaluated",
  passed: "Passed",
  retry: "Retry required",
};

export interface AssessmentMasteryEvaluation {
  readonly assessmentVersion: PublishedAssessmentVersion;
  readonly weight: number;
  readonly requiredToPass: boolean;
  readonly latestAttempt?: AssessmentAttempt;
  readonly submitted: boolean;
  readonly evaluated: boolean;
  readonly scorePercentage?: number;
  readonly thresholdSatisfied: boolean;
}

export interface CourseMasteryEvaluation {
  readonly courseVersionId: CourseVersionId;
  readonly state: CourseMasteryState;
  readonly passed: boolean;
  readonly completedUnitIds: ReadonlySet<LearningUnitId>;
  readonly requiredUnitIds: readonly LearningUnitId[];
  readonly projectUnitIds: readonly LearningUnitId[];
  readonly learningWorkComplete: boolean;
  readonly requiredAssessmentsSubmitted: boolean;
  readonly requiredAssessmentsEvaluated: boolean;
  readonly passingThresholdSatisfied: boolean;
  readonly projectEvidenceComplete: boolean;
  readonly weightedScorePercentage?: number;
  readonly assessments: readonly AssessmentMasteryEvaluation[];
  readonly blockers: readonly string[];
}

function selectedCourseVersionIds(progress: StoredProgramProgress | undefined) {
  return Object.values(progress?.requirementSelections ?? {}).flat();
}

function compareAttempts(left: AssessmentAttempt, right: AssessmentAttempt) {
  if (left.attemptNumber !== right.attemptNumber) {
    return left.attemptNumber - right.attemptNumber;
  }
  const leftTime = left.updatedAt ?? left.submittedAt ?? left.startedAt;
  const rightTime = right.updatedAt ?? right.submittedAt ?? right.startedAt;
  return leftTime.localeCompare(rightTime) || left.id.localeCompare(right.id);
}

export function latestAssessmentAttempt(
  progress: StoredProgramProgress | undefined,
  courseVersionId: CourseVersionId,
  assessmentVersionId: AssessmentVersionId,
) {
  return Object.values(progress?.assessmentAttempts ?? {})
    .filter(
      (attempt) =>
        attempt.courseVersionId === courseVersionId &&
        attempt.assessmentVersionId === assessmentVersionId &&
        attempt.status !== "void",
    )
    .sort(compareAttempts)
    .at(-1);
}

function isProjectEvidenceUnit(unit: LearningUnit) {
  return (
    unit.kind === "project" ||
    unit.assessmentKind === "project" ||
    unit.assessmentKind === "lab" ||
    unit.assessmentKind === "portfolio" ||
    unit.assessmentKind === "presentation"
  );
}

function validCompletedUnitIds(
  bundle: PublishedProgramBundle,
  courseVersionId: CourseVersionId,
  progress: StoredProgramProgress | undefined,
) {
  const allowed = new Set(
    bundle.learningUnits
      .filter((unit) => unit.courseVersionId === courseVersionId)
      .map((unit) => unit.id),
  );
  return new Set(
    (progress?.courses?.[courseVersionId]?.completedUnitIds ?? []).filter(
      (unitId): unitId is LearningUnitId => allowed.has(unitId as LearningUnitId),
    ),
  );
}

/**
 * Evaluates the exact published course version against durable learner state.
 * Unit checkboxes are learning-work records, never a course-passing shortcut.
 */
export function evaluateCourseMastery(
  bundle: PublishedProgramBundle,
  courseVersionId: CourseVersionId,
  progress: StoredProgramProgress | undefined,
): CourseMasteryEvaluation {
  const courseVersion = bundle.courseVersions.find(
    (course) => course.id === courseVersionId,
  );
  if (!courseVersion) {
    throw new Error(`Unknown course version ${courseVersionId}.`);
  }

  const units = bundle.learningUnits.filter(
    (unit) => unit.courseVersionId === courseVersionId,
  );
  const requiredUnitIds = units.map((unit) => unit.id);
  const projectUnitIds = units.filter(isProjectEvidenceUnit).map((unit) => unit.id);
  const completedUnitIds = validCompletedUnitIds(
    bundle,
    courseVersionId,
    progress,
  );
  const learningWorkComplete =
    requiredUnitIds.length > 0 &&
    requiredUnitIds.every((unitId) => completedUnitIds.has(unitId));

  const assessmentById = new Map(
    bundle.assessmentVersions.map((assessment) => [assessment.id, assessment]),
  );
  const assessments = courseVersion.gradingPolicy.contributions.map(
    (contribution): AssessmentMasteryEvaluation => {
      const assessmentVersion = assessmentById.get(
        contribution.assessmentVersionId,
      );
      if (!assessmentVersion) {
        throw new Error(
          `Course ${courseVersionId} references missing assessment ${contribution.assessmentVersionId}.`,
        );
      }
      const latestAttempt = latestAssessmentAttempt(
        progress,
        courseVersionId,
        assessmentVersion.id,
      );
      const hasSubmissionEvidence = Boolean(
        latestAttempt?.submissionEvidence.some((entry) => entry.trim().length > 0),
      );
      const submitted =
        hasSubmissionEvidence &&
        (latestAttempt?.status === "submitted" ||
          latestAttempt?.status === "evaluated");
      const evaluated =
        submitted &&
        latestAttempt?.status === "evaluated" &&
        latestAttempt.result !== undefined;
      const maximumScore =
        latestAttempt?.result?.maximumScore ?? assessmentVersion.maximumScore;
      const scorePercentage = evaluated
        ? (latestAttempt.result!.score / maximumScore) * 100
        : undefined;
      const thresholdSatisfied = Boolean(
        evaluated &&
          latestAttempt.result?.passed &&
          scorePercentage !== undefined &&
          scorePercentage >= courseVersion.gradingPolicy.passingPercentage,
      );
      return {
        assessmentVersion,
        weight: contribution.weight,
        requiredToPass: contribution.requiredToPass ?? false,
        ...(latestAttempt ? { latestAttempt } : {}),
        submitted,
        evaluated,
        ...(scorePercentage !== undefined ? { scorePercentage } : {}),
        thresholdSatisfied,
      };
    },
  );

  const requiredAssessmentsSubmitted = assessments.every(
    (assessment) => assessment.submitted,
  );
  const requiredAssessmentsEvaluated = assessments.every(
    (assessment) => assessment.evaluated,
  );
  const totalWeight = assessments.reduce(
    (total, assessment) => total + assessment.weight,
    0,
  );
  const weightedScorePercentage = requiredAssessmentsEvaluated && totalWeight > 0
    ? assessments.reduce(
        (total, assessment) =>
          total + (assessment.scorePercentage ?? 0) * assessment.weight,
        0,
      ) / totalWeight
    : assessments.length === 0
      ? 100
      : undefined;
  const requiredAssessmentThresholdsSatisfied = assessments
    .filter((assessment) => assessment.requiredToPass)
    .every((assessment) => assessment.thresholdSatisfied);
  const passingThresholdSatisfied = Boolean(
    requiredAssessmentsEvaluated &&
      weightedScorePercentage !== undefined &&
      weightedScorePercentage >= courseVersion.gradingPolicy.passingPercentage &&
      requiredAssessmentThresholdsSatisfied,
  );

  const projectEvidenceComplete = projectUnitIds.every((unitId) => {
    const evidence = progress?.unitEvidences?.[unitId];
    return Boolean(
      evidence &&
        evidence.courseVersionId === courseVersionId &&
        evidence.learningUnitId === unitId &&
        evidence.textOrUrl.trim().length > 0,
    );
  });

  const passed =
    learningWorkComplete &&
    requiredAssessmentsSubmitted &&
    passingThresholdSatisfied &&
    projectEvidenceComplete;
  const blockers: string[] = [];
  if (!learningWorkComplete) blockers.push("Complete every required learning unit.");
  if (!requiredAssessmentsSubmitted) {
    blockers.push("Submit every required assessment with work evidence.");
  }
  if (!passingThresholdSatisfied) {
    blockers.push(
      `Earn at least ${courseVersion.gradingPolicy.passingPercentage}% and pass every required assessment.`,
    );
  }
  if (!projectEvidenceComplete) {
    blockers.push("Attach evidence for every required project or practical unit.");
  }

  const hasStarted =
    completedUnitIds.size > 0 ||
    assessments.some((assessment) => assessment.latestAttempt) ||
    projectUnitIds.some((unitId) => Boolean(progress?.unitEvidences?.[unitId]));
  const hasRetryDraft = assessments.some(
    (assessment) =>
      assessment.latestAttempt?.attemptNumber &&
      assessment.latestAttempt.attemptNumber > 1 &&
      assessment.latestAttempt.status === "draft",
  );
  const state: CourseMasteryState = passed
    ? "passed"
    : requiredAssessmentsEvaluated && !passingThresholdSatisfied
      ? "retry"
      : hasRetryDraft
        ? "retry"
        : requiredAssessmentsEvaluated
          ? "evaluated"
          : requiredAssessmentsSubmitted
            ? "submitted"
            : learningWorkComplete
              ? "assessment-due"
              : hasStarted
                ? "studying"
                : "not-started";

  return {
    courseVersionId,
    state,
    passed,
    completedUnitIds,
    requiredUnitIds,
    projectUnitIds,
    learningWorkComplete,
    requiredAssessmentsSubmitted,
    requiredAssessmentsEvaluated,
    passingThresholdSatisfied,
    projectEvidenceComplete,
    ...(weightedScorePercentage !== undefined
      ? { weightedScorePercentage }
      : {}),
    assessments,
    blockers,
  };
}

export function getMasteredCourseVersionIds(
  bundle: PublishedProgramBundle,
  progress: StoredProgramProgress | undefined,
) {
  const path = resolveLearnerPath(bundle, {
    selectedConcentrationId: progress?.selectedConcentrationId,
    selectedCourseVersionIds: selectedCourseVersionIds(progress),
  });
  return new Set(
    path.courseVersions
      .filter((course) => evaluateCourseMastery(bundle, course.id, progress).passed)
      .map((course) => course.id),
  );
}
