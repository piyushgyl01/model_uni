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
import { mathematicsIdentities } from "../manifests/mathematics-identities";
import {
  mathematicsCourseSpecs,
  type MathematicsCourseSpec,
} from "./mathematics-course-specs";

const PUBLISHED_AT = "2026-08-02T00:00:00Z" as const;
const CHECKED_AT = "2026-08-02T00:00:00Z" as const;
const VERSION = "1.0.0" as const;
const CREDIT_SYSTEM = "Course Atlas credits";

const PROGRAM_ID = mathematicsIdentities.programId;
const PROGRAM_VERSION_ID = mathematicsIdentities.programVersionId;
const BUNDLE_ID = mathematicsIdentities.bundleId;
const CALENDAR_ID = mathematicsIdentities.calendar.id;
const SCHEDULE_ID = mathematicsIdentities.calendar.scheduleId;
const PROGRAM_EVIDENCE_ID =
  mathematicsIdentities.programProvenanceEvidenceId;

const courseSpecs: readonly MathematicsCourseSpec[] =
  mathematicsCourseSpecs;

type CourseIdentity =
  (typeof mathematicsIdentities.courses)[keyof typeof mathematicsIdentities.courses];
type ResourceIdentity =
  (typeof mathematicsIdentities.resources)[keyof typeof mathematicsIdentities.resources];

function lookupIdentity<T>(
  identities: Readonly<Record<string, T>>,
  key: string,
  identityKind: string,
): T {
  const identity = identities[key];
  if (!identity) {
    throw new Error(
      `Missing Mathematics ${identityKind} identity for ${key}`,
    );
  }
  return identity;
}

const courseIdentity = (key: string): CourseIdentity =>
  lookupIdentity(mathematicsIdentities.courses, key, "course");
const resourceIdentity = (key: string): ResourceIdentity =>
  lookupIdentity(mathematicsIdentities.resources, key, "resource");

const courseId = (key: string) => courseIdentity(key).courseId;
const courseVersionId = (key: string) => courseIdentity(key).courseVersionId;
const unitId = (key: string, topicKey: string): LearningUnitId =>
  lookupIdentity(
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
const resourceId = (key: string) => resourceIdentity(key).resourceId;
const resourceVersionId = (key: string) =>
  resourceIdentity(key).resourceVersionId;
const accessOfferId = (key: string) => resourceIdentity(key).accessOfferId;
const rightsRecordId = (key: string) => resourceIdentity(key).rightsRecordId;
const freshnessRecordId = (key: string) =>
  resourceIdentity(key).freshnessRecordId;
const resourceEvidenceId = (key: string) =>
  resourceIdentity(key).provenanceEvidenceId;
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
  return mathematicsIdentities.calendar.periodIds[
    periodKeyByTerm[term]
  ];
}

type CompetencySpec = {
  readonly key: MathematicsCourseSpec["competencyKeys"][number];
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly domain: string;
};

const competencySpecs: readonly CompetencySpec[] = [
  {
    key: "rigorous-proof-abstraction",
    slug: "rigorous-proof-abstraction",
    title: "Rigorous proof and abstraction",
    description:
      "Formulate precise definitions and conjectures, construct valid arguments, identify hidden assumptions, use counterexamples, and move deliberately between concrete cases and abstract structures.",
    domain: "Mathematical Foundations",
  },
  {
    key: "analysis-continuous-models",
    slug: "analysis-continuous-models",
    title: "Analysis and continuous models",
    description:
      "Reason rigorously about limits, convergence, measure, functions, operators, differential equations, dynamical systems, and continuous models.",
    domain: "Analysis",
  },
  {
    key: "algebra-number-structure",
    slug: "algebra-number-structure",
    title: "Algebra, number, and structure",
    description:
      "Analyze linear and abstract algebraic structures, symmetry, arithmetic, representations, and invariants using proof and explicit computation.",
    domain: "Algebra and Number Theory",
  },
  {
    key: "geometry-topology-spatial",
    slug: "geometry-topology-spatial-reasoning",
    title: "Geometry, topology, and spatial reasoning",
    description:
      "Study spaces through geometric, differential, and topological structure; choose useful invariants and connect local descriptions with global behavior.",
    domain: "Geometry and Topology",
  },
  {
    key: "probability-discrete-optimization",
    slug: "probability-discrete-optimization",
    title: "Probability, discrete mathematics, and optimization",
    description:
      "Model randomness and discrete structure, reason combinatorially, formulate optimization problems, and justify algorithms or statistical conclusions under explicit assumptions.",
    domain: "Discrete and Stochastic Mathematics",
  },
  {
    key: "computation-modeling-verification",
    slug: "computation-modeling-verification",
    title: "Computation, modeling, and verification",
    description:
      "Translate questions into mathematical models and reproducible algorithms, analyze error and complexity, and verify computation against theory, bounds, or independent methods.",
    domain: "Applied and Computational Mathematics",
  },
  {
    key: "research-communication-responsibility",
    slug: "research-communication-responsibility",
    title: "Research, communication, and responsible practice",
    description:
      "Read mathematical literature critically, develop original or replicated work, communicate proofs and limitations clearly, preserve provenance, and assess the consequences of models and quantitative decisions.",
    domain: "Research Practice",
  },
];

const competencyId = (key: CompetencySpec["key"]): CompetencyId =>
  lookupIdentity(
    mathematicsIdentities.competencyIds,
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
  discipline: "Mathematics",
  lifecycle: "active",
}));

function resolvedAssessmentKinds(
  spec: MathematicsCourseSpec,
): readonly [AssessmentKind, AssessmentKind] {
  return spec.assessmentKinds ?? ["project", "exam"];
}

const assessments: readonly Assessment[] = courseSpecs.flatMap((spec) => {
  const [appliedKind, finalKind] = resolvedAssessmentKinds(spec);
  return [
    {
      id: assessmentId(spec.key, "applied"),
      courseId: courseId(spec.key),
      canonicalSlug: `${spec.slug}-applied-work`,
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

function assessmentTopicKey(
  spec: MathematicsCourseSpec,
  position: "applied" | "final",
) {
  const topic = spec.topics.find(
    (candidate) => candidate.assessmentPosition === position,
  );
  if (!topic) {
    throw new Error(
      `Missing ${position} assessment topic in Mathematics course ${spec.key}`,
    );
  }
  return topic.key;
}

const assessmentVersions: readonly PublishedAssessmentVersion[] =
  courseSpecs.flatMap((spec) => {
    const [appliedKind, finalKind] = resolvedAssessmentKinds(spec);
    const competencyIds = spec.competencyKeys.map(competencyId);
    const provenanceEvidenceIds = [resourceEvidenceId(spec.key)];
    return [
      {
        id: assessmentVersionId(spec.key, "applied"),
        assessmentId: assessmentId(spec.key, "applied"),
        courseVersionId: courseVersionId(spec.key),
        unitId: unitId(spec.key, assessmentTopicKey(spec, "applied")),
        version: VERSION,
        status: "published",
        publishedAt: PUBLISHED_AT,
        title: `${spec.title}: Applied ${appliedKind}`,
        instructions: `${spec.appliedBrief} Submit the proof, model, computation, or exposition with definitions and assumptions, theorem dependencies, independent checks or counterexample searches, an error log, and corrected work.`,
        submissionEvidence: [
          "Source proofs, derivations, models, algorithms, code, or exposition",
          "Independent verification, test cases, bounds, or counterexample search",
          "Definition, assumption, attribution, and provenance record",
          "Self-assessment with corrected logical or computational weaknesses",
        ],
        estimatedHours: 24,
        maximumScore: 100,
        resourceVersionIds: [resourceVersionId(spec.key)],
        competencyIds,
        provenanceEvidenceIds,
      },
      {
        id: assessmentVersionId(spec.key, "final"),
        assessmentId: assessmentId(spec.key, "final"),
        courseVersionId: courseVersionId(spec.key),
        unitId: unitId(spec.key, assessmentTopicKey(spec, "final")),
        version: VERSION,
        status: "published",
        publishedAt: PUBLISHED_AT,
        title: `${spec.title}: Final ${finalKind}`,
        instructions: `${spec.finalBrief} Integrate all eight units, make every dependency and inference traceable, state limitations and responsible-use boundaries, and complete a structured correction or oral defense.`,
        submissionEvidence: [
          "Cumulative proof portfolio, model, computation, exposition, or defense",
          "Objective-aligned score sheet and requirement traceability",
          "Verification evidence, edge cases, limitations, responsible-use boundary, and corrections",
        ],
        estimatedHours: 20,
        maximumScore: 100,
        resourceVersionIds: [resourceVersionId(spec.key)],
        competencyIds,
        provenanceEvidenceIds,
      },
    ];
  });

function unitActivity(spec: MathematicsCourseSpec, topic: string) {
  if (spec.format === "studio" || spec.format === "capstone") {
    return `Study ${topic} in the primary resource, translate it into a conjecture, model, algorithm, or research artifact, review the work against explicit mathematical criteria, and revise it from evidence.`;
  }
  if (spec.format === "seminar") {
    return `Study ${topic} in the primary resource, reconstruct the central definitions and argument, test the claims on examples and edge cases, and communicate a precise conclusion.`;
  }
  return `Study ${topic} in the primary resource. Reconstruct one definition, proof, derivation, or algorithm; solve a new problem; test boundary cases; and compare with an independent argument or computation.`;
}

const learningUnits: readonly LearningUnit[] = courseSpecs.flatMap((spec) => {
  const [appliedKind, finalKind] = resolvedAssessmentKinds(spec);
  const competencyIds = spec.competencyKeys.map(competencyId);
  return spec.topics.map((topic, index) => ({
    id: unitId(spec.key, topic.key),
    courseVersionId: courseVersionId(spec.key),
    kind:
      index === 3
        ? appliedKind === "lab"
          ? "lab"
          : "project"
        : index === 7
          ? "review"
          : "module",
    order: index + 1,
    label: `Unit ${index + 1}`,
    title: topic.title.charAt(0).toUpperCase() + topic.title.slice(1),
    topic: topic.title,
    resourceLocator: `Use the lectures, readings, worked examples, and exercises in “${spec.resource.title}” that address ${topic.title}.`,
    activity: unitActivity(spec, topic.title),
    evidence: `Submit a checked ${topic.title} proof, derivation, model, computation, or exposition; include source files where applicable, an error log, and a short statement of what the evidence does and does not establish.`,
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
      "Produce independently checkable mathematical reasoning or computation and correct weaknesses after assessment.",
      "State definitions, assumptions, dependencies, limitations, responsible-use boundaries, and unresolved questions.",
    ],
    format: spec.format,
    nominalHours: 160,
    setup: [
      `Open “${spec.resource.title}” and confirm that its readings, lectures, examples, or exercises are freely accessible in your region.`,
      "Create a version-controlled course workspace for definitions, proofs, derivations, code, experiments, assessments, corrections, and the final portfolio.",
      "Write a one-page academic-integrity and responsible-modeling agreement: cite help and reused results, do not publish provider solutions, distinguish proof from numerical evidence, protect sensitive data, and record consequential assumptions.",
      spec.format === "studio" || spec.format === "capstone"
        ? "Define the question, admissible evidence, verification plan, attribution rules, computational environment, and responsible-use boundary before beginning the main artifact."
        : "Install only the software needed for reproducible symbolic or numerical work, recording versions, precision, seeds, dependencies, and setup steps.",
    ],
    firstAction: `Study the primary resource material for ${spec.topics[0].title}, solve one diagnostic task, and record prerequisite gaps plus a concrete plan to close them.`,
    safetyNote: spec.safetyNote,
    prerequisites: spec.prerequisiteKeys.map((key) => {
      const prerequisiteSpec = courseSpecs.find(
        (candidate) => candidate.key === key,
      );
      if (!prerequisiteSpec) {
        throw new Error(
          `Unknown Mathematics prerequisite ${key} for ${spec.key}`,
        );
      }
      if (prerequisiteSpec.term >= spec.term) {
        throw new Error(
          `Mathematics prerequisite ${key} must be scheduled before ${spec.key}`,
        );
      }
      return {
        courseVersionId: courseVersionId(key),
        kind: "required" as const,
      };
    }),
    resourceReferences: [
      {
        resourceVersionId: resourceVersionId(spec.key),
        role: "primary",
        note: "Official, institutional, or author-maintained source checked for free public access on 2026-08-02.",
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
  note: "The linked primary learning material was readable without payment during editorial verification. Optional certificates, books, submissions, hosted computation, software, or datasets may cost money.",
}));

const rights: readonly ResourceRights[] = courseSpecs.map((spec) => ({
  id: rightsRecordId(spec.key),
  resourceVersionId: resourceVersionId(spec.key),
  status: "link only",
  mayMirror: false,
  mayAdapt: false,
  verifiedAt: CHECKED_AT,
  evidenceIds: [resourceEvidenceId(spec.key)],
  note: "Course Atlas links to the source and does not republish it. Free access is not a blanket reuse license; follow the provider's current terms and third-party-content notices.",
}));

const freshness: readonly ResourceFreshness[] = courseSpecs.map((spec) => ({
  id: freshnessRecordId(spec.key),
  resourceVersionId: resourceVersionId(spec.key),
  status: "healthy",
  checkedAt: CHECKED_AT,
  httpStatus: 200,
  resolvedUrl: spec.resource.url,
  note: "Verified through an editorial web check on 2026-08-02.",
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
    note: "The source page was checked for title, provider, topical coverage, and free public access. Course Atlas authored the independent units and assessments; the source provider does not award credit for or endorse this pathway.",
  }),
);

const concentrations: readonly Concentration[] = [
  {
    id: mathematicsIdentities.concentrationIds[
      "pure-structures-number-theory"
    ],
    canonicalSlug: "pure-structures-number-theory",
    title: "Pure Structures and Number Theory",
    description:
      "Deepen algebraic number theory, algebraic geometry, representation theory, symmetry, arithmetic invariants, and proof-driven structural reasoning.",
    courseVersionIds: [
      courseVersionId("algebraic-number-theory"),
      courseVersionId("algebraic-geometry-representation-theory"),
    ],
    capstoneIdeas: [
      "Develop an expository bridge between a concrete Diophantine problem and the algebraic structures that control it",
      "Compute and prove properties of representations or algebraic varieties in a reproducible case study",
    ],
  },
  {
    id: mathematicsIdentities.concentrationIds[
      "analysis-pdes-mathematical-physics"
    ],
    canonicalSlug: "analysis-pdes-mathematical-physics",
    title: "Analysis, PDEs, and Mathematical Physics",
    description:
      "Deepen partial differential equations, variational methods, continuum models, functional analysis, Fourier methods, and rigorous connections between analysis and physical systems.",
    courseVersionIds: [
      courseVersionId("partial-differential-equations"),
      courseVersionId("calculus-variations-continuum"),
    ],
    capstoneIdeas: [
      "Prove and numerically test an existence, stability, or regularity claim for a model PDE",
      "Derive a continuum model from a variational principle and audit its assumptions, boundary conditions, and approximation error",
    ],
  },
  {
    id: mathematicsIdentities.concentrationIds[
      "discrete-optimization-computation"
    ],
    canonicalSlug: "discrete-optimization-computation",
    title: "Discrete Optimization and Computation",
    description:
      "Deepen combinatorial optimization, algorithms, computational complexity, coding, discrete structure, and proof-backed computational decision making.",
    courseVersionIds: [
      courseVersionId("combinatorial-optimization"),
      courseVersionId("algorithms-complexity-coding"),
    ],
    capstoneIdeas: [
      "Design an exact or approximation algorithm, prove its guarantee, and benchmark it on reproducible instances",
      "Analyze a coding or complexity result from theorem through implementation, adversarial cases, and practical limits",
    ],
  },
];

const concentrationIdByKey: Readonly<
  Record<
    NonNullable<MathematicsCourseSpec["concentrationKey"]>,
    ConcentrationId
  >
> = {
  "pure-structures-number-theory":
    mathematicsIdentities.concentrationIds["pure-structures-number-theory"],
  "analysis-pdes-mathematical-physics":
    mathematicsIdentities.concentrationIds["analysis-pdes-mathematical-physics"],
  "discrete-optimization-computation":
    mathematicsIdentities.concentrationIds["discrete-optimization-computation"],
};

const concentrationTitleByKey: Readonly<
  Record<
    NonNullable<MathematicsCourseSpec["concentrationKey"]>,
    string
  >
> = {
  "pure-structures-number-theory": "Pure Structures and Number Theory",
  "analysis-pdes-mathematical-physics":
    "Analysis, PDEs, and Mathematical Physics",
  "discrete-optimization-computation":
    "Discrete Optimization and Computation",
};

const requirementGroupId = (key: string): RequirementGroupId =>
  lookupIdentity(
    mathematicsIdentities.requirementGroupIds,
    key,
    "requirement group",
  );

function requirementGroup(
  id: RequirementGroupId,
  title: string,
  description: string,
  order: number,
  specs: readonly MathematicsCourseSpec[],
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
  (spec): spec is MathematicsCourseSpec &
    Required<Pick<MathematicsCourseSpec, "concentrationKey">> =>
    Boolean(spec.concentrationKey),
);

if (courseSpecs.length !== 34 || fixedSpecs.length !== 28 || concentrationSpecs.length !== 6) {
  throw new Error(
    "Mathematics publication requires exactly 34 courses: 28 fixed and 6 concentration courses.",
  );
}

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
  id: mathematicsIdentities.requirementGroupIds.concentration,
  title: "Coherent concentration",
  description:
    "Complete both sequenced courses in Pure Structures and Number Theory, Analysis, PDEs, and Mathematical Physics, or Discrete Optimization and Computation.",
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
    recommendedPeriodId: periodId(spec.term),
  })),
};

const requirements: readonly RequirementGroup[] = [
  ...fixedRequirementGroups,
  concentrationRequirement,
];

const programEvidence: ProvenanceEvidence = {
  id: PROGRAM_EVIDENCE_ID,
  kind: "official catalog",
  sourceTitle:
    "MIT Mathematics major pathways and five-university curriculum synthesis",
  sourceUrl:
    "https://math.mit.edu/academics/undergrad/major/",
  retrievedAt: CHECKED_AT,
  subjects: [
    { kind: "programVersion", id: PROGRAM_VERSION_ID },
    ...competencies.map((competency) => ({
      kind: "competency" as const,
      id: competency.id,
    })),
  ],
  note: "Official pure and applied Mathematics curricula from MIT, Princeton, Harvard, Stanford, and UC Berkeley informed the proof core, breadth, research practice, application areas, and depth choices. Course Atlas independently normalized them into a six-term disciplinary pathway, selected free learning resources, and authored the assessments. This is not any university's program, is not affiliated with those institutions, and is not an accredited or awarded degree.",
};

const programCompetencyMappingId = (key: CompetencySpec["key"]) =>
  lookupIdentity(
    mathematicsIdentities.programCompetencyMappingIds,
    key,
    "program competency mapping",
  );
const courseCompetencyMappingId = (
  courseKey: string,
  competencyKey: CompetencySpec["key"],
) =>
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
      "The pathway requires repeated proof, theory, computation, modeling, research review, and a defended thesis; completion still does not constitute a university degree.",
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
      evidenceNote: `Mapped to the outcomes, mathematical work, verification, and assessed evidence in ${spec.title}.`,
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
      "The final demonstration requires cumulative, traceable reasoning, independent checks, corrections, limitations, and an explicit responsible-use boundary.",
  })),
];

const periods = ([1, 2, 3, 4, 5, 6] as const).map((term) => ({
  id: periodId(term),
  order: term,
  label: `Term ${term}`,
}));

const milestoneId = (key: string) =>
  lookupIdentity(
    mathematicsIdentities.calendar.milestoneIds,
    key,
    "calendar milestone",
  );

const milestones = ([1, 2, 3, 4, 5, 6] as const).flatMap((term) => [
  {
    id: milestoneId(`term-${term}-midpoint`),
    label: `Term ${term} midpoint proof portfolios, problem sets, computation reviews, and research checks`,
    periodId: periodId(term),
    kind: "checkpoint" as const,
  },
  {
    id: milestoneId(`term-${term}-final`),
    label:
      term === 6
        ? "Term 6 final demonstrations, thesis defense, and corrections"
        : `Term ${term} final proofs, demonstrations, and corrections`,
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

export const mathematicsBundle = {
  schemaVersion: 1,
  id: BUNDLE_ID,
  publishedAt: PUBLISHED_AT,
  program: {
    id: PROGRAM_ID,
    canonicalSlug: "mathematics",
    title: "Mathematics",
    shortTitle: "Mathematics",
    school: "School of Natural Sciences",
    discipline: "Mathematics",
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
    title: "Mathematics",
    summary:
      "A rigorous three-year independent-study pathway spanning proof and logic, calculus, linear and abstract algebra, analysis, geometry and topology, probability and discrete mathematics, differential equations, optimization, numerical and computational mathematics, mathematical modeling, one coherent pure or applied concentration, and a defended senior research thesis.",
    credentialLabel: "Bachelor-level independent study pathway",
    nominalDuration: "3 years · 6 terms",
    recognitionNotice:
      "Course Atlas is not a university, mathematics department, or accreditor. It awards no degree, diploma, academic credit, transfer credit, research appointment, or guaranteed provider certificate. This independent pathway is informed by public curricula from MIT, Princeton, Harvard, Stanford, and UC Berkeley, but it is not their program and those institutions do not endorse it. It does not reproduce a university's general education, faculty mentorship, seminars, peer community, supervised research, or institutional credential. Completion evidence is a self-directed portfolio that another person may evaluate independently.",
    outcomes: [
      "Write precise definitions and rigorous proofs, recognize invalid inference, construct counterexamples, and use abstraction to expose common structure.",
      "Reason across real and complex analysis, linear and abstract algebra, number theory, geometry, topology, probability, combinatorics, optimization, and dynamical systems.",
      "Formulate continuous, discrete, stochastic, and variational models; state assumptions and determine what conclusions the model can and cannot support.",
      "Build reproducible symbolic and numerical computations whose correctness, stability, convergence, complexity, provenance, and limitations are explicit.",
      "Read mathematical literature critically and communicate responsible claims through proofs, exposition, visualizations, software, talks, and oral examinations.",
      "Formulate, execute, document, and publicly defend a substantial independent Mathematics research or rigorous replication project.",
    ],
    workloadPolicy:
      "Every course carries 4 Course Atlas credits and 160 nominal hours: eight ordered units of about 20 hours each. Unit numbers express sequence, not fixed calendar weeks. The completion contract is 28 fixed courses plus both courses in one coherent concentration: 30 courses, 120 Course Atlas credits, and approximately 4,800 hours. A standard term is 20 weeks with five concurrent courses at roughly 40 hours per week; learners may slow the calendar without changing requirements. Prerequisites must be completed in an earlier term. Computational evidence supplements rather than replaces proof whenever a proof is required, and consequential models must document assumptions, uncertainty, data provenance, affected parties, and limits of use.",
    defaultScheduleId: SCHEDULE_ID,
    requirements,
    concentrationIds: concentrations.map((concentration) => concentration.id),
    competencyIds: competencies.map((competency) => competency.id),
    provenanceEvidenceIds: [PROGRAM_EVIDENCE_ID],
    changelog:
      "Initial Course Atlas Mathematics publication synthesized from MIT, Princeton, Harvard, Stanford, and UC Berkeley curricula with free primary resources, coherent pure and applied depth tracks, explicit proof practice, responsible modeling, and a defended thesis.",
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
      title: "Mathematics three-year recommended calendar",
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
