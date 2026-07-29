/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

type FreshnessStatus = "healthy" | "redirected" | "temporarily_unavailable" | "broken" | "unchecked";

async function checkResourceFreshness(
  db: D1Database,
  resourceVersionId: string,
  canonicalUrl: string,
): Promise<{
  status: FreshnessStatus;
  httpStatus?: number;
  resolvedUrl?: string;
  contentFingerprint?: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    const response = await fetch(canonicalUrl, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const httpStatus = response.status;
    const resolvedUrl = response.url;

    let status: FreshnessStatus;
    if (httpStatus >= 200 && httpStatus < 300) {
      status = resolvedUrl !== canonicalUrl ? "redirected" : "healthy";
    } else if (httpStatus >= 300 && httpStatus < 400) {
      status = "redirected";
    } else if (httpStatus >= 400 && httpStatus < 500) {
      status = "broken";
    } else {
      status = "temporarily_unavailable";
    }

    let contentFingerprint: string | undefined;
    if (status === "healthy" || status === "redirected") {
      try {
        const getResponse = await fetch(canonicalUrl, {
          method: "GET",
          redirect: "follow",
          signal: AbortSignal.timeout(15_000),
        });
        const content = await getResponse.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", content);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        contentFingerprint = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      } catch {
        // Ignore fingerprint errors
      }
    }

    return { status, httpStatus, resolvedUrl, contentFingerprint };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { status: "temporarily_unavailable" };
    }
    return { status: "broken" };
  }
}

async function runFreshnessCheck(db: D1Database, batchSize = 50): Promise<{
  checked: number;
  updated: number;
  errors: number;
}> {
  const now = new Date().toISOString();

  const resources = await db
    .prepare(
      `SELECT rv.id as resource_version_id, rv.canonical_url, 
              rf.id as freshness_id
       FROM resource_versions rv
       LEFT JOIN resource_freshness rf ON rf.resource_version_id = rv.id
       WHERE rv.status = 'published'
       ORDER BY rf.checked_at ASC NULLS FIRST
       LIMIT ?`,
    )
    .bind(batchSize)
    .all<{
      resource_version_id: string;
      canonical_url: string;
      freshness_id?: string;
    }>();

  let checked = 0;
  let updated = 0;
  let errors = 0;

  for (const resource of resources.results ?? []) {
    checked++;
    try {
      const result = await checkResourceFreshness(
        db,
        resource.resource_version_id,
        resource.canonical_url,
      );

      if (resource.freshness_id) {
        await db
          .prepare(
            `UPDATE resource_freshness
             SET status = ?, checked_at = ?, http_status = ?, resolved_url = ?, 
                 content_fingerprint = ?, note = ''
             WHERE id = ?`,
          )
          .bind(
            result.status,
            now,
            result.httpStatus ?? null,
            result.resolvedUrl ?? null,
            result.contentFingerprint ?? null,
            resource.freshness_id,
          )
          .run();
      } else {
        const freshnessId = `frs_${crypto.randomUUID().slice(0, 24)}`;
        await db
          .prepare(
            `INSERT INTO resource_freshness 
             (id, resource_version_id, status, checked_at, http_status, resolved_url, content_fingerprint, note)
             VALUES (?, ?, ?, ?, ?, ?, ?, '')`,
          )
          .bind(
            freshnessId,
            resource.resource_version_id,
            result.status,
            now,
            result.httpStatus ?? null,
            result.resolvedUrl ?? null,
            result.contentFingerprint ?? null,
          )
          .run();
      }
      updated++;
    } catch {
      errors++;
    }
  }

  return { checked, updated, errors };
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body)
            .transform(width > 0 ? { width } : {})
            .output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    if (url.pathname === "/_api/freshness-check" && request.method === "POST") {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${env.FRESHNESS_CHECK_TOKEN}`) {
        return new Response("Unauthorized", { status: 401 });
      }

      const { batchSize = 50 } = await request.json().catch(() => ({}));
      const result = await runFreshnessCheck(env.DB, batchSize);

      return Response.json({
        success: true,
        ...result,
        timestamp: new Date().toISOString(),
      });
    }

    return handler.fetch(request, env, ctx);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    if (event.cron === "0 6 * * *") {
      ctx.waitUntil(runFreshnessCheck(env.DB, 200));
    }
  },
};

export default worker;