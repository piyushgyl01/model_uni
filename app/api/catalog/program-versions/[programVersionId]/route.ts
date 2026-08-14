import type { ProgramVersionId } from "../../../../domain/catalog";
import { getRuntimeCatalogRepository } from "../../../../catalog/cloudflare-catalog";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "cache-control":
        status === 200
          ? "public, max-age=31536000, immutable"
          : "no-store",
      "content-type": "application/json; charset=utf-8",
    },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ programVersionId: string }> },
) {
  const { programVersionId } = await context.params;
  if (!/^prv_[A-Za-z0-9][A-Za-z0-9._-]{0,179}$/.test(programVersionId)) {
    return json({ error: "programVersionId is invalid." }, 400);
  }
  try {
    const bundle = await (
      await getRuntimeCatalogRepository()
    ).loadByProgramVersionId(programVersionId as ProgramVersionId);
    if (!bundle) return json({ error: "Program version was not found." }, 404);
    return json({ bundle });
  } catch (error) {
    console.error("Catalog program-version API failed", error);
    return json({ error: "Catalog program version is temporarily unavailable." }, 500);
  }
}
