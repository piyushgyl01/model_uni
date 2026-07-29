import assert from "node:assert/strict";
import test from "node:test";

async function worker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("progress-test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

const environment = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};
const context = {
  waitUntil() {},
  passThroughOnException() {},
};

test("progress reads require ChatGPT identity and return a safe sign-in route", async () => {
  const app = await worker();
  const response = await app.fetch(
    new Request(
      "http://localhost/api/learner-progress?programVersionId=prv_course_atlas_ee_2026_1&clientImportId=test-device-1234&returnTo=%2Fprograms%2Felectrical-engineering",
      { headers: { accept: "application/json" } },
    ),
    environment,
    context,
  );

  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    authenticated: false,
    signInPath:
      "/signin-with-chatgpt?return_to=%2Fprograms%2Felectrical-engineering",
  });
});

test("progress writes reject cross-origin requests before processing data", async () => {
  const app = await worker();
  const response = await app.fetch(
    new Request("http://localhost/api/learner-progress", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        origin: "https://attacker.example",
      },
      body: "{}",
    }),
    environment,
    context,
  );

  assert.equal(response.status, 403);
  assert.match((await response.json()).error, /cross-origin/i);
});

test("local progress cannot be imported without a signed-in owner", async () => {
  const app = await worker();
  const response = await app.fetch(
    new Request("http://localhost/api/learner-progress/import", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
      },
      body: "{}",
    }),
    environment,
    context,
  );

  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

