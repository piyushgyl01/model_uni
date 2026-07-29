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
  assert.match(html, /Electrical Engineering/);
  assert.match(html, /Practical Spreadsheets/);
  assert.match(html, /\/programs\/electrical-engineering/);
  assert.match(html, /\/programs\/practical-spreadsheets/);
  assert.match(html, /31/);
  assert.match(html, /course minimum path/);
  assert.match(html, /8/);
  assert.match(html, /learning units/);
  assert.doesNotMatch(html, /∞/);
  assert.doesNotMatch(html, /Your three-year electrical engineering university/);
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

test("the same program route renders a one-course eight-week intensive", async () => {
  const response = await render("/programs/practical-spreadsheets");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Practical Spreadsheets &amp; Decision Modeling/);
  assert.match(html, /8 weeks/);
  assert.match(html, /1/);
  assert.match(html, /Eight-week self-directed schedule/);
  assert.match(html, /Power Query/);
  assert.doesNotMatch(html, /id="concentrations"/);
  assert.doesNotMatch(html, /six semesters/i);
});

test("standalone course route is an executable arbitrary-length classroom", async () => {
  const response = await render(
    "/programs/practical-spreadsheets/courses/practical-spreadsheets-and-decision-modeling",
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
    "Week 8",
    "8 learning units",
  ]) {
    assert.match(html, new RegExp(phrase));
  }
  assert.match(html, /Access/);
  assert.match(html, /Rights/);
  assert.match(html, /Freshness/);
  assert.doesNotMatch(html, /Week 16/);
});

test("a sixteen-unit EE course uses the same standalone classroom", async () => {
  const response = await render(
    "/programs/electrical-engineering/courses/calculus-i-models-and-change",
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Calculus I/);
  assert.match(html, /16 learning units/);
  assert.match(html, /Week 16/);
  assert.match(html, /Cumulative/);
});

test("legacy degree URLs redirect and unpublished programs remain 404", async () => {
  const legacy = await render("/degrees/electrical-engineering");
  assert.ok([307, 308].includes(legacy.status));
  assert.equal(
    new URL(legacy.headers.get("location"), "http://localhost").pathname,
    "/programs/electrical-engineering",
  );

  const missing = await render("/programs/computer-science");
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
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
  ]);

  assert.match(programRoute, /catalogRepository\.loadBySlug/);
  assert.match(programRoute, /<ProgramPage bundle=\{bundle\}/);
  assert.doesNotMatch(programRoute, /ee-beng|electrical-engineering/);
  assert.match(courseRoute, /<CoursePage bundle=\{bundle\}/);
  assert.doesNotMatch(programPage, /from "\.\/data"|from "\.\/course-plans"/);
  assert.doesNotMatch(coursePage, /length === 16|Array\.from\(\{ length: 16/);
  assert.match(progress, /course-atlas-progress-v2/);
  assert.match(progress, /programVersionId/);
  assert.match(progress, /courseVersionId/);
  assert.match(progress, /completedUnitIds/);
  assert.match(catalog, /StaticCatalogRepository/);
  assert.match(schema, /programVersions/);
  assert.match(schema, /courseVersions/);
  assert.match(schema, /resourceRights/);
  assert.match(schema, /competencies/);

  await access(new URL("../drizzle/0000_supreme_bloodscream.sql", import.meta.url));
  await access(new URL("../.openai/hosting.json", import.meta.url));
});
