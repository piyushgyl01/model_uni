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

test("server-renders the Course Atlas launch catalog", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Course Atlas/);
  assert.match(html, /Every subject\. One navigable education\./);
  assert.match(html, /School of Engineering/);
  assert.match(html, /Electrical Engineering/);
  assert.match(html, /128/);
  assert.match(html, /Midterm I/);
  assert.match(html, /Cumulative final/);
  assert.match(html, /independent, non-accredited learning blueprint/i);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
  assert.doesNotMatch(html, /codex-preview/);
  assert.doesNotMatch(html, /OpenEE/i);
});

test("ships the universal hierarchy and removes starter infrastructure", async () => {
  const [page, layout, data, packageJson, lockfile] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
  ]);

  for (const level of [
    "Schools",
    "Disciplines",
    "Programs",
    "Courses",
    "Modules",
    "Resources",
  ]) {
    assert.match(page, new RegExp(`"${level}"`));
  }

  assert.match(page, /course-atlas-track/);
  assert.match(page, /course-atlas-ee-progress/);
  assert.match(layout, /Course Atlas/);
  assert.match(layout, /\/og\.png/);
  assert.match(data, /export const schools/);
  assert.match(data, /export const disciplines/);
  assert.match(data, /export const programs/);
  assert.match(data, /export const modules/);
  assert.doesNotMatch(page, /openee/i);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(lockfile, /react-loading-skeleton/);

  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../.openai/hosting.json", import.meta.url));
  await access(projectRoot);
});
