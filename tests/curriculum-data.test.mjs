import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const projectRoot = new URL("../", import.meta.url);

async function loadTypeScriptModule(relativePath) {
  const source = await readFile(new URL(relativePath, projectRoot), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: relativePath,
  }).outputText;
  const commonJsModule = { exports: {} };
  const execute = new Function("exports", "module", "require", compiled);
  execute(commonJsModule.exports, commonJsModule, () => {
    throw new Error(`${relativePath} unexpectedly used a runtime import`);
  });
  return commonJsModule.exports;
}

const data = await loadTypeScriptModule("app/data.ts");
const plans = await loadTypeScriptModule("app/course-plans.ts");

test("publishes a three-year route with five or six courses each semester", () => {
  assert.equal(data.semesters.length, 6);
  assert.deepEqual(
    data.semesters.map((semester) => semester.year),
    [1, 1, 2, 2, 3, 3],
  );
  for (const semester of data.semesters) {
    assert.ok(
      semester.courseCodes.length >= 5 && semester.courseCodes.length <= 6,
      `Semester ${semester.number} has ${semester.courseCodes.length} courses`,
    );
  }

  const scheduledCodes = data.semesters.flatMap((semester) => semester.courseCodes);
  assert.equal(new Set(scheduledCodes).size, 31);
  assert.deepEqual(
    new Set(data.courses.map((course) => course.code)),
    new Set(scheduledCodes),
  );
  assert.equal(data.programs[0].duration, "3 years · 6 semesters");
  assert.equal(data.programs[0].totalCredits, 96);
});

test("every course has a complete executable sixteen-week classroom", () => {
  assert.equal(Object.keys(plans.coursePlans).length, 29);
  assert.deepEqual(Object.keys(plans.trackCoursePlans).sort(), ["TRK401", "TRK402"]);

  for (const code of ["TRK401", "TRK402"]) {
    assert.deepEqual(
      Object.keys(plans.trackCoursePlans[code]).sort(),
      ["chips", "energy", "robotics", "signals"],
    );
  }

  for (const course of data.courses) {
    const plan = plans.getCoursePlan(course.code, "chips");
    assert.ok(plan, `${course.code} is missing a plan`);
    assert.equal(plan.weeks.length, 16, `${course.code} does not have 16 weeks`);
    assert.deepEqual(
      plan.weeks.map((week) => week.week),
      Array.from({ length: 16 }, (_, index) => index + 1),
      `${course.code} week numbers are incomplete`,
    );
    assert.ok(plan.primaryResource, `${course.code} has no primary resource`);
    assert.ok(plan.alternatives.length >= 1, `${course.code} has no alternative`);
    assert.ok(plan.setup.length >= 1, `${course.code} has no setup`);
    assert.ok(plan.firstAction, `${course.code} has no first action`);

    for (const week of plan.weeks) {
      for (const field of [
        "title",
        "topic",
        "whereLabel",
        "resourceTitle",
        "action",
        "evidence",
      ]) {
        assert.ok(week[field], `${course.code} Week ${week.week} is missing ${field}`);
      }
      assert.ok(week.hours > 0, `${course.code} Week ${week.week} has no workload`);
    }

    assert.equal(plan.weeks[5].assessmentType, "midterm", `${course.code} W6`);
    assert.equal(plan.weeks[10].assessmentType, "midterm", `${course.code} W11`);
    assert.equal(plan.weeks[14].assessmentType, "presentation", `${course.code} W15`);
    assert.equal(plan.weeks[15].assessmentType, "final", `${course.code} W16`);
  }
});

test("all four specialization routes are real, distinct sixteen-week plans", () => {
  for (const code of ["TRK401", "TRK402"]) {
    const variants = plans.trackCoursePlans[code];
    const primaryResources = new Set(
      Object.values(variants).map((plan) => plan.primaryResource),
    );
    assert.equal(primaryResources.size, 4, `${code} variants reuse one generic route`);

    for (const [track, plan] of Object.entries(variants)) {
      assert.equal(plan.trackId, track);
      assert.equal(plan.weeks.length, 16);
      assert.equal(plan.weeks[5].assessmentType, "midterm");
      assert.equal(plan.weeks[10].assessmentType, "midterm");
      assert.equal(plan.weeks[14].assessmentType, "presentation");
      assert.equal(plan.weeks[15].assessmentType, "final");
    }
  }
});

test("every plan reference resolves to a uniquely named free resource", () => {
  const titles = data.resources.map((resource) => resource.title);
  assert.equal(new Set(titles).size, titles.length, "Resource titles must be unique");

  const resourceTitles = new Set(titles);
  const allPlans = [
    ...Object.values(plans.coursePlans),
    ...Object.values(plans.trackCoursePlans).flatMap((variants) =>
      Object.values(variants),
    ),
  ];

  for (const plan of allPlans) {
    const references = [
      plan.primaryResource,
      ...plan.alternatives,
      ...plan.weeks.map((week) => week.resourceTitle),
    ];
    for (const title of references) {
      assert.ok(
        resourceTitles.has(title),
        `${plan.courseCode} references missing resource: ${title}`,
      );
    }
  }

  for (const resource of data.resources) {
    assert.match(resource.url, /^https:\/\//, `${resource.title} must use HTTPS`);
  }
});

test("prerequisites always precede the course", () => {
  const byCode = new Map(data.courses.map((course) => [course.code, course]));
  for (const course of data.courses) {
    for (const prerequisite of course.prerequisites) {
      const prior = byCode.get(prerequisite);
      assert.ok(prior, `${course.code} references unknown prerequisite ${prerequisite}`);
      assert.ok(
        prior.semester < course.semester,
        `${course.code} prerequisite ${prerequisite} is not earlier`,
      );
    }
  }
});
