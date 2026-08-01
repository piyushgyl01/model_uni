import {
  catalogImportErrorResponse,
  catalogImportSuccessResponse,
  importPublishedCatalogBundles,
  readCatalogImportBundles,
  rejectCrossOriginCatalogMutation,
  requireCatalogPublisher,
} from "../../../catalog/catalog-import";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    rejectCrossOriginCatalogMutation(request);
    await requireCatalogPublisher();
    const bundles = await readCatalogImportBundles(request);
    return catalogImportSuccessResponse(
      await importPublishedCatalogBundles(bundles),
    );
  } catch (error) {
    return catalogImportErrorResponse(error);
  }
}
