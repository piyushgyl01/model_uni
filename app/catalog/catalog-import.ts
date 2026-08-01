import { getChatGPTUser, type ChatGPTUser } from "../chatgpt-auth";
import type { PublishedProgramBundle } from "../domain/catalog";
import {
  validateCatalogBundles,
  validatePublishedProgramBundle,
} from "../domain/validation";
import {
  CatalogShadowMismatchError,
  compareCatalogBundleShadows,
} from "./catalog-shadow";
import {
  getCatalogD1Binding,
  getRuntimeCatalogRepository,
} from "./cloudflare-catalog";
import {
  CatalogDataError,
  CatalogSeedConflictError,
  D1CatalogRepository,
  seedPublishedProgramBundles,
} from "./d1-repository";
import { D1OperationError } from "./d1-contract";
import type { D1DatabaseLike } from "./d1-contract";
import { CatalogValidationError } from "./static-repository";

export const MAX_CATALOG_IMPORT_BYTES = 16 * 1024 * 1024;
export const MAX_CATALOG_IMPORT_BUNDLES = 16;
const MAX_RESOURCE_URL_CONFLICTS = 100;

const PUBLISHER_IDS_BINDING = "CATALOG_PUBLISHER_IDS";

export class CatalogImportRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "CatalogImportRequestError";
  }
}

export interface CatalogImportResult {
  readonly insertedBundleIds: readonly string[];
  readonly unchangedBundleIds: readonly string[];
}

export interface CatalogImportStorage {
  readonly database: D1DatabaseLike;
  readonly initialize: () => Promise<unknown>;
}

export interface CatalogResourceUrlConflict {
  readonly canonicalUrl: string;
  readonly incomingBundleId: string;
  readonly incomingResourceId: string;
  readonly incomingResourceVersionId: string;
  readonly publishedBundleId: string;
  readonly publishedResourceId: string;
  readonly publishedResourceVersionId: string;
}

export class CatalogResourceUrlConflictError extends Error {
  constructor(
    readonly conflicts: readonly CatalogResourceUrlConflict[],
    readonly truncated: boolean,
  ) {
    super(
      `${conflicts.length} imported resource URL collision${
        conflicts.length === 1 ? "" : "s"
      } must reuse published resource identities.`,
    );
    this.name = "CatalogResourceUrlConflictError";
  }
}

function noStoreJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { ...init, headers });
}

function requestError(status: number, message: string): never {
  throw new CatalogImportRequestError(status, message);
}

function runtimeModuleIsUnavailable(error: unknown): boolean {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
  const message = error instanceof Error ? error.message : String(error);
  return (
    code === "ERR_MODULE_NOT_FOUND" ||
    code === "ERR_UNSUPPORTED_ESM_URL_SCHEME" ||
    message.includes("cloudflare:workers")
  );
}

async function getPublisherIdsBinding(): Promise<string | undefined> {
  try {
    const { env } = await import("cloudflare:workers");
    const value = (env as unknown as Record<string, unknown>)[
      PUBLISHER_IDS_BINDING
    ];
    if (typeof value === "string") return value;
    // Cloudflare's Node compatibility layer mirrors text bindings into
    // process.env. This also keeps the same fail-closed behavior in local
    // builds whose binding manifest only declares durable resources.
    return process.env[PUBLISHER_IDS_BINDING];
  } catch (error) {
    if (runtimeModuleIsUnavailable(error)) {
      return process.env[PUBLISHER_IDS_BINDING];
    }
    throw error;
  }
}

function parsePublisherIds(value: string | undefined): ReadonlySet<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

export async function requireCatalogPublisher(): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (!user) {
    requestError(401, "ChatGPT sign-in is required to publish catalog data.");
  }

  const publisherIds = parsePublisherIds(await getPublisherIdsBinding());
  if (!publisherIds.has(user.id)) {
    // Missing, empty, and malformed bindings all fail closed here.
    requestError(403, "This account is not authorized to publish catalog data.");
  }
  return user;
}

export function rejectCrossOriginCatalogMutation(request: Request): void {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin && origin !== requestOrigin) {
    requestError(403, "Cross-origin catalog writes are not allowed.");
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    requestError(403, "Cross-site catalog writes are not allowed.");
  }
}

async function readBoundedUtf8(request: Request): Promise<string> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    const bytes = Number(declaredLength);
    if (!Number.isSafeInteger(bytes) || bytes < 0) {
      requestError(400, "Content-Length must be a non-negative integer.");
    }
    if (bytes > MAX_CATALOG_IMPORT_BYTES) {
      requestError(413, "Catalog import payload is too large.");
    }
  }

  if (!request.body) requestError(400, "Catalog import payload is required.");

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let receivedBytes = 0;
  let text = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      receivedBytes += chunk.value.byteLength;
      if (receivedBytes > MAX_CATALOG_IMPORT_BYTES) {
        await reader.cancel("Catalog import payload is too large.");
        requestError(413, "Catalog import payload is too large.");
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
  } catch (error) {
    if (error instanceof CatalogImportRequestError) throw error;
    requestError(400, "Catalog import payload must be valid UTF-8.");
  }
  return text;
}

export async function readCatalogImportBundles(
  request: Request,
): Promise<readonly PublishedProgramBundle[]> {
  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (contentType !== "application/json") {
    requestError(415, "Catalog imports require application/json.");
  }

  const text = await readBoundedUtf8(request);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    requestError(400, "Catalog import payload must be valid JSON.");
  }

  const candidates = Array.isArray(parsed) ? parsed : [parsed];
  if (candidates.length === 0) {
    requestError(400, "Catalog import must contain at least one bundle.");
  }
  if (candidates.length > MAX_CATALOG_IMPORT_BUNDLES) {
    requestError(
      400,
      `Catalog import cannot contain more than ${MAX_CATALOG_IMPORT_BUNDLES} bundles.`,
    );
  }

  const bundles = candidates.map((candidate, index) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      requestError(400, `Catalog bundle ${index + 1} must be a JSON object.`);
    }
    const bundle = candidate as PublishedProgramBundle;
    let validation: ReturnType<typeof validatePublishedProgramBundle>;
    try {
      validation = validatePublishedProgramBundle(bundle);
    } catch {
      requestError(
        400,
        `Catalog bundle ${index + 1} does not have a complete publication shape.`,
      );
    }
    if (!validation.valid) {
      throw new CatalogValidationError(
        validation.issues.map(
          (issue) => `bundles[${index}].${issue.path}: ${issue.message}`,
        ),
      );
    }
    return bundle;
  });

  return bundles;
}

function publicationIdentitiesOverlap(
  existing: PublishedProgramBundle,
  incoming: PublishedProgramBundle,
): boolean {
  return (
    existing.id === incoming.id ||
    existing.programVersion.id === incoming.programVersion.id ||
    (existing.program.id === incoming.program.id &&
      existing.programVersion.version === incoming.programVersion.version)
  );
}

function assertCrossBundleConsistency(
  existing: readonly PublishedProgramBundle[],
  incoming: readonly PublishedProgramBundle[],
): void {
  // Exact immutable publication identities are intentionally excluded. The
  // seed layer owns exact-content idempotence and hash-conflict detection.
  const nonReplacedExisting = existing.filter(
    (published) =>
      !incoming.some((candidate) =>
        publicationIdentitiesOverlap(published, candidate),
      ),
  );
  const validation = validateCatalogBundles([
    ...nonReplacedExisting,
    ...incoming,
  ]);
  if (!validation.valid) {
    throw new CatalogValidationError(
      validation.issues.map((issue) => `${issue.path}: ${issue.message}`),
    );
  }
}

function normalizeCanonicalResourceUrl(value: string): string {
  const url = new URL(value);
  url.hash = "";
  url.searchParams.sort();
  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }
  return url.href;
}

function assertNoNewResourceUrlCollisions(
  existing: readonly PublishedProgramBundle[],
  incoming: readonly PublishedProgramBundle[],
): void {
  type ResourceReference = {
    readonly bundle: PublishedProgramBundle;
    readonly resourceId: string;
    readonly resourceVersionId: string;
  };
  const indexResources = (bundles: readonly PublishedProgramBundle[]) => {
    const index = new Map<string, ResourceReference[]>();
    for (const bundle of bundles) {
      for (const version of bundle.resourceVersions) {
        const canonicalUrl = normalizeCanonicalResourceUrl(
          version.canonicalUrl,
        );
        index.set(canonicalUrl, [
          ...(index.get(canonicalUrl) ?? []),
          {
            bundle,
            resourceId: version.resourceId,
            resourceVersionId: version.id,
          },
        ]);
      }
    }
    return index;
  };

  const existingByUrl = indexResources(existing);
  const incomingByUrl = indexResources(incoming);
  const conflicts: CatalogResourceUrlConflict[] = [];
  const seen = new Set<string>();
  let truncated = false;

  for (const candidate of incoming) {
    const exactExisting = existing.find((published) =>
      publicationIdentitiesOverlap(published, candidate),
    );
    if (exactExisting) {
      // Existing seed publications contain a few historical duplicate URLs.
      // Exact publication identities belong to seed hash/conflict validation,
      // which keeps both idempotent and changed-identity behavior deterministic.
      continue;
    }

    for (const resourceVersion of candidate.resourceVersions) {
      const canonicalUrl = normalizeCanonicalResourceUrl(
        resourceVersion.canonicalUrl,
      );
      const comparisons = [
        ...(existingByUrl.get(canonicalUrl) ?? []),
        ...(incomingByUrl.get(canonicalUrl) ?? []).filter(
          (reference) => reference.bundle !== candidate,
        ),
      ];
      for (const published of comparisons) {
        if (published.resourceId === resourceVersion.resourceId) continue;
        const key = [
          candidate.id,
          resourceVersion.id,
          published.bundle.id,
          published.resourceVersionId,
          canonicalUrl,
        ].join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        conflicts.push({
          canonicalUrl,
          incomingBundleId: candidate.id,
          incomingResourceId: resourceVersion.resourceId,
          incomingResourceVersionId: resourceVersion.id,
          publishedBundleId: published.bundle.id,
          publishedResourceId: published.resourceId,
          publishedResourceVersionId: published.resourceVersionId,
        });
        if (conflicts.length >= MAX_RESOURCE_URL_CONFLICTS) {
          truncated = true;
          break;
        }
      }
      if (truncated) break;
    }
    if (truncated) break;
  }

  if (conflicts.length > 0) {
    throw new CatalogResourceUrlConflictError(conflicts, truncated);
  }
}

export async function importPublishedCatalogBundles(
  bundles: readonly PublishedProgramBundle[],
  storage?: CatalogImportStorage,
): Promise<CatalogImportResult> {
  const database = storage?.database ?? (await getCatalogD1Binding());
  if (!database) {
    requestError(503, "Catalog publication storage is not available.");
  }

  // This initializes the runtime schema and idempotently seeds checked-in
  // publications. A present-but-broken D1 binding is never hidden by fallback.
  if (storage) await storage.initialize();
  else await getRuntimeCatalogRepository();
  const repository = new D1CatalogRepository(database);
  const existing = await repository.loadAll();
  assertNoNewResourceUrlCollisions(existing, bundles);
  assertCrossBundleConsistency(existing, bundles);

  const insertedBundleIds: string[] = [];
  const unchangedBundleIds: string[] = [];
  for (const bundle of bundles) {
    const seed = await seedPublishedProgramBundles(database, [bundle]);
    if (seed.inserted === 1) insertedBundleIds.push(bundle.id);
    else unchangedBundleIds.push(bundle.id);
  }

  const reconstructed = (
    await Promise.all(
      bundles.map((bundle) =>
        repository.loadByProgramId(
          bundle.program.id,
          bundle.programVersion.version,
        ),
      ),
    )
  ).filter((bundle) => bundle !== undefined);
  const shadow = compareCatalogBundleShadows(bundles, reconstructed);
  if (!shadow.matches) throw new CatalogShadowMismatchError(shadow);

  return { insertedBundleIds, unchangedBundleIds };
}

export function catalogImportErrorResponse(error: unknown): Response {
  if (error instanceof CatalogImportRequestError) {
    return noStoreJson({ error: error.message }, { status: error.status });
  }
  if (error instanceof CatalogValidationError) {
    return noStoreJson(
      {
        error: "Catalog publication validation failed.",
        problems: error.problems.slice(0, 100),
      },
      { status: 400 },
    );
  }
  if (error instanceof CatalogSeedConflictError) {
    return noStoreJson(
      {
        error: "An immutable catalog publication identity already has different content.",
        bundleId: error.bundleId,
        differences: error.differences.slice(0, 25),
      },
      { status: 409 },
    );
  }
  if (error instanceof CatalogResourceUrlConflictError) {
    return noStoreJson(
      {
        error:
          "An imported resource URL is already published under another resource identity. Reuse the published resource and resource-version IDs.",
        conflicts: error.conflicts,
        truncated: error.truncated,
      },
      { status: 409 },
    );
  }
  if (error instanceof CatalogDataError || error instanceof D1OperationError) {
    console.error("Catalog publication storage failed", error);
    return noStoreJson(
      { error: "Catalog publication storage is temporarily unavailable." },
      { status: 503 },
    );
  }
  if (error instanceof CatalogShadowMismatchError) {
    console.error("Imported catalog shadow verification failed", error);
    return noStoreJson(
      { error: "The imported catalog could not be verified after storage." },
      { status: 500 },
    );
  }
  console.error("Catalog publication request failed", error);
  return noStoreJson(
    { error: "Catalog publication is temporarily unavailable." },
    { status: 503 },
  );
}

export function catalogImportSuccessResponse(
  result: CatalogImportResult,
): Response {
  const inserted = result.insertedBundleIds.length;
  const unchanged = result.unchangedBundleIds.length;
  return noStoreJson(
    {
      inserted,
      unchanged,
      insertedBundleIds: result.insertedBundleIds,
      unchangedBundleIds: result.unchangedBundleIds,
    },
    { status: inserted > 0 ? 201 : 200 },
  );
}
