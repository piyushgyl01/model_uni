import type {
  CourseVersionId,
  LearningUnit,
  PublishedCourseVersion,
  PublishedProgramBundle,
  ResourceVersionId,
  WeeklyAssignment,
} from "./catalog";

export type InstructionalQualityIssueCode =
  | "vague_resource_location"
  | "repeated_instruction_template"
  | "missing_weekly_assignment"
  | "missing_assessable_output"
  | "missing_rubric"
  | "invalid_workload"
  | "unverified_resource";

export interface InstructionalQualityIssue {
  readonly code: InstructionalQualityIssueCode;
  readonly path: string;
  readonly message: string;
}

type AddIssue = (
  code: InstructionalQualityIssueCode,
  path: string,
  message: string,
) => void;

type TextSample = {
  readonly path: string;
  readonly value: string;
  readonly dynamicText: readonly string[];
};

type QualityUnit = LearningUnit & { readonly __qualityIndex: number };

const EXPECTED_WEEKS = Array.from({ length: 16 }, (_, index) => index + 1);
const HOUR_TOLERANCE = 0.01;
const SCORE_TOLERANCE = 0.000_001;
const DAY_IN_MS = 24 * 60 * 60 * 1_000;
const MAX_ACCESS_AGE_DAYS = 180;
const MAX_FRESHNESS_AGE_DAYS = 180;
const MAX_RIGHTS_AGE_DAYS = 365;
const MAX_PROVENANCE_AGE_DAYS = 180;
const WEEKLY_SOURCE_METHODS = new Set([
  "automated-http",
  "manual-browser",
  "automated-http-and-editorial-review",
]);
const HTTP_URL = /https?:\/\/[^\s)\]}>]+/giu;

const EXACT_LOCATION =
  /(?:\b(?:week|lecture|lec\.?|chapter|ch\.?|section|module|unit|lesson|problem\s*set|pset|exercise|assignment|homework|project|lab|page(?:s)?|video)\s*(?:#|no\.?|number)?\s*\d+(?:[.:-]\d+)*\b|§\s*\d+(?:\.\d+)*|\b\d{1,2}:\d{2}(?::\d{2})?\b)/i;
const NAMED_EXACT_LOCATION =
  /\b(?:lecture|chapter|section|module|lesson|exercise|assignment|homework|project|lab|reading|schedule|specification|guide)\b[^|\n]{0,45}(?:—|:|-)[^|\n]{6,}/i;
const VAGUE_LOCATION =
  /(?:find\s+(?:the\s+)?(?:relevant\s+)?section|sections?,?\s+lectures?,?\s+or\s+exercises?[^.]{0,80}\bcover|primary resource(?: material)?|course resources?|provider exercises? where available|materials? on\b)/i;
const VAGUE_INSTRUCTION =
  /(?:course-specific|where available|without copying a solution|one (?:new )?example|one .* artifact|as appropriate|primary resource)/i;
const UNRESOLVED_PROMPT_DEPENDENCY =
  /\b(?:supplied|unseen|hidden|predefined)\s+(?:api|artifact|brief|case|code|data(?:set)?|defects?|environment|examples?|fixtures?|graph|input|interface|language|layouts?|matrix|network|problem|programs?|prompts?|repository|scenario|service|statistics|study|time series|traces?|workload)\b/i;
const GENERIC_RUBRIC_SCAFFOLD =
  /(?:visibly establishes|trace [^.]{0,100} to concrete results|audit [^.]{0,100} from inputs through outputs|cross-check [^.]{0,100} against the other submitted artifacts)/i;
const ACTION_VERB =
  /\b(?:ablate|add|adapt|amortize|analy[sz]e|annotate|apply|approximate|assemble|audit|benchmark|bind|build|calculate|capture|characteri[sz]e|check|choose|classify|collect|compare|compile|complete|compose|compress|compute|conduct|configure|connect|construct|consume|convert|correct|create|critique|cut|debug|decompose|defend|define|deliver|demonstrate|derive|design|diagnose|document|draft|draw|edit|enumerate|estimate|evaluate|execute|explain|explore|extend|extract|find|fit|formalize|formulate|freeze|generate|give|handle|identify|implement|infer|inject|inspect|instrument|integrate|interview|inventory|investigate|label|layer|maintain|map|measure|model|operate|optimi[sz]e|parse|patch|prepare|preregister|preserve|present|probe|produce|profile|prove|publish|quantify|rank|record|reconcile|reconstruct|recover|redesign|reduce|refactor|repair|replace|replan|reproduce|research|restructure|revalidate|review|revise|rewrite|run|score|search|separate|simulate|solve|specify|split|submit|synthesize|test|trace|train|translate|turn|use|validate|vary|verify|visualize|write)\b/i;
const CONCRETE_OUTPUT =
  /\b(?:ablation|analysis|answers?|api|application|archive|arguments?|artifact|assumptions?|audit|benchmark|bibliography|bounds?|build|calculation|capture|case|catalog|chart|checklist|checks?|claims?|cli|code|comparisons?|configuration|corpus|corrections?|csv|curves?|dashboard|data|dataset|decision(?: record| table)?|definitions?|defense|demonstration|derivations?|design(?: document)?|diagrams?|diff|diagnostics?|dossier|draft|equations?|error log|essay|evaluation|evidence|examination|executable|experiment|figures?|files?|fixtures?|gallery|graphs?|guide|harness|implementation|index|inventory|lab notebook|ledger|library|logs?|manifest|map|matrix|measurements?|memo|metrics?|model|module|notebook|owners?|packet|patch(?: series)?|paths?|plan|plots?|policy|portfolio|presentation|procedure|profile|program|proofs?|proposal|protocol|prototype|queries|reasoning|recording|records?|release|report|repository|responses?|results?|review|rubric|rules?|runbook|scenarios?|schema|scenes?|sets?|sheets?|simulation|snapshot|solver|source|specification|spreadsheet|state machine|streams?|study|suite|table|taxonomy|test suite|tests?|timeline|tool|traces?|transcript|trees?|values?|verification|visualization|worksheet|write-up|(?:written )?solutions?)\b/i;

function urlsInLocator(locator: string) {
  return (locator.match(HTTP_URL) ?? []).map((candidate) =>
    candidate.replace(/[.,;:]$/u, ""),
  );
}

function absoluteDetailedUrl(locator: string) {
  const urls = urlsInLocator(locator);
  return urls.some((candidate) => {
    try {
      const url = new URL(candidate);
      return Boolean(
        url.hash ||
          url.search ||
          (url.pathname !== "/" && url.pathname.replace(/^\/+|\/+$/g, "").length > 0),
      );
    } catch {
      return false;
    }
  });
}

export function isExactResourceLocation(locator: string) {
  const normalized = locator.trim();
  return (
    normalized.length >= 12 &&
    !VAGUE_LOCATION.test(normalized) &&
    (EXACT_LOCATION.test(normalized) ||
      NAMED_EXACT_LOCATION.test(normalized) ||
      absoluteDetailedUrl(normalized))
  );
}

export function containsAssessableOutput(value: string) {
  return value.trim().length >= 24 && CONCRETE_OUTPUT.test(value);
}

export function containsConcreteInstruction(value: string) {
  return (
    value.trim().length >= 60 &&
    ACTION_VERB.test(value) &&
    !VAGUE_INSTRUCTION.test(value) &&
    !UNRESOLVED_PROMPT_DEPENDENCY.test(value)
  );
}

function replaceLiteral(value: string, literal: string) {
  const trimmed = literal.trim().toLowerCase();
  if (trimmed.length < 4) return value;
  return value.split(trimmed).join(" [subject] ");
}

function templateFingerprint(value: string, dynamicText: readonly string[]) {
  let normalized = value
    .toLowerCase()
    .replace(/https?:\/\/[^\s)\]}>]+/g, " [url] ")
    .replace(/\b[a-z]{2,8}_[a-z0-9_-]{8,}\b/g, " [id] ")
    .replace(/[`“”\"][^`“”\"]+[`“”\"]/g, " [detail] ");
  for (const dynamic of dynamicText) normalized = replaceLiteral(normalized, dynamic);
  return normalized
    .replace(/\b\d+(?:\.\d+)*(?:%|h|hr|hrs|hours?)?\b/g, " [number] ")
    .replace(/[^a-z\[\] ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function reportRepeatedTemplates(
  samples: readonly TextSample[],
  add: AddIssue,
  threshold = 3,
) {
  const byFingerprint = new Map<string, TextSample[]>();
  for (const sample of samples) {
    const fingerprint = templateFingerprint(sample.value, sample.dynamicText);
    if (fingerprint.split(" ").length < 8) continue;
    byFingerprint.set(fingerprint, [
      ...(byFingerprint.get(fingerprint) ?? []),
      sample,
    ]);
  }
  for (const repeated of byFingerprint.values()) {
    if (repeated.length < threshold) continue;
    add(
      "repeated_instruction_template",
      repeated[threshold - 1].path,
      `The same normalized instructional template appears ${repeated.length} times. Replace topic-swapped boilerplate with assignment-specific directions and outputs.`,
    );
  }
}

function ageInDays(publicationDate: string, observationDate: string) {
  const publication = Date.parse(publicationDate);
  const observation = Date.parse(observationDate);
  if (!Number.isFinite(publication) || !Number.isFinite(observation)) {
    return Number.POSITIVE_INFINITY;
  }
  return (publication - observation) / DAY_IN_MS;
}

function isCurrentAtPublication(
  publicationDate: string,
  observationDate: string | undefined,
  maximumAgeDays: number,
) {
  if (!observationDate) return false;
  const age = ageInDays(publicationDate, observationDate);
  return age >= -1 && age <= maximumAgeDays;
}

function weeklyAssignmentsForCourse(
  units: readonly LearningUnit[],
): readonly WeeklyAssignment[] {
  return units.flatMap((unit) => unit.weeklyAssignments ?? []);
}

function validateWeeklyPlan(
  publicationDate: string,
  course: PublishedCourseVersion,
  courseIndex: number,
  units: readonly QualityUnit[],
  add: AddIssue,
  activitySamples: TextSample[],
  evidenceSamples: TextSample[],
) {
  const coursePath = `courseVersions[${courseIndex}]`;
  const unitHours = units.reduce((total, unit) => total + unit.nominalHours, 0);
  if (Math.abs(unitHours - course.nominalHours) > HOUR_TOLERANCE) {
    add(
      "invalid_workload",
      `${coursePath}.nominalHours`,
      `Course hours (${course.nominalHours}) must equal the ${unitHours} hours scheduled in its learning units.`,
    );
  }

  const weeks = weeklyAssignmentsForCourse(units);
  if (weeks.length !== EXPECTED_WEEKS.length) {
    add(
      "missing_weekly_assignment",
      `${coursePath}.rootUnitIds`,
      `Runnable courses need exactly 16 explicit weekly assignments; received ${weeks.length}.`,
    );
  }

  const weekCounts = new Map<number, number>();
  for (const assignment of weeks) {
    weekCounts.set(assignment.week, (weekCounts.get(assignment.week) ?? 0) + 1);
  }
  const missingWeeks = EXPECTED_WEEKS.filter(
    (week) => weekCounts.get(week) !== 1,
  );
  const unexpectedWeeks = [...weekCounts].filter(
    ([week, count]) => !EXPECTED_WEEKS.includes(week) || count !== 1,
  );
  if (missingWeeks.length > 0 || unexpectedWeeks.length > 0) {
    add(
      "missing_weekly_assignment",
      `${coursePath}.rootUnitIds`,
      `Weekly assignments must cover weeks 1–16 exactly once. Missing or duplicated weeks: ${[
        ...missingWeeks,
        ...unexpectedWeeks.map(([week]) => week),
      ]
        .filter((week, index, values) => values.indexOf(week) === index)
        .join(", ")}.`,
    );
  }

  units.forEach((unit) => {
    const unitIndex = unit.__qualityIndex;
    const unitPath = `learningUnits[${unitIndex}]`;
    const dynamicText = [course.title, unit.label, unit.title, unit.topic];

    if (!isExactResourceLocation(unit.resourceLocator ?? "")) {
      add(
        "vague_resource_location",
        `${unitPath}.resourceLocator`,
        "Runnable units need a numbered lecture, chapter, section, problem set, timestamp, or a deep/anchored URL—not a topic-level pointer.",
      );
    }
    if (unit.resourceVersionIds.length === 0) {
      add(
        "unverified_resource",
        `${unitPath}.resourceVersionIds`,
        "Every runnable unit must pin at least one resource version.",
      );
    }
    if (!containsConcreteInstruction(unit.activity)) {
      add(
        "missing_assessable_output",
        `${unitPath}.activity`,
        "Unit work must give concrete, course-specific instructions with an observable action.",
      );
    }
    if (!containsAssessableOutput(unit.evidence)) {
      add(
        "missing_assessable_output",
        `${unitPath}.evidence`,
        "Unit evidence must name a concrete artifact another person can inspect.",
      );
    }
    activitySamples.push({
      path: `${unitPath}.activity`,
      value: unit.activity,
      dynamicText,
    });
    evidenceSamples.push({
      path: `${unitPath}.evidence`,
      value: unit.evidence,
      dynamicText,
    });

    const assignments = unit.weeklyAssignments ?? [];
    if (assignments.length === 0) {
      add(
        "missing_weekly_assignment",
        `${unitPath}.weeklyAssignments`,
        "Every runnable unit must state the week-sized assignments it contains.",
      );
    }
    if (units.length === 8 && assignments.length !== 2) {
      add(
        "missing_weekly_assignment",
        `${unitPath}.weeklyAssignments`,
        `An eight-block course needs exactly two weekly assignments per block; received ${assignments.length}.`,
      );
    }
    const weeklyHours = assignments.reduce(
      (total, assignment) => total + assignment.estimatedHours,
      0,
    );
    if (Math.abs(weeklyHours - unit.nominalHours) > HOUR_TOLERANCE) {
      add(
        "invalid_workload",
        `${unitPath}.weeklyAssignments`,
        `Weekly assignment hours (${weeklyHours}) must equal the parent unit's ${unit.nominalHours} hours.`,
      );
    }
    assignments.forEach((assignment, assignmentIndex) => {
      const assignmentPath = `${unitPath}.weeklyAssignments[${assignmentIndex}]`;
      const assignmentDynamicText = [
        ...dynamicText,
        assignment.title,
        assignment.resourceLocator,
      ];
      if (
        !Number.isInteger(assignment.week) ||
        assignment.week < 1 ||
        assignment.week > 16
      ) {
        add(
          "missing_weekly_assignment",
          `${assignmentPath}.week`,
          "Week must be an integer from 1 through 16.",
        );
      }
      if (assignment.title.trim().length < 12) {
        add(
          "missing_weekly_assignment",
          `${assignmentPath}.title`,
          "Weekly assignments need a descriptive title.",
        );
      }
      if (!isExactResourceLocation(assignment.resourceLocator)) {
        add(
          "vague_resource_location",
          `${assignmentPath}.resourceLocator`,
          "Give the exact lecture, chapter, section, problem set, timestamp, or deep/anchored URL for this week.",
        );
      }
      const locatorUrls = urlsInLocator(assignment.resourceLocator);
      const sourceEvidence = assignment.sourceEvidence;
      if (
        locatorUrls.length !== 1 ||
        !sourceEvidence ||
        sourceEvidence.url !== locatorUrls[0]
      ) {
        add(
          "unverified_resource",
          `${assignmentPath}.sourceEvidence.url`,
          "Each weekly assignment needs one source URL, and its evidence URL must exactly match the URL embedded in resourceLocator.",
        );
      } else {
        let sourceUrlIsHttps = false;
        let resolvedUrlIsHttps = false;
        let licenseUrlIsHttps = sourceEvidence.licenseUrl === undefined;
        try {
          sourceUrlIsHttps = new URL(sourceEvidence.url).protocol === "https:";
          resolvedUrlIsHttps =
            new URL(sourceEvidence.resolvedUrl).protocol === "https:";
          if (sourceEvidence.licenseUrl) {
            licenseUrlIsHttps =
              new URL(sourceEvidence.licenseUrl).protocol === "https:";
          }
        } catch {
          // The checks below report the malformed evidence as one source issue.
        }
        if (
          !sourceUrlIsHttps ||
          (sourceEvidence.accessType !== "free" &&
            sourceEvidence.accessType !== "free audit") ||
          sourceEvidence.accessNote.trim().length < 60
        ) {
          add(
            "unverified_resource",
            `${assignmentPath}.sourceEvidence.accessType`,
            "Weekly source evidence must name the exact HTTPS URL, confirm free access, and explain the dated access basis in a meaningful note.",
          );
        }
        if (
          sourceEvidence.rightsStatus === "unknown" ||
          sourceEvidence.rightsNote.trim().length < 60 ||
          (sourceEvidence.rightsStatus === "open" &&
            (!sourceEvidence.licenseIdentifier ||
              !sourceEvidence.licenseUrl ||
              !licenseUrlIsHttps))
        ) {
          add(
            "unverified_resource",
            `${assignmentPath}.sourceEvidence.rightsStatus`,
            "Weekly source rights must be non-unknown and explain the reuse basis; an open claim also requires an HTTPS license URL and identifier. Use link-only when no open license was verified.",
          );
        }
        if (
          (sourceEvidence.freshnessStatus !== "healthy" &&
            sourceEvidence.freshnessStatus !== "redirected") ||
          !resolvedUrlIsHttps ||
          (sourceEvidence.httpStatus === undefined
            ? sourceEvidence.checkMethod !== "manual-browser"
            : sourceEvidence.httpStatus < 200 ||
              sourceEvidence.httpStatus >= 400) ||
          !isCurrentAtPublication(
            publicationDate,
            sourceEvidence.checkedAt,
            MAX_FRESHNESS_AGE_DAYS,
          ) ||
          !WEEKLY_SOURCE_METHODS.has(sourceEvidence.checkMethod) ||
          sourceEvidence.freshnessNote.trim().length < 60
        ) {
          add(
            "unverified_resource",
            `${assignmentPath}.sourceEvidence.freshnessStatus`,
            "Weekly source evidence needs a recent healthy reachability result, resolved HTTPS URL, named check method, and meaningful freshness note; automated checks must record a 2xx–3xx status.",
          );
        }
      }
      if (!containsConcreteInstruction(assignment.activity)) {
        add(
          "missing_assessable_output",
          `${assignmentPath}.activity`,
          "Weekly work must state a concrete action, method, and constraint—not a generic study prompt.",
        );
      }
      if (!containsAssessableOutput(assignment.deliverable)) {
        add(
          "missing_assessable_output",
          `${assignmentPath}.deliverable`,
          "Name the inspectable file, proof, code, report, test, presentation, or other output due this week.",
        );
      }
      if (
        !Number.isFinite(assignment.estimatedHours) ||
        assignment.estimatedHours <= 0 ||
        assignment.estimatedHours > 40
      ) {
        add(
          "invalid_workload",
          `${assignmentPath}.estimatedHours`,
          "Weekly assignment hours must be greater than zero and no more than 40.",
        );
      }
      activitySamples.push({
        path: `${assignmentPath}.activity`,
        value: assignment.activity,
        dynamicText: assignmentDynamicText,
      });
      evidenceSamples.push({
        path: `${assignmentPath}.deliverable`,
        value: assignment.deliverable,
        dynamicText: assignmentDynamicText,
      });
    });
  });
}

function validateAssessments(
  bundle: PublishedProgramBundle,
  course: PublishedCourseVersion,
  courseIndex: number,
  units: readonly QualityUnit[],
  add: AddIssue,
  assessmentSamples: TextSample[],
  rubricSamples: TextSample[],
) {
  const coursePath = `courseVersions[${courseIndex}]`;
  const assessmentById = new Map(
    bundle.assessmentVersions.map((assessment, index) => [
      assessment.id,
      { assessment, index },
    ]),
  );
  const assessmentEntityById = new Map(
    bundle.assessments.map((assessment) => [assessment.id, assessment]),
  );
  const graded = course.gradingPolicy.contributions.flatMap((contribution) => {
    const found = assessmentById.get(contribution.assessmentVersionId);
    return found ? [{ ...found, contribution }] : [];
  });

  if (graded.length < 2) {
    add(
      "missing_assessable_output",
      `${coursePath}.gradingPolicy.contributions`,
      "Runnable courses need at least a midpoint assessment and a cumulative final assessment.",
    );
  }
  for (const stage of ["midterm", "final"] as const) {
    if (!graded.some(({ assessment }) => assessment.stage === stage)) {
      add(
        "missing_assessable_output",
        `${coursePath}.gradingPolicy.contributions`,
        `Runnable courses need one explicitly staged ${stage} assessment.`,
      );
    }
  }

  if (
    ["laboratory", "studio", "capstone"].includes(course.format) &&
    !graded.some(({ assessment }) => {
      const kind = assessmentEntityById.get(assessment.assessmentId)?.kind;
      return kind === "lab" || kind === "project" || kind === "portfolio";
    })
  ) {
    add(
      "missing_assessable_output",
      `${coursePath}.gradingPolicy.contributions`,
      `${course.format} courses need a graded lab, project, or portfolio output.`,
    );
  }

  for (const { assessment, index, contribution } of graded) {
    const path = `assessmentVersions[${index}]`;
    const unit = assessment.unitId
      ? units.find((candidate) => candidate.id === assessment.unitId)
      : undefined;
    if (!contribution.requiredToPass) {
      add(
        "missing_assessable_output",
        `${coursePath}.gradingPolicy.contributions`,
        "Midterm and final assessments must be explicitly required to pass.",
      );
    }
    if (assessment.stage === "midterm" && !unit?.weeklyAssignments?.some((week) => week.week === 8)) {
      add(
        "missing_assessable_output",
        `${path}.unitId`,
        "The midterm must be attached to the unit containing week 8.",
      );
    }
    if (assessment.stage === "final" && !unit?.weeklyAssignments?.some((week) => week.week === 16)) {
      add(
        "missing_assessable_output",
        `${path}.unitId`,
        "The final must be attached to the unit containing week 16.",
      );
    }
    const assessmentWeek =
      assessment.stage === "midterm"
        ? unit?.weeklyAssignments?.find((week) => week.week === 8)
        : assessment.stage === "final"
          ? unit?.weeklyAssignments?.find((week) => week.week === 16)
          : undefined;
    if (
      assessmentWeek &&
      (assessmentWeek.activity !== assessment.instructions ||
        assessmentWeek.deliverable !== assessment.submissionEvidence.join("; ") ||
        Math.abs(assessmentWeek.estimatedHours - assessment.estimatedHours) >
          SCORE_TOLERANCE)
    ) {
      add(
        "invalid_workload",
        `${path}.estimatedHours`,
        "The published midterm/final must be the dated week-8/week-16 assignment, with identical instructions, evidence, and hours, rather than extra or replacement work.",
      );
    }
    if (
      assessment.instructions.trim().length < 120 ||
      !ACTION_VERB.test(assessment.instructions) ||
      VAGUE_INSTRUCTION.test(assessment.instructions) ||
      UNRESOLVED_PROMPT_DEPENDENCY.test(assessment.instructions)
    ) {
      add(
        "missing_assessable_output",
        `${path}.instructions`,
        "Assessment specifications must state the exact task, constraints, evidence, and evaluation procedure.",
      );
    }
    if (
      assessment.submissionEvidence.length < 2 ||
      assessment.submissionEvidence.some((item) => !containsAssessableOutput(item))
    ) {
      add(
        "missing_assessable_output",
        `${path}.submissionEvidence`,
        "Assessments need at least two concrete, inspectable submission outputs.",
      );
    }
    if (assessment.estimatedHours <= 0) {
      add(
        "invalid_workload",
        `${path}.estimatedHours`,
        "Assessment hours must be greater than zero.",
      );
    }
    if (unit && assessment.estimatedHours > unit.nominalHours) {
      add(
        "invalid_workload",
        `${path}.estimatedHours`,
        "Assessment hours must fit within the schedulable learning unit to which it is attached.",
      );
    }
    if (assessment.resourceVersionIds.length === 0) {
      add(
        "unverified_resource",
        `${path}.resourceVersionIds`,
        "Assessments must pin the resources needed to complete them.",
      );
    }

    const rubric = assessment.rubric ?? [];
    if (rubric.length < 3) {
      add(
        "missing_rubric",
        `${path}.rubric`,
        "Assessments need at least three observable rubric criteria.",
      );
    }
    const rubricPoints = rubric.reduce((total, criterion) => total + criterion.points, 0);
    if (
      rubric.some(
        (criterion) =>
          criterion.criterion.trim().length < 4 ||
          criterion.description.trim().length < 120 ||
          !criterion.description
            .toLowerCase()
            .includes(criterion.criterion.trim().toLowerCase()) ||
          !assessment.submissionEvidence.some((evidence) =>
            criterion.description.includes(evidence),
          ) ||
          !criterion.description.includes(`Award ${criterion.points}`) ||
          !/\baward\s+0\b/i.test(criterion.description) ||
          GENERIC_RUBRIC_SCAFFOLD.test(criterion.description) ||
          !Number.isFinite(criterion.points) ||
          criterion.points <= 0,
      ) ||
      Math.abs(rubricPoints - assessment.maximumScore) > SCORE_TOLERANCE
    ) {
      add(
        "missing_rubric",
        `${path}.rubric`,
        `Rubric criteria need assessment-specific evidence anchors, observable full/zero score conditions, positive points, and must total ${assessment.maximumScore}.`,
      );
    }
    if (
      assessment.passingScore === undefined ||
      assessment.passingScore <= 0 ||
      assessment.passingScore > assessment.maximumScore
    ) {
      add(
        "missing_rubric",
        `${path}.passingScore`,
        "Set an explicit positive passing score no greater than the assessment maximum.",
      );
    }
    assessmentSamples.push({
      path: `${path}.instructions`,
      value: assessment.instructions,
      dynamicText: [course.title, ...units.flatMap((unit) => [unit.title, unit.topic])],
    });
    rubric.forEach((criterion, criterionIndex) =>
      rubricSamples.push({
        path: `${path}.rubric[${criterionIndex}].description`,
        value: `${criterion.criterion}: ${criterion.description}`,
        dynamicText: [
          course.title,
          assessment.title,
          criterion.criterion,
          ...assessment.submissionEvidence,
        ],
      }),
    );
  }
}

function validateResourceFacts(
  bundle: PublishedProgramBundle,
  resourceVersionIds: ReadonlySet<ResourceVersionId>,
  add: AddIssue,
) {
  const publicationDate = bundle.publishedAt;
  for (const resourceVersionId of resourceVersionIds) {
    const resourceIndex = bundle.resourceVersions.findIndex(
      (resource) => resource.id === resourceVersionId,
    );
    const path =
      resourceIndex >= 0
        ? `resourceVersions[${resourceIndex}]`
        : `resourceVersions.${resourceVersionId}`;
    const freeAccess = bundle.accessOffers.find(
      (offer) =>
        offer.resourceVersionId === resourceVersionId &&
        (offer.type === "free" || offer.type === "free audit") &&
        (!offer.price || offer.price.amount === 0),
    );
    if (
      !freeAccess ||
      !isCurrentAtPublication(
        publicationDate,
        freeAccess.checkedAt,
        MAX_ACCESS_AGE_DAYS,
      )
    ) {
      add(
        "unverified_resource",
        path,
        "Every teaching resource needs a free or free-audit access record checked within 180 days of publication.",
      );
    }

    const rights = bundle.rights.find(
      (record) =>
        record.resourceVersionId === resourceVersionId &&
        record.status !== "unknown" &&
        isCurrentAtPublication(
          publicationDate,
          record.verifiedAt,
          MAX_RIGHTS_AGE_DAYS,
        ) &&
        (record.status === "open"
          ? Boolean(record.licenseIdentifier || record.licenseUrl)
          : Boolean(
              record.copyrightHolder ||
                (record.note && record.note.trim().length >= 20),
            )),
    );
    if (
      !rights
    ) {
      add(
        "unverified_resource",
        path,
        "Record a verified license or link-only/reuse determination, including its basis, within one year of publication.",
      );
    }

    const freshness = bundle.freshness.find((record) => {
      if (resourceVersionId !== record.resourceVersionId) return false;
      if (record.status !== "healthy" && record.status !== "redirected") {
        return false;
      }
      if (
        !isCurrentAtPublication(
          publicationDate,
          record.checkedAt,
          MAX_FRESHNESS_AGE_DAYS,
        ) ||
        record.httpStatus === undefined ||
        record.httpStatus < 200 ||
        record.httpStatus >= 400 ||
        !record.resolvedUrl
      ) {
        return false;
      }
      try {
        new URL(record.resolvedUrl);
        return true;
      } catch {
        return false;
      }
    });
    if (
      !freshness
    ) {
      add(
        "unverified_resource",
        path,
        "Resource freshness needs a healthy/redirected 2xx–3xx observation and resolved URL from the last 180 days.",
      );
    }

    const currentEvidence = bundle.provenance.filter((evidence) =>
      isCurrentAtPublication(
          publicationDate,
          evidence.retrievedAt,
          MAX_PROVENANCE_AGE_DAYS,
        ),
    );
    const resourceEvidence = currentEvidence.some((evidence) =>
      evidence.subjects.some(
        (subject) =>
          subject.kind === "resourceVersion" &&
          subject.id === resourceVersionId,
      ),
    );
    const accessEvidence = Boolean(
      freeAccess &&
        currentEvidence.some((evidence) =>
          evidence.subjects.some(
            (subject) =>
              subject.kind === "resourceAccess" &&
              subject.id === freeAccess.id,
          ),
        ),
    );
    const rightsEvidence = Boolean(
      rights &&
        currentEvidence.some((evidence) =>
          evidence.subjects.some(
            (subject) =>
              subject.kind === "resourceRights" && subject.id === rights.id,
          ),
        ),
    );
    if (!resourceEvidence || !accessEvidence || !rightsEvidence) {
      add(
        "unverified_resource",
        path,
        "Resource, access, and rights claims need dated provenance linked to those exact records from the last 180 days.",
      );
    }
  }
}

/**
 * Editorial validation for publications that explicitly promise a complete,
 * runnable course-by-course pathway. It deliberately does not apply to legacy
 * publications unless their immutable program version opts in.
 */
export function validateRunnableProgramBundle(
  bundle: PublishedProgramBundle,
): readonly InstructionalQualityIssue[] {
  if (bundle.programVersion.qualityStandard !== "runnable-pathway-v1") return [];

  const issues: InstructionalQualityIssue[] = [];
  const add: AddIssue = (code, path, message) =>
    issues.push({ code, path, message });
  const unitsByCourse = new Map<CourseVersionId, QualityUnit[]>();
  bundle.learningUnits.forEach((unit, index) => {
    const values = unitsByCourse.get(unit.courseVersionId) ?? [];
    values.push({ ...unit, __qualityIndex: index });
    unitsByCourse.set(unit.courseVersionId, values);
  });

  const allAssessmentSamples: TextSample[] = [];
  const allRubricSamples: TextSample[] = [];
  const allActivitySamples: TextSample[] = [];
  const allEvidenceSamples: TextSample[] = [];
  const referencedResources = new Set<ResourceVersionId>();
  bundle.courseVersions.forEach((course, courseIndex) => {
    const units = (unitsByCourse.get(course.id) ?? []).sort(
      (left, right) => left.order - right.order,
    );
    const activitySamples: TextSample[] = [];
    const evidenceSamples: TextSample[] = [];
    if (!course.resourceReferences.some((reference) => reference.role === "primary")) {
      add(
        "unverified_resource",
        `courseVersions[${courseIndex}].resourceReferences`,
        "Every runnable course needs a pinned primary teaching resource.",
      );
    }
    course.resourceReferences.forEach((reference) =>
      referencedResources.add(reference.resourceVersionId),
    );
    units.forEach((unit) =>
      unit.resourceVersionIds.forEach((id) => referencedResources.add(id)),
    );
    validateWeeklyPlan(
      bundle.publishedAt,
      course,
      courseIndex,
      units,
      add,
      activitySamples,
      evidenceSamples,
    );
    validateAssessments(
      bundle,
      course,
      courseIndex,
      units,
      add,
      allAssessmentSamples,
      allRubricSamples,
    );
    reportRepeatedTemplates(activitySamples, add);
    reportRepeatedTemplates(evidenceSamples, add);
    allActivitySamples.push(...activitySamples);
    allEvidenceSamples.push(...evidenceSamples);
  });
  bundle.assessmentVersions.forEach((assessment) =>
    assessment.resourceVersionIds.forEach((id) => referencedResources.add(id)),
  );
  reportRepeatedTemplates(allAssessmentSamples, add, 4);
  reportRepeatedTemplates(allRubricSamples, add, 8);
  reportRepeatedTemplates(allActivitySamples, add, 8);
  reportRepeatedTemplates(allEvidenceSamples, add, 8);
  validateResourceFacts(bundle, referencedResources, add);
  return issues;
}
