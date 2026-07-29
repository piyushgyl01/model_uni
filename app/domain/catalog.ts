/**
 * The publishable Course Atlas content contract.
 *
 * Stable entities keep the same ID over time. Their published versions receive
 * a separate ID and semantic version so a learner's plan can remain pinned to
 * exactly what they started.
 */

export type PrefixedId<Prefix extends string> = `${Prefix}_${string}`;

export type BundleId = PrefixedId<"bnd">;
export type ProgramId = PrefixedId<"prg">;
export type ProgramVersionId = PrefixedId<"prv">;
export type RequirementGroupId = PrefixedId<"req">;
export type RequirementOptionId = PrefixedId<"opt">;
export type ConcentrationId = PrefixedId<"con">;
export type CourseId = PrefixedId<"crs">;
export type CourseVersionId = PrefixedId<"crv">;
export type LearningUnitId = PrefixedId<"unt">;
export type AssessmentId = PrefixedId<"asm">;
export type AssessmentVersionId = PrefixedId<"asv">;
export type CompetencyId = PrefixedId<"cmp">;
export type CompetencyMappingId = PrefixedId<"cpm">;
export type ResourceId = PrefixedId<"res">;
export type ResourceVersionId = PrefixedId<"rsv">;
export type AccessOfferId = PrefixedId<"acc">;
export type RightsRecordId = PrefixedId<"rgt">;
export type FreshnessRecordId = PrefixedId<"frs">;
export type ProvenanceEvidenceId = PrefixedId<"prvdc">;
export type CalendarId = PrefixedId<"cal">;
export type CalendarPeriodId = PrefixedId<"per">;
export type CalendarMilestoneId = PrefixedId<"mil">;
export type ScheduleId = PrefixedId<"sch">;
export type SchedulePlacementId = PrefixedId<"plc">;

export type SemanticVersion = `${number}.${number}.${number}`;
export type IsoDate = `${number}-${number}-${number}`;
export type IsoDateTime = `${number}-${number}-${number}T${string}`;
export type LocaleTag = string;

export type CatalogLifecycle = "active" | "retired";
export type ProgramKind =
  | "degree-equivalent pathway"
  | "certificate pathway"
  | "course sequence"
  | "independent study";

export interface Program {
  readonly id: ProgramId;
  readonly canonicalSlug: string;
  readonly title: string;
  readonly shortTitle?: string;
  readonly school: string;
  readonly discipline: string;
  readonly kind: ProgramKind;
  readonly lifecycle: CatalogLifecycle;
}

export interface CreditValue {
  readonly value: number;
  readonly system: string;
}

export interface RequirementRule {
  /** Minimum number of options that must be completed. */
  readonly minSelections: number;
  /** Omit when there is no upper selection limit. */
  readonly maxSelections?: number;
  /** Optional credit floor in the group's declared credit system. */
  readonly minCredits?: CreditValue;
  /** Used by coherent tracks whose selected options must come from one path. */
  readonly selectionConstraint?: "same concentration";
}

export interface RequirementOption {
  readonly id: RequirementOptionId;
  readonly courseVersionId: CourseVersionId;
  readonly credits: CreditValue;
  readonly concentrationId?: ConcentrationId;
  readonly recommendedPeriodId?: CalendarPeriodId;
  readonly note?: string;
}

export interface RequirementGroup {
  readonly id: RequirementGroupId;
  readonly title: string;
  readonly description?: string;
  readonly order: number;
  readonly rule: RequirementRule;
  /**
   * Options in different groups should normally be distinct. Set this only
   * when the curriculum deliberately allows one course to satisfy both groups.
   */
  readonly allowSharedCourseCounting?: boolean;
  readonly options: readonly RequirementOption[];
}

export interface PublishedProgramVersion {
  readonly id: ProgramVersionId;
  readonly programId: ProgramId;
  readonly version: SemanticVersion;
  readonly status: "published";
  readonly publishedAt: IsoDateTime;
  readonly baseLocale: LocaleTag;
  readonly title: string;
  readonly summary: string;
  readonly credentialLabel: string;
  readonly nominalDuration: string;
  readonly recognitionNotice: string;
  readonly outcomes: readonly string[];
  readonly workloadPolicy: string;
  readonly defaultScheduleId?: ScheduleId;
  readonly requirements: readonly RequirementGroup[];
  readonly concentrationIds: readonly ConcentrationId[];
  readonly competencyIds: readonly CompetencyId[];
  readonly provenanceEvidenceIds: readonly ProvenanceEvidenceId[];
  readonly changelog?: string;
}

export interface CourseCode {
  /** Examples: "Course Atlas" or "MIT OCW". Codes are scoped to a namespace. */
  readonly namespace: string;
  readonly value: string;
}

export interface Course {
  readonly id: CourseId;
  readonly canonicalSlug: string;
  readonly codes: readonly CourseCode[];
  readonly discipline: string;
  readonly lifecycle: CatalogLifecycle;
}

export interface CoursePrerequisite {
  readonly courseVersionId: CourseVersionId;
  readonly kind: "required" | "recommended";
  readonly concurrentEnrollmentAllowed?: boolean;
  readonly note?: string;
}

export interface CourseResourceReference {
  readonly resourceVersionId: ResourceVersionId;
  readonly role:
    | "primary"
    | "alternative"
    | "tool"
    | "reference"
    | "dataset"
    | "further reading";
  readonly note?: string;
}

export interface AssessmentContribution {
  readonly assessmentVersionId: AssessmentVersionId;
  /** Percentage points in the final course grade. */
  readonly weight: number;
  readonly requiredToPass?: boolean;
}

export interface CourseGradingPolicy {
  readonly passingPercentage: number;
  readonly contributions: readonly AssessmentContribution[];
}

export interface PublishedCourseVersion {
  readonly id: CourseVersionId;
  readonly courseId: CourseId;
  readonly version: SemanticVersion;
  readonly status: "published";
  readonly publishedAt: IsoDateTime;
  readonly baseLocale: LocaleTag;
  readonly title: string;
  readonly summary: string;
  readonly outcomes: readonly string[];
  readonly format:
    | "theory"
    | "laboratory"
    | "studio"
    | "seminar"
    | "capstone"
    | "short course";
  readonly nominalHours: number;
  readonly setup: readonly string[];
  readonly firstAction: string;
  readonly safetyNote?: string;
  readonly prerequisites: readonly CoursePrerequisite[];
  readonly resourceReferences: readonly CourseResourceReference[];
  readonly rootUnitIds: readonly LearningUnitId[];
  readonly gradingPolicy: CourseGradingPolicy;
  readonly competencyIds: readonly CompetencyId[];
  readonly provenanceEvidenceIds: readonly ProvenanceEvidenceId[];
  readonly changelog?: string;
}

export type LearningUnitKind =
  | "module"
  | "unit"
  | "lesson"
  | "reading"
  | "lecture"
  | "practice"
  | "lab"
  | "project"
  | "review"
  | "other";

/**
 * A course may contain any depth or number of units. Ordering is local to the
 * parent; no semester or sixteen-week assumption exists in the model.
 */
export interface LearningUnit {
  readonly id: LearningUnitId;
  readonly courseVersionId: CourseVersionId;
  readonly parentUnitId?: LearningUnitId;
  readonly kind: LearningUnitKind;
  readonly kindLabel?: string;
  readonly order: number;
  readonly label: string;
  readonly title: string;
  readonly topic: string;
  readonly resourceLocator?: string;
  readonly activity: string;
  readonly evidence: string;
  readonly nominalHours: number;
  readonly resourceVersionIds: readonly ResourceVersionId[];
  readonly competencyIds: readonly CompetencyId[];
  readonly assessmentKind?: AssessmentKind;
}

export type AssessmentKind =
  | "quiz"
  | "exam"
  | "problem set"
  | "lab"
  | "project"
  | "presentation"
  | "oral"
  | "portfolio"
  | "reflection"
  | "other";

export interface Assessment {
  readonly id: AssessmentId;
  readonly courseId: CourseId;
  readonly canonicalSlug: string;
  readonly kind: AssessmentKind;
  readonly lifecycle: CatalogLifecycle;
}

export interface PublishedAssessmentVersion {
  readonly id: AssessmentVersionId;
  readonly assessmentId: AssessmentId;
  readonly courseVersionId: CourseVersionId;
  readonly unitId?: LearningUnitId;
  readonly version: SemanticVersion;
  readonly status: "published";
  readonly publishedAt: IsoDateTime;
  readonly title: string;
  readonly instructions: string;
  readonly submissionEvidence: readonly string[];
  readonly estimatedHours: number;
  readonly maximumScore: number;
  readonly resourceVersionIds: readonly ResourceVersionId[];
  readonly competencyIds: readonly CompetencyId[];
  readonly provenanceEvidenceIds: readonly ProvenanceEvidenceId[];
}

export type CompetencyLevel =
  | "awareness"
  | "foundational"
  | "applied"
  | "advanced"
  | "mastery";

export interface Competency {
  readonly id: CompetencyId;
  readonly canonicalSlug: string;
  readonly title: string;
  readonly description: string;
  readonly domain: string;
}

export type CompetencySubject =
  | { readonly kind: "programVersion"; readonly id: ProgramVersionId }
  | { readonly kind: "courseVersion"; readonly id: CourseVersionId }
  | { readonly kind: "learningUnit"; readonly id: LearningUnitId }
  | { readonly kind: "assessmentVersion"; readonly id: AssessmentVersionId };

export interface CompetencyMapping {
  readonly id: CompetencyMappingId;
  readonly competencyId: CompetencyId;
  readonly subject: CompetencySubject;
  readonly relationship: "introduces" | "develops" | "assesses" | "demonstrates";
  readonly targetLevel: CompetencyLevel;
  readonly evidenceNote?: string;
}

export interface Concentration {
  readonly id: ConcentrationId;
  readonly canonicalSlug: string;
  readonly title: string;
  readonly description: string;
  readonly courseVersionIds: readonly CourseVersionId[];
  readonly capstoneIdeas: readonly string[];
}

export type ResourceKind =
  | "course"
  | "textbook"
  | "lecture"
  | "article"
  | "documentation"
  | "dataset"
  | "software"
  | "simulation"
  | "exercise"
  | "reference"
  | "other";

export interface Resource {
  readonly id: ResourceId;
  readonly canonicalSlug: string;
  readonly provider: string;
  readonly kind: ResourceKind;
  readonly lifecycle: CatalogLifecycle;
}

export interface PublishedResourceVersion {
  readonly id: ResourceVersionId;
  readonly resourceId: ResourceId;
  readonly version: SemanticVersion;
  readonly status: "published";
  readonly publishedAt: IsoDateTime;
  readonly title: string;
  readonly canonicalUrl: string;
  readonly language: LocaleTag;
  readonly mediaType?: string;
  readonly authors: readonly string[];
  readonly provenanceEvidenceIds: readonly ProvenanceEvidenceId[];
}

export type AccessType =
  | "free"
  | "free audit"
  | "freemium"
  | "library access"
  | "paid";

/** Access is a current offer, not a copyright or license conclusion. */
export interface ResourceAccessOffer {
  readonly id: AccessOfferId;
  readonly resourceVersionId: ResourceVersionId;
  readonly type: AccessType;
  readonly region: string;
  readonly loginRequired: boolean;
  readonly price?: { readonly amount: number; readonly currency: string };
  readonly checkedAt: IsoDateTime;
  readonly note?: string;
}

export type RightsStatus =
  | "open"
  | "permission granted"
  | "link only"
  | "unknown"
  | "restricted";

/** Rights describes permitted reuse; it remains separate from learner access. */
export interface ResourceRights {
  readonly id: RightsRecordId;
  readonly resourceVersionId: ResourceVersionId;
  readonly status: RightsStatus;
  readonly licenseIdentifier?: string;
  readonly licenseUrl?: string;
  readonly copyrightHolder?: string;
  readonly mayMirror: boolean;
  readonly mayAdapt: boolean;
  readonly verifiedAt?: IsoDateTime;
  readonly evidenceIds: readonly ProvenanceEvidenceId[];
  readonly note?: string;
}

export type FreshnessStatus =
  | "healthy"
  | "redirected"
  | "temporarily unavailable"
  | "broken"
  | "unchecked";

/** Freshness is an observation and may change without a content republication. */
export interface ResourceFreshness {
  readonly id: FreshnessRecordId;
  readonly resourceVersionId: ResourceVersionId;
  readonly status: FreshnessStatus;
  readonly checkedAt?: IsoDateTime;
  readonly httpStatus?: number;
  readonly resolvedUrl?: string;
  readonly contentFingerprint?: string;
  readonly note?: string;
}

export type EvidenceKind =
  | "official catalog"
  | "official syllabus"
  | "provider page"
  | "license terms"
  | "access check"
  | "editorial review"
  | "archived snapshot"
  | "other";

export type EvidenceSubject =
  | { readonly kind: "programVersion"; readonly id: ProgramVersionId }
  | { readonly kind: "courseVersion"; readonly id: CourseVersionId }
  | { readonly kind: "assessmentVersion"; readonly id: AssessmentVersionId }
  | { readonly kind: "competency"; readonly id: CompetencyId }
  | { readonly kind: "resourceVersion"; readonly id: ResourceVersionId }
  | { readonly kind: "resourceRights"; readonly id: RightsRecordId }
  | { readonly kind: "resourceAccess"; readonly id: AccessOfferId };

export interface ProvenanceEvidence {
  readonly id: ProvenanceEvidenceId;
  readonly kind: EvidenceKind;
  readonly sourceTitle: string;
  readonly sourceUrl: string;
  readonly retrievedAt: IsoDateTime;
  readonly subjects: readonly EvidenceSubject[];
  readonly note?: string;
  readonly contentHash?: string;
}

export type CalendarStructure = "terms" | "weeks" | "self paced" | "custom";

export interface CalendarPeriod {
  readonly id: CalendarPeriodId;
  readonly order: number;
  readonly label: string;
  readonly startDate?: IsoDate;
  readonly endDate?: IsoDate;
}

export interface CalendarMilestone {
  readonly id: CalendarMilestoneId;
  readonly label: string;
  readonly periodId?: CalendarPeriodId;
  readonly date?: IsoDate;
  readonly kind: "checkpoint" | "break" | "exam" | "project" | "other";
}

export interface AcademicCalendar {
  readonly id: CalendarId;
  readonly title: string;
  readonly structure: CalendarStructure;
  readonly timezone?: string;
  readonly periods: readonly CalendarPeriod[];
  readonly milestones: readonly CalendarMilestone[];
}

export type ScheduledSubject =
  | { readonly kind: "courseVersion"; readonly id: CourseVersionId }
  | { readonly kind: "learningUnit"; readonly id: LearningUnitId }
  | { readonly kind: "assessmentVersion"; readonly id: AssessmentVersionId };

export interface SchedulePlacement {
  readonly id: SchedulePlacementId;
  readonly subject: ScheduledSubject;
  readonly order: number;
  readonly periodId?: CalendarPeriodId;
  readonly startsOn?: IsoDate;
  readonly dueOn?: IsoDate;
  readonly note?: string;
}

export interface ProgramSchedule {
  readonly id: ScheduleId;
  readonly programVersionId: ProgramVersionId;
  readonly calendarId: CalendarId;
  readonly title: string;
  readonly placements: readonly SchedulePlacement[];
}

/**
 * One immutable, self-contained publication unit. A program pins exact versions
 * of all reusable content needed to render and evaluate its learning path.
 */
export interface PublishedProgramBundle {
  readonly schemaVersion: 1;
  readonly id: BundleId;
  readonly publishedAt: IsoDateTime;
  readonly program: Program;
  readonly programVersion: PublishedProgramVersion;
  readonly courses: readonly Course[];
  readonly courseVersions: readonly PublishedCourseVersion[];
  readonly learningUnits: readonly LearningUnit[];
  readonly assessments: readonly Assessment[];
  readonly assessmentVersions: readonly PublishedAssessmentVersion[];
  readonly competencies: readonly Competency[];
  readonly competencyMappings: readonly CompetencyMapping[];
  readonly concentrations: readonly Concentration[];
  readonly resources: readonly Resource[];
  readonly resourceVersions: readonly PublishedResourceVersion[];
  readonly accessOffers: readonly ResourceAccessOffer[];
  readonly rights: readonly ResourceRights[];
  readonly freshness: readonly ResourceFreshness[];
  readonly provenance: readonly ProvenanceEvidence[];
  readonly calendars: readonly AcademicCalendar[];
  readonly schedules: readonly ProgramSchedule[];
}

export interface RequirementGroupEvaluation {
  readonly requirementGroupId: RequirementGroupId;
  readonly selectedCourseVersionIds: readonly CourseVersionId[];
  readonly selectedCredits?: CreditValue;
  readonly satisfied: boolean;
  readonly reasons: readonly string[];
}

export interface ProgramRequirementEvaluation {
  readonly satisfied: boolean;
  readonly groups: readonly RequirementGroupEvaluation[];
}
