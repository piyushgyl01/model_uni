import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolveLearnerPath } from "../app/domain/learner-path";
import { computerScienceBundle } from "../content/programs/computer-science-v1-1";

test("the Study Plan follows the learner's selected Computer Science path", () => {
  const selectedConcentration = computerScienceBundle.concentrations[1];
  assert.ok(selectedConcentration);

  const path = resolveLearnerPath(computerScienceBundle, {
    selectedConcentrationId: selectedConcentration.id,
  });
  const termSix = path.calendar?.periods.find(
    (period) => period.label === "Term 6",
  );
  assert.ok(termSix);

  const termSixCourseIds = new Set(
    path.placements.flatMap((placement) =>
      placement.periodId === termSix.id &&
      placement.subject.kind === "courseVersion"
        ? [placement.subject.id]
        : [],
    ),
  );

  assert.equal(termSixCourseIds.size, 5);
  assert.equal(
    [...termSixCourseIds].every((courseVersionId) =>
      path.selectedCourseVersionIdSet.has(courseVersionId),
    ),
    true,
  );
});

test("the Study Plan reacts to the stored concentration without filtering the course directory", () => {
  const componentSource = readFileSync(
    new URL("../app/program-study-plan.tsx", import.meta.url),
    "utf8",
  );
  const pageSource = readFileSync(
    new URL("../app/program-page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(componentSource, /resolveLearnerPath\(bundle/);
  assert.match(componentSource, /getStoredProgram\(bundle\.programVersion\.id\)/);
  assert.match(
    componentSource,
    /window\.addEventListener\(PROGRESS_EVENT, updatePath\)/,
  );
  assert.match(pageSource, /<ProgramStudyPlan bundle=\{clientBundle\}/);
  assert.match(pageSource, /\{courseRecords\.map\(\(\{ course, version \}\) =>/);
});
