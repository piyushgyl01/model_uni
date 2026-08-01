import type {
  Assessment,
  AssessmentKind,
  Competency,
  CompetencyId,
  CompetencyMapping,
  Concentration,
  ConcentrationId,
  Course,
  LearningUnit,
  LearningUnitId,
  ProvenanceEvidence,
  PublishedAssessmentVersion,
  PublishedCourseVersion,
  PublishedProgramBundle,
  PublishedResourceVersion,
  RequirementGroup,
  RequirementGroupId,
  Resource,
  ResourceFreshness,
  ResourceRights,
  SchedulePlacement,
} from "../../app/domain/catalog";
import { computerScienceIdentities } from "../manifests/computer-science-identities";
import {
  computerScienceCourseSpecs,
  type ComputerScienceCourseSpec,
} from "./computer-science-course-specs";

const PUBLISHED_AT = "2026-07-29T00:00:00Z" as const;
const CHECKED_AT = "2026-07-29T00:00:00Z" as const;
const VERSION = "1.0.0" as const;
const CREDIT_SYSTEM = "Course Atlas credits";

const PROGRAM_ID = computerScienceIdentities.programId;
const PROGRAM_VERSION_ID = computerScienceIdentities.programVersionId;
const BUNDLE_ID = computerScienceIdentities.bundleId;
const CALENDAR_ID = computerScienceIdentities.calendar.id;
const SCHEDULE_ID = computerScienceIdentities.calendar.scheduleId;
const PROGRAM_EVIDENCE_ID =
  computerScienceIdentities.programProvenanceEvidenceId;

const courseSpecs: readonly ComputerScienceCourseSpec[] =
  computerScienceCourseSpecs;

type CourseIdentity =
  (typeof computerScienceIdentities.courses)[keyof typeof computerScienceIdentities.courses];

function lookupIdentity<T>(
  identities: Readonly<Record<string, T>>,
  key: string,
  identityKind: string,
): T {
  const identity = identities[key];
  if (!identity) {
    throw new Error(`Missing Computer Science ${identityKind} identity for ${key}`);
  }
  return identity;
}

function courseIdentity(key: string): CourseIdentity {
  return lookupIdentity<CourseIdentity>(
    computerScienceIdentities.courses,
    key,
    "course",
  );
}

const courseId = (key: string) => courseIdentity(key).courseId;
const courseVersionId = (key: string) => courseIdentity(key).courseVersionId;
const unitId = (key: string, topicKey: string): LearningUnitId =>
  lookupIdentity<LearningUnitId>(
    courseIdentity(key).learningUnitIds,
    topicKey,
    "learning unit",
  );
const assessmentId = (key: string, position: "applied" | "final") =>
  courseIdentity(key).assessmentIds[position];
const assessmentVersionId = (
  key: string,
  position: "applied" | "final",
) => courseIdentity(key).assessmentVersionIds[position];
const resourceId = (key: string) => courseIdentity(key).resourceId;
const resourceVersionId = (key: string) =>
  courseIdentity(key).resourceVersionId;
const accessOfferId = (key: string) => courseIdentity(key).accessOfferId;
const rightsRecordId = (key: string) => courseIdentity(key).rightsRecordId;
const freshnessRecordId = (key: string) =>
  courseIdentity(key).freshnessRecordId;
const resourceEvidenceId = (key: string) =>
  courseIdentity(key).provenanceEvidenceId;
const requirementOptionId = (key: string) =>
  courseIdentity(key).requirementOptionId;
const placementId = (key: string) =>
  courseIdentity(key).schedulePlacementId;

const periodKeyByTerm = {
  1: "term-1",
  2: "term-2",
  3: "term-3",
  4: "term-4",
  5: "term-5",
  6: "term-6",
} as const;

function periodId(term: keyof typeof periodKeyByTerm) {
  return computerScienceIdentities.calendar.periodIds[periodKeyByTerm[term]];
}

type CompetencySpec = {
  readonly key: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly domain: string;
};

const competencySpecs: readonly CompetencySpec[] = [
  {
    key: "programming",
    slug: "program-construction",
    title: "Program construction",
    description:
      "Design, implement, test, debug, document, and maintain programs using appropriate languages and abstractions.",
    domain: "Software Development Fundamentals",
  },
  {
    key: "algorithms",
    slug: "algorithmic-reasoning",
    title: "Algorithmic reasoning",
    description:
      "Design and analyze algorithms using correctness arguments, complexity bounds, and empirical evidence.",
    domain: "Algorithmic Foundations",
  },
  {
    key: "mathematics",
    slug: "mathematical-statistical-reasoning",
    title: "Mathematical and statistical reasoning",
    description:
      "Use proof, discrete structures, calculus, linear algebra, probability, and statistics in computing problems.",
    domain: "Mathematical and Statistical Foundations",
  },
  {
    key: "systems",
    slug: "computer-systems",
    title: "Computer systems",
    description:
      "Reason across hardware and software layers, including architecture, operating systems, concurrency, and performance.",
    domain: "Systems Fundamentals",
  },
  {
    key: "data",
    slug: "data-management",
    title: "Data management",
    description:
      "Model, store, query, protect, and evaluate data using appropriate database and information-system techniques.",
    domain: "Data Management",
  },
  {
    key: "networks",
    slug: "networks-distributed-systems",
    title: "Networks and distributed systems",
    description:
      "Build and analyze communicating services under latency, concurrency, scaling, and partial failure.",
    domain: "Networking and Parallel and Distributed Computing",
  },
  {
    key: "software",
    slug: "software-engineering",
    title: "Software engineering",
    description:
      "Develop sustainable software through requirements, architecture, collaboration, testing, review, and operations.",
    domain: "Software Engineering",
  },
  {
    key: "security",
    slug: "security-privacy",
    title: "Security and privacy",
    description:
      "Apply threat modeling, secure design, testing, cryptographic judgment, and responsible vulnerability handling.",
    domain: "Security",
  },
  {
    key: "ai-data",
    slug: "artificial-intelligence-data-science",
    title: "Artificial intelligence and data science",
    description:
      "Build and evaluate statistical and intelligent systems with reproducible data, metrics, and limitations.",
    domain: "Artificial Intelligence",
  },
  {
    key: "human-centered",
    slug: "human-centered-computing",
    title: "Human-centered computing",
    description:
      "Research, design, prototype, and assess accessible interactive systems around real human needs.",
    domain: "Human–Computer Interaction",
  },
  {
    key: "ethics",
    slug: "computing-ethics",
    title: "Computing ethics",
    description:
      "Analyze benefits, harms, rights, fairness, accountability, and professional duties in sociotechnical systems.",
    domain: "Society, Ethics, and the Profession",
  },
  {
    key: "professional",
    slug: "professional-communication",
    title: "Professional communication and collaboration",
    description:
      "Communicate technical decisions clearly, collaborate responsibly, and produce checkable documentation.",
    domain: "Society, Ethics, and the Profession",
  },
  {
    key: "research",
    slug: "computer-science-research",
    title: "Computer science research",
    description:
      "Formulate questions, assess literature, select methods, evaluate evidence, and report limitations reproducibly.",
    domain: "Research Practice",
  },
  {
    key: "capstone",
    slug: "integrated-computing-practice",
    title: "Integrated computing practice",
    description:
      "Integrate technical, human, ethical, and professional judgment in a substantial defended computing project.",
    domain: "Capstone",
  },
  {
    key: "theory",
    slug: "foundations-programming-languages",
    title: "Theory and programming-language foundations",
    description:
      "Reason about formal languages, computability, complexity, semantics, interpreters, and compilers.",
    domain: "Foundations of Programming Languages",
  },
  {
    key: "graphics",
    slug: "graphics-visual-computing",
    title: "Graphics and visual computing",
    description:
      "Represent, generate, transform, and analyze visual data using geometric and computational methods.",
    domain: "Graphics and Interactive Techniques",
  },
];

const competencyId = (key: string): CompetencyId =>
  lookupIdentity<CompetencyId>(
    computerScienceIdentities.competencyIds,
    key,
    "competency",
  );

const competencies: readonly Competency[] = competencySpecs.map((spec) => ({
  id: competencyId(spec.key),
  canonicalSlug: spec.slug,
  title: spec.title,
  description: spec.description,
  domain: spec.domain,
}));

const courses: readonly Course[] = courseSpecs.map((spec) => ({
  id: courseId(spec.key),
  canonicalSlug: spec.slug,
  codes: [{ namespace: "Course Atlas", value: spec.code }],
  discipline: "Computer Science",
  lifecycle: "active",
}));

function resolvedAssessmentKinds(
  spec: ComputerScienceCourseSpec,
): readonly [AssessmentKind, AssessmentKind] {
  return spec.assessmentKinds ?? ["project", "exam"];
}

const assessments: readonly Assessment[] = courseSpecs.flatMap((spec) => {
  const [appliedKind, finalKind] = resolvedAssessmentKinds(spec);
  return [
    {
      id: assessmentId(spec.key, "applied"),
      courseId: courseId(spec.key),
      canonicalSlug: `${spec.slug}-applied-portfolio`,
      kind: appliedKind,
      lifecycle: "active",
    },
    {
      id: assessmentId(spec.key, "final"),
      courseId: courseId(spec.key),
      canonicalSlug: `${spec.slug}-final-demonstration`,
      kind: finalKind,
      lifecycle: "active",
    },
  ];
});

function assessmentInstructions(
  spec: ComputerScienceCourseSpec,
  position: "applied" | "final",
  kind: AssessmentKind,
) {
  if (position === "applied") {
    return `Complete a course-specific ${kind} that applies ${spec.topics
      .slice(0, 6)
      .map((topic) => topic.title)
      .join(
        ", ",
      )}. Submit source work, tests or calculations, a short decision record, and corrections after self-review.`;
  }
  if (kind === "exam") {
    return `Sit a cumulative, closed-notes practice exam covering all eight ${spec.title} units. Grade it against explicit objectives, correct every missed item, and add a one-page transfer note.`;
  }
  if (kind === "oral" || kind === "presentation") {
    return `Demonstrate and defend cumulative mastery of ${spec.title}. Explain the artifact or analysis, answer challenge questions, disclose limitations, and submit the recording or presentation notes with supporting evidence.`;
  }
  return `Produce a cumulative ${kind} for ${spec.title}. Integrate all eight units, include reproducible evidence, document limitations, and complete a structured self-critique.`;
}

function assessmentTopicKey(
  spec: ComputerScienceCourseSpec,
  position: "applied" | "final",
) {
  const topic = spec.topics.find(
    (candidate) => candidate.assessmentPosition === position,
  );
  if (!topic) {
    throw new Error(
      `Missing ${position} assessment topic in Computer Science course ${spec.key}`,
    );
  }
  return topic.key;
}

const assessmentVersions: readonly PublishedAssessmentVersion[] =
  courseSpecs.flatMap((spec) => {
    const [appliedKind, finalKind] = resolvedAssessmentKinds(spec);
    const evidenceId = resourceEvidenceId(spec.key);
    const competencyIds = spec.competencyKeys.map(competencyId);
    const primaryResourceVersionId = resourceVersionId(spec.key);
    return [
      {
        id: assessmentVersionId(spec.key, "applied"),
        assessmentId: assessmentId(spec.key, "applied"),
        courseVersionId: courseVersionId(spec.key),
        unitId: unitId(spec.key, assessmentTopicKey(spec, "applied")),
        version: VERSION,
        status: "published",
        publishedAt: PUBLISHED_AT,
        title: `${spec.title}: Applied portfolio`,
        instructions: assessmentInstructions(spec, "applied", appliedKind),
        submissionEvidence: [
          "Source files, calculations, or design artifacts",
          "Automated tests or explicit checking procedure",
          "Decision record with assumptions and tradeoffs",
          "Self-assessment and corrected weaknesses",
        ],
        estimatedHours: 24,
        maximumScore: 100,
        resourceVersionIds: [primaryResourceVersionId],
        competencyIds,
        provenanceEvidenceIds: [evidenceId],
      },
      {
        id: assessmentVersionId(spec.key, "final"),
        assessmentId: assessmentId(spec.key, "final"),
        courseVersionId: courseVersionId(spec.key),
        unitId: unitId(spec.key, assessmentTopicKey(spec, "final")),
        version: VERSION,
        status: "published",
        publishedAt: PUBLISHED_AT,
        title: `${spec.title}: Final demonstration`,
        instructions: assessmentInstructions(spec, "final", finalKind),
        submissionEvidence: [
          "Cumulative solution, artifact, or performance",
          "Objective-aligned score sheet or rubric",
          "Corrections, limitations, and transfer reflection",
        ],
        estimatedHours: 20,
        maximumScore: 100,
        resourceVersionIds: [primaryResourceVersionId],
        competencyIds,
        provenanceEvidenceIds: [evidenceId],
      },
    ];
  });

const learningUnits: readonly LearningUnit[] = courseSpecs.flatMap((spec) => {
  const [appliedKind, finalKind] = resolvedAssessmentKinds(spec);
  const competencyIds = spec.competencyKeys.map(competencyId);
  return spec.topics.map((topic, index) => ({
    id: unitId(spec.key, topic.key),
    courseVersionId: courseVersionId(spec.key),
    kind: index === 3 ? "project" : index === 7 ? "review" : "module",
    order: index + 1,
    label: `Unit ${index + 1}`,
    title: topic.title.charAt(0).toUpperCase() + topic.title.slice(1),
    topic: topic.title,
    resourceLocator: `Use the sections, lectures, or exercises in “${spec.resource.title}” that cover ${topic.title}.`,
    activity: `Study ${topic.title} in the primary resource. Reproduce one worked example, complete provider exercises where available, then implement, calculate, or critique one new example without copying a solution.`,
    evidence: `Submit a checked ${topic.title} artifact, an error log, and a short explanation of what the evidence establishes and what it does not.`,
    nominalHours: 20,
    resourceVersionIds: [resourceVersionId(spec.key)],
    competencyIds,
    assessmentKind: index === 3 ? appliedKind : index === 7 ? finalKind : undefined,
  }));
});

const courseVersions: readonly PublishedCourseVersion[] = courseSpecs.map(
  (spec) => ({
    id: courseVersionId(spec.key),
    courseId: courseId(spec.key),
    version: VERSION,
    status: "published",
    publishedAt: PUBLISHED_AT,
    baseLocale: "en",
    title: spec.title,
    summary: spec.summary,
    outcomes: [
      spec.primaryOutcome,
      "Produce independently checkable evidence of practice and correct weaknesses after assessment.",
      "State assumptions, tradeoffs, safety or ethical limits, and unanswered questions.",
    ],
    format: spec.format,
    nominalHours: 160,
    setup: [
      `Open “${spec.resource.title}” and confirm that its lessons, readings, or exercises are accessible in your region.`,
      "Create a version-controlled course workspace with folders for notes, exercises, assessments, corrections, and the final portfolio.",
      "Write a one-page integrity agreement: attempt work independently, cite help and reused code, and never publish provider solutions.",
    ],
    firstAction: `Study the primary resource material for ${spec.topics[0].title}, complete one diagnostic exercise, and record what you need to review.`,
    safetyNote:
      spec.key === "computer-security" || spec.key === "applied-cryptography"
        ? "Perform security work only on systems you own or have explicit permission to test. Use the provider's legal training environments; never target third parties."
        : undefined,
    prerequisites: spec.prerequisiteKeys.map((key) => {
      const prerequisiteSpec = courseSpecs.find(
        (candidate) => candidate.key === key,
      );
      const isSameTerm = prerequisiteSpec?.term === spec.term;
      return {
        courseVersionId: courseVersionId(key),
        kind: "required",
        concurrentEnrollmentAllowed: isSameTerm || undefined,
        note: isSameTerm
          ? `Concurrent enrollment is allowed in Term ${spec.term}; complete the prerequisite course's relevant units before depending on them in ${spec.title}.`
          : undefined,
      };
    }),
    resourceReferences: [
      {
        resourceVersionId: resourceVersionId(spec.key),
        role: "primary",
        note: "Official or author-maintained source checked for free public access on 2026-07-29.",
      },
    ],
    rootUnitIds: spec.topics.map((topic) => unitId(spec.key, topic.key)),
    gradingPolicy: {
      passingPercentage: 70,
      contributions: [
        {
          assessmentVersionId: assessmentVersionId(spec.key, "applied"),
          weight: 60,
          requiredToPass: true,
        },
        {
          assessmentVersionId: assessmentVersionId(spec.key, "final"),
          weight: 40,
          requiredToPass: true,
        },
      ],
    },
    competencyIds: spec.competencyKeys.map(competencyId),
    provenanceEvidenceIds: [resourceEvidenceId(spec.key)],
  }),
);

const resources: readonly Resource[] = courseSpecs.map((spec) => ({
  id: resourceId(spec.key),
  canonicalSlug: spec.resource.slug,
  provider: spec.resource.provider,
  kind: spec.resource.kind,
  lifecycle: "active",
}));

const resourceVersions: readonly PublishedResourceVersion[] = courseSpecs.map(
  (spec) => ({
    id: resourceVersionId(spec.key),
    resourceId: resourceId(spec.key),
    version: VERSION,
    status: "published",
    publishedAt: PUBLISHED_AT,
    title: spec.resource.title,
    canonicalUrl: spec.resource.url,
    language: "en",
    mediaType: "text/html",
    authors: spec.resource.authors,
    provenanceEvidenceIds: [resourceEvidenceId(spec.key)],
  }),
);

const accessOffers = courseSpecs.map((spec) => ({
  id: accessOfferId(spec.key),
  resourceVersionId: resourceVersionId(spec.key),
  type: "free" as const,
  region: "Worldwide where the provider site is available",
  loginRequired: false,
  checkedAt: CHECKED_AT,
  note: "The linked primary material was readable without payment during editorial verification. Optional certificates, books, submissions, or hosted tooling may cost money or require an account.",
}));

const rights: readonly ResourceRights[] = courseSpecs.map((spec) => ({
  id: rightsRecordId(spec.key),
  resourceVersionId: resourceVersionId(spec.key),
  status: "link only",
  mayMirror: false,
  mayAdapt: false,
  verifiedAt: CHECKED_AT,
  evidenceIds: [resourceEvidenceId(spec.key)],
  note: "Course Atlas links to the official source and does not republish it. This conservative record makes no claim that free access permits copying or adaptation; follow the provider's current terms.",
}));

const freshness: readonly ResourceFreshness[] = courseSpecs.map((spec) => ({
  id: freshnessRecordId(spec.key),
  resourceVersionId: resourceVersionId(spec.key),
  status: "healthy",
  checkedAt: CHECKED_AT,
  httpStatus: 200,
  resolvedUrl: spec.resource.url,
  note: "Verified through an editorial web check on 2026-07-29.",
}));

const resourceProvenance: readonly ProvenanceEvidence[] = courseSpecs.map(
  (spec) => ({
    id: resourceEvidenceId(spec.key),
    kind: "access check",
    sourceTitle: spec.resource.title,
    sourceUrl: spec.resource.url,
    retrievedAt: CHECKED_AT,
    subjects: [
      { kind: "courseVersion", id: courseVersionId(spec.key) },
      {
        kind: "assessmentVersion",
        id: assessmentVersionId(spec.key, "applied"),
      },
      {
        kind: "assessmentVersion",
        id: assessmentVersionId(spec.key, "final"),
      },
      { kind: "resourceVersion", id: resourceVersionId(spec.key) },
      { kind: "resourceAccess", id: accessOfferId(spec.key) },
      { kind: "resourceRights", id: rightsRecordId(spec.key) },
    ],
    note: "The official or author-maintained page was checked for title, provider, topical coverage, and free public access. Course Atlas authored the independent study units and assessments; the source provider does not award credit for this pathway or endorse it.",
  }),
);

const concentrations: readonly Concentration[] = [
  {
    id: computerScienceIdentities.concentrationIds["intelligent-systems"],
    canonicalSlug: "intelligent-systems",
    title: "Intelligent Systems",
    description:
      "Deepen machine learning through vision and language, with reproducible evaluation and responsible model documentation.",
    courseVersionIds: [
      courseVersionId("computer-vision"),
      courseVersionId("natural-language-processing"),
    ],
    capstoneIdeas: [
      "Accessible document-understanding assistant with error and bias analysis",
      "Visual inspection system with dataset and model cards",
    ],
  },
  {
    id: computerScienceIdentities.concentrationIds[
      "scalable-secure-systems"
    ],
    canonicalSlug: "scalable-secure-systems",
    title: "Scalable and Secure Systems",
    description:
      "Deepen systems practice through parallel performance engineering and applied cryptographic reasoning.",
    courseVersionIds: [
      courseVersionId("parallel-computing"),
      courseVersionId("applied-cryptography"),
    ],
    capstoneIdeas: [
      "Measured parallel data-processing service with threat model",
      "Secure collaboration prototype using standard cryptographic libraries",
    ],
  },
  {
    id: computerScienceIdentities.concentrationIds[
      "interactive-applications"
    ],
    canonicalSlug: "interactive-applications",
    title: "Interactive Applications",
    description:
      "Deepen visual and product engineering through computer graphics and native Android development.",
    courseVersionIds: [
      courseVersionId("computer-graphics"),
      courseVersionId("android-development"),
    ],
    capstoneIdeas: [
      "Accessible scientific visualization application",
      "Offline-first mobile field tool with custom visual interaction",
    ],
  },
];

const concentrationIdByKey: Readonly<
  Record<NonNullable<ComputerScienceCourseSpec["concentrationKey"]>, ConcentrationId>
> = {
  "intelligent-systems":
    computerScienceIdentities.concentrationIds["intelligent-systems"],
  "scalable-secure-systems":
    computerScienceIdentities.concentrationIds["scalable-secure-systems"],
  "interactive-applications":
    computerScienceIdentities.concentrationIds["interactive-applications"],
};

const concentrationTitleByKey: Readonly<
  Record<NonNullable<ComputerScienceCourseSpec["concentrationKey"]>, string>
> = {
  "intelligent-systems": "Intelligent Systems",
  "scalable-secure-systems": "Scalable and Secure Systems",
  "interactive-applications": "Interactive Applications",
};

const requirementGroupId = (key: string): RequirementGroupId =>
  lookupIdentity<RequirementGroupId>(
    computerScienceIdentities.requirementGroupIds,
    key,
    "requirement group",
  );

function requirementGroup(
  id: RequirementGroupId,
  title: string,
  description: string,
  order: number,
  specs: readonly ComputerScienceCourseSpec[],
): RequirementGroup {
  return {
    id,
    title,
    description,
    order,
    rule: {
      minSelections: specs.length,
      maxSelections: specs.length,
      minCredits: {
        value: specs.reduce((sum, spec) => sum + spec.credits, 0),
        system: CREDIT_SYSTEM,
      },
    },
    options: specs.map((spec) => ({
      id: requirementOptionId(spec.key),
      courseVersionId: courseVersionId(spec.key),
      credits: { value: spec.credits, system: CREDIT_SYSTEM },
      recommendedPeriodId: periodId(spec.term),
    })),
  };
}

const fixedSpecs = courseSpecs.filter((spec) => !spec.concentrationKey);
const concentrationSpecs = courseSpecs.filter(
  (spec): spec is ComputerScienceCourseSpec &
    Required<Pick<ComputerScienceCourseSpec, "concentrationKey">> =>
    Boolean(spec.concentrationKey),
);

const fixedRequirementGroups = ([1, 2, 3, 4, 5, 6] as const).map((term) => {
  const specs = fixedSpecs.filter((spec) => spec.term === term);
  return requirementGroup(
    requirementGroupId(periodKeyByTerm[term]),
    `Term ${term} core`,
    `Complete all ${specs.length} fixed courses in the recommended Term ${term} sequence.`,
    term,
    specs,
  );
});

const concentrationRequirement: RequirementGroup = {
  id: computerScienceIdentities.requirementGroupIds.concentration,
  title: "Coherent concentration",
  description:
    "Complete both courses in one concentration: Intelligent Systems, Scalable and Secure Systems, or Interactive Applications.",
  order: 7,
  rule: {
    minSelections: 2,
    maxSelections: 2,
    minCredits: { value: 8, system: CREDIT_SYSTEM },
    selectionConstraint: "same concentration",
  },
  options: concentrationSpecs.map((spec) => ({
    id: requirementOptionId(spec.key),
    courseVersionId: courseVersionId(spec.key),
    credits: { value: spec.credits, system: CREDIT_SYSTEM },
    concentrationId: concentrationIdByKey[spec.concentrationKey],
    recommendedPeriodId: periodId(6),
  })),
};

const requirements: readonly RequirementGroup[] = [
  ...fixedRequirementGroups,
  concentrationRequirement,
];

const programEvidence: ProvenanceEvidence = {
  id: PROGRAM_EVIDENCE_ID,
  kind: "official catalog",
  sourceTitle: "CS2023 – ACM/IEEE-CS/AAAI Computer Science Curricula",
  sourceUrl: "https://csed.acm.org/final-report/",
  retrievedAt: CHECKED_AT,
  subjects: [
    { kind: "programVersion", id: PROGRAM_VERSION_ID },
    ...competencies.map((competency) => ({
      kind: "competency" as const,
      id: competency.id,
    })),
  ],
  note: "CS2023 informed breadth, competency language, mathematics, ethics, and professional-practice coverage. Course Atlas independently selected and sequenced the free resources. This is not an ACM, IEEE-CS, AAAI, or university-accredited program.",
};

const programCompetencyMappingId = (key: string) =>
  lookupIdentity(
    computerScienceIdentities.programCompetencyMappingIds,
    key,
    "program competency mapping",
  );

const courseCompetencyMappingId = (courseKey: string, competencyKey: string) =>
  lookupIdentity(
    courseIdentity(courseKey).competencyMappingIds,
    competencyKey,
    "course competency mapping",
  );

const finalAssessmentMappingId = (courseKey: string) =>
  courseIdentity(courseKey).finalAssessmentMappingId;

const competencyMappings: readonly CompetencyMapping[] = [
  ...competencySpecs.map((spec) => ({
    id: programCompetencyMappingId(spec.key),
    competencyId: competencyId(spec.key),
    subject: { kind: "programVersion" as const, id: PROGRAM_VERSION_ID },
    relationship: "develops" as const,
    targetLevel: "advanced" as const,
    evidenceNote:
      "The program requires multiple courses plus a defended capstone; completion still does not constitute an accredited degree.",
  })),
  ...courseSpecs.flatMap((spec) =>
    spec.competencyKeys.map((key) => ({
      id: courseCompetencyMappingId(spec.key, key),
      competencyId: competencyId(key),
      subject: {
        kind: "courseVersion" as const,
        id: courseVersionId(spec.key),
      },
      relationship: "develops" as const,
      targetLevel:
        spec.term <= 2
          ? ("foundational" as const)
          : spec.term <= 4
            ? ("applied" as const)
            : ("advanced" as const),
      evidenceNote: `Mapped to the stated outcomes and assessed work in ${spec.title}.`,
    })),
  ),
  ...courseSpecs.map((spec) => ({
    id: finalAssessmentMappingId(spec.key),
    competencyId: competencyId(spec.competencyKeys[0]),
    subject: {
      kind: "assessmentVersion" as const,
      id: assessmentVersionId(spec.key, "final"),
    },
    relationship: "assesses" as const,
    targetLevel:
      spec.term <= 2
        ? ("foundational" as const)
        : spec.term <= 4
          ? ("applied" as const)
          : ("advanced" as const),
    evidenceNote:
      "The final demonstration requires cumulative evidence, corrections, and a limitations statement.",
  })),
];

const periods = ([1, 2, 3, 4, 5, 6] as const).map((term) => ({
  id: periodId(term),
  order: term,
  label: `Term ${term}`,
}));

const milestoneId = (key: string) =>
  lookupIdentity(
    computerScienceIdentities.calendar.milestoneIds,
    key,
    "calendar milestone",
  );

const milestones = ([1, 2, 3, 4, 5, 6] as const).flatMap((term) => [
  {
    id: milestoneId(`term-${term}-midpoint`),
    label: `Term ${term} midpoint assessments`,
    periodId: periodId(term),
    kind: "checkpoint" as const,
  },
  {
    id: milestoneId(`term-${term}-final`),
    label: `Term ${term} final demonstrations and corrections`,
    periodId: periodId(term),
    kind: term === 6 ? ("project" as const) : ("exam" as const),
  },
]);

const placements: readonly SchedulePlacement[] = courseSpecs.map(
  (spec, index) => ({
    id: placementId(spec.key),
    subject: { kind: "courseVersion", id: courseVersionId(spec.key) },
    order: index + 1,
    periodId: periodId(spec.term),
    note: spec.concentrationKey
      ? `Take only if completing the ${concentrationTitleByKey[spec.concentrationKey]} concentration.`
      : `Recommended in Term ${spec.term}.`,
  }),
);

export const computerScienceBundleV1 = {
  schemaVersion: 1,
  id: BUNDLE_ID,
  publishedAt: PUBLISHED_AT,
  program: {
    id: PROGRAM_ID,
    canonicalSlug: "computer-science",
    title: "Computer Science",
    shortTitle: "CS",
    school: "School of Computing",
    discipline: "Computer Science",
    kind: "degree-equivalent pathway",
    lifecycle: "active",
  },
  programVersion: {
    id: PROGRAM_VERSION_ID,
    programId: PROGRAM_ID,
    version: VERSION,
    status: "published",
    publishedAt: PUBLISHED_AT,
    baseLocale: "en",
    title: "Computer Science",
    summary:
      "A rigorous three-year independent-study pathway spanning mathematical foundations, programming, algorithms, systems, data, networks, software engineering, security, AI, human-centered computing, ethics, research, a coherent concentration, and a two-stage defended capstone.",
    credentialLabel: "Bachelor-level independent study pathway",
    nominalDuration: "3 years · 6 terms",
    recognitionNotice:
      "Course Atlas is not a university or accreditor. It awards no degree, diploma, academic credit, transfer credit, professional license, or guaranteed provider certificate. Completion evidence is a self-directed portfolio that another person may evaluate independently.",
    outcomes: [
      "Build reliable software from requirements through design, implementation, testing, review, deployment, and maintenance.",
      "Apply mathematical, algorithmic, statistical, and theoretical reasoning to computing problems.",
      "Explain and evaluate computer architecture, operating systems, networks, databases, distributed systems, and security.",
      "Develop data-driven and intelligent systems with reproducible evaluation and explicit limitations.",
      "Research human needs, design accessible interactions, and analyze computing's ethical and social consequences.",
      "Plan, build, evaluate, document, and publicly defend a substantial capstone artifact.",
    ],
    workloadPolicy:
      "Every course carries 4 Course Atlas credits and 160 nominal hours: eight ordered units of about 20 hours each. Unit numbers express sequence, not fixed calendar weeks. The completion contract is 30 courses and 120 Course Atlas credits, approximately 4,800 hours. A standard term is 20 weeks with five concurrent courses at roughly 40 hours per week; learners may slow the calendar without changing requirements.",
    defaultScheduleId: SCHEDULE_ID,
    requirements,
    concentrationIds: concentrations.map((concentration) => concentration.id),
    competencyIds: competencies.map((competency) => competency.id),
    provenanceEvidenceIds: [PROGRAM_EVIDENCE_ID],
    changelog: "Initial independently authored Course Atlas publication.",
  },
  courses,
  courseVersions,
  learningUnits,
  assessments,
  assessmentVersions,
  competencies,
  competencyMappings,
  concentrations,
  resources,
  resourceVersions,
  accessOffers,
  rights,
  freshness,
  provenance: [programEvidence, ...resourceProvenance],
  calendars: [
    {
      id: CALENDAR_ID,
      title: "Computer Science three-year recommended calendar",
      structure: "terms",
      periods,
      milestones,
    },
  ],
  schedules: [
    {
      id: SCHEDULE_ID,
      programVersionId: PROGRAM_VERSION_ID,
      calendarId: CALENDAR_ID,
      title: "Six-term recommended sequence",
      placements,
    },
  ],
} as const satisfies PublishedProgramBundle;
