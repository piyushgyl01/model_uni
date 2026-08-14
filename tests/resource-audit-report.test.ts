import assert from "node:assert/strict";
import test from "node:test";
import {
  assertAuditHasNoDefinitiveBreakage,
  buildAuditReport,
  classifyAuditResult,
  type AuditResult,
} from "../scripts/audit-runnable-resources";

const CHECKED_AT = "2026-08-14T12:00:00.000Z";

function result(
  url: string,
  values: Partial<AuditResult>,
): AuditResult {
  return {
    programVersion: "computer-science@1.2.0",
    course: "Test course",
    label: "Week 1: exact source",
    url,
    ok: true,
    attempt: 1,
    checkedAt: CHECKED_AT,
    status: 200,
    resolvedUrl: url,
    redirected: false,
    ...values,
  };
}

test("the dated report distinguishes HTTP evidence from manual-only outcomes", () => {
  const values = [
    result("https://example.edu/z-broken", {
      ok: false,
      attempt: 2,
      status: 404,
    }),
    result("https://example.edu/a-success", {}),
    result("https://example.edu/c-blocked", {
      ok: false,
      attempt: 2,
      status: 403,
    }),
    result("https://example.edu/b-redirect", {
      redirected: true,
      resolvedUrl: "https://www.example.edu/b-redirect",
    }),
  ];

  const report = buildAuditReport(
    values,
    "2026-08-14T11:59:00.000Z",
    "2026-08-14T12:01:00.000Z",
  );

  assert.equal(
    report.schemaVersion,
    "course-atlas-runnable-resource-audit/v1",
  );
  assert.deepEqual(report.summary, {
    uniqueUrls: 4,
    httpSuccess: 1,
    httpRedirect: 1,
    indeterminateManualOnly: 1,
    definitivelyBroken: 1,
  });
  assert.deepEqual(
    report.results.map((entry) => entry.url),
    [...values.map((entry) => entry.url)].sort(),
  );
  const blocked = report.results.find(
    (entry) => entry.url === "https://example.edu/c-blocked",
  );
  assert.equal(blocked?.classification, "indeterminate-manual-only");
  assert.match(blocked?.interpretation ?? "", /could not verify/i);
  assert.match(blocked?.interpretation ?? "", /manual editorial evidence only/i);
  assert.equal(
    report.results.find(
      (entry) => entry.url === "https://example.edu/z-broken",
    )?.classification,
    "definitively-broken",
  );
  assert.throws(
    () => assertAuditHasNoDefinitiveBreakage(report),
    /1 of 4 exact runnable-resource locations are definitively broken/,
  );
});

test("DNS failures are definitive while timeouts remain indeterminate", () => {
  const dnsFailure = result("https://missing.invalid/resource", {
    ok: false,
    attempt: 2,
    status: undefined,
    resolvedUrl: undefined,
    error: "fetch failed",
    errorCode: "ENOTFOUND",
  });
  const timeout = result("https://slow.example.edu/resource", {
    ok: false,
    attempt: 2,
    status: undefined,
    resolvedUrl: undefined,
    error: "The operation was aborted due to timeout",
    errorCode: undefined,
  });

  assert.equal(classifyAuditResult(dnsFailure), "definitively-broken");
  assert.equal(classifyAuditResult(timeout), "indeterminate-manual-only");
});
