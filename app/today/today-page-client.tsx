"use client";

import { useEffect, useState } from "react";
import type { PublishedProgramBundle } from "../domain/catalog";
import { syncStoredProgram } from "../progress-sync-client";
import { PROGRESS_EVENT, readProgressStore } from "../progress-storage";
import { TodayDashboardComponent } from "../today-dashboard-component";

interface TodayPageClientProps {
  readonly bundles: readonly PublishedProgramBundle[];
}

export function TodayPageClient({ bundles }: TodayPageClientProps) {
  const [mounted, setMounted] = useState(false);
  const [enrolledProgramVersionIds, setEnrolledProgramVersionIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const updateEnrolled = () => {
      if (!active) return;
      const store = readProgressStore();
      const enrolled = Object.entries(store.programs ?? {})
        .filter(([, program]) => program.enrollment?.status === "enrolled")
        .map(([versionId]) => versionId);
      setEnrolledProgramVersionIds(enrolled);
      setMounted(true);
    };
    const hydrateSuppliedPrograms = async () => {
      await Promise.all(
        bundles.map((bundle) =>
          syncStoredProgram(bundle.programVersion.id),
        ),
      );
      updateEnrolled();
    };

    updateEnrolled();
    void hydrateSuppliedPrograms();
    const handleEvent = () => updateEnrolled();
    const handleReconnect = () => void hydrateSuppliedPrograms();
    window.addEventListener(PROGRESS_EVENT, handleEvent);
    window.addEventListener("online", handleReconnect);
    return () => {
      active = false;
      window.removeEventListener(PROGRESS_EVENT, handleEvent);
      window.removeEventListener("online", handleReconnect);
    };
  }, [bundles]);

  const enrolledBundles = bundles.filter((b) =>
    enrolledProgramVersionIds.includes(b.programVersion.id),
  );

  // If learner is enrolled in 1 or more programs, display their today dashboard(s)
  if (mounted && enrolledBundles.length > 0) {
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
