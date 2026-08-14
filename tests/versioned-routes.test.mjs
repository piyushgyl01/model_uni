import assert from "node:assert/strict";
import test from "node:test";

async function render(path) {
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

test("immutable program publications remain directly reachable", async () => {
  const latest = await render("/programs/computer-science");
  assert.equal(latest.status, 200);
  const latestHtml = await latest.text();
  assert.match(latestHtml, /Published curriculum v(?:<!-- -->)?1\.2\.0/);
  assert.match(
    latestHtml,
    /\/programs\/computer-science\/courses\/computer-architecture/,
  );

  const runnableVersion = await render(
    "/programs/computer-science/versions/1.2.0/courses/computer-architecture",
  );
  assert.equal(runnableVersion.status, 200);
  const runnableVersionHtml = await runnableVersion.text();
  assert.match(runnableVersionHtml, /Exact weekly assignments/);
  assert.match(runnableVersionHtml, /Rubric:/);

  const priorVersion = await render(
    "/programs/computer-science/versions/1.1.0/courses/computer-architecture",
  );
  assert.equal(priorVersion.status, 200);
  const priorVersionHtml = await priorVersion.text();
  assert.match(priorVersionHtml, /pipelining/i);
  assert.match(priorVersionHtml, /MIT 6\.004/i);

  const program = await render(
    "/programs/computer-science/versions/1.0.0",
  );
  assert.equal(program.status, 200);
  const programHtml = await program.text();
  assert.match(
    programHtml,
    /\/programs\/computer-science\/versions\/1\.0\.0\/courses\/operating-systems/,
  );

  const course = await render(
    "/programs/computer-science/versions/1.0.0/courses/operating-systems",
  );
  assert.equal(course.status, 200);
  const courseHtml = await course.text();
  assert.match(courseHtml, /Operating Systems/);
  assert.match(
    courseHtml,
    /\/programs\/computer-science\/versions\/1\.0\.0/,
  );

  const missing = await render(
    "/programs/computer-science/versions/not-a-version",
  );
  assert.equal(missing.status, 404);
});
