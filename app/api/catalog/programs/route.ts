import {
  CatalogQueryError,
  parseProgramPageSearchParams,
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
    const query = parseProgramPageSearchParams(new URL(request.url).searchParams);
    const repository = await getRuntimeCatalogRepository();
    const [page, stats] = await Promise.all([
      repository.listProgramPage(query),
      repository.getCatalogStats(),
    ]);
    return json({
      schemaVersion: 1,
      items: page.items,
      ...(page.nextCursor ? { nextCursor: page.nextCursor } : {}),
      ...(stats ? { stats } : {}),
    });
  } catch (error) {
    if (error instanceof CatalogQueryError) {
      return json({ error: error.message }, 400);
    }
    console.error("Catalog program API failed", error);
    return json({ error: "Catalog programs are temporarily unavailable." }, 500);
  }
}
