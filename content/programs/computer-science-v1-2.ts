import type {
  AssessmentKind,
  CoursePrerequisite,
  LearningUnit,
  LearningUnitId,
  PublishedAssessmentVersion,
  PublishedCourseVersion,
  PublishedProgramBundle,
  PublishedResourceVersion,
  Resource,
  ResourceAccessOffer,
  ResourceFreshness,
  ResourceRights,
  WeeklySourceEvidence,
} from "../../app/domain/catalog";
import { assertValidPublishedProgramBundle } from "../../app/domain/validation";
import { computerScienceV11Identities } from "../manifests/computer-science-v1-1-identities";
import { computerScienceV12Identities } from "../manifests/computer-science-v1-2-identities";
import {
  computerScienceRunnablePlans,
  type ComputerScienceRunnableCoursePlan,
  type ComputerScienceRunnableCourseKey,
  type RunnableAssessmentSpec,
} from "./computer-science-runnable-plans";
import {
  computerScienceCourseSpecsV1_1,
} from "./computer-science-course-specs-v1-1";
import { computerScienceBundle as computerScienceBundleV11 } from "./computer-science-v1-1";

const VERSION = "1.2.0" as const;
const PUBLISHED_AT = "2026-08-14T00:00:00Z" as const;
const CHECKED_AT = "2026-08-14T00:00:00Z" as const;

type CourseKey = keyof typeof computerScienceV12Identities.courses;

function identityFor(key: string) {
  const identity =
    computerScienceV12Identities.courses[key as CourseKey];
  if (!identity) {
    throw new Error(`Missing Computer Science 1.2 identity for ${key}.`);
  }
  return identity;
}

function runnablePlanFor(key: string): ComputerScienceRunnableCoursePlan {
  const plan =
    computerScienceRunnablePlans[key as ComputerScienceRunnableCourseKey];
  if (!plan) {
    throw new Error(`Missing Computer Science 1.2 runnable plan for ${key}.`);
  }
  return plan;
}

function learningUnitId(key: string, topicKey: string): LearningUnitId {
  const id = (identityFor(key).learningUnitIds as Record<string, LearningUnitId>)[
    topicKey
  ];
  if (!id) {
    throw new Error(`Missing Computer Science 1.2 unit identity ${key}/${topicKey}.`);
  }
  return id;
}

function collectIdentityReplacementPairs(
  prior: unknown,
  next: unknown,
  replacements = new Map<string, string>(),
) {
  if (typeof prior === "string" && typeof next === "string") {
    if (/^[a-z]+_/.test(prior) && prior !== next) {
      replacements.set(prior, next);
    }
    return replacements;
  }
  if (
    prior &&
    next &&
    typeof prior === "object" &&
    typeof next === "object"
  ) {
    for (const [key, child] of Object.entries(prior)) {
      if (Object.hasOwn(next, key)) {
        collectIdentityReplacementPairs(
          child,
          (next as Record<string, unknown>)[key],
          replacements,
        );
      }
    }
  }
  return replacements;
}

const identityReplacements = collectIdentityReplacementPairs(
  // The 1.2 manifest has the same descriptive key shape as 1.1 and differs
  // only where an immutable entity must be republished.
  computerScienceV11Identities,
  computerScienceV12Identities,
);

function remapIdentityStrings<Value>(value: Value): Value {
  if (typeof value === "string") {
    return (identityReplacements.get(value) ?? value) as Value;
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

const remappedV11 = remapIdentityStrings(
  computerScienceBundleV11,
) as PublishedProgramBundle;

const courseVersionByCourseId = new Map(
  remappedV11.courseVersions.map((version) => [version.courseId, version]),
);
const assessmentVersionById = new Map(
  remappedV11.assessmentVersions.map((version) => [version.id, version]),
);
const assessmentById = new Map(
  remappedV11.assessments.map((assessment) => [assessment.id, assessment]),
);
const resourceById = new Map(
  remappedV11.resources.map((resource) => [resource.id, resource]),
);
const priorResourceById = new Map(
  computerScienceBundleV11.resources.map((resource) => [resource.id, resource]),
);
const resourceVersionById = new Map(
  remappedV11.resourceVersions.map((version) => [version.id, version]),
);
const accessOfferById = new Map(
  remappedV11.accessOffers.map((offer) => [offer.id, offer]),
);
const rightsById = new Map(
  remappedV11.rights.map((record) => [record.id, record]),
);
const freshnessById = new Map(
  remappedV11.freshness.map((record) => [record.id, record]),
);

function exactLocation(
  location: { readonly provider: string; readonly label: string; readonly url: string },
) {
  return `${location.provider} — ${location.label} — ${location.url}`;
}

function exactBlockLocator(
  locations: readonly [
    { readonly provider: string; readonly label: string; readonly url: string },
    { readonly provider: string; readonly label: string; readonly url: string },
  ],
) {
  return locations.map(exactLocation).join(" | ");
}

function prerequisitesFor(
  spec: (typeof computerScienceCourseSpecsV1_1)[number],
): CoursePrerequisite[] {
  return spec.prerequisiteKeys.map((key) => {
    const prerequisite = computerScienceCourseSpecsV1_1.find(
      (candidate) => candidate.key === key,
    );
    if (!prerequisite) {
      throw new Error(`Unknown Computer Science prerequisite ${key}.`);
    }
    const concurrentEnrollmentAllowed = prerequisite.term === spec.term;
    return {
      courseVersionId: identityFor(key).courseVersionId,
      kind: "required",
      concurrentEnrollmentAllowed: concurrentEnrollmentAllowed || undefined,
      note: concurrentEnrollmentAllowed
        ? `Concurrent enrollment is allowed in Term ${spec.term}; finish the prerequisite's relevant weekly work before using it in ${spec.title}.`
        : undefined,
    };
  });
}

function assessmentKindFor(
  key: string,
  position: "applied" | "final",
): AssessmentKind {
  const identity = identityFor(key);
  const assessmentVersion = assessmentVersionById.get(
    identity.assessmentVersionIds[position],
  );
  const assessment = assessmentVersion
    ? assessmentById.get(assessmentVersion.assessmentId)
    : undefined;
  if (!assessment) {
    throw new Error(`Missing ${position} assessment identity for ${key}.`);
  }
  return assessment.kind;
}

const courseVersions: readonly PublishedCourseVersion[] =
  computerScienceCourseSpecsV1_1.map((spec) => {
    const identity = identityFor(spec.key);
    const plan = runnablePlanFor(spec.key);
    const previous = courseVersionByCourseId.get(identity.courseId);
    if (!previous) {
      throw new Error(`Missing Computer Science 1.1 course ${spec.key}.`);
    }
    const firstWeek = plan.blocks[0];
    return {
      ...previous,
      id: identity.courseVersionId,
      version: VERSION,
      publishedAt: PUBLISHED_AT,
      nominalHours: plan.blocks.reduce(
        (hours, block) => hours + block.estimatedHours,
        0,
      ),
      setup: [
        `Open and bookmark ${exactLocation(firstWeek.resourceLocations[0])}.`,
        "Create a version-controlled workspace with weekly work, tests, assessment submissions, rubrics, corrections, and evidence in separate folders.",
        "Record tool versions, cite every reused source or code fragment, preserve raw inputs, and do not publish provider answer keys.",
      ],
      firstAction: `${firstWeek.assignments[0].activity} Keep ${firstWeek.assignments[0].deliverable}`,
      prerequisites: prerequisitesFor(spec),
      resourceReferences: [
        {
          resourceVersionId: identity.resourceVersionId,
          role: "primary",
          note: `Primary course source and its exact weekly locations were checked for free access on ${CHECKED_AT.slice(0, 10)}.`,
        },
      ],
      rootUnitIds: spec.topics.map(
        (topic) => learningUnitId(spec.key, topic.key),
      ),
      gradingPolicy: {
        passingPercentage: 70,
        contributions: [
          {
            assessmentVersionId: identity.assessmentVersionIds.applied,
            weight: 40,
            requiredToPass: true,
          },
          {
            assessmentVersionId: identity.assessmentVersionIds.final,
            weight: 60,
            requiredToPass: true,
          },
        ],
      },
      provenanceEvidenceIds: [identity.provenanceEvidenceId],
      changelog:
        "Republished for CS 1.2 with sixteen exact weekly assignments, assessable outputs, a specified midterm and final, explicit rubrics, passing criteria, and refreshed resource evidence.",
    };
  });

function buildLearningUnits(): readonly LearningUnit[] {
  return computerScienceCourseSpecsV1_1.flatMap((spec) => {
    const identity = identityFor(spec.key);
    const plan = runnablePlanFor(spec.key);
    const competencyIds = spec.competencyKeys.map(
      (key) =>
        computerScienceV12Identities.competencyIds[
          key as keyof typeof computerScienceV12Identities.competencyIds
        ],
    );
    return plan.blocks.map((block, blockIndex) => {
      const topic = spec.topics[blockIndex];
      if (!topic || block.topicKey !== topic.key) {
        throw new Error(
          `Computer Science 1.2 topic mismatch at ${spec.key} block ${blockIndex + 1}.`,
        );
      }
      const startWeek = blockIndex * 2 + 1;
      const appliedKind = assessmentKindFor(spec.key, "applied");
      const finalKind = assessmentKindFor(spec.key, "final");
      const scheduledAssessment =
        blockIndex === 3 ? plan.midterm : blockIndex === 7 ? plan.final : undefined;
      const weeklyAssignments = block.assignments.map((assignment, index) => {
        const isAssessmentWeek = index === 1 && scheduledAssessment !== undefined;
        return {
          week: startWeek + index,
          title: `Week ${startWeek + index} · ${
            isAssessmentWeek
              ? scheduledAssessment.title
              : block.resourceLocations[index].label
          }`,
          resourceLocator: exactLocation(block.resourceLocations[index]),
          sourceEvidence: sourceEvidenceFor(block.resourceLocations[index].url),
          activity: isAssessmentWeek
            ? scheduledAssessment.instructions
            : assignment.activity,
          deliverable: isAssessmentWeek
            ? scheduledAssessment.submissionEvidence.join("; ")
            : assignment.deliverable,
          estimatedHours: assignment.estimatedHours,
        };
      });
      return {
        id: learningUnitId(spec.key, topic.key),
        courseVersionId: identity.courseVersionId,
        kind:
          blockIndex === 3
            ? "project"
            : blockIndex === 7
              ? "review"
              : spec.format === "laboratory" && blockIndex % 2 === 1
                ? "lab"
                : blockIndex % 2 === 0
                  ? "lecture"
                  : "practice",
        order: blockIndex + 1,
        label: `Weeks ${startWeek}–${startWeek + 1}`,
        title: topic.title.charAt(0).toUpperCase() + topic.title.slice(1),
        topic: topic.title,
        resourceLocator: exactBlockLocator(block.resourceLocations),
        activity: weeklyAssignments
          .map((assignment, index) => `Week ${startWeek + index}: ${assignment.activity}`)
          .join(" "),
        evidence: weeklyAssignments
          .map(
            (assignment, index) =>
              `Week ${startWeek + index}: ${assignment.deliverable}`,
          )
          .join(" "),
        nominalHours: block.estimatedHours,
        resourceVersionIds: [identity.resourceVersionId],
        competencyIds,
        assessmentKind:
          blockIndex === 3
            ? appliedKind
            : blockIndex === 7
              ? finalKind
              : undefined,
        weeklyAssignments,
      } satisfies LearningUnit;
    });
  });
}

function assessmentVersion(
  spec: (typeof computerScienceCourseSpecsV1_1)[number],
  position: "applied" | "final",
  plan: RunnableAssessmentSpec,
): PublishedAssessmentVersion {
  const identity = identityFor(spec.key);
  const id = identity.assessmentVersionIds[position];
  const previous = assessmentVersionById.get(id);
  if (!previous) {
    throw new Error(`Missing remapped ${position} assessment for ${spec.key}.`);
  }
  const unitIndex = position === "applied" ? 3 : 7;
  const topic = spec.topics[unitIndex];
  return {
    ...previous,
    id,
    courseVersionId: identity.courseVersionId,
    unitId: learningUnitId(spec.key, topic.key),
    version: VERSION,
    publishedAt: PUBLISHED_AT,
    title: plan.title,
    instructions: plan.instructions,
    submissionEvidence: plan.submissionEvidence,
    estimatedHours: plan.estimatedHours,
    maximumScore: plan.maximumScore,
    stage: plan.stage,
    passingScore: plan.passingScore,
    rubric: plan.rubric,
    resourceVersionIds: [identity.resourceVersionId],
    competencyIds: spec.competencyKeys.map(
      (key) =>
        computerScienceV12Identities.competencyIds[
          key as keyof typeof computerScienceV12Identities.competencyIds
        ],
    ),
    provenanceEvidenceIds: [identity.provenanceEvidenceId],
  };
}

const assessmentVersions: readonly PublishedAssessmentVersion[] =
  computerScienceCourseSpecsV1_1.flatMap((spec) => {
    const plan = runnablePlanFor(spec.key);
    return [
      assessmentVersion(spec, "applied", plan.midterm),
      assessmentVersion(spec, "final", plan.final),
    ];
  });

const resources: readonly Resource[] = computerScienceCourseSpecsV1_1.map(
  (spec) => {
    const identity = identityFor(spec.key);
    const previous = resourceById.get(identity.resourceId);
    if (!previous) {
      throw new Error(`Missing remapped resource for ${spec.key}.`);
    }
    const override = runnablePlanFor(spec.key).resourceOverride;
    const priorIdentity =
      computerScienceV11Identities.courses[
        spec.key as keyof typeof computerScienceV11Identities.courses
      ];
    const prior = priorResourceById.get(priorIdentity.resourceId);
    if (!prior) {
      throw new Error(`Missing prior resource identity for ${spec.key}.`);
    }
    const identityChanged = prior.id !== identity.resourceId;
    const next = override && identityChanged
      ? {
          ...previous,
          id: identity.resourceId,
          canonicalSlug: override.slug,
          provider: override.provider,
          kind: override.kind,
        }
      : previous;
    const payloadChanged =
      prior.canonicalSlug !== next.canonicalSlug ||
      prior.provider !== next.provider ||
      prior.kind !== next.kind;
    if (payloadChanged !== identityChanged || next.id !== identity.resourceId) {
      throw new Error(
        `Computer Science 1.2 resource identity decision is inconsistent for ${spec.key}.`,
      );
    }
    return next;
  },
);

const resourceVersions: readonly PublishedResourceVersion[] =
  computerScienceCourseSpecsV1_1.map((spec) => {
    const identity = identityFor(spec.key);
    const previous = resourceVersionById.get(identity.resourceVersionId);
    if (!previous) {
      throw new Error(`Missing remapped resource version for ${spec.key}.`);
    }
    const override = runnablePlanFor(spec.key).resourceOverride;
    return {
      ...previous,
      id: identity.resourceVersionId,
      resourceId: identity.resourceId,
      version: VERSION,
      publishedAt: PUBLISHED_AT,
      title: override?.title ?? spec.resource.title,
      canonicalUrl: override?.url ?? spec.resource.url,
      authors: override?.authors ?? spec.resource.authors,
      provenanceEvidenceIds: [identity.provenanceEvidenceId],
    };
  });

const accessOffers: readonly ResourceAccessOffer[] =
  computerScienceCourseSpecsV1_1.map((spec) => {
    const identity = identityFor(spec.key);
    const previous = accessOfferById.get(identity.accessOfferId);
    if (!previous) {
      throw new Error(`Missing remapped access fact for ${spec.key}.`);
    }
    const override = runnablePlanFor(spec.key).resourceOverride;
    return {
      ...previous,
      id: identity.accessOfferId,
      resourceVersionId: identity.resourceVersionId,
      type: "free",
      checkedAt: CHECKED_AT,
      note:
        override?.access.note ??
        "The primary source and the exact assigned locations were reachable without payment during the 2026-08-14 editorial audit. Optional accounts, certificates, books, or hosted tooling may have separate terms.",
    };
  });

const verifiedOpenLicenses: Partial<
  Record<
    CourseKey,
    {
      readonly identifier: string;
      readonly url: string;
      readonly note: string;
    }
  >
> = {
  "programming-1": {
    identifier: "CC-BY-NC-SA-4.0",
    url: "https://cs50.harvard.edu/python/license/",
    note: "CS50P publishes its course materials under CC BY-NC-SA 4.0, subject to the exceptions and attribution requirements on its license page.",
  },
  "systems-foundations": {
    identifier: "CC-BY-NC-SA-4.0",
    url: "https://cs50.harvard.edu/x/license/",
    note: "CS50x publishes its course materials under CC BY-NC-SA 4.0, subject to the exceptions and attribution requirements on its license page.",
  },
  "discrete-mathematics": {
    identifier: "CC-BY-NC-SA-4.0",
    url: "https://ocw.mit.edu/pages/privacy-and-terms-of-use/#cc",
    note: "MIT OpenCourseWare publishes eligible course materials under CC BY-NC-SA 4.0; third-party components retain their stated terms.",
  },
  calculus: {
    identifier: "CC-BY-NC-SA-4.0",
    url: "https://ocw.mit.edu/pages/privacy-and-terms-of-use/#cc",
    note: "MIT OpenCourseWare publishes eligible course materials under CC BY-NC-SA 4.0; third-party components retain their stated terms.",
  },
  "data-structures": {
    identifier: "CC-BY-NC-SA-4.0",
    url: "https://ocw.mit.edu/pages/privacy-and-terms-of-use/#cc",
    note: "MIT OpenCourseWare publishes eligible 6.006 materials under CC BY-NC-SA 4.0; third-party components retain their stated terms.",
  },
  "computer-architecture": {
    identifier: "CC-BY-NC-SA-4.0",
    url: "https://ocw.mit.edu/pages/privacy-and-terms-of-use/#cc",
    note: "MIT OpenCourseWare publishes eligible course materials under CC BY-NC-SA 4.0; third-party components retain their stated terms.",
  },
  "linear-algebra": {
    identifier: "CC-BY-NC-SA-4.0",
    url: "https://ocw.mit.edu/pages/privacy-and-terms-of-use/#cc",
    note: "MIT OpenCourseWare publishes eligible course materials under CC BY-NC-SA 4.0; third-party components retain their stated terms.",
  },
  algorithms: {
    identifier: "CC-BY-NC-SA-4.0",
    url: "https://ocw.mit.edu/pages/privacy-and-terms-of-use/#cc",
    note: "MIT OpenCourseWare publishes eligible course materials under CC BY-NC-SA 4.0; third-party components retain their stated terms.",
  },
  "theory-of-computation": {
    identifier: "CC-BY-NC-SA-4.0",
    url: "https://ocw.mit.edu/pages/privacy-and-terms-of-use/#cc",
    note: "MIT OpenCourseWare publishes eligible course materials under CC BY-NC-SA 4.0; third-party components retain their stated terms.",
  },
  "machine-learning": {
    identifier: "CC-BY-NC-SA-4.0",
    url: "https://ocw.mit.edu/pages/privacy-and-terms-of-use/#cc",
    note: "MIT OpenCourseWare publishes eligible course materials under CC BY-NC-SA 4.0; third-party components retain their stated terms.",
  },
  "technical-communication": {
    identifier: "CC-BY-4.0",
    url: "https://developers.google.com/terms/site-policies",
    note: "Google Developers documentation is available under CC BY 4.0 unless noted; code samples can use Apache 2.0 and third-party items can differ.",
  },
  "android-development": {
    identifier: "CC-BY-4.0",
    url: "https://developers.google.com/terms/site-policies",
    note: "Android Developers documentation is available under CC BY 4.0 unless noted; code samples can use Apache 2.0 and third-party items can differ.",
  },
  "web-engineering": {
    identifier: "CC-BY-SA-4.0",
    url: "https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Attrib_copyright_license",
    note: "MDN prose is available under the documented CC BY-SA terms; code examples and third-party contributions may carry different terms.",
  },
};

function sourceRightsFor(
  spec: (typeof computerScienceCourseSpecsV1_1)[number],
) {
  const declared = runnablePlanFor(spec.key).resourceOverride?.rights;
  const verifiedLicense = verifiedOpenLicenses[spec.key as CourseKey];
  if (verifiedLicense) {
    return {
      rightsStatus: "open" as const,
      licenseIdentifier: verifiedLicense.identifier,
      licenseUrl: verifiedLicense.url,
      rightsNote: verifiedLicense.note,
    };
  }
  if (declared?.mode === "licensed") {
    return {
      rightsStatus: "open" as const,
      licenseIdentifier: declared.licenseIdentifier,
      licenseUrl: declared.licenseUrl,
      rightsNote: declared.note,
    };
  }
  return {
    rightsStatus: "link only" as const,
    rightsNote:
      declared?.note ??
      "Course Atlas verified only that this provider location may be linked for study. It does not mirror, adapt, or claim a broader license for the material.",
  };
}

function sourceEvidenceFor(
  url: string,
): WeeklySourceEvidence {
  return {
    url,
    accessType: "free",
    accessNote:
      "This exact weekly location was reachable without payment during the dated editorial check; optional accounts, certificates, books, or hosted tools may have separate terms.",
    rightsStatus: "link only",
    rightsNote:
      "Course Atlas links to this exact weekly location for independent study but does not claim permission to mirror, adapt, or redistribute its contents.",
    freshnessStatus: "healthy",
    resolvedUrl: url,
    checkedAt: CHECKED_AT,
    checkMethod: "manual-browser",
    freshnessNote:
      "An editor opened this exact weekly URL in a browser on 2026-08-14 and confirmed that the assigned material rendered; automated clients may still be provider-blocked.",
  };
}

const learningUnits = buildLearningUnits();

const rights: readonly ResourceRights[] =
  computerScienceCourseSpecsV1_1.map((spec) => {
    const identity = identityFor(spec.key);
    const previous = rightsById.get(identity.rightsRecordId);
    if (!previous) {
      throw new Error(`Missing remapped rights fact for ${spec.key}.`);
    }
    const declaration = sourceRightsFor(spec);
    if (declaration.rightsStatus === "open") {
      return {
        ...previous,
        id: identity.rightsRecordId,
        resourceVersionId: identity.resourceVersionId,
        status: "open",
        licenseIdentifier: declaration.licenseIdentifier,
        licenseUrl: declaration.licenseUrl,
        mayMirror: false,
        mayAdapt: false,
        verifiedAt: CHECKED_AT,
        evidenceIds: [identity.provenanceEvidenceId],
        note: declaration.rightsNote,
      };
    }
    return {
      ...previous,
      id: identity.rightsRecordId,
      resourceVersionId: identity.resourceVersionId,
      status: "link only",
      mayMirror: false,
      mayAdapt: false,
      verifiedAt: CHECKED_AT,
      evidenceIds: [identity.provenanceEvidenceId],
      note: declaration.rightsNote,
    };
  });

const freshness: readonly ResourceFreshness[] =
  computerScienceCourseSpecsV1_1.map((spec) => {
    const identity = identityFor(spec.key);
    const previous = freshnessById.get(identity.freshnessRecordId);
    if (!previous) {
      throw new Error(`Missing remapped freshness fact for ${spec.key}.`);
    }
    const override = runnablePlanFor(spec.key).resourceOverride;
    const resolvedUrl = override?.freshness.resolvedUrl ?? spec.resource.url;
    return {
      ...previous,
      id: identity.freshnessRecordId,
      resourceVersionId: identity.resourceVersionId,
      status: "healthy",
      checkedAt: CHECKED_AT,
      httpStatus: 200,
      resolvedUrl,
      note:
        override?.freshness.note ??
        "The canonical source and the exact assigned locations returned successful responses during the 2026-08-14 editorial audit.",
    };
  });

const resourceProvenance = computerScienceCourseSpecsV1_1.map((spec) => {
  const identity = identityFor(spec.key);
  const plan = runnablePlanFor(spec.key);
  const override = plan.resourceOverride;
  const sourceTitle = override?.title ?? spec.resource.title;
  const sourceUrl = override?.url ?? spec.resource.url;
  return {
    id: identity.provenanceEvidenceId,
    kind: "editorial review" as const,
    sourceTitle,
    sourceUrl,
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
    note:
      `Course Atlas checked the canonical source plus all sixteen exact weekly locations on 2026-08-14, recorded access and rights conservatively, and independently authored the assignments, assessments, and rubrics. ${
        override?.providerAssessmentPolicy.note ??
        "Provider exercises inform practice only; Course Atlas assessments and completion decisions are independent."
      }`,
  };
});

const programEvidence = {
  ...remappedV11.provenance[0],
  id: computerScienceV12Identities.programProvenanceEvidenceId,
  retrievedAt: CHECKED_AT,
  subjects: [
    {
      kind: "programVersion" as const,
      id: computerScienceV12Identities.programVersionId,
    },
    ...remappedV11.competencies.map((competency) => ({
      kind: "competency" as const,
      id: competency.id,
    })),
  ],
  note:
    "CS 1.2 preserves the reviewed breadth and sequence of CS 1.1 while replacing its generated instructional templates with a sixteen-week, independently assessable plan for every course. Course Atlas verified the linked locations, access basis, rights basis, and freshness on 2026-08-14. It remains independent and non-accredited.",
};

export const computerScienceBundleV12 = {
  ...remappedV11,
  id: computerScienceV12Identities.bundleId,
  publishedAt: PUBLISHED_AT,
  programVersion: {
    ...remappedV11.programVersion,
    id: computerScienceV12Identities.programVersionId,
    version: VERSION,
    publishedAt: PUBLISHED_AT,
    qualityStandard: "runnable-pathway-v1",
    workloadPolicy:
      "Every course carries 4 Course Atlas credits and 160 nominal hours: eight ordered topic blocks containing sixteen exact weekly assignments of 10 hours each. The 30-course pathway remains approximately 4,800 hours across six recommended 20-week terms, including assessment windows and breaks.",
    provenanceEvidenceIds: [
      computerScienceV12Identities.programProvenanceEvidenceId,
    ],
    changelog:
      "CS 1.2 replaces vague generated templates across all 34 courses with exact free locations, sixteen concrete weekly assignments, assessable deliverables, labs and checkpoints, specified midterms and finals, explicit 100-point rubrics and 70-point passing scores, and refreshed access, rights, freshness, and provenance records.",
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
} as const satisfies PublishedProgramBundle;

if (courseVersions.length !== 34 || learningUnits.length !== 272) {
  throw new Error("Computer Science 1.2 must publish 34 courses and 272 topic blocks.");
}
if (
  learningUnits.some(
    (unit) =>
      unit.weeklyAssignments?.length !== 2 ||
      unit.weeklyAssignments.reduce(
        (hours, assignment) => hours + assignment.estimatedHours,
        0,
      ) !== unit.nominalHours,
  )
) {
  throw new Error(
    "Every Computer Science 1.2 topic block must contain two complete weekly assignments.",
  );
}
if (assessmentVersions.length !== 68) {
  throw new Error("Computer Science 1.2 must publish a midterm and final for every course.");
}

assertValidPublishedProgramBundle(computerScienceBundleV12);
