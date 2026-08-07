import { getRuntimeCatalogRepository } from "../catalog/cloudflare-catalog";
import type { PublishedProgramBundle } from "../domain/catalog";
import { TranscriptPageClient } from "./transcript-page-client";

export const metadata = {
  title: "Official Academic Transcript & Portfolio | Course Atlas",
  description: "Your official self-directed university degree completion transcript and verified work evidence portfolio.",
};

export default async function TranscriptPage() {
  const repo = await getRuntimeCatalogRepository();
  const programSummaries = await repo.listPrograms();

  const bundles: PublishedProgramBundle[] = [];
  for (const summary of programSummaries) {
    const bundle = await repo.loadBySlug(summary.slug);
    if (bundle) {
      bundles.push(bundle);
    }
  }

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      <div style={{ marginBottom: "1.5rem", borderBottom: "2px solid #000", paddingBottom: "1rem" }}>
        <a href="/" style={{ fontSize: "0.9rem", textDecoration: "underline" }}>
          ← Back to All Degree Programs
        </a>
        <h1 style={{ margin: "0.5rem 0 0.2rem 0", fontSize: "1.8rem" }}>
          📜 Official Academic Transcript & Portfolio
        </h1>
        <p style={{ margin: 0, color: "#444" }}>
          Official self-directed record of completed university courses, degree requirement audits, and verified work evidence.
        </p>
      </div>

      <TranscriptPageClient bundles={bundles} />
    </div>
  );
}
