import { getRuntimeCatalogRepository } from "../catalog/cloudflare-catalog";
import type { PublishedProgramBundle } from "../domain/catalog";
import { TodayPageClient } from "./today-page-client";

export const metadata = {
  title: "Today's Study Queue | Course Atlas",
  description: "Your personalized daily university study queue and pace progress.",
};

export default async function TodayPage() {
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
          ⚡ Today's Study Queue
        </h1>
        <p style={{ margin: 0, color: "#444" }}>
          Your daily schedule generated from your enrolled degree programs and study pace.
        </p>
      </div>

      <TodayPageClient bundles={bundles} />
    </div>
  );
}
