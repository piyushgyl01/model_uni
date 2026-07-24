import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
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

test("server-renders a universal degree catalog homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Course Atlas/);
  assert.match(html, /Pick a degree/);
  assert.match(html, /Degree directory/);
  assert.match(html, /Many independent degree pages/);
  assert.match(html, /\/degrees\/electrical-engineering/);
  assert.match(html, /Electrical Engineering/);
  assert.match(html, /Computer Science/);
  assert.match(html, /Not published yet/);
  assert.doesNotMatch(html, /Your three-year electrical engineering university/);
  assert.doesNotMatch(html, /Your EE progress/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("server-renders Electrical Engineering as its own degree route", async () => {
  const response = await render("/degrees/electrical-engineering");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /three-year electrical engineering university/i);
  assert.match(html, /Six semesters\. Thirty-one courses\./);
  assert.match(html, /Start Semester 1/);
  assert.match(html, /School of Engineering/);
  assert.match(html, /96/);
  assert.match(html, /Midterm I/);
  assert.match(html, /Cumulative final/);
  assert.match(html, /independent, non-accredited learning blueprint/i);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
  assert.doesNotMatch(html, /codex-preview/);
  assert.doesNotMatch(html, /OpenEE/i);
});

test("does not publish empty degree shells", async () => {
  const response = await render("/degrees/computer-science");
  assert.equal(response.status, 404);
});

test("ships the universal hierarchy, executable classrooms, and no starter infrastructure", async () => {
  const [page, degreePage, degreeRoute, registry, layout, data, coursePlans, classroom, packageJson, lockfile] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/degree-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/degrees/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/program-registry.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/course-plans.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/course-classroom.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
  ]);

  for (const level of [
    "Schools",
    "Disciplines",
    "Programs",
    "Courses",
    "Weeks",
    "Resources",
  ]) {
    assert.match(degreePage, new RegExp(`"${level}"`));
  }

  assert.match(page, /degreeCatalog/);
  assert.match(page, /\/degrees\/\$\{degree\.slug\}/);
  assert.match(degreeRoute, /generateStaticParams/);
  assert.match(registry, /electrical-engineering/);
  assert.match(registry, /computer-science/);
  assert.match(degreePage, /course-atlas-track/);
  assert.match(degreePage, /course-atlas-ee-progress/);
  assert.match(degreePage, /course-atlas-week-progress-v1/);
  assert.match(layout, /Course Atlas/);
  assert.match(layout, /\/og\.png/);
  assert.match(data, /export const schools/);
  assert.match(data, /export const disciplines/);
  assert.match(data, /export const programs/);
  assert.match(data, /3 years · 6 semesters/);
  assert.match(coursePlans, /export const coursePlans/);
  assert.match(coursePlans, /export const trackCoursePlans/);
  assert.match(coursePlans, /getCoursePlan/);
  assert.match(classroom, /What to learn/);
  assert.match(classroom, /Where to learn it/);
  assert.match(classroom, /What to submit/);
  assert.doesNotMatch(degreePage, /Eight semesters|S7–S8|39 courses|128 credits/);
  assert.doesNotMatch(degreePage, /openee/i);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(lockfile, /react-loading-skeleton/);

  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../.openai/hosting.json", import.meta.url));
  await access(projectRoot);
});
