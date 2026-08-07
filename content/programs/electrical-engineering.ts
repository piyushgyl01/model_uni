import type {
  AssessmentKind,
  CompetencyId,
  CourseId,
  CourseVersionId,
  LearningUnitKind,
  ProgramVersionId,
  PublishedProgramBundle,
  ResourceVersionId,
} from "../../app/domain/catalog";
import {
  assertValidPublishedProgramBundle,
} from "../../app/domain/validation";
import {
  getCoursePlan,
  trackCoursePlans,
  type AssessmentType,
} from "../seeds/ee-course-plans";
import {
  courses as sourceCourses,
  provenanceSources,
  resources as sourceResources,
  semesters,
  tracks,
  type Course as SourceCourse,
  type TrackId,
} from "../seeds/ee-source-data";
import {
  eeCourseIdsByLegacyCode,
  eeResourceIdsByLegacyTitle,
  eeSpecializationCourseIds,
} from "../manifests/ee-identities";

const PUBLISHED_AT = "2026-07-24T00:00:00Z" as const;
const PROGRAM_ID = "prg_course_atlas_ee";
const PROGRAM_VERSION_ID: ProgramVersionId =
  "prv_course_atlas_ee_2026_1";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const commonSourceCourses = sourceCourses.filter(
  (course) => course.code !== "TRK401" && course.code !== "TRK402",
);

const courseIdForCode = (code: string) => {
  const id =
    eeCourseIdsByLegacyCode[
      code as keyof typeof eeCourseIdsByLegacyCode
    ];
  if (!id) throw new Error(`Missing stable course identity for ${code}.`);
  return id as CourseId;
};

const courseVersionIdForCourseId = (courseId: CourseId) =>
  `crv_${courseId.slice(4)}_2026_1` as CourseVersionId;

const resourceVersionIdForTitle = (title: string) => {
  const resourceId = eeResourceIdsByLegacyTitle[title];
  if (!resourceId) throw new Error(`Missing stable resource identity for "${title}".`);
  return `rsv_${resourceId.slice(4)}_2026_1` as ResourceVersionId;
};

const competencyDefinitions = [
  {
    id: "cmp_ee_mathematical_physical_foundations",
    canonicalSlug: "ee-mathematical-physical-foundations",
    title: "Mathematical and physical foundations",
    description:
      "Model electrical and computational systems using mathematics, physical laws, probability, and evidence.",
    domain: "Electrical Engineering",
  },
  {
    id: "cmp_ee_circuits_devices",
    canonicalSlug: "ee-circuits-and-devices",
    title: "Circuits, electronics, and devices",
    description:
      "Analyze and design circuits, electronic systems, semiconductor devices, and mixed-signal interfaces.",
    domain: "Electrical Engineering",
  },
  {
    id: "cmp_ee_signals_systems",
    canonicalSlug: "ee-signals-systems-control",
    title: "Signals, systems, control, and communication",
    description:
      "Transform, estimate, communicate, and control information-bearing physical signals.",
    domain: "Electrical Engineering",
  },
  {
    id: "cmp_ee_computing_digital",
    canonicalSlug: "ee-computing-and-digital-systems",
    title: "Computing and digital systems",
    description:
      "Build tested software, digital logic, embedded systems, and hardware/software interfaces.",
    domain: "Electrical Engineering",
  },
  {
    id: "cmp_ee_design_evidence",
    canonicalSlug: "ee-design-experimentation-evidence",
    title: "Design, experimentation, and evidence",
    description:
      "Turn needs into safe designs, reproducible experiments, verified artifacts, and defensible decisions.",
    domain: "Engineering Practice",
  },
  {
    id: "cmp_ee_context_communication",
    canonicalSlug: "ee-communication-ethics-context",
    title: "Communication, ethics, and public context",
    description:
      "Communicate technical work and evaluate its safety, social consequences, ownership, and deployment context.",
    domain: "Engineering Practice",
  },
] as const;

function competenciesForCourse(code: string, kind: SourceCourse["kind"]) {
  const ids = new Set<CompetencyId>();
  if (/^(MATH|PHYS|SCI)/.test(code)) {
    ids.add("cmp_ee_mathematical_physical_foundations");
  }
  if (
    ["EE102", "EE201", "EE203", "EE205", "EE303", "EE306"].includes(code) ||
    /^CHIP|^PWR/.test(code)
  ) {
    ids.add("cmp_ee_circuits_devices");
  }
  if (
    ["MATH202", "EE204", "EE301", "EE302", "EE304", "EE306"].includes(code) ||
    /^SIG|^ROB|^PWR/.test(code)
  ) {
    ids.add("cmp_ee_signals_systems");
  }
  if (
    /^(CS|CHIP)/.test(code) ||
    ["EE101", "EE202", "EE206", "SYS401"].includes(code)
  ) {
    ids.add("cmp_ee_computing_digital");
  }
  if (
    ["lab", "studio", "capstone"].includes(kind) ||
    /^(CAP|SYS|ROB|CHIP|SIG|PWR)/.test(code)
  ) {
    ids.add("cmp_ee_design_evidence");
  }
  if (/^(HUM|ENT|CAP)/.test(code)) {
    ids.add("cmp_ee_context_communication");
  }
  if (ids.size === 0) ids.add("cmp_ee_design_evidence");
  return [...ids];
}

function learningUnitKind(type: AssessmentType): LearningUnitKind {
  if (type === "lab") return "lab";
  if (type === "project" || type === "presentation") return "project";
  if (type === "study") return "lecture";
  if (type === "practice" || type === "problem-set" || type === "quiz") {
    return "practice";
  }
  return "review";
}

function assessmentKind(type: AssessmentType): AssessmentKind | undefined {
  if (type === "midterm" || type === "final") return "exam";
  if (type === "presentation") return "presentation";
  if (type === "project") return "project";
  if (type === "problem-set") return "problem set";
  if (type === "quiz") return "quiz";
  if (type === "lab") return "lab";
  return undefined;
}

const milestoneTypes = new Set<AssessmentType>([
  "midterm",
  "presentation",
  "final",
]);

const commonCourseMetadata = commonSourceCourses.map((source) => {
  const courseId = courseIdForCode(source.code);
  const courseVersionId = courseVersionIdForCourseId(courseId);
  const plan = getCoursePlan(source.code);
  if (!plan) throw new Error(`Missing published plan for ${source.code}.`);
  return {
    source,
    courseId,
    courseVersionId,
    code: source.code,
    title: source.title,
    slug: slugify(source.title),
    plan,
    credits: source.credits,
    period: source.semester,
    competencyIds: competenciesForCourse(source.code, source.kind),
  };
});

const specializationCodes: Record<TrackId, readonly [string, string]> = {
  chips: ["CHIP401", "CHIP402"],
  signals: ["SIG401", "SIG402"],
  robotics: ["ROB401", "ROB402"],
  energy: ["PWR401", "PWR402"],
};

const specializationPrerequisites: Record<
  TrackId,
  readonly [readonly string[], readonly string[]]
> = {
  chips: [["EE202", "EE206"], ["CHIP401", "EE206"]],
  signals: [["MATH202", "EE204"], ["SIG401", "EE301", "EE304"]],
  robotics: [["MATH202", "EE204"], ["ROB401", "EE302"]],
  energy: [["EE201", "EE204"], ["PWR401", "EE306"]],
};

const specializationCourseMetadata = tracks.flatMap((track) =>
  track.courseNames.map((title, slot) => {
    const courseId = eeSpecializationCourseIds[track.id][slot] as CourseId;
    const courseVersionId = courseVersionIdForCourseId(courseId);
    const code = specializationCodes[track.id][slot];
    const plan = trackCoursePlans[slot === 0 ? "TRK401" : "TRK402"][track.id];
    return {
      source: {
        code,
        title,
        semester: slot === 0 ? 5 : 6,
        credits: slot === 0 ? 2 : 3,
        hours: slot === 0 ? 7 : 8,
        kind: "studio" as const,
        summary: `${track.description} This is an independently versioned ${track.name} course, not a mutable specialization placeholder.`,
        prerequisites: specializationPrerequisites[track.id][slot],
        outcome: `Complete and defend the ${title} technical work defined in this published course version.`,
      },
      courseId,
      courseVersionId,
      code,
      title,
      slug: slugify(title),
      plan,
      credits: slot === 0 ? 2 : 3,
      period: slot === 0 ? 5 : 6,
      trackId: track.id,
      competencyIds: competenciesForCourse(code, "studio"),
    };
  }),
);

const allCourseMetadata = [
  ...commonCourseMetadata,
  ...specializationCourseMetadata,
];

const metadataByCode = new Map(
  allCourseMetadata.map((metadata) => [metadata.code, metadata]),
);

const resources = sourceResources.map((source) => {
  const id = eeResourceIdsByLegacyTitle[source.title];
  if (!id) throw new Error(`Missing resource manifest entry for ${source.title}.`);
  return {
    id: id as `res_${string}`,
    canonicalSlug: slugify(source.title),
    provider: source.provider,
    kind:
      source.access === "Free tool" || source.access === "Free for personal use"
        ? ("software" as const)
        : source.access === "Open textbook"
          ? ("textbook" as const)
          : source.access === "Open course" || source.access === "Free course"
            ? ("course" as const)
            : ("reference" as const),
    lifecycle: "active" as const,
  };
});

const resourceVersions = sourceResources.map((source) => {
  const resourceVersionId = resourceVersionIdForTitle(source.title);
  return {
    id: resourceVersionId,
    resourceId: eeResourceIdsByLegacyTitle[source.title] as `res_${string}`,
    version: "1.0.0" as const,
    status: "published" as const,
    publishedAt: PUBLISHED_AT,
    title: source.title,
    canonicalUrl: source.url,
    language: "en",
    authors: [],
    provenanceEvidenceIds: [
      `prvdc_ee_resource_${eeResourceIdsByLegacyTitle[source.title].slice(7)}`,
    ] as `prvdc_${string}`[],
  };
});

const accessOffers = sourceResources.map((source) => {
  const suffix = eeResourceIdsByLegacyTitle[source.title].slice(7);
  return {
    id: `acc_ee_resource_${suffix}` as const,
    resourceVersionId: resourceVersionIdForTitle(source.title),
    type: "free" as const,
    region: "Provider terms and local availability may apply",
    loginRequired: false,
    checkedAt: PUBLISHED_AT,
    note: `${source.access}. ${source.note}`,
  };
});

const rights = sourceResources.map((source) => {
  const suffix = eeResourceIdsByLegacyTitle[source.title].slice(7);
  return {
    id: `rgt_ee_resource_${suffix}` as const,
    resourceVersionId: resourceVersionIdForTitle(source.title),
    status: "link only" as const,
    mayMirror: false,
    mayAdapt: false,
    evidenceIds: [`prvdc_ee_resource_${suffix}` as const],
    note:
      "Course Atlas links to this provider resource. Free access is not treated as permission to copy or redistribute it.",
  };
});

const freshness = sourceResources.map((source) => {
  const suffix = eeResourceIdsByLegacyTitle[source.title].slice(7);
  return {
    id: `frs_ee_resource_${suffix}` as const,
    resourceVersionId: resourceVersionIdForTitle(source.title),
    status: "unchecked" as const,
    checkedAt: PUBLISHED_AT,
    resolvedUrl: source.url,
    note:
      "Imported with the first published EE bundle. Recheck the provider page before beginning the course.",
  };
});

const curriculumEvidence = provenanceSources.map((source, index) => ({
  id: `prvdc_ee_curriculum_${String(index + 1).padStart(2, "0")}` as const,
  kind: "official catalog" as const,
  sourceTitle: source.name,
  sourceUrl: source.url,
  retrievedAt: PUBLISHED_AT,
  subjects: [
    { kind: "programVersion" as const, id: PROGRAM_VERSION_ID },
    ...competencyDefinitions.map((competency) => ({
      kind: "competency" as const,
      id: competency.id,
    })),
  ],
  note: source.note,
}));

const resourceEvidence = sourceResources.map((source) => {
  const suffix = eeResourceIdsByLegacyTitle[source.title].slice(7);
  return {
    id: `prvdc_ee_resource_${suffix}` as const,
    kind: "provider page" as const,
    sourceTitle: `${source.provider}: ${source.title}`,
    sourceUrl: source.url,
    retrievedAt: PUBLISHED_AT,
    subjects: [
      {
        kind: "resourceVersion" as const,
        id: resourceVersionIdForTitle(source.title),
      },
      {
        kind: "resourceAccess" as const,
        id: `acc_ee_resource_${suffix}` as const,
      },
      {
        kind: "resourceRights" as const,
        id: `rgt_ee_resource_${suffix}` as const,
      },
    ],
    note: source.note,
  };
});

function courseArtifacts(metadata: (typeof allCourseMetadata)[number]) {
  const { courseId, courseVersionId, code, title, plan, competencyIds } = metadata;
  const unitIds = plan.weeks.map(
    (_, index) =>
      `unt_${courseId.slice(4)}_2026_1_${String(index + 1).padStart(2, "0")}` as const,
  );
  const units = plan.weeks.map((week, index) => ({
    id: unitIds[index],
    courseVersionId,
    kind: learningUnitKind(week.assessmentType),
    kindLabel: week.assessmentType.replace("-", " "),
    order: index + 1,
    label: `Week ${index + 1}`,
    title: week.title,
    topic: week.topic,
    resourceLocator: week.whereLabel,
    activity: week.action,
    evidence: week.evidence,
    nominalHours: week.hours,
    resourceVersionIds: [resourceVersionIdForTitle(week.resourceTitle)],
    competencyIds,
    assessmentKind: assessmentKind(week.assessmentType),
  }));

  const assessedUnits = plan.weeks
    .map((week, index) => ({ week, index }))
    .filter(({ week }) => milestoneTypes.has(week.assessmentType));
  const milestoneWeights =
    assessedUnits.length === 4
      ? [20, 20, 25, 35]
      : assessedUnits.map((_, index) =>
          index === assessedUnits.length - 1
            ? 100 - Math.floor(100 / assessedUnits.length) * (assessedUnits.length - 1)
            : Math.floor(100 / assessedUnits.length),
        );
  const assessments = assessedUnits.map(({ week }, index) => ({
    id: `asm_${courseId.slice(4)}_${String(index + 1).padStart(2, "0")}` as const,
    courseId,
    canonicalSlug: `${slugify(title)}-${slugify(week.title)}`,
    kind: assessmentKind(week.assessmentType) ?? ("portfolio" as const),
    lifecycle: "active" as const,
  }));
  const assessmentVersions = assessedUnits.map(({ week, index: weekIndex }, index) => ({
    id: `asv_${courseId.slice(4)}_2026_1_${String(index + 1).padStart(2, "0")}` as const,
    assessmentId: assessments[index].id,
    courseVersionId,
    unitId: unitIds[weekIndex],
    version: "1.0.0" as const,
    status: "published" as const,
    publishedAt: PUBLISHED_AT,
    title: week.title,
    instructions: week.action,
    submissionEvidence: [week.evidence],
    estimatedHours: week.hours,
    maximumScore: 100,
    resourceVersionIds: [resourceVersionIdForTitle(week.resourceTitle)],
    competencyIds,
    provenanceEvidenceIds: curriculumEvidence.map((evidence) => evidence.id),
  }));

  const primary = resourceVersionIdForTitle(plan.primaryResource);
  const alternativeIds = plan.alternatives.map(resourceVersionIdForTitle);
  const source = metadata.source;
  const prerequisiteIds = source.prerequisites
    .map((prerequisiteCode) => metadataByCode.get(prerequisiteCode)?.courseVersionId)
    .filter((id): id is CourseVersionId => Boolean(id));

  return {
    course: {
      id: courseId,
      canonicalSlug: metadata.slug,
      codes: [{ namespace: "Course Atlas", value: code }],
      discipline: "Electrical Engineering",
      lifecycle: "active" as const,
    },
    version: {
      id: courseVersionId,
      courseId,
      version: "1.0.0" as const,
      status: "published" as const,
      publishedAt: PUBLISHED_AT,
      baseLocale: "en",
      title,
      summary: source.summary,
      outcomes: [source.outcome],
      format:
        source.kind === "lab"
          ? ("laboratory" as const)
          : source.kind === "humanities"
            ? ("seminar" as const)
            : source.kind,
      nominalHours: plan.weeks.reduce((total, week) => total + week.hours, 0),
      setup: plan.setup,
      firstAction: plan.firstAction,
      safetyNote: plan.safetyLabNote,
      prerequisites: prerequisiteIds.map((courseVersionId) => ({
        courseVersionId,
        kind: "required" as const,
      })),
      resourceReferences: [
        { resourceVersionId: primary, role: "primary" as const },
        ...alternativeIds.map((resourceVersionId) => ({
          resourceVersionId,
          role: "alternative" as const,
        })),
      ],
      rootUnitIds: unitIds,
      gradingPolicy: {
        passingPercentage: 60,
        contributions: assessmentVersions.map((version, index) => ({
          assessmentVersionId: version.id,
          weight: milestoneWeights[index],
          requiredToPass: index === assessmentVersions.length - 1,
        })),
      },
      competencyIds,
      provenanceEvidenceIds: curriculumEvidence.map((evidence) => evidence.id),
    },
    units,
    assessments,
    assessmentVersions,
  };
}

const artifacts = allCourseMetadata.map(courseArtifacts);
const commonRequirementOptions = commonCourseMetadata.map((metadata, index) => ({
  id: `opt_ee_core_${String(index + 1).padStart(2, "0")}` as const,
  courseVersionId: metadata.courseVersionId,
  credits: { value: metadata.credits, system: "Course Atlas workload credit" },
  recommendedPeriodId: `per_ee_${String(metadata.period).padStart(2, "0")}` as const,
}));

const concentrationIds: Record<TrackId, `con_${string}`> = {
  chips: "con_ee_chips",
  signals: "con_ee_signals",
  robotics: "con_ee_robotics",
  energy: "con_ee_energy",
};

const specializationRequirementOptions = specializationCourseMetadata.map(
  (metadata, index) => ({
    id: `opt_ee_specialization_${String(index + 1).padStart(2, "0")}` as const,
    courseVersionId: metadata.courseVersionId,
    credits: {
      value: metadata.credits,
      system: "Course Atlas workload credit",
    },
    concentrationId: concentrationIds[metadata.trackId],
    recommendedPeriodId: `per_ee_${String(metadata.period).padStart(2, "0")}` as const,
  }),
);

const calendarPeriods = semesters.map((semester) => ({
  id: `per_ee_${String(semester.number).padStart(2, "0")}` as const,
  order: semester.number,
  label: `Semester ${semester.number} · Year ${semester.year} · ${semester.theme}`,
}));

const schedulePlacements = allCourseMetadata.map((metadata, index) => ({
  id: `plc_ee_${String(index + 1).padStart(3, "0")}` as const,
  subject: { kind: "courseVersion" as const, id: metadata.courseVersionId },
  order: index + 1,
  periodId: `per_ee_${String(metadata.period).padStart(2, "0")}` as const,
  note:
    "trackId" in metadata
      ? `${tracks.find((track) => track.id === metadata.trackId)?.name} option`
      : undefined,
}));

export const electricalEngineeringProgram = assertValidPublishedProgramBundle({
  schemaVersion: 1,
  id: "bnd_course_atlas_ee_2026_1",
  publishedAt: PUBLISHED_AT,
  program: {
    id: PROGRAM_ID,
    canonicalSlug: "electrical-engineering",
    title: "Electrical Engineering",
    shortTitle: "EE",
    school: "School of Engineering",
    discipline: "Electrical Engineering",
    kind: "degree-equivalent pathway",
    lifecycle: "active",
  },
  programVersion: {
    id: PROGRAM_VERSION_ID,
    programId: PROGRAM_ID,
    version: "1.0.0",
    status: "published",
    publishedAt: PUBLISHED_AT,
    baseLocale: "en",
    title: "Electrical Engineering",
    summary:
      "A three-year, laboratory-rich route from mathematical foundations to specialization and a defended senior design project.",
    credentialLabel: "Bachelor-level independent study pathway",
    nominalDuration: "3 years · 6 semesters",
    recognitionNotice:
      "Independent, non-accredited study. Course Atlas does not award a university degree, transferable credit, or professional licensure.",
    outcomes: [
      "Analyze and design electrical, electronic, computational, signal, control, communication, and energy systems.",
      "Build reproducible simulations, laboratory evidence, technical reports, and a public engineering portfolio.",
      "Select one coherent specialization and complete a two-stage capstone with review, verification, and defense.",
    ],
    workloadPolicy:
      "One internal workload credit represents approximately 40–45 hours of combined study, practice, laboratory, assessment, and project work. It is not an academic credit conversion.",
    defaultScheduleId: "sch_ee_full_time",
    requirements: [
      {
        id: "req_ee_common_core",
        title: "Common engineering core",
        description:
          "Twenty-nine required courses spanning foundations, breadth, laboratories, professional practice, and capstone.",
        order: 1,
        rule: {
          minSelections: commonRequirementOptions.length,
          maxSelections: commonRequirementOptions.length,
          minCredits: {
            value: commonRequirementOptions.reduce(
              (total, option) => total + option.credits.value,
              0,
            ),
            system: "Course Atlas workload credit",
          },
        },
        options: commonRequirementOptions,
      },
      {
        id: "req_ee_specialization",
        title: "Coherent specialization",
        description:
          "Choose both independently versioned courses from Chips, Signals, Robotics, or Energy.",
        order: 2,
        rule: {
          minSelections: 2,
          maxSelections: 2,
          minCredits: {
            value: 5,
            system: "Course Atlas workload credit",
          },
          selectionConstraint: "same concentration",
        },
        options: specializationRequirementOptions,
      },
    ],
    concentrationIds: Object.values(concentrationIds),
    competencyIds: competencyDefinitions.map((competency) => competency.id),
    provenanceEvidenceIds: curriculumEvidence.map((evidence) => evidence.id),
    changelog:
      "First generic publication. Replaces specialization placeholders with eight real course versions and separates course content from semester placement.",
  },
  courses: artifacts.map((artifact) => artifact.course),
  courseVersions: artifacts.map((artifact) => artifact.version),
  learningUnits: artifacts.flatMap((artifact) => artifact.units),
  assessments: artifacts.flatMap((artifact) => artifact.assessments),
  assessmentVersions: artifacts.flatMap(
    (artifact) => artifact.assessmentVersions,
  ),
  competencies: competencyDefinitions,
  competencyMappings: artifacts.flatMap((artifact, courseIndex) =>
    artifact.version.competencyIds.map((competencyId, competencyIndex) => ({
      id: `cpm_ee_${String(courseIndex + 1).padStart(2, "0")}_${String(
        competencyIndex + 1,
      ).padStart(2, "0")}` as const,
      competencyId,
      subject: {
        kind: "courseVersion" as const,
        id: artifact.version.id,
      },
      relationship: "develops" as const,
      targetLevel: "applied" as const,
      evidenceNote: artifact.version.outcomes[0],
    })),
  ),
  concentrations: tracks.map((track) => ({
    id: concentrationIds[track.id],
    canonicalSlug: track.id,
    title: track.name,
    description: track.description,
    courseVersionIds: specializationCourseMetadata
      .filter((metadata) => metadata.trackId === track.id)
      .map((metadata) => metadata.courseVersionId),
    capstoneIdeas: track.capstoneIdeas,
  })),
  resources,
  resourceVersions,
  accessOffers,
  rights,
  freshness,
  provenance: [...curriculumEvidence, ...resourceEvidence],
  calendars: [
    {
      id: "cal_ee_six_semesters",
      title: "Six-semester full-time projection",
      structure: "terms",
      periods: calendarPeriods,
      milestones: [],
    },
  ],
  schedules: [
    {
      id: "sch_ee_full_time",
      programVersionId: PROGRAM_VERSION_ID,
      calendarId: "cal_ee_six_semesters",
      title: "Recommended three-year full-time sequence",
      placements: schedulePlacements,
    },
  ],
} satisfies PublishedProgramBundle);
