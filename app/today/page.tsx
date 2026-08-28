import Link from "next/link";
import { TodayPageClient } from "./today-page-client";

export const metadata = {
  title: "Today's Study Queue | Course Atlas",
  description: "Your personalized daily university study queue and pace progress.",
};

export default async function TodayPage() {
  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      <div style={{ marginBottom: "1.5rem", borderBottom: "var(--stroke-strong, 2px) solid var(--ink, #000)", paddingBottom: "1rem" }}>
        <Link href="/" style={{ fontSize: "0.9rem", textDecoration: "underline" }}>
          ← Back to All Degree Programs
        </Link>
        <h1 style={{ margin: "0.5rem 0 0.2rem 0", fontSize: "1.8rem" }}>
          Today&apos;s Study Queue
        </h1>
        <p style={{ margin: 0, color: "var(--ink-soft, #444)" }}>
          Your daily schedule generated from your enrolled degree programs and study pace.
        </p>
      </div>

      <TodayPageClient />
    </div>
  );
}
