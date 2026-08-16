import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
      redirect: "manual",
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("homepage is a universal catalog derived from published programs", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Choose an outcome/);
  assert.match(html, /Different structures/);
  assert.match(html, /Computer Science/);
  assert.match(html, /Electrical Engineering/);
  assert.match(html, /Mechanical Engineering/);
  assert.match(html, /Physics/);
  assert.match(html, /Mathematics/);
  assert.match(html, /\/programs\/computer-science/);
  assert.match(html, /\/programs\/electrical-engineering/);
  assert.match(html, /\/programs\/mechanical-engineering/);
  assert.match(html, /\/programs\/physics/);
  assert.match(html, /\/programs\/mathematics/);
  assert.match(
    html,
    /<strong>5<\/strong>(?:<!-- -->)?\s*complete programs/,
  );
  assert.match(
    html,
    /<strong>151<\/strong>\s*(?:<!-- -->)?\s*courses across minimum paths/,
  );
  assert.match(
    html,
    /<strong>1,456<\/strong>\s*(?:<!-- -->)?\s*executable learning units/,
  );
  assert.match(html, /31/);
  assert.match(html, /course minimum path/);
  assert.match(html, /8/);
  assert.match(html, /learning units/);
  assert.doesNotMatch(html, /∞/);
  assert.doesNotMatch(html, /Your three-year electrical engineering university/);
});

test("Computer Science renders as a complete six-term program and course classroom", async () => {
  const programResponse = await render("/programs/computer-science");
  assert.equal(programResponse.status, 200);
  const programHtml = await programResponse.text();
  assert.match(programHtml, /Computer Science/);
  assert.match(programHtml, /30/);
  assert.match(programHtml, /selected from/);
  assert.match(programHtml, /34/);
  assert.match(programHtml, /Intelligent Systems/);
  assert.match(programHtml, /Scalable and Secure Systems/);
  assert.match(programHtml, /Interactive Applications/);
  assert.match(programHtml, /CS2023/);
  assert.match(programHtml, /independent-study pathway/i);

  const courseResponse = await render(
    "/programs/computer-science/courses/operating-systems",
  );
  assert.equal(courseResponse.status, 200);
  const courseHtml = await courseResponse.text();
  assert.match(courseHtml, /Operating Systems/);
  assert.match(courseHtml, /8 learning units/);
  assert.match(courseHtml, /Unit 8/);
  assert.match(courseHtml, /Operating Systems: Three Easy Pieces/);
  assert.match(courseHtml, /What to learn/);
  assert.match(courseHtml, /Evidence to keep/);
  assert.match(courseHtml, /Exact weekly assignments/);
  assert.match(courseHtml, /Source check:/);
  assert.match(courseHtml, /Free access(?:<!-- -->)? · (?:<!-- -->)?link only/);
  assert.match(courseHtml, /Chapter 4 — The Abstraction: The Process/);
  assert.match(courseHtml, /Homework — process-run\.py/);
  assert.match(
    courseHtml,
    /<a[^>]+href="https:\/\/pages\.cs\.wisc\.edu\/~remzi\/OSTEP\/cpu-intro\.pdf"[^>]*>Open exact source ↗<\/a>/,
  );
  assert.match(
    courseHtml,
    /Trace fork, exec, wait, file-descriptor inheritance, and exit status/,
  );
  assert.match(courseHtml, /C program, process diagram, syscall trace/);
  assert.match(courseHtml, /CS310 Scheduler and Virtual-Memory Kernel Simulation/);
  assert.match(courseHtml, /CS310 Crash-Safe Concurrent Service Lab/);
  assert.match(courseHtml, /midterm ·/i);
  assert.match(courseHtml, /final ·/i);
  assert.match(courseHtml, /Pass: 70/);
  assert.match(courseHtml, /Rubric:/);
  assert.match(courseHtml, /State-transition correctness/);
  assert.doesNotMatch(
    courseHtml,
    /find the section|provider exercises where available|materials on the topic/i,
  );
});

test("generic program route renders the EE publication without placeholders", async () => {
  const response = await render("/programs/electrical-engineering");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Electrical Engineering/);
  assert.match(html, /31/);
  assert.match(html, /selected from/);
  assert.match(html, /37/);
  assert.match(html, /Coherent specialization/);
  assert.match(html, /FPGA Systems/);
  assert.match(html, /Robot Kinematics/);
  assert.match(html, /Access is not the same as permission/);
  assert.match(html, /independent, non-accredited/i);
  assert.doesNotMatch(html, /TRK401|TRK402/);
});

test("Mechanical Engineering renders as a complete six-term program and course classroom", async () => {
  const programResponse = await render("/programs/mechanical-engineering");
  assert.equal(programResponse.status, 200);
  const programHtml = await programResponse.text();
  assert.match(programHtml, /Mechanical Engineering/);
  assert.match(programHtml, /30(?:<!-- -->)? selected from 34 options/);
  assert.match(programHtml, /3 years · 6 terms/);
  assert.match(programHtml, /Six-term recommended sequence/);
  assert.match(programHtml, /Robotics and Autonomous Systems/);
  assert.match(programHtml, /Aerospace and Propulsion/);
  assert.match(programHtml, /Sustainable Energy/);
  assert.match(programHtml, /MIT Mechanical Engineering degree chart/);
  assert.match(programHtml, /awards no degree/i);
  assert.match(programHtml, /Access is not the same as permission/);

  const courseResponse = await render(
    "/programs/mechanical-engineering/courses/engineering-thermodynamics",
  );
  assert.equal(courseResponse.status, 200);
  const courseHtml = await courseResponse.text();
  assert.match(courseHtml, /Engineering Thermodynamics/);
  assert.match(courseHtml, /8 learning units/);
  assert.match(courseHtml, /Unit 8/);
  assert.match(courseHtml, /Thermodynamics and Climate Change/);
  assert.match(courseHtml, /What to learn/);
  assert.match(courseHtml, /Evidence to keep/);
  assert.match(courseHtml, /Safety note/);
});

test("Physics renders as a complete six-term program and quantum classroom", async () => {
  const programResponse = await render("/programs/physics");
  assert.equal(programResponse.status, 200);
  const programHtml = await programResponse.text();
  assert.match(programHtml, /Physics/);
  assert.match(
    programHtml,
    /30(?:<!-- -->)?\s*selected from\s*(?:<!-- -->)?34(?:<!-- -->)?\s*options/,
  );
  assert.match(programHtml, /3 years · 6 terms/);
  assert.match(programHtml, /Astrophysics and Gravitation/);
  assert.match(programHtml, /Quantum Science and Materials/);
  assert.match(programHtml, /Particle and Nuclear Physics/);
  assert.match(programHtml, /MIT undergraduate Physics pathways/);
  assert.match(programHtml, /awards no degree/i);
  assert.match(programHtml, /Access is not the same as permission/);

  const courseResponse = await render(
    "/programs/physics/courses/quantum-mechanics-1",
  );
  assert.equal(courseResponse.status, 200);
  const courseHtml = await courseResponse.text();
  assert.match(courseHtml, /Quantum Mechanics I/);
  assert.match(courseHtml, /8 learning units/);
  assert.match(courseHtml, /Unit 8/);
  assert.match(courseHtml, /8\.04: Quantum Physics I/);
  assert.match(courseHtml, /What to learn/);
  assert.match(courseHtml, /Evidence to keep/);
});

test("Mathematics renders as a complete six-term program and real-analysis classroom", async () => {
  const programResponse = await render("/programs/mathematics");
  assert.equal(programResponse.status, 200);
  const programHtml = await programResponse.text();
  assert.match(programHtml, /Mathematics/);
  assert.match(
    programHtml,
    /30(?:<!-- -->)?\s*selected from\s*(?:<!-- -->)?34(?:<!-- -->)?\s*options/,
  );
  assert.match(programHtml, /3 years · 6 terms/);
  assert.match(programHtml, /Pure Structures and Number Theory/);
  assert.match(programHtml, /Analysis, PDEs, and Mathematical Physics/);
  assert.match(programHtml, /Discrete Optimization and Computation/);
  assert.match(
    programHtml,
    /MIT Mathematics major pathways and five-university curriculum synthesis/,
  );
  assert.match(programHtml, /awards no degree/i);
  assert.match(programHtml, /Access is not the same as permission/);

  const courseResponse = await render(
    "/programs/mathematics/courses/real-analysis-1",
  );
  assert.equal(courseResponse.status, 200);
  const courseHtml = await courseResponse.text();
  assert.match(courseHtml, /Real Analysis I/);
  assert.match(courseHtml, /8 learning units/);
  assert.match(courseHtml, /Unit 8/);
  assert.match(courseHtml, /Real Analysis/);
  assert.match(
    courseHtml,
    /https:\/\/ocw\.mit\.edu\/courses\/18-100a-real-analysis-fall-2020\//,
  );
  assert.match(courseHtml, /What to learn/);
  assert.match(courseHtml, /Evidence to keep/);
});

test("standalone course route is an executable arbitrary-length classroom", async () => {
  const response = await render(
    "/programs/electrical-engineering/courses/calculus-i-models-and-change",
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const phrase of [
    "What to learn",
    "Where to learn it",
    "What to do",
    "Evidence to keep",
    "Course resources",
    "Assessments and grading",
    "Calculus I",
    "16 learning units",
    "Unit 16",
    "Cumulative",
  ]) {
    assert.match(html, new RegExp(phrase));
  }
  assert.match(html, /Access/);
  assert.match(html, /Rights/);
  assert.match(html, /Freshness/);
});

test("the learner record is explicitly independent and makes no institutional claim", async () => {
  const response = await render("/transcript");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Independent Learning Record/);
  assert.match(html, /non-accredited record/i);
  assert.doesNotMatch(html, /Official Academic Transcript/i);
  assert.doesNotMatch(html, /verified work evidence/i);
});

test("legacy degree links redirect and unknown programs remain 404", async () => {
  const legacy = await render("/degrees/computer-science");
  assert.ok([307, 308].includes(legacy.status));
  assert.equal(
    new URL(legacy.headers.get("location"), "http://localhost").pathname,
    "/programs/computer-science",
  );

  const missing = await render("/programs/not-a-published-program");
  assert.equal(missing.status, 404);
});

test("source architecture has one renderer, stable progress, and D1 migrations", async () => {
  const [
    programRoute,
    courseRoute,
    programPage,
    coursePage,
    progress,
    catalog,
    runtimeCatalog,
    progressApi,
    progressStorage,
    chatgptAuth,
    learnerProgressApi,
    transcriptPage,
    transcriptClient,
    todayPage,
    todayClient,
    cloudflareCatalog,
    catalogReadModel,
    learnerReadModel,
    independentLearningRecord,
    instructionalQuality,
    runnableComputerScience,
    resourceAudit,
    packageJson,
    schema,
  ] = await Promise.all([
    readFile(new URL("../app/programs/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(
      new URL(
        "../app/programs/[slug]/courses/[courseSlug]/page.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(new URL("../app/program-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/course-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/course-progress.tsx", import.meta.url), "utf8"),
    readFile(new URL("../content/catalog.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../app/catalog/runtime-repository.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/api/learner-progress/route.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/progress-storage.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/chatgpt-auth.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../app/learner-progress-api.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/transcript/page.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../app/transcript/transcript-page-client.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/today/page.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../app/today/today-page-client.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/catalog/cloudflare-catalog.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/catalog/catalog-read-model.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/catalog/learner-read-model-repository.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/domain/independent-learning-record.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/domain/instructional-quality.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../content/programs/computer-science-v1-2.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../scripts/audit-runnable-resources.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
  ]);

  assert.match(programRoute, /getRuntimeCatalogRepository/);
  assert.match(programRoute, /await catalogRepository\.loadBySlug/);
  assert.match(programRoute, /<ProgramPage bundle=\{bundle\}/);
  const programSpecificHardcoding =
    /ee-beng|electrical-engineering|mechanical-engineering|mechanicalEngineering|physicsBundle|physicsCourseSpecs|["'`]physics["'`]|\/programs\/physics(?:\/|["'`])|mathematicsBundle|mathematicsCourseSpecs|["'`]mathematics["'`]|\/programs\/mathematics(?:\/|["'`])/;
  assert.doesNotMatch(programRoute, programSpecificHardcoding);
  assert.match(courseRoute, /<CoursePage bundle=\{bundle\}/);
  assert.doesNotMatch(courseRoute, programSpecificHardcoding);
  assert.doesNotMatch(programPage, /from "\.\/data"|from "\.\/course-plans"/);
  assert.doesNotMatch(programPage, programSpecificHardcoding);
  assert.doesNotMatch(coursePage, /length === 16|Array\.from\(\{ length: 16/);
  assert.doesNotMatch(coursePage, programSpecificHardcoding);
  assert.match(coursePage, /unit\.weeklyAssignments/);
  assert.match(coursePage, /assessmentVersion\.passingScore/);
  assert.match(coursePage, /assessmentVersion\.rubric/);
  assert.match(progress, /course-atlas-progress-v3/);
  assert.match(progress, /programVersionId/);
  assert.match(progress, /courseVersionId/);
  assert.match(progress, /completedUnitIds/);
  assert.match(progress, /syncStoredProgram/);
  assert.match(progressStorage, /course-atlas-progress-v2/);
  assert.match(progressStorage, /owner-scoped-v1/);
  assert.match(catalog, /StaticCatalogRepository/);
  assert.match(catalog, /computerScienceBundleV12/);
  assert.match(runtimeCatalog, /seedPublishedProgramBundles/);
  assert.match(runtimeCatalog, /compareCatalogBundleShadows/);
  assert.match(runtimeCatalog, /projectCatalogReadModels/);
  assert.match(cloudflareCatalog, /releaseProjectionIsCurrent/);
  assert.match(cloudflareCatalog, /await import\(/);
  assert.doesNotMatch(
    cloudflareCatalog.split("await import(")[0],
    /content\/catalog["']/,
  );
  assert.match(progressApi, /getAuthenticatedLearner/);
  assert.match(progressApi, /rejectCrossOriginMutation/);
  assert.match(
    progressStorage,
    /disposition === "merged" \? sanitizedImportPrograms\(store\) : \{\}/,
  );
  assert.match(chatgptAuth, /oai-authenticated-user-id/);
  assert.match(learnerProgressApi, /subject: user\.id/);
  assert.match(transcriptClient, /learner-views\/record/);
  assert.match(transcriptClient, /buildIndependentLearningRecord/);
  assert.match(transcriptClient, /course\.canonicalSlug/);
  assert.doesNotMatch(transcriptPage, /listPrograms|loadBySlug|PublishedProgramBundle/);
  assert.doesNotMatch(todayPage, /listPrograms|loadBySlug|PublishedProgramBundle/);
  assert.doesNotMatch(todayClient, /bundles\.map|listPrograms/);
  assert.match(todayClient, /learner-views\/today/);
  assert.match(catalogReadModel, /listD1ProgramPage/);
  assert.match(catalogReadModel, /searchD1Courses/);
  assert.doesNotMatch(
    catalogReadModel.slice(catalogReadModel.indexOf("listD1ProgramPage")),
    /\bOFFSET\b/,
  );
  assert.match(learnerReadModel, /learner_pathway_course_rows/);
  assert.match(learnerReadModel, /learner_today_assignment_rows/);
  assert.match(learnerReadModel, /learner_transcript_rows/);
  assert.doesNotMatch(transcriptClient, /evaluateProgramRequirements/);
  assert.doesNotMatch(
    `${transcriptPage}\n${transcriptClient}`,
    /official|verified work|degree completed|credentialLabel/i,
  );
  assert.match(
    independentLearningRecord,
    /evaluateLearnerPathCompletion/,
  );
  assert.match(independentLearningRecord, /self-attested/);
  assert.match(independentLearningRecord, /instructor-reviewed/);
  assert.match(instructionalQuality, /runnable-pathway-v1/);
  assert.match(instructionalQuality, /VAGUE_LOCATION/);
  assert.match(instructionalQuality, /repeated/i);
  assert.match(runnableComputerScience, /weeklyAssignments/);
  assert.match(runnableComputerScience, /qualityStandard: "runnable-pathway-v1"/);
  assert.match(runnableComputerScience, /assertValidPublishedProgramBundle/);
  assert.match(resourceAudit, /qualityStandard.*"runnable-pathway-v1"/);
  assert.match(resourceAudit, /await fetch\(/);
  assert.match(resourceAudit, /throw new Error/);
  assert.match(packageJson, /catalog:audit-resources/);
  assert.match(schema, /programVersions/);
  assert.match(schema, /courseVersions/);
  assert.match(schema, /resourceRights/);
  assert.match(schema, /competencies/);
  assert.match(schema, /catalogBundles/);
  assert.match(schema, /learnerProgramProgress/);
  assert.match(schema, /learnerUnitCompletions/);
  assert.match(schema, /learnerProgramStates/);
  assert.match(schema, /learnerUnitEvidence/);
  assert.match(schema, /catalogProgramSummaries/);
  assert.match(schema, /catalogCourseSearchRows/);
  assert.match(schema, /learnerPathwaySnapshots/);

  await access(new URL("../drizzle/0000_supreme_bloodscream.sql", import.meta.url));
  await access(new URL("../drizzle/0001_big_infant_terrible.sql", import.meta.url));
  await access(new URL("../drizzle/0002_pale_nextwave.sql", import.meta.url));
  await access(new URL("../drizzle/0003_dazzling_paladin.sql", import.meta.url));
  await access(new URL("../drizzle/0004_soft_champions.sql", import.meta.url));
  await access(new URL("../drizzle/0005_sparkling_cannonball.sql", import.meta.url));
  await access(new URL("../.openai/hosting.json", import.meta.url));
});
