import type {
  AssessmentKind,
  AssessmentVersionId,
  CourseVersionId,
  LearningUnitId,
  ProgramRequirementEvaluation,
  PublishedProgramBundle,
} from "./catalog";
import type {
  AssessmentAttempt,
  AssessmentAttemptStatus,
  AssessmentEvaluationMethod,
} from "../learner-progress-contract";
import type { StoredProgramProgress } from "../progress-storage";
import {
  COURSE_MASTERY_STATE_LABELS,
  evaluateCourseMastery,
  getMasteredCourseVersionIds,
  type CourseMasteryState,
} from "./mastery";
import {
  evaluateLearnerPathCompletion,
  resolveLearnerPath,
  type ResolvedLearnerPath,
} from "./learner-path";

export type EvidenceReviewStatus =
  | "self-attested"
  | "self-assessed"
  | "automatically-checked"
  | "peer-reviewed"
  | "instructor-reviewed";

export const EVIDENCE_REVIEW_LABELS: Readonly<
  Record<EvidenceReviewStatus, string>
> = {
  "self-attested": "Self-attested",
  "self-assessed": "Self-assessed",
  "automatically-checked": "Automatically checked",
  "peer-reviewed": "Peer reviewed",
  "instructor-reviewed": "Instructor reviewed",
};

export interface LearningRecordEvidence {
  readonly id: string;
  readonly source: "learning-unit" | "assessment-submission";
  readonly courseVersionId: CourseVersionId;
  readonly courseTitle: string;
  readonly subjectId: string;
  readonly subjectTitle: string;
  readonly textOrUrl: string;
  readonly recordedAt?: string;
  readonly reviewStatus: EvidenceReviewStatus;
  readonly provenance: string;
}

export interface LearningRecordAssessmentAttempt {
  readonly id: string;
  readonly attemptNumber: number;
  readonly status: AssessmentAttemptStatus;
  readonly startedAt: string;
  readonly submittedAt?: string;
  readonly evaluatedAt?: string;
  readonly submissionEvidence: readonly string[];
  readonly score?: number;
  readonly maximumScore?: number;
  readonly scorePercentage?: number;
  readonly passed?: boolean;
  readonly evaluationMethod?: AssessmentEvaluationMethod;
  readonly reviewStatus: EvidenceReviewStatus;
  readonly feedback?: string;
}

export interface LearningRecordAssessment {
  readonly assessmentVersionId: AssessmentVersionId;
  readonly title: string;
  readonly kind: AssessmentKind;
  readonly weight: number;
  readonly requiredToPass: boolean;
  readonly estimatedHours: number;
  readonly maximumScore: number;
  readonly attempts: readonly LearningRecordAssessmentAttempt[];
}

export interface LearningRecordCourse {
  readonly courseVersionId: CourseVersionId;
  readonly canonicalSlug: string;
  readonly code: string;
  readonly title: string;
  readonly format: string;
  readonly nominalHours: number;
  readonly totalUnits: number;
  readonly completedUnits: number;
  readonly completedLearningHours: number;
  readonly masteryState: CourseMasteryState;
  readonly masteryLabel: string;
  readonly passed: boolean;
  readonly weightedScorePercentage?: number;
  readonly assessments: readonly LearningRecordAssessment[];
}

export interface LearningRecordProject {
  readonly learningUnitId: LearningUnitId;
  readonly courseVersionId: CourseVersionId;
  readonly courseTitle: string;
  readonly title: string;
  readonly nominalHours: number;
  readonly completed: boolean;
  readonly evidence?: LearningRecordEvidence;
}

export interface IndependentLearningRecord {
  readonly learnerPath: ResolvedLearnerPath;
  readonly requirementEvaluation: ProgramRequirementEvaluation;
  readonly pathwayRequirementsCompleted: boolean;
  readonly courses: readonly LearningRecordCourse[];
  readonly projects: readonly LearningRecordProject[];
  readonly evidence: readonly LearningRecordEvidence[];
  readonly totals: {
    readonly courses: number;
    readonly passedCourses: number;
    readonly learningUnits: number;
    readonly completedLearningUnits: number;
    readonly nominalPathHours: number;
    readonly passedCourseNominalHours: number;
    readonly completedLearningHours: number;
    readonly assessmentHours: number;
    readonly assessments: number;
    readonly assessmentAttempts: number;
    readonly projects: number;
    readonly evidencedProjects: number;
  };
}

function selectedCourseVersionIds(progress: StoredProgramProgress | undefined) {
  return Object.values(progress?.requirementSelections ?? {}).flat();
}

function compareAttempts(left: AssessmentAttempt, right: AssessmentAttempt) {
  if (left.attemptNumber !== right.attemptNumber) {
    return left.attemptNumber - right.attemptNumber;
  }
  return (
    left.startedAt.localeCompare(right.startedAt) || left.id.localeCompare(right.id)
  );
}

function reviewStatusForMethod(
  method: AssessmentEvaluationMethod | undefined,
): EvidenceReviewStatus {
  if (method === "self") return "self-assessed";
  if (method === "automatic") return "automatically-checked";
  if (method === "peer") return "peer-reviewed";
  if (method === "instructor") return "instructor-reviewed";
  return "self-attested";
}

function attemptProjection(
  attempt: AssessmentAttempt,
  publishedMaximumScore: number,
): LearningRecordAssessmentAttempt {
  const maximumScore = attempt.result?.maximumScore ?? publishedMaximumScore;
  const scorePercentage = attempt.result
    ? (attempt.result.score / maximumScore) * 100
    : undefined;
  const reviewStatus = reviewStatusForMethod(
    attempt.result?.evaluationMethod,
  );
  return {
    id: attempt.id,
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    startedAt: attempt.startedAt,
    ...(attempt.submittedAt ? { submittedAt: attempt.submittedAt } : {}),
    ...(attempt.result?.evaluatedAt
      ? { evaluatedAt: attempt.result.evaluatedAt }
      : {}),
    submissionEvidence: attempt.submissionEvidence,
    ...(attempt.result ? { score: attempt.result.score } : {}),
    ...(attempt.result ? { maximumScore } : {}),
    ...(scorePercentage !== undefined ? { scorePercentage } : {}),
    ...(attempt.result ? { passed: attempt.result.passed } : {}),
    ...(attempt.result?.evaluationMethod
      ? { evaluationMethod: attempt.result.evaluationMethod }
      : {}),
    reviewStatus,
    ...(attempt.result?.feedback ? { feedback: attempt.result.feedback } : {}),
  };
}

/**
 * Creates the sole data projection used for completion claims and the printable
 * Independent Learning Record. All totals are catalog nominal hours, not a
 * claim that Course Atlas observed the learner for that duration.
 */
export function buildIndependentLearningRecord(
  bundle: PublishedProgramBundle,
  progress: StoredProgramProgress | undefined,
): IndependentLearningRecord {
  const learnerPath = resolveLearnerPath(bundle, {
    selectedConcentrationId: progress?.selectedConcentrationId,
    selectedCourseVersionIds: selectedCourseVersionIds(progress),
  });
  const masteredCourseVersionIds = getMasteredCourseVersionIds(bundle, progress);
  const requirementEvaluation = evaluateLearnerPathCompletion(
    bundle,
    learnerPath,
    masteredCourseVersionIds,
  );
  const pathwayRequirementsCompleted =
    learnerPath.isResolved && requirementEvaluation.satisfied;

  const courseById = new Map(bundle.courses.map((course) => [course.id, course]));
  const assessmentById = new Map(
    bundle.assessments.map((assessment) => [assessment.id, assessment]),
  );
  const attempts = Object.values(progress?.assessmentAttempts ?? {});
  const evidence: LearningRecordEvidence[] = [];
  const projects: LearningRecordProject[] = [];

  const courses = learnerPath.courseVersions.map((courseVersion) => {
    const course = courseById.get(courseVersion.courseId);
    if (!course) {
      throw new Error(`Missing course identity for ${courseVersion.id}.`);
    }
    const units = learnerPath.learningUnits.filter(
      (unit) => unit.courseVersionId === courseVersion.id,
    );
    const mastery = evaluateCourseMastery(bundle, courseVersion.id, progress);
    const completedLearningHours = units
      .filter((unit) => mastery.completedUnitIds.has(unit.id))
      .reduce((total, unit) => total + unit.nominalHours, 0);

    for (const unit of units) {
      const storedEvidence = progress?.unitEvidences?.[unit.id];
      let projectedEvidence: LearningRecordEvidence | undefined;
      if (
        storedEvidence?.courseVersionId === courseVersion.id &&
        storedEvidence.learningUnitId === unit.id &&
        storedEvidence.textOrUrl.trim().length > 0
      ) {
        projectedEvidence = {
          id: `unit:${unit.id}`,
          source: "learning-unit",
          courseVersionId: courseVersion.id,
          courseTitle: courseVersion.title,
          subjectId: unit.id,
          subjectTitle: unit.title,
          textOrUrl: storedEvidence.textOrUrl,
          ...(storedEvidence.updatedAt
            ? { recordedAt: storedEvidence.updatedAt }
            : {}),
          reviewStatus: "self-attested",
          provenance:
            "Learner-submitted learning-unit evidence; no independent review is recorded.",
        };
        evidence.push(projectedEvidence);
      }
      if (mastery.projectUnitIds.includes(unit.id)) {
        projects.push({
          learningUnitId: unit.id,
          courseVersionId: courseVersion.id,
          courseTitle: courseVersion.title,
          title: unit.title,
          nominalHours: unit.nominalHours,
          completed: mastery.completedUnitIds.has(unit.id),
          ...(projectedEvidence ? { evidence: projectedEvidence } : {}),
        });
      }
    }

    const assessments = mastery.assessments.map((assessmentMastery) => {
      const assessmentVersion = assessmentMastery.assessmentVersion;
      const assessment = assessmentById.get(assessmentVersion.assessmentId);
      if (!assessment) {
        throw new Error(
          `Missing assessment identity for ${assessmentVersion.id}.`,
        );
      }
      const assessmentAttempts = attempts
        .filter(
          (attempt) =>
            attempt.courseVersionId === courseVersion.id &&
            attempt.assessmentVersionId === assessmentVersion.id,
        )
        .sort(compareAttempts)
        .map((attempt) =>
          attemptProjection(attempt, assessmentVersion.maximumScore),
        );

      for (const attempt of assessmentAttempts) {
        for (const [index, textOrUrl] of attempt.submissionEvidence.entries()) {
          if (!textOrUrl.trim()) continue;
          const provenance = attempt.evaluationMethod
            ? `Learner-submitted assessment evidence; result recorded as ${EVIDENCE_REVIEW_LABELS[attempt.reviewStatus].toLowerCase()}.`
            : "Learner-submitted assessment evidence; no evaluation is recorded.";
          evidence.push({
            id: `assessment:${attempt.id}:${index}`,
            source: "assessment-submission",
            courseVersionId: courseVersion.id,
            courseTitle: courseVersion.title,
            subjectId: assessmentVersion.id,
            subjectTitle: `${assessmentVersion.title} · Attempt ${attempt.attemptNumber}`,
            textOrUrl,
            ...(attempt.evaluatedAt ?? attempt.submittedAt
              ? { recordedAt: attempt.evaluatedAt ?? attempt.submittedAt }
              : {}),
            reviewStatus: attempt.reviewStatus,
            provenance,
          });
        }
      }

      return {
        assessmentVersionId: assessmentVersion.id,
        title: assessmentVersion.title,
        kind: assessment.kind,
        weight: assessmentMastery.weight,
        requiredToPass: assessmentMastery.requiredToPass,
        estimatedHours: assessmentVersion.estimatedHours,
        maximumScore: assessmentVersion.maximumScore,
        attempts: assessmentAttempts,
      };
    });

    return {
      courseVersionId: courseVersion.id,
      canonicalSlug: course.canonicalSlug,
      code: course.codes[0]?.value ?? courseVersion.format,
      title: courseVersion.title,
      format: courseVersion.format,
      nominalHours: courseVersion.nominalHours,
      totalUnits: units.length,
      completedUnits: mastery.completedUnitIds.size,
      completedLearningHours,
      masteryState: mastery.state,
      masteryLabel: COURSE_MASTERY_STATE_LABELS[mastery.state],
      passed: mastery.passed,
      ...(mastery.weightedScorePercentage !== undefined
        ? { weightedScorePercentage: mastery.weightedScorePercentage }
        : {}),
      assessments,
    };
  });

  const allAssessments = courses.flatMap((course) => course.assessments);
  return {
    learnerPath,
    requirementEvaluation,
    pathwayRequirementsCompleted,
    courses,
    projects,
    evidence,
    totals: {
      courses: courses.length,
      passedCourses: courses.filter((course) => course.passed).length,
      learningUnits: learnerPath.learningUnits.length,
      completedLearningUnits: courses.reduce(
        (total, course) => total + course.completedUnits,
        0,
      ),
      nominalPathHours: learnerPath.totals.nominalHours,
      passedCourseNominalHours: courses
        .filter((course) => course.passed)
        .reduce((total, course) => total + course.nominalHours, 0),
      completedLearningHours: courses.reduce(
        (total, course) => total + course.completedLearningHours,
        0,
      ),
      assessmentHours: allAssessments.reduce(
        (total, assessment) => total + assessment.estimatedHours,
        0,
      ),
      assessments: allAssessments.length,
      assessmentAttempts: allAssessments.reduce(
        (total, assessment) => total + assessment.attempts.length,
        0,
      ),
      projects: projects.length,
      evidencedProjects: projects.filter((project) => project.evidence).length,
    },
  };
}
