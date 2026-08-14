import Link from "next/link";
import { TranscriptPageClient } from "./transcript-page-client";

export const metadata = {
  title: "Independent Learning Record | Course Atlas",
  description: "A learner-controlled record of pathway requirements, mastery, assessments, projects, hours, and evidence provenance.",
};

export default async function TranscriptPage() {
  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      <div style={{ marginBottom: "1.5rem", borderBottom: "2px solid #000", paddingBottom: "1rem" }}>
        <Link href="/" style={{ fontSize: "0.9rem", textDecoration: "underline" }}>
          ← Back to All Degree Programs
        </Link>
        <h1 style={{ margin: "0.5rem 0 0.2rem 0", fontSize: "1.8rem" }}>
          📜 Independent Learning Record
        </h1>
        <p style={{ margin: 0, color: "#444" }}>
          A transparent, non-accredited record of pathway progress, assessment results, projects, hours, and evidence provenance.
        </p>
      </div>

      <TranscriptPageClient />
    </div>
  );
}
