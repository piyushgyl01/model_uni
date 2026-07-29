import type {
  D1DatabaseLike,
} from "./d1-contract";
import type {
  ResourceVersionId,
  FreshnessRecordId,
  AccessOfferId,
  RightsRecordId,
  ProvenanceEvidenceId,
  FreshnessStatus,
  AccessType,
  RightsStatus,
} from "../domain/catalog";

export interface FreshnessCheckResult {
  readonly resourceVersionId: ResourceVersionId;
  readonly status: FreshnessStatus;
  readonly checkedAt: string;
  readonly httpStatus?: number;
  readonly resolvedUrl?: string;
  readonly contentFingerprint?: string;
  readonly note?: string;
}

export interface AccessCheckResult {
  readonly resourceVersionId: ResourceVersionId;
  readonly type: AccessType;
  readonly region: string;
  readonly loginRequired: boolean;
  readonly price?: { readonly amount: number; readonly currency: string };
  readonly checkedAt: string;
  readonly note?: string;
}

export interface RightsCheckResult {
  readonly resourceVersionId: ResourceVersionId;
  readonly status: RightsStatus;
  readonly licenseIdentifier?: string;
  readonly licenseUrl?: string;
  readonly copyrightHolder?: string;
  readonly mayMirror: boolean;
  readonly mayAdapt: boolean;
  readonly verifiedAt: string;
  readonly evidenceIds: readonly ProvenanceEvidenceId[];
  readonly note?: string;
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: "follow",
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkResourceFreshness(
  database: D1DatabaseLike,
  resourceVersionId: ResourceVersionId,
  canonicalUrl: string,
): Promise<FreshnessCheckResult> {
  const checkedAt = new Date().toISOString();
  let status: FreshnessStatus = "unchecked";
  let httpStatus: number | undefined;
  let resolvedUrl: string | undefined;
  let contentFingerprint: string | undefined;
  let note: string | undefined;

  try {
    const response = await fetchWithTimeout(canonicalUrl, { method: "HEAD" });
    httpStatus = response.status;
    resolvedUrl = response.url;

    if (response.status >= 200 && response.status < 300) {
      if (response.url !== canonicalUrl) {
        status = "redirected";
        note = `Redirected from ${canonicalUrl} to ${response.url}`;
      } else {
        status = "healthy";
      }

      const contentType = response.headers.get("content-type") ?? "";
      const contentLength = response.headers.get("content-length") ?? "";
      const etag = response.headers.get("etag") ?? "";
      const lastModified = response.headers.get("last-modified") ?? "";
      contentFingerprint = await hashString(`${contentType}|${contentLength}|${etag}|${lastModified}`);
    } else if (response.status >= 400 && response.status < 500) {
      status = "broken";
      note = `HTTP ${response.status}: ${response.statusText}`;
    } else {
      status = "temporarily unavailable";
      note = `HTTP ${response.status}: ${response.statusText}`;
    }
  } catch (error) {
    status = "temporarily unavailable";
    note = error instanceof Error ? error.message : "Network error";
  }

  const freshnessId = generateId("frs") as FreshnessRecordId;

  await database
    .prepare(
      `INSERT INTO resource_freshness (id, resource_version_id, status, checked_at, http_status, resolved_url, content_fingerprint, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(resource_version_id, id) DO UPDATE SET
         status = excluded.status,
         checked_at = excluded.checked_at,
         http_status = excluded.http_status,
         resolved_url = excluded.resolved_url,
         content_fingerprint = excluded.content_fingerprint,
         note = excluded.note`,
    )
    .bind(
      freshnessId,
      resourceVersionId,
      status,
      checkedAt,
      httpStatus ?? null,
      resolvedUrl ?? null,
      contentFingerprint ?? null,
      note ?? null,
    )
    .run();

  return {
    resourceVersionId,
    status,
    checkedAt,
    httpStatus,
    resolvedUrl,
    contentFingerprint,
    note,
  };
}

export async function checkResourceAccess(
  database: D1DatabaseLike,
  resourceVersionId: ResourceVersionId,
  canonicalUrl: string,
): Promise<AccessCheckResult> {
  const checkedAt = new Date().toISOString();
  let type: AccessType = "unknown";
  let region = "*";
  let loginRequired = false;
  let price: { readonly amount: number; readonly currency: string } | undefined;
  let note: string | undefined;

  try {
    const response = await fetchWithTimeout(canonicalUrl, { method: "GET" });
    const contentType = response.headers.get("content-type") ?? "";
    const isHtml = contentType.includes("text/html");

    if (response.status === 200) {
      if (isHtml && (await hasLoginForm(await response.text()))) {
        type = "free audit";
        loginRequired = true;
        note = "Content requires login for full access";
      } else {
        type = "free";
      }
    } else if (response.status === 401 || response.status === 403) {
      type = "free audit";
      loginRequired = true;
      note = "Authentication required";
    } else {
      type = "unknown";
      note = `HTTP ${response.status}`;
    }
  } catch {
    type = "unknown";
    note = "Network error during access check";
  }

  const accessId = generateId("acc") as AccessOfferId;

  await database
    .prepare(
      `INSERT INTO access_offers (id, resource_version_id, type, region, login_required, price_minor, currency, checked_at, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(resource_version_id, id) DO UPDATE SET
         type = excluded.type,
         region = excluded.region,
         login_required = excluded.login_required,
         price_minor = excluded.price_minor,
         currency = excluded.currency,
         checked_at = excluded.checked_at,
         note = excluded.note`,
    )
    .bind(
      accessId,
      resourceVersionId,
      type,
      region,
      loginRequired ? 1 : 0,
      price?.amount ?? null,
      price?.currency ?? null,
      checkedAt,
      note ?? null,
    )
    .run();

  return {
    resourceVersionId,
    type,
    region,
    loginRequired,
    price,
    checkedAt,
    note,
  };
}

async function hasLoginForm(html: string): Promise<boolean> {
  const loginIndicators = [
    '<form',
    'type="password"',
    'name="password"',
    'id="password"',
    "sign in",
    "log in",
    "login",
    "authentication",
  ];
  const lower = html.toLowerCase();
  return loginIndicators.some((indicator) => lower.includes(indicator));
}

async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function runFreshnessChecks(
  database: D1DatabaseLike,
  limit = 50,
): Promise<FreshnessCheckResult[]> {
  const resourceVersions = await database
    .prepare(
      `SELECT id, canonical_url FROM resource_versions 
       WHERE status = 'published'
       ORDER BY id
       LIMIT ?`,
    )
    .bind(limit)
    .all<{ id: ResourceVersionId; canonical_url: string }>();

  const results: FreshnessCheckResult[] = [];
  for (const rv of resourceVersions.results) {
    const result = await checkResourceFreshness(database, rv.id, rv.canonical_url);
    results.push(result);
  }
  return results;
}

export async function runAccessChecks(
  database: D1DatabaseLike,
  limit = 50,
): Promise<AccessCheckResult[]> {
  const resourceVersions = await database
    .prepare(
      `SELECT id, canonical_url FROM resource_versions 
       WHERE status = 'published'
       ORDER BY id
       LIMIT ?`,
    )
    .bind(limit)
    .all<{ id: ResourceVersionId; canonical_url: string }>();

  const results: AccessCheckResult[] = [];
  for (const rv of resourceVersions.results) {
    const result = await checkResourceAccess(database, rv.id, rv.canonical_url);
    results.push(result);
  }
  return results;
}