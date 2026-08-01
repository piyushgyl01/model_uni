import type {
  AssessmentKind,
  CoursePrerequisite,
  LearningUnit,
  LearningUnitId,
  PublishedAssessmentVersion,
  PublishedCourseVersion,
  PublishedProgramBundle,
  PublishedResourceVersion,
  RequirementGroup,
  Resource,
  ResourceAccessOffer,
  ResourceFreshness,
  ResourceRights,
  SchedulePlacement,
} from "../../app/domain/catalog";
import { computerScienceIdentities } from "../manifests/computer-science-identities";
import {
  computerScienceV11Identities,
  computerScienceV11IdentityReplacements,
} from "../manifests/computer-science-v1-1-identities";
import {
  computerScienceCourseSpecs,
  type ComputerScienceCourseSpec,
} from "./computer-science-course-specs";
import { computerScienceCourseSpecsV1_1 } from "./computer-science-course-specs-v1-1";
import { computerScienceBundleV1 } from "./computer-science";

const VERSION = "1.1.0" as const;
const PUBLISHED_AT = "2026-08-01T00:00:00Z" as const;
const CHECKED_AT = "2026-08-01T00:00:00Z" as const;
const CREDIT_SYSTEM = "Course Atlas credits";

type V11CourseKey = keyof typeof computerScienceV11Identities.courses;

const directContentRevisionKeys = new Set<string>([
  "computer-architecture",
  "algorithms",
  "programming-languages",
  "machine-learning",
  "parallel-computing",
]);

const sourceReplacementKeys = new Set<string>([
  "computer-architecture",
  "algorithms",
  "machine-learning",
  "parallel-computing",
]);

/**
 * Course versions pin exact prerequisite course-version IDs. A revised
 * prerequisite therefore requires a new version for every downstream course,
 * recursively, even when that downstream course's teaching plan is unchanged.
 */
const versionedCourseKeys = (() => {
  const keys = new Set(directContentRevisionKeys);
  let changed = true;
  while (changed) {
    changed = false;
    for (const spec of computerScienceCourseSpecsV1_1) {
      if (
        !keys.has(spec.key) &&
        spec.prerequisiteKeys.some((prerequisiteKey) =>
          keys.has(prerequisiteKey),
        )
      ) {
        keys.add(spec.key);
        changed = true;
      }
    }
  }
  return keys;
})();

function remapIdentityStrings<Value>(value: Value): Value {
  if (typeof value === "string") {
    return (
      computerScienceV11IdentityReplacements[
        value as keyof typeof computerScienceV11IdentityReplacements
      ] ?? value
    ) as Value;
  }
  if (Array.isArray(value)) {
    return value.map(remapIdentityStrings) as Value;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        remapIdentityStrings(child),
      ]),
    ) as Value;
  }
  return value;
}

const remappedV1 = remapIdentityStrings(
  computerScienceBundleV1,
) as unknown as PublishedProgramBundle;

function specFor(key: string): ComputerScienceCourseSpec {
  const spec = computerScienceCourseSpecsV1_1.find(
    (candidate) => candidate.key === key,
  );
  if (!spec) throw new Error(`Missing Computer Science 1.1 course spec ${key}.`);
  return spec;
}

function identityFor(key: string) {
  const identity = computerScienceV11Identities.courses[key as V11CourseKey];
  if (!identity) {
    throw new Error(`Missing Computer Science 1.1 course identity ${key}.`);
  }
  return identity;
}

function learningUnitId(key: string, topicKey: string): LearningUnitId {
  const id = (identityFor(key).learningUnitIds as Record<string, LearningUnitId>)[
    topicKey
  ];
  if (!id) {
    throw new Error(
      `Missing Computer Science 1.1 learning-unit identity ${key}/${topicKey}.`,
    );
  }
  return id;
}

function resolvedAssessmentKinds(
  spec: ComputerScienceCourseSpec,
): readonly [AssessmentKind, AssessmentKind] {
  return spec.assessmentKinds ?? ["project", "exam"];
}

function assessmentTopicKey(
  spec: ComputerScienceCourseSpec,
  position: "applied" | "final",
) {
  const topic = spec.topics.find(
    (candidate) => candidate.assessmentPosition === position,
  );
  if (!topic) {
    throw new Error(`Missing ${position} assessment topic for ${spec.key}.`);
  }
  return topic.key;
}

function genericAssessmentInstructions(
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

const flagshipAssessmentInstructions = {
  "computer-architecture": {
    applied:
      "Build a cycle-level pipeline or datapath simulator that exposes data and control hazards, implements a documented mitigation, and passes instruction traces you designed. Submit the model, traces, tests, and a latency/throughput analysis.",
    final:
      "Integrate a processor and memory-system study covering instruction execution, pipelining, cache behavior, virtual memory, and I/O. Run reproducible experiments, explain performance bottlenecks, defend the design orally, and correct weaknesses found during the defense.",
  },
  algorithms: {
    applied:
      "Solve and implement a connected set of greedy, dynamic-programming, and maximum-flow problems. For each, state the model, prove correctness, derive complexity, test adversarial cases, and explain why a tempting alternative fails.",
    final:
      "Complete a cumulative proof portfolio and timed practice exam spanning divide-and-conquer, greedy design, dynamic programming, flow and cuts, reductions and NP-completeness, and approximation. Correct every error and defend one reduction and one approximation guarantee.",
  },
  "programming-languages": {
    applied:
      "Implement typed functional transformations over algebraic and persistent data, using pattern matching, structural recursion, folds, and higher-order functions. Supply executable examples plus equational or inductive reasoning for the important laws.",
    final:
      "Extend a small interpreter with closures, mutation or objects, and a static type feature. Compare the resulting functional, imperative, and object-oriented designs, demonstrate the implementation, defend semantic choices, and document counterexamples and limitations.",
  },
  "machine-learning": {
    applied:
      "Derive and implement comparable linear, logistic, and margin-based learners, then study regularization and model selection on a fixed dataset. Submit reproducible code, learning curves, error analysis, and a decision record that separates empirical results from assumptions.",
    final:
      "Produce a reproducible model-comparison study that includes a neural or probabilistic method, justified metrics, uncertainty or sensitivity analysis, subgroup/fairness checks, and a model card. Defend generalization claims and correct any unsupported conclusion.",
  },
  "parallel-computing": {
    applied:
      "Analyze computation DAGs and work/span bounds, then implement a work-efficient parallel scan or divide-and-conquer primitive. Compare theoretical parallelism with measured behavior and explain scheduling, contention, and locality effects.",
    final:
      "Build and benchmark a parallel application across multiple worker counts and input sizes. Submit the implementation, work/span analysis, reproducible measurements, speedup and efficiency plots, bottleneck diagnosis, and an oral defense of scaling limits.",
  },
} as const;

function assessmentInstructions(
  spec: ComputerScienceCourseSpec,
  position: "applied" | "final",
  kind: AssessmentKind,
) {
  const flagship =
    flagshipAssessmentInstructions[
      spec.key as keyof typeof flagshipAssessmentInstructions
    ];
  return flagship?.[position] ?? genericAssessmentInstructions(spec, position, kind);
}

const resourceLocators = {
  "computer-architecture": [
    "MIT 6.004 materials on digital abstraction, combinational logic, and sequential logic",
    "MIT 6.004 instruction-set architecture and assembly-programming materials",
    "MIT 6.004 processor, datapath, control, and instruction-execution materials",
    "MIT 6.004 pipelining lectures and exercises on data and control hazards",
    "MIT 6.004 cache, locality, and memory-hierarchy materials",
    "MIT 6.004 virtual-memory, exceptions, and device/I/O materials",
    "MIT 6.004 concurrency, parallelism, and performance-analysis materials",
    "MIT 6.004 cumulative processor and memory-system exercises",
  ],
  algorithms: [
    "MIT 6.046J introduction and algorithm-analysis lectures and problem sets",
    "MIT 6.046J divide-and-conquer, recurrence, and sorting materials",
    "MIT 6.046J greedy-algorithm, spanning-tree, and shortest-path materials",
    "MIT 6.046J dynamic-programming lectures, recitations, and problem sets",
    "MIT 6.046J network-flow, minimum-cut, and matching materials",
    "MIT 6.046J complexity, reductions, and NP-completeness materials",
    "MIT 6.046J approximation-algorithm lectures and problems",
    "MIT 6.046J cumulative exams and problem sets across the course",
  ],
  "programming-languages": [
    "PLAI sections introducing expressions, substitution, and interpreters",
    "PLAI material on data representation and pattern-directed evaluation",
    "PLAI recursive interpreters plus the book's inductive data examples",
    "PLAI chapters on functions, first-class procedures, and abstraction",
    "PLAI sections on lexical scope, environments, and closures",
    "PLAI material on state, data abstraction, modules, and representation",
    "PLAI chapters and exercises on static types and type checking",
    "PLAI cumulative interpreter material spanning functions, state, objects, and types",
  ],
  "machine-learning": [
    "MIT 6.036 linear regression, loss, and optimization materials",
    "MIT 6.036 linear classification and logistic-model materials",
    "MIT 6.036 margin, feature, and kernel materials",
    "MIT 6.036 generalization, regularization, and model-selection materials",
    "MIT 6.036 neural-network and backpropagation materials",
    "MIT 6.036 probabilistic-model and inference materials",
    "MIT 6.036 reinforcement-learning and sequential-decision materials",
    "MIT 6.036 cumulative exercises and exams, paired with an independently chosen dataset",
  ],
  "parallel-computing": [
    "CMU 15-210 course-book material on computation DAGs, work, and span",
    "CMU 15-210 scheduling and work-efficiency analysis materials",
    "CMU 15-210 parallel divide-and-conquer and sequence-algorithm materials",
    "CMU 15-210 scan, prefix computation, and sequence data-structure materials",
    "CMU 15-210 parallel-programming material on synchronization and contention",
    "CMU 15-210 graph/parallel design material, extended with a message-passing implementation",
    "CMU 15-210 cost-model material, paired with local profiling and scaling experiments",
    "CMU 15-210 cumulative algorithm material and the learner's benchmark suite",
  ],
} as const;

function resourceLocator(spec: ComputerScienceCourseSpec, index: number) {
  const locators = resourceLocators[spec.key as keyof typeof resourceLocators];
  return locators?.[index] ??
    `Use the sections, lectures, or exercises in “${spec.resource.title}” that cover ${spec.topics[index].title}.`;
}

function unitActivity(spec: ComputerScienceCourseSpec, index: number) {
  const topic = spec.topics[index].title;
  switch (spec.key) {
    case "computer-architecture":
      return `Study ${resourceLocator(spec, index)}. Build or simulate one ${topic} artifact, state its interface and assumptions, run normal and adversarial traces, and connect the observed behavior to latency, throughput, or correctness.`;
    case "algorithms":
      return `Study ${resourceLocator(spec, index)}. Solve at least two ${topic} problems, write a correctness argument and complexity bound, implement one solution, and test it against boundary cases and a plausible wrong approach.`;
    case "programming-languages":
      return `Study ${resourceLocator(spec, index)}. Extend a small functional program or interpreter with ${topic}, create executable semantic examples, and explain the result using substitution, environments, types, or equational reasoning as appropriate.`;
    case "machine-learning":
      return `Study ${resourceLocator(spec, index)}. Derive one key result for ${topic}, implement a controlled notebook experiment, preserve the data split and random seed, and distinguish measured findings from assumptions and limitations.`;
    case "parallel-computing":
      return `Study ${resourceLocator(spec, index)}. Draw the computation structure or implement a ${topic} primitive, derive work and span where applicable, benchmark more than one input size or worker count, and diagnose departures from the model.`;
    default:
      return `Study ${topic} in the primary resource. Reproduce one worked example, complete provider exercises where available, then implement, calculate, or critique one new example without copying a solution.`;
  }
}

function unitEvidence(spec: ComputerScienceCourseSpec, index: number) {
  const topic = spec.topics[index].title;
  if (directContentRevisionKeys.has(spec.key)) {
    return `Submit the checked ${topic} artifact, source or derivation, tests or measurements, an error log, and a short claim-evidence-limitations note.`;
  }
  return `Submit a checked ${topic} artifact, an error log, and a short explanation of what the evidence establishes and what it does not.`;
}

function prerequisitesFor(spec: ComputerScienceCourseSpec): CoursePrerequisite[] {
  return spec.prerequisiteKeys.map((key) => {
    const prerequisiteSpec = specFor(key);
    const isSameTerm = prerequisiteSpec.term === spec.term;
    return {
      courseVersionId: identityFor(key).courseVersionId,
      kind: "required",
      concurrentEnrollmentAllowed: isSameTerm || undefined,
      note: isSameTerm
        ? `Concurrent enrollment is allowed in Term ${spec.term}; complete the prerequisite course's relevant units before depending on them in ${spec.title}.`
        : undefined,
    };
  });
}

function revisedCourseVersion(
  prior: PublishedCourseVersion,
  spec: ComputerScienceCourseSpec,
): PublishedCourseVersion {
  const identity = identityFor(spec.key);
  const directlyRevised = directContentRevisionKeys.has(spec.key);
  return {
    ...prior,
    id: identity.courseVersionId,
    version: VERSION,
    publishedAt: PUBLISHED_AT,
    summary: directlyRevised ? spec.summary : prior.summary,
    outcomes: directlyRevised
      ? [
          spec.primaryOutcome,
          "Produce independently checkable evidence of practice and correct weaknesses after assessment.",
          "State assumptions, tradeoffs, safety or ethical limits, and unanswered questions.",
        ]
      : prior.outcomes,
    setup: directlyRevised
      ? [
          `Open “${spec.resource.title}” and confirm that its lessons, readings, or exercises are accessible in your region.`,
          "Create a version-controlled course workspace with folders for notes, exercises, assessments, corrections, and the final portfolio.",
          "Write a one-page integrity agreement: attempt work independently, cite help and reused code, and never publish provider solutions.",
        ]
      : prior.setup,
    firstAction: directlyRevised
      ? `Study ${resourceLocator(spec, 0)}, complete one diagnostic exercise, and record what you need to review.`
      : prior.firstAction,
    prerequisites: prerequisitesFor(spec),
    resourceReferences: [
      {
        resourceVersionId: identity.resourceVersionId,
        role: "primary",
        note: "Official or author-maintained source checked for free public access on 2026-08-01.",
      },
    ],
    rootUnitIds: spec.topics.map((topic) =>
      learningUnitId(spec.key, topic.key),
    ),
    gradingPolicy: {
      ...prior.gradingPolicy,
      contributions: [
        {
          assessmentVersionId: identity.assessmentVersionIds.applied,
          weight: 60,
          requiredToPass: true,
        },
        {
          assessmentVersionId: identity.assessmentVersionIds.final,
          weight: 40,
          requiredToPass: true,
        },
      ],
    },
    provenanceEvidenceIds: [identity.provenanceEvidenceId],
    changelog: directlyRevised
      ? "Revised in CS 1.1 after a primary-source curriculum audit; topics, free-resource alignment, weekly evidence, and assessments were strengthened."
      : "Republished in CS 1.1 to pin the revised prerequisite graph; teaching scope and workload are unchanged.",
  };
}

const priorCourseVersionByCourseId = new Map(
  remappedV1.courseVersions.map((version) => [version.courseId, version]),
);

const courseVersions: readonly PublishedCourseVersion[] =
  computerScienceCourseSpecsV1_1.map((spec) => {
    const prior = priorCourseVersionByCourseId.get(identityFor(spec.key).courseId);
    if (!prior) throw new Error(`Missing prior course version for ${spec.key}.`);
    return versionedCourseKeys.has(spec.key)
      ? revisedCourseVersion(prior, spec)
      : prior;
  });

const priorUnitById = new Map(
  remappedV1.learningUnits.map((unit) => [unit.id, unit]),
);

const learningUnits: readonly LearningUnit[] =
  computerScienceCourseSpecsV1_1.flatMap((spec) => {
    if (!versionedCourseKeys.has(spec.key)) {
      return spec.topics.map((topic) => {
        const unit = priorUnitById.get(learningUnitId(spec.key, topic.key));
        if (!unit) throw new Error(`Missing prior unit ${spec.key}/${topic.key}.`);
        return unit;
      });
    }
    const identity = identityFor(spec.key);
    const [appliedKind, finalKind] = resolvedAssessmentKinds(spec);
    const competencyIds = spec.competencyKeys.map(
      (key) =>
        computerScienceV11Identities.competencyIds[
          key as keyof typeof computerScienceV11Identities.competencyIds
        ],
    );
    return spec.topics.map((topic, index) => ({
      id: learningUnitId(spec.key, topic.key),
      courseVersionId: identity.courseVersionId,
      kind: index === 3 ? "project" : index === 7 ? "review" : "module",
      order: index + 1,
      label: `Unit ${index + 1}`,
      title: topic.title.charAt(0).toUpperCase() + topic.title.slice(1),
      topic: topic.title,
      resourceLocator: resourceLocator(spec, index),
      activity: unitActivity(spec, index),
      evidence: unitEvidence(spec, index),
      nominalHours: 20,
      resourceVersionIds: [identity.resourceVersionId],
      competencyIds,
      assessmentKind:
        index === 3 ? appliedKind : index === 7 ? finalKind : undefined,
    }));
  });

const priorAssessmentVersionById = new Map(
  remappedV1.assessmentVersions.map((version) => [version.id, version]),
);

function revisedAssessmentVersion(
  spec: ComputerScienceCourseSpec,
  position: "applied" | "final",
  kind: AssessmentKind,
): PublishedAssessmentVersion {
  const identity = identityFor(spec.key);
  const id = identity.assessmentVersionIds[position];
  const prior = priorAssessmentVersionById.get(id);
  if (!prior) {
    throw new Error(`Missing prior ${position} assessment for ${spec.key}.`);
  }
  return {
    ...prior,
    id,
    courseVersionId: identity.courseVersionId,
    unitId: learningUnitId(spec.key, assessmentTopicKey(spec, position)),
    version: VERSION,
    publishedAt: PUBLISHED_AT,
    instructions: assessmentInstructions(spec, position, kind),
    resourceVersionIds: [identity.resourceVersionId],
    provenanceEvidenceIds: [identity.provenanceEvidenceId],
  };
}

const assessmentVersions: readonly PublishedAssessmentVersion[] =
  computerScienceCourseSpecsV1_1.flatMap((spec) => {
    const identity = identityFor(spec.key);
    if (!versionedCourseKeys.has(spec.key)) {
      const applied = priorAssessmentVersionById.get(
        identity.assessmentVersionIds.applied,
      );
      const final = priorAssessmentVersionById.get(
        identity.assessmentVersionIds.final,
      );
      if (!applied || !final) {
        throw new Error(`Missing prior assessment versions for ${spec.key}.`);
      }
      return [applied, final];
    }
    const [appliedKind, finalKind] = resolvedAssessmentKinds(spec);
    return [
      revisedAssessmentVersion(spec, "applied", appliedKind),
      revisedAssessmentVersion(spec, "final", finalKind),
    ];
  });

const resources: readonly Resource[] = computerScienceCourseSpecsV1_1.map(
  (spec) => ({
    id: identityFor(spec.key).resourceId,
    canonicalSlug: spec.resource.slug,
    provider: spec.resource.provider,
    kind: spec.resource.kind,
    lifecycle: "active",
  }),
);

const priorResourceVersionById = new Map(
  remappedV1.resourceVersions.map((version) => [version.id, version]),
);

const resourceVersions: readonly PublishedResourceVersion[] =
  computerScienceCourseSpecsV1_1.map((spec) => {
    const identity = identityFor(spec.key);
    const prior = priorResourceVersionById.get(identity.resourceVersionId);
    if (!prior) throw new Error(`Missing prior resource version for ${spec.key}.`);
    if (!versionedCourseKeys.has(spec.key)) return prior;
    return {
      ...prior,
      id: identity.resourceVersionId,
      resourceId: identity.resourceId,
      version: sourceReplacementKeys.has(spec.key) ? "1.0.0" : VERSION,
      publishedAt: PUBLISHED_AT,
      title: spec.resource.title,
      canonicalUrl: spec.resource.url,
      authors: spec.resource.authors,
      provenanceEvidenceIds: [identity.provenanceEvidenceId],
    };
  });

const priorAccessById = new Map(
  remappedV1.accessOffers.map((offer) => [offer.id, offer]),
);
const accessOffers: readonly ResourceAccessOffer[] =
  computerScienceCourseSpecsV1_1.map((spec) => {
    const identity = identityFor(spec.key);
    const prior = priorAccessById.get(identity.accessOfferId);
    if (!prior) throw new Error(`Missing prior access offer for ${spec.key}.`);
    if (!versionedCourseKeys.has(spec.key)) return prior;
    return {
      ...prior,
      id: identity.accessOfferId,
      resourceVersionId: identity.resourceVersionId,
      checkedAt: CHECKED_AT,
    };
  });

const priorRightsById = new Map(
  remappedV1.rights.map((record) => [record.id, record]),
);
const rights: readonly ResourceRights[] = computerScienceCourseSpecsV1_1.map(
  (spec) => {
    const identity = identityFor(spec.key);
    const prior = priorRightsById.get(identity.rightsRecordId);
    if (!prior) throw new Error(`Missing prior rights record for ${spec.key}.`);
    if (!versionedCourseKeys.has(spec.key)) return prior;
    return {
      ...prior,
      id: identity.rightsRecordId,
      resourceVersionId: identity.resourceVersionId,
      verifiedAt: CHECKED_AT,
      evidenceIds: [identity.provenanceEvidenceId],
    };
  },
);

const priorFreshnessById = new Map(
  remappedV1.freshness.map((record) => [record.id, record]),
);
const freshness: readonly ResourceFreshness[] =
  computerScienceCourseSpecsV1_1.map((spec) => {
    const identity = identityFor(spec.key);
    const prior = priorFreshnessById.get(identity.freshnessRecordId);
    if (!prior) throw new Error(`Missing prior freshness record for ${spec.key}.`);
    if (!versionedCourseKeys.has(spec.key)) return prior;
    return {
      ...prior,
      id: identity.freshnessRecordId,
      resourceVersionId: identity.resourceVersionId,
      checkedAt: CHECKED_AT,
      resolvedUrl: spec.resource.url,
      note: "Verified through an editorial web check on 2026-08-01.",
    };
  });

const priorResourceProvenanceById = new Map(
  remappedV1.provenance.slice(1).map((evidence) => [evidence.id, evidence]),
);
const resourceProvenance = computerScienceCourseSpecsV1_1.map((spec) => {
  const identity = identityFor(spec.key);
  const prior = priorResourceProvenanceById.get(identity.provenanceEvidenceId);
  if (!prior) throw new Error(`Missing prior provenance for ${spec.key}.`);
  if (!versionedCourseKeys.has(spec.key)) return prior;
  return {
    ...prior,
    id: identity.provenanceEvidenceId,
    sourceTitle: spec.resource.title,
    sourceUrl: spec.resource.url,
    retrievedAt: CHECKED_AT,
    subjects: [
      { kind: "courseVersion" as const, id: identity.courseVersionId },
      {
        kind: "assessmentVersion" as const,
        id: identity.assessmentVersionIds.applied,
      },
      {
        kind: "assessmentVersion" as const,
        id: identity.assessmentVersionIds.final,
      },
      { kind: "resourceVersion" as const, id: identity.resourceVersionId },
      { kind: "resourceAccess" as const, id: identity.accessOfferId },
      { kind: "resourceRights" as const, id: identity.rightsRecordId },
    ],
  };
});

const periodKeyByTerm = {
  1: "term-1",
  2: "term-2",
  3: "term-3",
  4: "term-4",
  5: "term-5",
  6: "term-6",
} as const;

function periodId(term: keyof typeof periodKeyByTerm) {
  return computerScienceV11Identities.calendar.periodIds[periodKeyByTerm[term]];
}

const concentrationTitleByKey = {
  "intelligent-systems": "Intelligent Systems",
  "scalable-secure-systems": "Scalable and Secure Systems",
  "interactive-applications": "Interactive Applications",
} as const;

function requirementGroup(
  id: RequirementGroup["id"],
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
      id: identityFor(spec.key).requirementOptionId,
      courseVersionId: identityFor(spec.key).courseVersionId,
      credits: { value: spec.credits, system: CREDIT_SYSTEM },
      recommendedPeriodId: periodId(spec.term),
    })),
  };
}

const fixedSpecs = computerScienceCourseSpecsV1_1.filter(
  (spec) => !spec.concentrationKey,
);
const concentrationSpecs = computerScienceCourseSpecsV1_1.filter(
  (spec): spec is ComputerScienceCourseSpec &
    Required<Pick<ComputerScienceCourseSpec, "concentrationKey">> =>
    Boolean(spec.concentrationKey),
);

const fixedRequirementGroups = ([1, 2, 3, 4, 5, 6] as const).map(
  (term) => {
    const specs = fixedSpecs.filter((spec) => spec.term === term);
    return requirementGroup(
      computerScienceV11Identities.requirementGroupIds[
        periodKeyByTerm[term]
      ],
      `Term ${term} core`,
      `Complete all ${specs.length} fixed courses in the recommended Term ${term} sequence.`,
      term,
      specs,
    );
  },
);

const concentrationRequirement: RequirementGroup = {
  id: computerScienceV11Identities.requirementGroupIds.concentration,
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
    id: identityFor(spec.key).requirementOptionId,
    courseVersionId: identityFor(spec.key).courseVersionId,
    credits: { value: spec.credits, system: CREDIT_SYSTEM },
    concentrationId:
      computerScienceV11Identities.concentrationIds[spec.concentrationKey],
    recommendedPeriodId: periodId(6),
  })),
};

const requirements: readonly RequirementGroup[] = [
  ...fixedRequirementGroups,
  concentrationRequirement,
];

const placements: readonly SchedulePlacement[] =
  computerScienceCourseSpecsV1_1.map((spec, index) => ({
    id: identityFor(spec.key).schedulePlacementId,
    subject: {
      kind: "courseVersion",
      id: identityFor(spec.key).courseVersionId,
    },
    order: index + 1,
    periodId: periodId(spec.term),
    note: spec.concentrationKey
      ? `Take only if completing the ${concentrationTitleByKey[spec.concentrationKey]} concentration.`
      : `Recommended in Term ${spec.term}.`,
  }));

const programEvidence = {
  ...remappedV1.provenance[0],
  id: computerScienceV11Identities.programProvenanceEvidenceId,
  retrievedAt: CHECKED_AT,
  subjects: [
    {
      kind: "programVersion" as const,
      id: computerScienceV11Identities.programVersionId,
    },
    ...remappedV1.competencies.map((competency) => ({
      kind: "competency" as const,
      id: competency.id,
    })),
  ],
  note: "CS2023 informed breadth, competency language, mathematics, ethics, and professional-practice coverage. Official MIT, CMU, and author-maintained materials informed the targeted CS 1.1 architecture, algorithms, programming-languages, machine-learning, and parallel-computing revisions. Course Atlas independently selected and sequenced the free resources. This is not an ACM, IEEE-CS, AAAI, CMU, MIT, or university-accredited program.",
};

const computerScienceBundleV11 = {
  ...remappedV1,
  id: computerScienceV11Identities.bundleId,
  publishedAt: PUBLISHED_AT,
  programVersion: {
    ...remappedV1.programVersion,
    id: computerScienceV11Identities.programVersionId,
    version: VERSION,
    publishedAt: PUBLISHED_AT,
    requirements,
    concentrationIds: Object.values(
      computerScienceV11Identities.concentrationIds,
    ),
    provenanceEvidenceIds: [
      computerScienceV11Identities.programProvenanceEvidenceId,
    ],
    changelog:
      "CS 1.1 strengthens functional programming, modern computer architecture, advanced algorithm design, mathematical machine learning, and work-span parallel computing; Programming Languages now precedes Compilers. The six-term, 30-course, 4,800-hour completion contract is unchanged.",
  },
  courseVersions,
  learningUnits,
  assessmentVersions,
  resources,
  resourceVersions,
  accessOffers,
  rights,
  freshness,
  provenance: [programEvidence, ...resourceProvenance],
  schedules: [
    {
      ...remappedV1.schedules[0],
      id: computerScienceV11Identities.calendar.scheduleId,
      programVersionId: computerScienceV11Identities.programVersionId,
      placements,
    },
  ],
} as const satisfies PublishedProgramBundle;

if (versionedCourseKeys.size !== 19) {
  throw new Error(
    `Computer Science 1.1 prerequisite closure contains ${versionedCourseKeys.size} courses; expected 19.`,
  );
}

for (const key of versionedCourseKeys) {
  if (
    identityFor(key).courseVersionId ===
    computerScienceIdentities.courses[key as V11CourseKey].courseVersionId
  ) {
    throw new Error(`Computer Science 1.1 did not republish dependent course ${key}.`);
  }
}

for (const spec of computerScienceCourseSpecs) {
  if (!specFor(spec.key)) {
    throw new Error(`Computer Science 1.1 dropped course ${spec.key}.`);
  }
}

export const computerScienceBundle = computerScienceBundleV11;
