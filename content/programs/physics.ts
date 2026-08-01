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
import { physicsIdentities } from "../manifests/physics-identities";
import {
  physicsCourseSpecs,
  type PhysicsCourseSpec,
} from "./physics-course-specs";

const PUBLISHED_AT = "2026-08-01T00:00:00Z" as const;
const CHECKED_AT = "2026-08-01T00:00:00Z" as const;
const VERSION = "1.0.0" as const;
const CREDIT_SYSTEM = "Course Atlas credits";

const PROGRAM_ID = physicsIdentities.programId;
const PROGRAM_VERSION_ID = physicsIdentities.programVersionId;
const BUNDLE_ID = physicsIdentities.bundleId;
const CALENDAR_ID = physicsIdentities.calendar.id;
const SCHEDULE_ID = physicsIdentities.calendar.scheduleId;
const PROGRAM_EVIDENCE_ID =
  physicsIdentities.programProvenanceEvidenceId;

const courseSpecs: readonly PhysicsCourseSpec[] =
  physicsCourseSpecs;

type CourseIdentity =
  (typeof physicsIdentities.courses)[keyof typeof physicsIdentities.courses];
type ResourceIdentity =
  (typeof physicsIdentities.resources)[keyof typeof physicsIdentities.resources];

function lookupIdentity<T>(
  identities: Readonly<Record<string, T>>,
  key: string,
  identityKind: string,
): T {
  const identity = identities[key];
  if (!identity) {
    throw new Error(
      `Missing Physics ${identityKind} identity for ${key}`,
    );
  }
  return identity;
}

const courseIdentity = (key: string): CourseIdentity =>
  lookupIdentity(physicsIdentities.courses, key, "course");
const resourceIdentity = (key: string): ResourceIdentity =>
  lookupIdentity(physicsIdentities.resources, key, "resource");

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
  return physicsIdentities.calendar.periodIds[
    periodKeyByTerm[term]
  ];
}

type CompetencySpec = {
  readonly key: PhysicsCourseSpec["competencyKeys"][number];
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly domain: string;
};

const competencySpecs: readonly CompetencySpec[] = [
  {
    key: "mathematical-modeling",
    slug: "mathematical-modeling-approximation",
    title: "Mathematical modeling and approximation",
    description:
      "Translate physical assumptions into tractable mathematics, solve at an appropriate level, and test units, limits, symmetries, scaling, and approximation error.",
    domain: "Mathematical Physics",
  },
  {
    key: "classical-fields",
    slug: "classical-dynamics-fields-waves",
    title: "Classical dynamics, fields, and waves",
    description:
      "Reason with mechanics, electromagnetism, waves, optics, relativity, conservation laws, and continuum or field descriptions.",
    domain: "Classical Physics",
  },
  {
    key: "quantum-statistical",
    slug: "quantum-statistical-modern-physics",
    title: "Quantum, statistical, and modern physics",
    description:
      "Use quantum theory and statistical reasoning to explain microscopic systems, matter, information, nuclei, particles, and emergent macroscopic behavior.",
    domain: "Modern Physics",
  },
  {
    key: "experiment-instrumentation",
    slug: "experiment-instrumentation-uncertainty",
    title: "Experimentation, instrumentation, and uncertainty",
    description:
      "Design safe measurements, calibrate instruments, preserve raw evidence, quantify uncertainty, diagnose systematics, and compare experiment with theory.",
    domain: "Experimental Physics",
  },
  {
    key: "computation-data",
    slug: "scientific-computation-data-inference",
    title: "Scientific computation, data, and inference",
    description:
      "Build reproducible simulations and data pipelines, verify numerical methods, assess models statistically, and communicate computational limits.",
    domain: "Computational Physics",
  },
  {
    key: "research-communication",
    slug: "research-literature-communication",
    title: "Research, literature, and scientific communication",
    description:
      "Formulate research questions, evaluate literature, design discriminating tests, maintain provenance, and defend claims in clear scientific writing and speech.",
    domain: "Research Practice",
  },
  {
    key: "professional-practice",
    slug: "professional-ethical-safe-physics-practice",
    title: "Professional, ethical, and safe physics practice",
    description:
      "Work within authorization and safety boundaries while accounting for research integrity, dual use, inclusion, environmental impact, public trust, and professional responsibility.",
    domain: "Physics in Society",
  },
];

const competencyId = (key: CompetencySpec["key"]): CompetencyId =>
  lookupIdentity(
    physicsIdentities.competencyIds,
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
  discipline: "Physics",
  lifecycle: "active",
}));

function resolvedAssessmentKinds(
  spec: PhysicsCourseSpec,
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
  spec: PhysicsCourseSpec,
  position: "applied" | "final",
) {
  const topic = spec.topics.find(
    (candidate) => candidate.assessmentPosition === position,
  );
  if (!topic) {
    throw new Error(
      `Missing ${position} assessment topic in Physics course ${spec.key}`,
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
        instructions: `${spec.appliedBrief} Submit the scientific artifact, assumptions, calculations or code, checks against an independent method, an error log, and corrected work.`,
        submissionEvidence: [
          "Source calculations, models, code, plots, or laboratory records",
          "Independent verification, calibration, or comparison evidence",
          "Assumption, uncertainty, provenance, and decision record",
          "Self-assessment plus corrected weaknesses",
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
        instructions: `${spec.finalBrief} Integrate all eight units, show traceable evidence, state limitations and safety boundaries, and complete a structured correction or defense.`,
        submissionEvidence: [
          "Cumulative solution, artifact, experiment, simulation, or defense",
          "Objective-aligned score sheet and requirement traceability",
          "Verification evidence, limitations, safety boundary, and corrections",
        ],
        estimatedHours: 20,
        maximumScore: 100,
        resourceVersionIds: [resourceVersionId(spec.key)],
        competencyIds,
        provenanceEvidenceIds,
      },
    ];
  });

function unitActivity(spec: PhysicsCourseSpec, topic: string) {
  if (spec.format === "laboratory") {
    return `Study ${topic} in the primary resource, predict the result, then run a safe bench experiment or a fully documented simulation. Compare prediction and evidence, quantify uncertainty, and explain discrepancies.`;
  }
  if (spec.format === "studio" || spec.format === "capstone") {
    return `Study ${topic} in the primary resource, translate it into a research decision, model, or artifact, review the work against explicit criteria, and revise it from evidence.`;
  }
  if (spec.format === "seminar") {
    return `Study ${topic} in the primary resource, analyze a real physics or research case, test the claims against evidence, and communicate a reasoned conclusion.`;
  }
  return `Study ${topic} in the primary resource. Reproduce one derivation or worked example, solve a new problem, check units and limiting cases, and compare with an independent calculation or simulation.`;
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
    evidence: `Submit a checked ${topic.title} artifact, the original data or source files where applicable, an error log, and a short statement of what the evidence does and does not establish.`,
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
      "Produce independently checkable scientific evidence and correct weaknesses after assessment.",
      "State assumptions, uncertainty, tradeoffs, safety limits, and unresolved questions.",
    ],
    format: spec.format,
    nominalHours: 160,
    setup: [
      `Open “${spec.resource.title}” and confirm that its readings, lectures, examples, or exercises are freely accessible in your region.`,
      "Create a version-controlled course workspace for notes, derivations, code, plots, raw evidence, assessments, corrections, and the final portfolio.",
      "Write a one-page integrity and safety agreement: cite help, never publish provider solutions, stay within your training and facilities, and stop work when hazards are uncontrolled.",
      spec.format === "laboratory" || spec.format === "studio" || spec.format === "capstone"
        ? "Choose a simulation-first, remote-instrument, open-data, or low-energy route unless a qualified local supervisor has approved the equipment, procedure, PPE, containment, and emergency plan."
        : "Install only the software needed for reproducible calculations or simulation, recording versions and setup steps.",
    ],
    firstAction: `Study the primary resource material for ${spec.topics[0].title}, solve one diagnostic task, and record prerequisite gaps plus a safe plan to close them.`,
    safetyNote: spec.safetyNote,
    prerequisites: spec.prerequisiteKeys.map((key) => {
      const prerequisiteSpec = courseSpecs.find(
        (candidate) => candidate.key === key,
      );
      const isSameTerm = prerequisiteSpec?.term === spec.term;
      return {
        courseVersionId: courseVersionId(key),
        kind: "required" as const,
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
        note: "Official, institutional, or author-maintained source checked for free public access on 2026-08-01.",
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
  note: "The linked primary learning material was readable without payment during editorial verification. Optional certificates, books, submissions, hosted software, instruments, datasets, or local laboratory access may cost money.",
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
  note: "Verified through an editorial web check on 2026-08-01.",
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
    id: physicsIdentities.concentrationIds[
      "astrophysics-gravitation"
    ],
    canonicalSlug: "astrophysics-gravitation",
    title: "Astrophysics and Gravitation",
    description:
      "Deepen stellar and galactic astrophysics, observation, cosmology, gravity, gravitational waves, and inference from public survey data.",
    courseVersionIds: [
      courseVersionId("astrophysics"),
      courseVersionId("cosmology-gravitational-waves"),
    ],
    capstoneIdeas: [
      "Infer stellar, exoplanet, or galaxy properties from a public survey with an explicit selection function",
      "Reproduce a gravitational-wave or cosmological parameter estimate and stress-test its priors and systematics",
    ],
  },
  {
    id: physicsIdentities.concentrationIds[
      "quantum-science-materials"
    ],
    canonicalSlug: "quantum-science-materials",
    title: "Quantum Science and Materials",
    description:
      "Deepen atomic and optical physics, quantum information, open-system dynamics, solid-state theory, quantum materials, and reproducible simulation.",
    courseVersionIds: [
      courseVersionId("quantum-information-amo"),
      courseVersionId("quantum-materials"),
    ],
    capstoneIdeas: [
      "Benchmark a noisy quantum protocol or error-correcting code with a transparent resource estimate",
      "Model a material band structure, phase transition, or transport observable and compare it with open experimental data",
    ],
  },
  {
    id: physicsIdentities.concentrationIds[
      "particle-nuclear-physics"
    ],
    canonicalSlug: "particle-nuclear-physics",
    title: "Particle and Nuclear Physics",
    description:
      "Deepen nuclear structure and decay, radiation detection, relativistic particle kinematics, symmetries, the Standard Model, and inference from open detector data.",
    courseVersionIds: [
      courseVersionId("nuclear-radiation-detectors"),
      courseVersionId("particle-physics-standard-model"),
    ],
    capstoneIdeas: [
      "Reconstruct a public collider or neutrino dataset with detector effects and uncertainty propagation",
      "Simulate a radiation detector response and validate the analysis against licensed open calibration data",
    ],
  },
];

const concentrationIdByKey: Readonly<
  Record<
    NonNullable<PhysicsCourseSpec["concentrationKey"]>,
    ConcentrationId
  >
> = {
  "astrophysics-gravitation":
    physicsIdentities.concentrationIds["astrophysics-gravitation"],
  "quantum-science-materials":
    physicsIdentities.concentrationIds["quantum-science-materials"],
  "particle-nuclear-physics":
    physicsIdentities.concentrationIds["particle-nuclear-physics"],
};

const concentrationTitleByKey: Readonly<
  Record<
    NonNullable<PhysicsCourseSpec["concentrationKey"]>,
    string
  >
> = {
  "astrophysics-gravitation": "Astrophysics and Gravitation",
  "quantum-science-materials": "Quantum Science and Materials",
  "particle-nuclear-physics": "Particle and Nuclear Physics",
};

const requirementGroupId = (key: string): RequirementGroupId =>
  lookupIdentity(
    physicsIdentities.requirementGroupIds,
    key,
    "requirement group",
  );

function requirementGroup(
  id: RequirementGroupId,
  title: string,
  description: string,
  order: number,
  specs: readonly PhysicsCourseSpec[],
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
  (spec): spec is PhysicsCourseSpec &
    Required<Pick<PhysicsCourseSpec, "concentrationKey">> =>
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
  id: physicsIdentities.requirementGroupIds.concentration,
  title: "Coherent concentration",
  description:
    "Complete both sequenced courses in Astrophysics and Gravitation, Quantum Science and Materials, or Particle and Nuclear Physics.",
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
    "MIT undergraduate Physics pathways and five-program curriculum synthesis",
  sourceUrl:
    "https://physics.mit.edu/academic-programs/undergrads/",
  retrievedAt: CHECKED_AT,
  subjects: [
    { kind: "programVersion", id: PROGRAM_VERSION_ID },
    ...competencies.map((competency) => ({
      kind: "competency" as const,
      id: competency.id,
    })),
  ],
  note: "Official Physics curricula from MIT, Caltech, Stanford, Princeton, and Harvard informed the breadth, laboratory expectations, research practice, and depth choices. Course Atlas independently normalized them into a six-term disciplinary pathway, selected free learning resources, and authored the assessments. This is not one of those universities' programs and is not an accredited or awarded degree.",
};

const programCompetencyMappingId = (key: CompetencySpec["key"]) =>
  lookupIdentity(
    physicsIdentities.programCompetencyMappingIds,
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
      "The pathway requires repeated theory, computation, experiment, research review, and a defended capstone; completion still does not constitute a university degree.",
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
      evidenceNote: `Mapped to the outcomes, scientific work, verification, and assessed evidence in ${spec.title}.`,
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
      "The final demonstration requires cumulative, traceable evidence, corrections, limitations, and an explicit safety boundary.",
  })),
];

const periods = ([1, 2, 3, 4, 5, 6] as const).map((term) => ({
  id: periodId(term),
  order: term,
  label: `Term ${term}`,
}));

const milestoneId = (key: string) =>
  lookupIdentity(
    physicsIdentities.calendar.milestoneIds,
    key,
    "calendar milestone",
  );

const milestones = ([1, 2, 3, 4, 5, 6] as const).flatMap((term) => [
  {
    id: milestoneId(`term-${term}-midpoint`),
    label: `Term ${term} midpoint problem sets, lab reviews, and research checks`,
    periodId: periodId(term),
    kind: "checkpoint" as const,
  },
  {
    id: milestoneId(`term-${term}-final`),
    label:
      term === 6
        ? "Term 6 final demonstrations, capstone defense, and corrections"
        : `Term ${term} final demonstrations and corrections`,
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

export const physicsBundle = {
  schemaVersion: 1,
  id: BUNDLE_ID,
  publishedAt: PUBLISHED_AT,
  program: {
    id: PROGRAM_ID,
    canonicalSlug: "physics",
    title: "Physics",
    shortTitle: "Physics",
    school: "School of Natural Sciences",
    discipline: "Physics",
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
    title: "Physics",
    summary:
      "A rigorous three-year independent-study pathway spanning mathematical methods, classical mechanics, electromagnetism, waves and optics, relativity, quantum mechanics, thermodynamics and statistical physics, scientific computing and inference, experimental physics, research communication, one coherent depth concentration, and a defended senior research thesis.",
    credentialLabel: "Bachelor-level independent study pathway",
    nominalDuration: "3 years · 6 terms",
    recognitionNotice:
      "Course Atlas is not a university, physics department, or accreditor. It awards no degree, diploma, academic credit, transfer credit, laboratory authorization, research appointment, or guaranteed provider certificate. This disciplinary pathway does not reproduce a university's general education, supervised facilities, faculty mentorship, peer research culture, or institutional credential. Completion evidence is a self-directed portfolio that another person may evaluate independently.",
    outcomes: [
      "Use calculus, linear algebra, differential equations, complex methods, symmetry, and approximation to formulate and test physical models.",
      "Reason across classical mechanics, fields, waves, optics, relativity, quantum theory, thermodynamics, statistical physics, matter, nuclei, particles, and the cosmos.",
      "Plan safe experiments or defensible simulation and open-data alternatives, calibrate evidence, quantify uncertainty, and diagnose systematic error.",
      "Build reproducible numerical models and inference pipelines whose stability, convergence, provenance, and limitations are explicit.",
      "Read scientific literature critically and communicate responsible claims in notebooks, papers, visualizations, talks, and oral examinations.",
      "Formulate, execute, document, and publicly defend a substantial independent Physics research project.",
    ],
    workloadPolicy:
      "Every course carries 4 Course Atlas credits and 160 nominal hours: eight ordered units of about 20 hours each. Unit numbers express sequence, not fixed calendar weeks. The completion contract is 30 courses and 120 Course Atlas credits, approximately 4,800 hours. A standard term is 20 weeks with five concurrent courses at roughly 40 hours per week; learners may slow the calendar without changing requirements. When safe supervised laboratory access is unavailable, a rigorously verified simulation, remote instrument, or open-data investigation may satisfy the portfolio evidence contract, but it does not grant authorization to use radiation, lasers, cryogens, vacuum, high voltage, or other controlled equipment.",
    defaultScheduleId: SCHEDULE_ID,
    requirements,
    concentrationIds: concentrations.map((concentration) => concentration.id),
    competencyIds: competencies.map((competency) => competency.id),
    provenanceEvidenceIds: [PROGRAM_EVIDENCE_ID],
    changelog:
      "Initial Course Atlas Physics publication synthesized from five leading US curricula with free primary resources, coherent depth tracks, explicit research practice, and simulation-first laboratory alternatives.",
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
      title: "Physics three-year recommended calendar",
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
