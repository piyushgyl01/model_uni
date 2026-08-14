import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { catalogRepository } from "../content/catalog";

const REQUEST_TIMEOUT_MS = 15_000;
const AUDIT_WORKERS = 12;
const HOST_SHARDS = 2;
const RETRY_TIMEOUT_MS = 20_000;
const RETRY_WORKERS = 8;
const HTTP_URL = /https?:\/\/[^\s)\]}>]+/giu;

export interface ResourceTarget {
  readonly programVersion: string;
  readonly course: string;
  readonly label: string;
  readonly url: string;
}

export interface AuditResult extends ResourceTarget {
  readonly ok: boolean;
  readonly attempt: 1 | 2;
  readonly checkedAt: string;
  readonly status?: number;
  readonly resolvedUrl?: string;
  readonly redirected?: boolean;
  readonly error?: string;
  readonly errorCode?: string;
}

export type ResourceAuditClassification =
  | "http-success"
  | "http-redirect"
  | "indeterminate-manual-only"
  | "definitively-broken";

export interface RunnableResourceAuditReport {
  readonly schemaVersion: "course-atlas-runnable-resource-audit/v1";
  readonly startedAt: string;
  readonly completedAt: string;
  readonly method: {
    readonly client: "CourseAtlasResourceAudit/1.0";
    readonly redirects: "follow";
    readonly requestTimeoutMs: number;
    readonly retryTimeoutMs: number;
    readonly maximumAttempts: 2;
  };
  readonly summary: {
    readonly uniqueUrls: number;
    readonly httpSuccess: number;
    readonly httpRedirect: number;
    readonly indeterminateManualOnly: number;
    readonly definitivelyBroken: number;
  };
  readonly results: readonly (AuditResult & {
    readonly classification: ResourceAuditClassification;
    readonly interpretation: string;
  })[];
}

function cleanUrl(value: string) {
  return value.replace(/[.,;:]$/u, "");
}

function exactLocatorUrls(value: string) {
  return (value.match(HTTP_URL) ?? []).map(cleanUrl);
}

function runnableTargets(): readonly ResourceTarget[] {
  const targets: ResourceTarget[] = [];
  for (const program of catalogRepository.listPrograms()) {
    for (const version of catalogRepository.listVersions(program.slug)) {
      const bundle = catalogRepository.loadBySlug(program.slug, version);
      if (bundle?.programVersion.qualityStandard !== "runnable-pathway-v1") {
        continue;
      }
      const courseTitleByVersionId = new Map(
        bundle.courseVersions.map((course) => [course.id, course.title]),
      );
      for (const resource of bundle.resourceVersions) {
        targets.push({
          programVersion: `${program.slug}@${version}`,
          course: "publication resource",
          label: resource.title,
          url: resource.canonicalUrl,
        });
      }
      for (const record of bundle.rights) {
        if (!record.licenseUrl) continue;
        targets.push({
          programVersion: `${program.slug}@${version}`,
          course: "publication rights",
          label: record.licenseIdentifier ?? "license terms",
          url: record.licenseUrl,
        });
      }
      for (const unit of bundle.learningUnits) {
        const course =
          courseTitleByVersionId.get(unit.courseVersionId) ?? unit.courseVersionId;
        for (const assignment of unit.weeklyAssignments ?? []) {
          const locatorUrls = exactLocatorUrls(assignment.resourceLocator);
          if (
            locatorUrls.length !== 1 ||
            assignment.sourceEvidence.url !== locatorUrls[0]
          ) {
            throw new Error(
              `${program.slug}@${version} ${course} week ${assignment.week} has source evidence that does not exactly match its single locator URL.`,
            );
          }
          targets.push({
            programVersion: `${program.slug}@${version}`,
            course,
            label: `Week ${assignment.week}: ${assignment.title}`,
            url: assignment.sourceEvidence.url,
          });
        }
      }
    }
  }
  return [...new Map(targets.map((target) => [target.url, target])).values()];
}

async function audit(
  target: ResourceTarget,
  timeoutMs = REQUEST_TIMEOUT_MS,
  attempt: 1 | 2 = 1,
): Promise<AuditResult> {
  try {
    const response = await fetch(target.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        accept: "text/html,application/pdf;q=0.9,*/*;q=0.5",
        "user-agent": "CourseAtlasResourceAudit/1.0 (+https://course-atlas-universal.piyush2022ug.chatgpt.site/)",
      },
    });
    await response.body?.cancel();
    return {
      ...target,
      ok: response.status >= 200 && response.status < 400,
      attempt,
      checkedAt: new Date().toISOString(),
      status: response.status,
      resolvedUrl: response.url,
      redirected: response.redirected || response.url !== target.url,
    };
  } catch (error) {
    const cause =
      error instanceof Error && error.cause && typeof error.cause === "object"
        ? (error.cause as { code?: unknown })
        : undefined;
    return {
      ...target,
      ok: false,
      attempt,
      checkedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      ...(typeof cause?.code === "string" ? { errorCode: cause.code } : {}),
    };
  }
}

async function auditTargets(
  targets: readonly ResourceTarget[],
  timeoutMs: number,
  workerCount: number,
  hostShards: number,
  attempt: 1 | 2 = 1,
) {
  const grouped = new Map<string, ResourceTarget[]>();
  const nextShardByHost = new Map<string, number>();
  for (const target of targets) {
    const host = new URL(target.url).host;
    const shard = nextShardByHost.get(host) ?? 0;
    nextShardByHost.set(host, (shard + 1) % hostShards);
    const key = `${host}:${shard}`;
    grouped.set(key, [...(grouped.get(key) ?? []), target]);
  }
  const groups = [...grouped.values()].sort(
    (left, right) => right.length - left.length,
  );
  const results: AuditResult[] = [];
  let nextGroup = 0;
  async function worker() {
    while (nextGroup < groups.length) {
      const group = groups[nextGroup];
      nextGroup += 1;
      for (const target of group) {
        results.push(await audit(target, timeoutMs, attempt));
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(workerCount, groups.length) }, worker),
  );
  return results;
}

export function isDefinitivelyBroken(result: AuditResult) {
  if (result.ok) return false;
  if (result.errorCode === "ENOTFOUND" || result.errorCode === "ERR_INVALID_URL") {
    return true;
  }
  return result.status !== undefined && [400, 404, 410].includes(result.status);
}

export function classifyAuditResult(
  result: AuditResult,
): ResourceAuditClassification {
  if (isDefinitivelyBroken(result)) return "definitively-broken";
  if (!result.ok) return "indeterminate-manual-only";
  return result.redirected || (result.status !== undefined && result.status >= 300)
    ? "http-redirect"
    : "http-success";
}

const INTERPRETATIONS: Record<ResourceAuditClassification, string> = {
  "http-success":
    "The automated HTTP client received a successful response at the exact URL.",
  "http-redirect":
    "The automated HTTP client followed a redirect and received a successful final response.",
  "indeterminate-manual-only":
    "The automated HTTP client could not verify this URL. Any persisted reachability claim remains manual editorial evidence only and is not upgraded by this audit.",
  "definitively-broken":
    "The automated check found a definitive broken-link signal; publication verification must fail until the URL is repaired.",
};

export function buildAuditReport(
  results: readonly AuditResult[],
  startedAt: string,
  completedAt: string,
): RunnableResourceAuditReport {
  const entries = [...results]
    .sort((left, right) => left.url.localeCompare(right.url))
    .map((result) => {
      const classification = classifyAuditResult(result);
      return {
        ...result,
        classification,
        interpretation: INTERPRETATIONS[classification],
      };
    });
  const count = (classification: ResourceAuditClassification) =>
    entries.filter((entry) => entry.classification === classification).length;
  return {
    schemaVersion: "course-atlas-runnable-resource-audit/v1",
    startedAt,
    completedAt,
    method: {
      client: "CourseAtlasResourceAudit/1.0",
      redirects: "follow",
      requestTimeoutMs: REQUEST_TIMEOUT_MS,
      retryTimeoutMs: RETRY_TIMEOUT_MS,
      maximumAttempts: 2,
    },
    summary: {
      uniqueUrls: entries.length,
      httpSuccess: count("http-success"),
      httpRedirect: count("http-redirect"),
      indeterminateManualOnly: count("indeterminate-manual-only"),
      definitivelyBroken: count("definitively-broken"),
    },
    results: entries,
  };
}

export function assertAuditHasNoDefinitiveBreakage(
  report: RunnableResourceAuditReport,
) {
  if (report.summary.definitivelyBroken === 0) return;
  throw new Error(
    `${report.summary.definitivelyBroken} of ${report.summary.uniqueUrls} exact runnable-resource locations are definitively broken; the complete dated result is preserved in the emitted report.`,
  );
}

function requestedReportPath(args: readonly string[]) {
  const equalsArgument = args.find((argument) =>
    argument.startsWith("--report="),
  );
  if (equalsArgument) {
    const value = equalsArgument.slice("--report=".length).trim();
    if (!value) throw new Error("--report requires a non-empty file path.");
    return resolve(value);
  }
  const index = args.indexOf("--report");
  if (index < 0) return undefined;
  const value = args[index + 1]?.trim();
  if (!value) throw new Error("--report requires a file path.");
  return resolve(value);
}

async function emitReport(
  report: RunnableResourceAuditReport,
  reportPath: string | undefined,
) {
  const payload = `${JSON.stringify(report, null, 2)}\n`;
  if (!reportPath) {
    process.stdout.write(payload);
    return;
  }
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, payload, { encoding: "utf8", flag: "wx" });
  console.error(`Wrote runnable-resource audit report to ${reportPath}.`);
}

export async function main(args = process.argv.slice(2)) {
  const startedAt = new Date().toISOString();
  const reportPath = requestedReportPath(args);
  const targets = runnableTargets();
  if (targets.length === 0) {
    throw new Error("No runnable-pathway publications are registered.");
  }
  let results = await auditTargets(
    targets,
    REQUEST_TIMEOUT_MS,
    AUDIT_WORKERS,
    HOST_SHARDS,
  );
  const retryTargets = results
    .filter((result) => !result.ok)
    .map(({ programVersion, course, label, url }) => ({
      programVersion,
      course,
      label,
      url,
    }));
  const retryByUrl = new Map(
    (
      await auditTargets(
        retryTargets,
        RETRY_TIMEOUT_MS,
        RETRY_WORKERS,
        1,
        2,
      )
    ).map((result) => [result.url, result]),
  );
  results = results.map((result) =>
    result.ok ? result : (retryByUrl.get(result.url) ?? result),
  );
  const report = buildAuditReport(
    results,
    startedAt,
    new Date().toISOString(),
  );
  await emitReport(report, reportPath);
  console.error(
    `Automated audit: ${report.summary.httpSuccess} direct successes, ${report.summary.httpRedirect} redirect successes, ${report.summary.indeterminateManualOnly} indeterminate/manual-only, and ${report.summary.definitivelyBroken} definitively broken across ${report.summary.uniqueUrls} unique URLs.`,
  );
  assertAuditHasNoDefinitiveBreakage(report);
}

const entrypoint = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : undefined;
if (entrypoint === import.meta.url) await main();
