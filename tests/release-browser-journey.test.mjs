import assert from "node:assert/strict";
import { constants as fsConstants } from "node:fs";
import { access, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Miniflare } from "miniflare";
import { chromium } from "playwright-core";

const PROGRAM_PATH = "/programs/practical-spreadsheets";
const COURSE_PATH = `${PROGRAM_PATH}/courses/practical-spreadsheets-and-decision-modeling`;
const PROJECT_UNIT_IDS = [
  "unt_spreadsheets_04",
  "unt_spreadsheets_06",
  "unt_spreadsheets_08",
];
const ASSESSMENT_TITLES = [
  "Reconciliation checkpoint",
  "Decision-workbook capstone and defense",
];

const AUTH_HEADERS = {
  "oai-authenticated-user-id": "acct_release_browser_learner",
  "oai-authenticated-user-email": "browser-journey@example.test",
};

async function chromeExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : undefined,
    process.platform === "darwin"
      ? "/Applications/Chromium.app/Contents/MacOS/Chromium"
      : undefined,
    process.platform === "linux" ? "/usr/bin/google-chrome" : undefined,
    process.platform === "linux" ? "/usr/bin/google-chrome-stable" : undefined,
    process.platform === "linux" ? "/usr/bin/chromium" : undefined,
    process.platform === "linux" ? "/usr/bin/chromium-browser" : undefined,
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // Try the next explicit system-browser location.
    }
  }
  throw new Error(
    "Release browser gate needs Chrome/Chromium. Set CHROME_PATH to its executable.",
  );
}

async function browserEnvironment(persistRoot) {
  const modulesRoot = fileURLToPath(new URL("../dist/server/", import.meta.url));
  const clientRoot = fileURLToPath(new URL("../dist/client/", import.meta.url));
  const moduleFiles = (
    await readdir(modulesRoot, { recursive: true, withFileTypes: true })
  )
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => resolve(entry.parentPath, entry.name))
    .sort();
  const entryPoint = resolve(modulesRoot, "index.js");
  const workerModules = [
    entryPoint,
    ...moduleFiles.filter((file) => file !== entryPoint),
  ].map((path) => ({ type: "ESModule", path }));

  const miniflare = new Miniflare({
    port: 0,
    d1Persist: persistRoot,
    workers: [
      {
        name: "course-atlas",
        modules: workerModules,
        modulesRoot,
        compatibilityDate: "2026-05-15",
        compatibilityFlags: ["nodejs_compat"],
        d1Databases: ["DB"],
        assets: {
          directory: clientRoot,
          binding: "ASSETS",
          routerConfig: {
            has_user_worker: true,
            invoke_user_worker_ahead_of_assets: false,
          },
        },
      },
    ],
  });
  return { miniflare, origin: (await miniflare.ready).origin };
}

function watchPage(page, failures, { allowAnonymous = false } = {}) {
  page.releaseFailures = failures;
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("response", (response) => {
    const url = new URL(response.url());
    // A signed-out visitor is *supposed* to get 401 from the progress API;
    // that is the anonymous answer the client needs, not a failure.
    const expectedAnonymous =
      allowAnonymous &&
      response.status() === 401 &&
      url.pathname.startsWith("/api/learner-");
    if (
      !expectedAnonymous &&
      response.status() >= 400 &&
      url.origin === new URL(page.url() || "http://invalid").origin
    ) {
      failures.push(
        `response: ${response.request().method()} ${response.status()} ${url.pathname}${url.search}`,
      );
    }
  });
  page.on("requestfailed", (request) => {
    const url = new URL(request.url());
    if (url.origin === new URL(page.url() || "http://invalid").origin) {
      failures.push(
        `requestfailed: ${url.pathname} (${request.failure()?.errorText ?? "unknown"})`,
      );
    }
  });
}

async function waitForCloud(page) {
  const cloud = page.getByText(/Cloud sync on/u).first();
  const consent = page
    .getByText("Bring this device's progress into your account?", { exact: true })
    .first();
  try {
    await cloud.or(consent).first().waitFor({ timeout: 15_000 });
  } catch (error) {
    throw new Error(
      `Cloud sync did not settle.\n${(page.releaseFailures ?? []).join("\n")}\n${(await page.locator("body").innerText()).slice(0, 2_000)}`,
      { cause: error },
    );
  }
  if (await consent.isVisible()) {
    await page.getByRole("button", { name: "Import and merge" }).click();
  }
  await cloud.waitFor({ timeout: 30_000 });
  await page.waitForFunction(
    () =>
      !document.body.innerText.includes("Saving to your cloud account") &&
      !document.body.innerText.includes("Checking cloud progress"),
  );
}

async function saveEvidence(page, unitId) {
  const input = page.locator(`#evidence-${unitId}`);
  await page.waitForFunction(
    (id) => !document.getElementById(`evidence-${id}`)?.hasAttribute("disabled"),
    unitId,
  );
  const container = input.locator("xpath=..");
  const button = container.getByRole("button", { name: "Save Proof" });
  const value = `https://example.test/browser-journey/${unitId}`;
  for (let attempt = 0; attempt < 10 && !(await button.isEnabled()); attempt += 1) {
    await input.fill(value);
    await page.waitForTimeout(200);
  }
  assert.equal(await input.inputValue(), value);
  assert.equal(await button.isEnabled(), true);
  await button.click();
  await container.getByText("Evidence saved").waitFor();
  await waitForCloud(page);
}

async function passAssessment(page, title, index) {
  const section = page
    .getByText(title, { exact: true })
    .first()
    .locator("xpath=ancestor::section[1]");
  await section.getByRole("button", { name: "Start assessment" }).click();
  const evidence = section.getByLabel(
    "Work evidence — one artifact or link per line",
  );
  await evidence.waitFor();
  await evidence.fill(`https://example.test/browser-journey/assessment-${index}`);
  await section.getByRole("button", { name: "Submit assessment" }).click();
  const score = section.getByLabel(/Score \/ 100/u);
  await score.waitFor();
  await score.fill("100");
  await section.getByRole("button", { name: "Record evaluation" }).click();
  await section.getByText(/100 \/ 100 · Passed/u).waitFor();
  await waitForCloud(page);
}

test(
  "criterion 12 browser gate: enrollment, mastery, refresh, honest record, prerequisite lock and a second device",
  { timeout: 120_000 },
  async (t) => {
    const persistRoot = await mkdtemp(join(tmpdir(), "course-atlas-browser-"));
    const { miniflare, origin } = await browserEnvironment(persistRoot);
    const browser = await chromium.launch({
      executablePath: await chromeExecutable(),
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
    t.after(async () => {
      await browser.close();
      await miniflare.dispose();
      await rm(persistRoot, { recursive: true, force: true });
    });

    const failures = [];
    const contextA = await browser.newContext({ extraHTTPHeaders: AUTH_HEADERS });
    const pageA = await contextA.newPage();
    watchPage(pageA, failures);

    await pageA.goto(`${origin}${PROGRAM_PATH}`, { waitUntil: "domcontentloaded" });
    await pageA.waitForTimeout(2_000);
    if (
      (await pageA
        .getByRole("button", { name: /Enroll & Generate Schedule/u })
        .count()) === 0
    ) {
      throw new Error(
        [
          "Program page did not hydrate its enrollment control.",
          ...failures,
          (await pageA.locator("body").innerText()).slice(0, 1_000),
        ].join("\n"),
      );
    }
    await pageA
      .getByRole("button", { name: /Enroll & Generate Schedule/u })
      .click();
    await pageA.getByLabel("Start Date:").fill(new Date().toISOString().slice(0, 10));
    await pageA.getByLabel("Casual (10 hrs/week)").check();
    await pageA.getByRole("button", { name: "Start Degree Now" }).click();
    await pageA.getByText("ACTIVE ENROLLMENT", { exact: true }).waitFor();
    await waitForCloud(pageA);

    await pageA.goto(`${origin}${COURSE_PATH}`, { waitUntil: "domcontentloaded" });
    await waitForCloud(pageA);
    const checklist = pageA.locator("fieldset.universal-unit-checklist");
    await assert.doesNotReject(() => checklist.waitFor());
    await pageA.waitForFunction(
      () => !document.querySelector("fieldset.universal-unit-checklist")?.hasAttribute("disabled"),
    );

    for (const unitId of PROJECT_UNIT_IDS) await saveEvidence(pageA, unitId);

    const unitChecks = checklist.locator('input[type="checkbox"]');
    assert.equal(await unitChecks.count(), 8);
    for (let index = 0; index < 8; index += 1) {
      const checkbox = unitChecks.nth(index);
      await checkbox.check();
      await assert.doesNotReject(() => checkbox.waitFor({ state: "attached" }));
      assert.equal(await checkbox.isChecked(), true);
      await waitForCloud(pageA);
    }

    for (const [index, title] of ASSESSMENT_TITLES.entries()) {
      await passAssessment(pageA, title, index + 1);
    }
    await pageA.getByText("Course passed", { exact: false }).waitFor();

    await pageA.reload({ waitUntil: "domcontentloaded" });
    await waitForCloud(pageA);
    await pageA.getByText("Course passed", { exact: false }).waitFor();
    assert.equal(
      await pageA.locator('fieldset.universal-unit-checklist input[type="checkbox"]:checked').count(),
      8,
    );

    await pageA.goto(`${origin}/transcript`, { waitUntil: "domcontentloaded" });
    try {
      await pageA
        .getByText("PATHWAY REQUIREMENTS COMPLETED ✓")
        .waitFor({ timeout: 15_000 });
    } catch (error) {
      throw new Error(
        `Independent Learning Record did not settle.\n${(pageA.releaseFailures ?? []).join("\n")}\n${(await pageA.locator("body").innerText()).slice(0, 3_000)}`,
        { cause: error },
      );
    }
    assert.match(await pageA.locator("body").innerText(), /Courses passed\s+1 of 1/u);
    assert.equal(await pageA.getByText(/Official Record|Verified Work Evidence|Degree awarded/iu).count(), 0);

    // A different browser context has no shared localStorage. It must recover
    // the complete record from D1 for the same authenticated learner.
    const contextB = await browser.newContext({ extraHTTPHeaders: AUTH_HEADERS });
    const pageB = await contextB.newPage();
    watchPage(pageB, failures);
    await pageB.goto(`${origin}${COURSE_PATH}`, { waitUntil: "domcontentloaded" });
    await waitForCloud(pageB);
    await pageB.getByText("Course passed", { exact: false }).waitFor();
    assert.equal(
      await pageB.locator('fieldset.universal-unit-checklist input[type="checkbox"]:checked').count(),
      8,
    );

    // This is a real control-level prerequisite assertion: an attempted click
    // cannot change the locked CS course checkbox.
    await pageB.goto(
      `${origin}/programs/computer-science/courses/data-structures`,
      { waitUntil: "domcontentloaded" },
    );
    await waitForCloud(pageB);
    const lockedChecklist = pageB.locator("fieldset.universal-unit-checklist");
    await lockedChecklist.waitFor();
    assert.equal(
      await lockedChecklist.evaluate((element) => element.hasAttribute("disabled")),
      true,
    );
    const lockedUnit = lockedChecklist.locator('input[type="checkbox"]').first();
    assert.equal(await lockedUnit.isDisabled(), true);
    await lockedUnit.evaluate((element) => element.click());
    assert.equal(await lockedUnit.isChecked(), false);
    for (const button of await pageB.getByRole("button", { name: "Start assessment" }).all()) {
      assert.equal(await button.isDisabled(), true);
    }

    // Product wiring, not just domain helpers: the rendered Study Plan must
    // expose the 30-course CS path while the directory still advertises all
    // 34 available courses. The bounded Today/record DTOs are exercised above
    // and query-budgeted independently in learner-read-model.test.ts.
    await pageB.goto(`${origin}/programs/computer-science`, {
      waitUntil: "domcontentloaded",
    });
    const studyPlan = pageB.locator("section#schedule");
    await studyPlan.waitFor();
    await pageB.waitForFunction(
      () =>
        document.querySelectorAll(
          "section#schedule ol.universal-placement-list li a",
        ).length === 30,
    );
    assert.equal(
      await studyPlan.locator("ol.universal-placement-list li a").count(),
      30,
    );
    assert.equal(await pageB.locator("section#courses article.catalog-row").count(), 34);

    await contextB.close();
    await contextA.close();
    assert.deepEqual(failures, [], failures.join("\n"));
  },
);


test(
  "signed-out gate: a learner with no account can tick week-sized work and keep it",
  { timeout: 120_000 },
  async (t) => {
    // The authenticated gate above never exercised this path, which is how a
    // permanently disabled checklist shipped: hydration was gated on
    // requestAnimationFrame, and that never fires in a hidden document, so a
    // signed-out page sat on "Checking cloud progress…" with every control
    // disabled.
    const persistRoot = await mkdtemp(join(tmpdir(), "course-atlas-guest-"));
    const { miniflare, origin } = await browserEnvironment(persistRoot);
    const browser = await chromium.launch({
      executablePath: await chromeExecutable(),
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
    t.after(async () => {
      await browser.close();
      await miniflare.dispose();
      await rm(persistRoot, { recursive: true, force: true });
    });

    const failures = [];
    // No auth headers: this is a visitor who never signs in.
    const context = await browser.newContext();
    const page = await context.newPage();
    watchPage(page, failures, { allowAnonymous: true });

    // Week-sized work exists only in the runnable Computer Science publication,
    // and CS101 has no prerequisites, so its checklist should be open.
    // The runnable Computer Science publication is large and this runs on a
    // cold Miniflare, so the default 30s navigation budget is too tight when
    // the suite is under load.
    await page.goto(
      `${origin}/programs/computer-science/courses/programming-1`,
      { waitUntil: "domcontentloaded", timeout: 90_000 },
    );
    const checklist = page.locator("fieldset.universal-unit-checklist");
    await checklist.waitFor();

    // The sync must settle rather than hang, or everything below is disabled.
    await page.waitForFunction(
      () => {
        const fieldset = document.querySelector("fieldset.universal-unit-checklist");
        return Boolean(fieldset) && !fieldset.disabled;
      },
      undefined,
      { timeout: 20_000 },
    );
    assert.equal(
      await page.locator("text=Checking cloud progress").count(),
      0,
      "A signed-out course page never finished checking for cloud progress.",
    );

    const unitBox = checklist.locator(".universal-unit-check > input").first();
    assert.equal(await unitBox.isDisabled(), false);
    assert.equal(await unitBox.isChecked(), false);

    const weekBoxes = checklist.locator(".universal-week-check input");
    const weekCount = await weekBoxes.count();
    assert.ok(weekCount > 0, "The course page exposed no week-sized work.");

    // Finishing every week of the first unit must complete that unit.
    const firstUnit = checklist.locator(".universal-unit-check").first();
    const firstUnitWeeks = firstUnit.locator(".universal-week-check input");
    const firstUnitWeekCount = await firstUnitWeeks.count();
    assert.ok(firstUnitWeekCount >= 2);
    for (let index = 0; index < firstUnitWeekCount; index += 1) {
      await firstUnitWeeks.nth(index).click();
    }
    await page.waitForTimeout(500);
    assert.equal(await unitBox.isChecked(), true);

    // The whole point: it is still there after a refresh.
    await page.reload({ waitUntil: "domcontentloaded", timeout: 90_000 });
    await checklist.waitFor();
    await page.waitForFunction(
      () => {
        const fieldset = document.querySelector("fieldset.universal-unit-checklist");
        return Boolean(fieldset) && !fieldset.disabled;
      },
      undefined,
      { timeout: 20_000 },
    );
    assert.equal(
      await checklist.locator(".universal-unit-check > input").first().isChecked(),
      true,
      "A signed-out learner's completed unit did not survive a refresh.",
    );
    for (let index = 0; index < firstUnitWeekCount; index += 1) {
      assert.equal(
        await checklist
          .locator(".universal-unit-check")
          .first()
          .locator(".universal-week-check input")
          .nth(index)
          .isChecked(),
        true,
        `Week ${index + 1} did not survive a refresh.`,
      );
    }
    assert.match(
      await page.locator("p.universal-progress-detail").innerText(),
      /1 of \d+ learning units complete/u,
    );

    await context.close();
    assert.deepEqual(failures, [], failures.join("\n"));
  },
);
