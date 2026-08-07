"use client";

import { useEffect, useState } from "react";
import type { PublishedProgramBundle } from "../domain/catalog";
import { readProgressStore } from "../progress-storage";
import { TodayDashboardComponent } from "../today-dashboard-component";

interface TodayPageClientProps {
  readonly bundles: readonly PublishedProgramBundle[];
}

export function TodayPageClient({ bundles }: TodayPageClientProps) {
  const [enrolledProgramVersionIds, setEnrolledProgramVersionIds] = useState<string[]>([]);

  useEffect(() => {
    const updateEnrolled = () => {
      const store = readProgressStore();
      const enrolled = Object.entries(store.programs ?? {})
        .filter(([, program]) => program.enrollment?.status === "enrolled")
        .map(([versionId]) => versionId);
      setEnrolledProgramVersionIds(enrolled);
    };

    updateEnrolled();
    const handleEvent = () => updateEnrolled();
    window.addEventListener("course-atlas-progress-v2:changed", handleEvent);
    return () => {
      window.removeEventListener("course-atlas-progress-v2:changed", handleEvent);
    };
  }, []);

  const enrolledBundles = bundles.filter((b) =>
    enrolledProgramVersionIds.includes(b.programVersion.id),
  );

  // If learner is enrolled in 1 or more programs, display their today dashboard(s)
  if (enrolledBundles.length > 0) {
    return (
      <div>
        {enrolledBundles.map((bundle) => (
          <TodayDashboardComponent key={bundle.programVersion.id} bundle={bundle} />
        ))}
      </div>
    );
  }

  // Otherwise, default to showing Computer Science and Electrical Engineering with an enrollment prompt
  const csBundle = bundles.find((b) => b.program.canonicalSlug === "computer-science") ?? bundles[0];

  return (
    <div>
      <div style={{ padding: "1rem", background: "#f0f4ff", border: "1px solid #0000ee", marginBottom: "1.5rem" }}>
        ℹ️ <strong>You are not enrolled in any degree programs yet.</strong> Select a program below to start your degree and set your daily study pace.
      </div>
      {csBundle && <TodayDashboardComponent bundle={csBundle} />}
    </div>
  );
}
