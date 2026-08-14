import assert from "node:assert/strict";
import test from "node:test";
import type {
  AssessmentVersionId,
  CourseVersionId,
  PublishedProgramBundle,
} from "../app/domain/catalog";
import { validatePublishedProgramBundle } from "../app/domain/validation";
import { computerScienceBundle } from "../content/programs/computer-science-v1-1";

const unitActions = [
  "Construct a trace matrix for the stated mechanism, test three boundary conditions, and annotate every state transition with the governing rule.",
  "Derive the governing invariant, prove why it is preserved, and test the derivation against a deliberately chosen counterexample.",
  "Implement the specified interface twice, benchmark both implementations on fixed inputs, and explain the measured tradeoff in a decision record.",
  "Design a failure-injection experiment, run it with a fixed seed, and document the smallest input that exposes each incorrect behavior.",
  "Build a reference model, compare its outputs with an independent implementation, and classify every disagreement before revising either artifact.",
  "Create a reproducible dataset of normal and adversarial cases, execute the stated method, and analyze sensitivity to one controlled variable.",
  "Write a formal specification, implement its critical operation, and test whether the implementation satisfies each stated precondition and postcondition.",
  "Integrate the prior results into a complete demonstration, record a timed run, and write a limitations report tied to observed evidence.",
] as const;

const unitEvidence = [
  "Submit the trace spreadsheet, annotated state diagram, and boundary-case test results.",
  "Submit the written proof, counterexample worksheet, and corrected derivation report.",
  "Submit both source-code implementations, the benchmark results, and the decision record.",
  "Submit the failure-injection test suite, minimized failing inputs, and debugging log.",
  "Submit the reference model, comparison test results, and discrepancy analysis report.",
  "Submit the reproducible dataset, experiment notebook, and sensitivity-analysis report.",
  "Submit the written specification, source code, and precondition/postcondition test suite.",
  "Submit the integrated repository, demonstration recording, and limitations report.",
] as const;

const weeklyActions = [
  "Write and test a minimal executable example, then explain every output using a hand-worked trace and two boundary cases.",
  "Solve three assigned problems independently, compare two solution methods, and document corrections in an error log.",
  "Implement a baseline model with a fixed interface, derive five normal and five boundary examples from the published specification, and record assumptions in a design memo.",
  "Construct an adversarial test suite, run it against the implementation, and minimize every input that reveals a defect.",
  "Derive the stated result step by step, verify it numerically, and write a proof that identifies every necessary assumption.",
  "Benchmark two competing implementations over five input sizes, plot the results, and explain departures from the predicted bound.",
  "Refactor the prior implementation around an explicit invariant, add regression tests, and justify each interface change.",
  "Complete the timed midpoint task, score it with the rubric, and submit corrected solutions for every lost point.",
  "Design a small empirical study with a fixed seed, preserve raw measurements, and analyze one plausible confounding variable.",
  "Build a second implementation from the written specification, compare outputs, and diagnose every mismatch with a reproducible trace.",
  "Create a threat or failure model, test the three highest-risk cases, and document one mitigation with residual limitations.",
  "Integrate two prior components behind a documented interface, run end-to-end tests, and measure one reliability or performance property.",
  "Review a deliberately flawed solution, identify each violated requirement, and produce a corrected implementation with regression tests.",
  "Prepare a reproducible demonstration, ask a reviewer to follow the instructions, and revise every step that cannot be independently repeated.",
  "Run a complete practice assessment under the stated time limit, grade it criterion by criterion, and correct all weak responses.",
  "Deliver and record the cumulative system or analysis, defend three design decisions, and write a final evidence-to-claim audit.",
] as const;

const weeklyDeliverables = [
  "Source-code file, hand-worked trace, and boundary-case test report.",
  "Written solutions, method-comparison memo, and corrected error log.",
  "Baseline implementation repository, validation tests, and design memo.",
  "Adversarial test suite, minimized failure traces, and debugging report.",
  "Written derivation, numerical-check notebook, and assumption-indexed proof.",
  "Benchmark source code, measurement dataset, plots, and performance analysis.",
  "Refactored source files, regression test suite, and interface decision record.",
  "Scored midpoint submission, completed rubric, and corrected solution report.",
  "Experiment notebook, raw dataset, fixed-seed script, and confound analysis.",
  "Independent implementation, comparison test results, and mismatch diagnosis.",
  "Failure-model diagram, risk test results, and mitigation limitations memo.",
  "Integrated repository, end-to-end test suite, and measurement report.",
  "Review worksheet, corrected implementation, and regression test results.",
  "Demonstration recording, reproducibility transcript, and revision log.",
  "Timed practice submission, criterion score sheet, and correction portfolio.",
  "Tagged final repository, defense recording, and evidence-audit report.",
] as const;

function makeRunnableBundle(): PublishedProgramBundle {
  const source = structuredClone(computerScienceBundle);
  const courseByVersionId = new Map(
    source.courseVersions.map((course) => [course.id, course]),
  );
  const courseEntityById = new Map(
    source.courses.map((course) => [course.id, course]),
  );
  const assessmentPosition = new Map<
    AssessmentVersionId,
    { stage: "midterm" | "final"; courseVersionId: CourseVersionId }
  >();
  source.courseVersions.forEach((course) => {
    course.gradingPolicy.contributions.forEach((contribution, index) =>
      assessmentPosition.set(contribution.assessmentVersionId, {
        stage: index === 0 ? "midterm" : "final",
        courseVersionId: course.id,
      }),
    );
  });

  const bundle = {
    ...source,
    programVersion: {
      ...source.programVersion,
      qualityStandard: "runnable-pathway-v1",
    },
    learningUnits: source.learningUnits.map((unit) => {
      const course = courseByVersionId.get(unit.courseVersionId);
      assert.ok(course);
      const courseEntity = courseEntityById.get(course.courseId);
      assert.ok(courseEntity);
      const unitPosition = unit.order - 1;
      const firstWeek = unitPosition * 2 + 1;
      const firstHours = unit.nominalHours / 2;
      return {
        ...unit,
        resourceLocator: `Lecture ${unit.order}, Section ${unit.order}.1, and Problem Set ${unit.order}: ${unit.title}`,
        activity: `${unitActions[unitPosition]} Apply it specifically to ${unit.topic} in ${courseEntity.canonicalSlug}.`,
        evidence: `${unitEvidence[unitPosition]} Label the work ${unit.title} for ${courseEntity.canonicalSlug}.`,
        weeklyAssignments: [firstWeek, firstWeek + 1].map((week, offset) => {
          const url = `https://quality.example.edu/${courseEntity.canonicalSlug}/week-${week}`;
          return {
            week,
            title: `Week ${week}: ${unit.title} ${offset === 0 ? "foundations" : "application"}`,
            resourceLocator: `Lecture ${week}, Section ${week}.1, and Problem Set ${week} — ${url}`,
            sourceEvidence: {
              url,
              accessType: "free" as const,
              accessNote:
                "The exact fixture location is available without payment for the dated runnable-publication access review.",
              rightsStatus: "link only" as const,
              rightsNote:
                "The fixture records permission to link only and does not claim permission to mirror, adapt, or redistribute provider material.",
              freshnessStatus: "healthy" as const,
              resolvedUrl: url,
              httpStatus: 200,
              checkedAt: source.publishedAt,
              checkMethod: "automated-http-and-editorial-review" as const,
              freshnessNote:
                "The exact fixture URL received a successful HTTP response and was reviewed editorially on the publication date.",
            },
            activity: `${weeklyActions[week - 1]} Use ${unit.topic} as the subject of the work in ${courseEntity.canonicalSlug}.`,
            deliverable: `${weeklyDeliverables[week - 1]} Identify it as week ${week} of ${courseEntity.canonicalSlug}.`,
            estimatedHours:
              offset === 0 ? firstHours : unit.nominalHours - firstHours,
          };
        }),
      };
    }),
    assessmentVersions: source.assessmentVersions.map((assessment) => {
      const position = assessmentPosition.get(assessment.id);
      assert.ok(position);
      const courseVersion = courseByVersionId.get(position.courseVersionId);
      assert.ok(courseVersion);
      const course = courseEntityById.get(courseVersion.courseId);
      assert.ok(course);
      const assessmentUnit = source.learningUnits.find(
        (unit) => unit.id === assessment.unitId,
      );
      assert.ok(assessmentUnit);
      const maximum = assessment.maximumScore;
      const correctnessPoints = maximum * 0.4;
      const evidencePoints = maximum * 0.3;
      const submissionEvidence = [
        `Tagged ${course.canonicalSlug} ${position.stage} source-code repository with a reproducible test suite and execution instructions.`,
        `${course.canonicalSlug} ${position.stage} analysis report containing measured results, design decisions, limitations, and corrections.`,
      ] as const;
      return {
        ...assessment,
        stage: position.stage,
        instructions: `For ${course.canonicalSlug}, ${position.stage === "midterm" ? "build and test the specified midpoint artifact under the published constraints" : "integrate and defend the cumulative final artifact under the published constraints"}. Submit a reproducible repository, execute the required normal and adversarial tests, connect each conclusion to recorded evidence, score the work criterion by criterion, and correct every result below the passing standard.`,
        submissionEvidence,
        estimatedHours: assessmentUnit.nominalHours / 2,
        passingScore: maximum * 0.7,
        rubric: [
          {
            criterion: "Technical correctness",
            description: `Technical correctness for ${course.canonicalSlug} is scored from “${submissionEvidence[0]}”. Award ${correctnessPoints} when every required behavior passes reproducible normal, boundary, and failure checks; award ${correctnessPoints / 2} when the main path works but one required boundary lacks evidence; award 0 when a required result is absent or contradicted by a retained failing test.`,
            points: correctnessPoints,
          },
          {
            criterion: "Evidence quality",
            description: `Evidence quality for ${course.canonicalSlug} is scored from “${submissionEvidence[1]}”. Award ${evidencePoints} when commands, versions, inputs, raw results, and corrections reproduce every claim; award ${evidencePoints / 2} when the central result repeats but one control or raw measurement is missing; award 0 when the claimed result cannot be rerun from the retained material.`,
            points: evidencePoints,
          },
          {
            criterion: "Communication and limits",
            description: `Communication and limits for ${course.canonicalSlug} is scored from “${submissionEvidence[1]}”. Award ${maximum - correctnessPoints - evidencePoints} when the report connects each claim to evidence and states assumptions, limitations, and corrections precisely; award ${(maximum - correctnessPoints - evidencePoints) / 2} when the work is understandable but one material limit or procedure is unclear; award 0 when an independent reviewer cannot follow the central claim or procedure.`,
            points: maximum - correctnessPoints - evidencePoints,
          },
        ],
      };
    }),
    accessOffers: source.accessOffers.map((offer) => ({
      ...offer,
      type: "free",
      price: undefined,
      checkedAt: source.publishedAt,
    })),
    rights: source.rights.map((record) => ({
      ...record,
      status: record.status === "unknown" ? "link only" : record.status,
      verifiedAt: source.publishedAt,
      copyrightHolder:
        record.copyrightHolder ?? "The named resource provider and authors",
      note:
        record.note ??
        "Course Atlas may link to this resource but does not assume permission to mirror or adapt it.",
    })),
    freshness: source.freshness.map((record) => ({
      ...record,
      status: "healthy",
      checkedAt: source.publishedAt,
      httpStatus: 200,
      resolvedUrl:
        record.resolvedUrl ??
        source.resourceVersions.find(
          (resource) => resource.id === record.resourceVersionId,
        )?.canonicalUrl,
    })),
    provenance: source.provenance.map((evidence) => ({
      ...evidence,
      retrievedAt: source.publishedAt,
    })),
  } satisfies PublishedProgramBundle;
  const assessmentByUnitId = new Map(
    bundle.assessmentVersions.flatMap((assessment) =>
      assessment.unitId ? [[assessment.unitId, assessment] as const] : [],
    ),
  );
  return {
    ...bundle,
    learningUnits: bundle.learningUnits.map((unit) => {
      const assessment = assessmentByUnitId.get(unit.id);
      if (!assessment?.stage) return unit;
      const assessmentWeek = assessment.stage === "midterm" ? 8 : 16;
      return {
        ...unit,
        weeklyAssignments: unit.weeklyAssignments?.map((assignment) =>
          assignment.week === assessmentWeek
            ? {
                ...assignment,
                activity: assessment.instructions,
                deliverable: assessment.submissionEvidence.join("; "),
                estimatedHours: assessment.estimatedHours,
              }
            : assignment,
        ),
      };
    }),
  } satisfies PublishedProgramBundle;
}

function issueCodes(bundle: PublishedProgramBundle) {
  return new Set(
    validatePublishedProgramBundle(bundle).issues.map((issue) => issue.code),
  );
}

test("legacy publications do not silently acquire the runnable-pathway editorial contract", () => {
  assert.equal(computerScienceBundle.programVersion.qualityStandard, undefined);
  assert.equal(validatePublishedProgramBundle(computerScienceBundle).valid, true);
});

test("a complete sixteen-week course plan satisfies runnable-pathway-v1", () => {
  const result = validatePublishedProgramBundle(makeRunnableBundle());
  assert.deepEqual(result.issues, []);
});

test("runnable validation rejects a vague fallback resource location", () => {
  const bundle = makeRunnableBundle();
  const firstUnit = bundle.learningUnits[0];
  const broken = {
    ...bundle,
    learningUnits: bundle.learningUnits.map((unit) =>
      unit.id === firstUnit.id
        ? {
            ...unit,
            resourceLocator: "Find the section in the primary resource covering this topic.",
          }
        : unit,
    ),
  } satisfies PublishedProgramBundle;
  const codes = issueCodes(broken);
  assert.equal(codes.has("vague_resource_location"), true);
});

test("runnable validation rejects a gap in the sixteen-week plan", () => {
  const bundle = makeRunnableBundle();
  const firstUnit = bundle.learningUnits[0];
  const broken = {
    ...bundle,
    learningUnits: bundle.learningUnits.map((unit) =>
      unit.id === firstUnit.id
        ? { ...unit, weeklyAssignments: unit.weeklyAssignments?.slice(1) }
        : unit,
    ),
  } satisfies PublishedProgramBundle;
  assert.equal(issueCodes(broken).has("missing_weekly_assignment"), true);
});

test("runnable validation rejects missing outputs, hours, rubrics, and passing criteria", () => {
  const bundle = makeRunnableBundle();
  const firstUnit = bundle.learningUnits[0];
  const firstAssessment = bundle.assessmentVersions[0];
  const broken = {
    ...bundle,
    learningUnits: bundle.learningUnits.map((unit) =>
      unit.id === firstUnit.id
        ? {
            ...unit,
            evidence: "Done.",
            weeklyAssignments: unit.weeklyAssignments?.map(
              (assignment, index) =>
                index === 0
                  ? { ...assignment, deliverable: "Do the work.", estimatedHours: 0 }
                  : assignment,
            ),
          }
        : unit,
    ),
    assessmentVersions: bundle.assessmentVersions.map((assessment) =>
      assessment.id === firstAssessment.id
        ? { ...assessment, rubric: [], passingScore: undefined }
        : assessment,
    ),
  } satisfies PublishedProgramBundle;
  const codes = issueCodes(broken);
  assert.equal(codes.has("missing_assessable_output"), true);
  assert.equal(codes.has("invalid_workload"), true);
  assert.equal(codes.has("missing_rubric"), true);
});

test("runnable validation rejects weekly work that depends on an absent prompt artifact", () => {
  const bundle = makeRunnableBundle();
  const firstUnit = bundle.learningUnits[0];
  const broken = {
    ...bundle,
    learningUnits: bundle.learningUnits.map((unit) =>
      unit.id === firstUnit.id
        ? {
            ...unit,
            weeklyAssignments: unit.weeklyAssignments?.map(
              (assignment, index) =>
                index === 0
                  ? {
                      ...assignment,
                      activity:
                        "Repair the supplied repository, execute its tests, document every defect, and preserve the unspecified public interface while producing a reproducible patch.",
                    }
                  : assignment,
            ),
          }
        : unit,
    ),
  } satisfies PublishedProgramBundle;
  assert.equal(issueCodes(broken).has("missing_assessable_output"), true);
});

test("runnable validation rejects assessments that depend on absent hidden inputs", () => {
  const bundle = makeRunnableBundle();
  const firstAssessment = bundle.assessmentVersions[0];
  const broken = {
    ...bundle,
    assessmentVersions: bundle.assessmentVersions.map((assessment) =>
      assessment.id === firstAssessment.id
        ? {
            ...assessment,
            instructions:
              "Execute the hidden workload against the implementation, explain every result, preserve all raw measurements, and defend the representation choice under the published time and evidence constraints.",
          }
        : assessment,
    ),
  } satisfies PublishedProgramBundle;
  assert.equal(issueCodes(broken).has("missing_assessable_output"), true);
});

test("runnable validation rejects a midterm or final double-booked outside its dated week", () => {
  const bundle = makeRunnableBundle();
  const assessment = bundle.assessmentVersions.find(
    (candidate) => candidate.stage === "midterm" && candidate.unitId,
  );
  assert.ok(assessment?.unitId);
  const broken = {
    ...bundle,
    learningUnits: bundle.learningUnits.map((unit) =>
      unit.id === assessment.unitId
        ? {
            ...unit,
            weeklyAssignments: unit.weeklyAssignments?.map((assignment) =>
              assignment.week === 8
                ? {
                    ...assignment,
                    activity:
                      "Complete a separate ten-hour project that is unrelated to the published midpoint assessment and submit its independent report.",
                  }
                : assignment,
            ),
          }
        : unit,
    ),
  } satisfies PublishedProgramBundle;
  assert.equal(issueCodes(broken).has("invalid_workload"), true);
});

test("runnable validation rejects a rubric whose points do not total the maximum score", () => {
  const bundle = makeRunnableBundle();
  const firstAssessment = bundle.assessmentVersions[0];
  const broken = {
    ...bundle,
    assessmentVersions: bundle.assessmentVersions.map((assessment) =>
      assessment.id === firstAssessment.id
        ? {
            ...assessment,
            rubric: assessment.rubric?.map((criterion, index) =>
              index === 0
                ? { ...criterion, points: criterion.points + 1 }
                : criterion,
            ),
          }
        : assessment,
    ),
  } satisfies PublishedProgramBundle;
  assert.equal(issueCodes(broken).has("missing_rubric"), true);
});

test("runnable validation rejects repeated generated instruction templates", () => {
  const bundle = makeRunnableBundle();
  const firstCourseId = bundle.courseVersions[0].id;
  let rewritten = 0;
  const broken = {
    ...bundle,
    learningUnits: bundle.learningUnits.map((unit) => {
      if (unit.courseVersionId !== firstCourseId || rewritten >= 3) return unit;
      rewritten += 1;
      return {
        ...unit,
        activity:
          "Build and test the subject implementation against three boundary cases, then document the measured result in a reproducible analysis report.",
      };
    }),
  } satisfies PublishedProgramBundle;
  assert.equal(
    issueCodes(broken).has("repeated_instruction_template"),
    true,
  );
});

test("runnable validation rejects a rubric description reused across courses", () => {
  const bundle = makeRunnableBundle();
  const repeatedAssessmentIds = new Set(
    bundle.assessmentVersions.slice(0, 8).map((assessment) => assessment.id),
  );
  const broken = {
    ...bundle,
    assessmentVersions: bundle.assessmentVersions.map((assessment) =>
      repeatedAssessmentIds.has(assessment.id)
        ? {
            ...assessment,
            rubric: assessment.rubric?.map((criterion, index) =>
              index === 0
                ? {
                    ...criterion,
                    description:
                      "The submitted solution satisfies every published requirement and the retained tests independently demonstrate the claimed behavior.",
                  }
                : criterion,
            ),
          }
        : assessment,
    ),
  } satisfies PublishedProgramBundle;
  assert.equal(
    issueCodes(broken).has("repeated_instruction_template"),
    true,
  );
});

test("runnable validation rejects topic-swapped rubric scaffolding without score anchors", () => {
  const bundle = makeRunnableBundle();
  const firstAssessment = bundle.assessmentVersions[0];
  const broken = {
    ...bundle,
    assessmentVersions: bundle.assessmentVersions.map((assessment) =>
      assessment.id === firstAssessment.id
        ? {
            ...assessment,
            rubric: assessment.rubric?.map((criterion, index) => ({
              ...criterion,
              description: `${assessment.title}: ${
                index % 2 === 0 ? "visibly establishes" : "trace"
              } ${criterion.criterion.toLowerCase()} to concrete results in “${
                assessment.submissionEvidence[
                  index % assessment.submissionEvidence.length
                ]
              }” under the assessment instructions, while recording mismatches and conclusions.`,
            })),
          }
        : assessment,
    ),
  } satisfies PublishedProgramBundle;
  assert.equal(issueCodes(broken).has("missing_rubric"), true);
});

test("runnable validation rejects a stale free-access observation", () => {
  const bundle = makeRunnableBundle();
  const resourceVersionId = bundle.resourceVersions[0].id;
  const broken = {
    ...bundle,
    accessOffers: bundle.accessOffers.map((offer) =>
      offer.resourceVersionId === resourceVersionId
        ? { ...offer, checkedAt: "2024-01-01T00:00:00Z" as const }
        : offer,
    ),
  } satisfies PublishedProgramBundle;
  assert.equal(issueCodes(broken).has("unverified_resource"), true);
});

test("runnable validation rejects an unverified rights determination", () => {
  const bundle = makeRunnableBundle();
  const resourceVersionId = bundle.resourceVersions[0].id;
  const broken = {
    ...bundle,
    rights: bundle.rights.map((record) =>
      record.resourceVersionId === resourceVersionId
        ? { ...record, status: "unknown" as const, verifiedAt: undefined }
        : record,
    ),
  } satisfies PublishedProgramBundle;
  assert.equal(issueCodes(broken).has("unverified_resource"), true);
});

test("runnable validation rejects an unreachable resource", () => {
  const bundle = makeRunnableBundle();
  const resourceVersionId = bundle.resourceVersions[0].id;
  const broken = {
    ...bundle,
    freshness: bundle.freshness.map((record) =>
      record.resourceVersionId === resourceVersionId
        ? { ...record, status: "broken" as const, httpStatus: 404 }
        : record,
    ),
  } satisfies PublishedProgramBundle;
  assert.equal(issueCodes(broken).has("unverified_resource"), true);
});

test("runnable validation requires weekly evidence to match the exact locator URL", () => {
  const bundle = makeRunnableBundle();
  const firstUnit = bundle.learningUnits[0];
  const broken = {
    ...bundle,
    learningUnits: bundle.learningUnits.map((unit) =>
      unit.id === firstUnit.id
        ? {
            ...unit,
            weeklyAssignments: unit.weeklyAssignments?.map(
              (assignment, index) =>
                index === 0
                  ? {
                      ...assignment,
                      sourceEvidence: {
                        ...assignment.sourceEvidence,
                        url: `${assignment.sourceEvidence.url}mismatch`,
                      },
                    }
                  : assignment,
            ),
          }
        : unit,
    ),
  } satisfies PublishedProgramBundle;
  assert.equal(issueCodes(broken).has("unverified_resource"), true);
});

test("runnable validation rejects weekly evidence without a meaningful free-access basis", () => {
  const bundle = makeRunnableBundle();
  const firstUnit = bundle.learningUnits[0];
  const broken = {
    ...bundle,
    learningUnits: bundle.learningUnits.map((unit) =>
      unit.id === firstUnit.id
        ? {
            ...unit,
            weeklyAssignments: unit.weeklyAssignments?.map(
              (assignment, index) =>
                index === 0
                  ? {
                      ...assignment,
                      sourceEvidence: {
                        ...assignment.sourceEvidence,
                        accessNote: "Free.",
                      },
                    }
                  : assignment,
            ),
          }
        : unit,
    ),
  } satisfies PublishedProgramBundle;
  assert.equal(issueCodes(broken).has("unverified_resource"), true);
});

test("runnable validation rejects a non-free weekly access claim at runtime", () => {
  const bundle = makeRunnableBundle();
  const firstUnit = bundle.learningUnits[0];
  const broken = {
    ...bundle,
    learningUnits: bundle.learningUnits.map((unit) =>
      unit.id === firstUnit.id
        ? {
            ...unit,
            weeklyAssignments: unit.weeklyAssignments?.map(
              (assignment, index) =>
                index === 0
                  ? {
                      ...assignment,
                      sourceEvidence: {
                        ...assignment.sourceEvidence,
                        // Simulate untyped JSON crossing the publication boundary.
                        accessType: "paid" as "free",
                      },
                    }
                  : assignment,
            ),
          }
        : unit,
    ),
  } satisfies PublishedProgramBundle;
  assert.equal(issueCodes(broken).has("unverified_resource"), true);
});

test("runnable validation rejects unknown per-week rights", () => {
  const bundle = makeRunnableBundle();
  const firstUnit = bundle.learningUnits[0];
  const broken = {
    ...bundle,
    learningUnits: bundle.learningUnits.map((unit) =>
      unit.id === firstUnit.id
        ? {
            ...unit,
            weeklyAssignments: unit.weeklyAssignments?.map(
              (assignment, index) =>
                index === 0
                  ? {
                      ...assignment,
                      sourceEvidence: {
                        ...assignment.sourceEvidence,
                        rightsStatus: "unknown" as const,
                      },
                    }
                  : assignment,
            ),
          }
        : unit,
    ),
  } satisfies PublishedProgramBundle;
  assert.equal(issueCodes(broken).has("unverified_resource"), true);
});

test("runnable validation rejects an open weekly rights claim without license evidence", () => {
  const bundle = makeRunnableBundle();
  const firstUnit = bundle.learningUnits[0];
  const broken = {
    ...bundle,
    learningUnits: bundle.learningUnits.map((unit) =>
      unit.id === firstUnit.id
        ? {
            ...unit,
            weeklyAssignments: unit.weeklyAssignments?.map(
              (assignment, index) =>
                index === 0
                  ? {
                      ...assignment,
                      sourceEvidence: {
                        ...assignment.sourceEvidence,
                        rightsStatus: "open" as const,
                        licenseIdentifier: undefined,
                        licenseUrl: undefined,
                      },
                    }
                  : assignment,
            ),
          }
        : unit,
    ),
  } satisfies PublishedProgramBundle;
  assert.equal(issueCodes(broken).has("unverified_resource"), true);
});

test("runnable validation rejects stale or unhealthy per-week freshness", () => {
  const bundle = makeRunnableBundle();
  const firstUnit = bundle.learningUnits[0];
  const broken = {
    ...bundle,
    learningUnits: bundle.learningUnits.map((unit) =>
      unit.id === firstUnit.id
        ? {
            ...unit,
            weeklyAssignments: unit.weeklyAssignments?.map(
              (assignment, index) =>
                index === 0
                  ? {
                      ...assignment,
                      sourceEvidence: {
                        ...assignment.sourceEvidence,
                        freshnessStatus: "broken" as const,
                        checkedAt: "2024-01-01T00:00:00Z" as const,
                      },
                    }
                  : assignment,
            ),
          }
        : unit,
    ),
  } satisfies PublishedProgramBundle;
  assert.equal(issueCodes(broken).has("unverified_resource"), true);
});
