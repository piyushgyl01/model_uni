import { mkdir, writeFile } from "node:fs/promises";
import { dirname, parse, resolve } from "node:path";
import { canonicalJson, sha256Hex } from "../app/catalog/canonical-json";
import { collectStaticCatalogBundles } from "../app/catalog/d1-repository";
import { catalogRepository } from "../content/catalog";

function usage(): never {
  throw new Error(
    "Usage: npm run catalog:export -- <new-output-directory>",
  );
}

const requestedDirectory = process.argv[2];
if (!requestedDirectory || requestedDirectory === "--help") usage();

const outputDirectory = resolve(requestedDirectory);
if (outputDirectory === parse(outputDirectory).root) {
  throw new Error("Refusing to export into a filesystem root.");
}

const bundles = [...collectStaticCatalogBundles(catalogRepository)].sort(
  (left, right) =>
    left.program.canonicalSlug.localeCompare(right.program.canonicalSlug) ||
    left.programVersion.version.localeCompare(right.programVersion.version),
);

const exports = await Promise.all(
  bundles.map(async (bundle) => {
    const file = `${bundle.program.canonicalSlug}-${bundle.programVersion.version}.catalog.json`;
    const payload = canonicalJson(bundle);
    return {
      file,
      payload,
      manifestEntry: {
        bundleId: bundle.id,
        bytes: new TextEncoder().encode(payload).byteLength,
        file,
        programId: bundle.program.id,
        programVersionId: bundle.programVersion.id,
        publishedAt: bundle.publishedAt,
        semanticVersion: bundle.programVersion.version,
        sha256: await sha256Hex(payload),
        slug: bundle.program.canonicalSlug,
      },
    };
  }),
);

const fileNames = new Set(exports.map((entry) => entry.file));
if (fileNames.size !== exports.length || fileNames.has("catalog-manifest.json")) {
  throw new Error("Catalog export filenames are not unique.");
}

// The destination must be new. This makes the exporter non-destructive: it
// never clears a directory or overwrites a previous publication artifact.
await mkdir(dirname(outputDirectory), { recursive: true });
await mkdir(outputDirectory);

for (const entry of exports) {
  await writeFile(resolve(outputDirectory, entry.file), entry.payload, {
    encoding: "utf8",
    flag: "wx",
  });
}

const manifest = canonicalJson({
  bundles: exports.map((entry) => entry.manifestEntry),
  count: exports.length,
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
});
await writeFile(resolve(outputDirectory, "catalog-manifest.json"), manifest, {
  encoding: "utf8",
  flag: "wx",
});

console.log(
  `Exported ${exports.length} catalog publications to ${outputDirectory}`,
);
