import {
  CatalogQueryError,
  parseCourseSearchParams,
} from "../../../catalog/catalog-read-model";
import { getRuntimeCatalogRepository } from "../../../catalog/cloudflare-catalog";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "cache-control":
        status === 200
          ? "public, max-age=60, stale-while-revalidate=300"
          : "no-store",
      "content-type": "application/json; charset=utf-8",
    },
  });
}

export async function GET(request: Request) {
  try {
    const query = parseCourseSearchParams(new URL(request.url).searchParams);
    const page = await (await getRuntimeCatalogRepository()).searchCourses(query);
    return json({
      schemaVersion: 1,
      items: page.items,
      ...(page.nextCursor ? { nextCursor: page.nextCursor } : {}),
    });
  } catch (error) {
    if (error instanceof CatalogQueryError) {
      return json({ error: error.message }, 400);
    }
    console.error("Catalog course API failed", error);
    return json({ error: "Catalog courses are temporarily unavailable." }, 500);
  }
}
