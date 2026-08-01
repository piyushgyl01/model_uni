import assert from "node:assert/strict";
import test from "node:test";
import { createCompetencyRepository } from "../app/catalog/competency-repository";
import type { PublishedProgramBundle } from "../app/domain/catalog";
import { catalogRepository } from "../content/catalog";

function publishedBundles(): readonly PublishedProgramBundle[] {
  return catalogRepository.listPrograms().flatMap((program) =>
    catalogRepository
      .listVersions(program.slug)
      .map((version) => catalogRepository.loadBySlug(program.slug, version))
      .filter((bundle): bundle is PublishedProgramBundle => Boolean(bundle)),
  );
}

test("competency repository resolves program, course, assessment, and gap evidence", () => {
  const bundles = publishedBundles();
  const computerScience = bundles.find(
    (bundle) => bundle.program.canonicalSlug === "computer-science",
  );
  assert.ok(computerScience);
  const repository = createCompetencyRepository(bundles);

  const programCompetencies = repository.getCompetenciesForProgramVersion(
    computerScience.programVersion.id,
  );
  assert.equal(
    programCompetencies.length,
    computerScience.programVersion.competencyIds.length,
  );

  const course = computerScience.courses.find(
    (candidate) => candidate.canonicalSlug === "operating-systems",
  );
  assert.ok(course);
  const courseVersion = computerScience.courseVersions.find(
    (candidate) => candidate.courseId === course.id,
  );
  assert.ok(courseVersion);
  assert.ok(
    repository.getCompetenciesForCourseVersion(courseVersion.id).length > 0,
  );

  const assessment = computerScience.assessmentVersions.find(
    (candidate) =>
      candidate.courseVersionId === courseVersion.id &&
      repository.getCompetenciesForAssessmentVersion(candidate.id).length > 0,
  );
  assert.ok(assessment);
  assert.ok(
    repository.getCompetenciesForAssessmentVersion(assessment.id).length > 0,
  );

  const gaps = repository.getGapAnalysis(
    computerScience.programVersion.id,
    new Set(),
  );
  assert.equal(gaps.length, programCompetencies.length);
  assert.ok(gaps.some((gap) => gap.suggestedAssessments.length > 0));
  assert.deepEqual(
    repository.getEquivalencyPaths(
      programCompetencies[0].id,
      programCompetencies[0].id,
    ),
    [
      {
        from: programCompetencies[0].id,
        to: programCompetencies[0].id,
        coverage: 1,
        relation: "equivalent",
        evidence: "Same competency",
      },
    ],
  );
});
