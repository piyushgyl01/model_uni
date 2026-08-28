"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LearnerTodayView } from "../catalog/learner-read-model-repository";
import type {
  ProgramVersionId,
  PublishedProgramBundle,
} from "../domain/catalog";
import { syncStoredProgram } from "../progress-sync-client";
import { PROGRESS_EVENT, readProgressStore } from "../progress-storage";
import { TodayDashboardComponent } from "../today-dashboard-component";

interface LearnerProgramsResponse {
  readonly authenticated: boolean;
  readonly programs?: readonly {
    readonly programVersionId: ProgramVersionId;
    readonly enrollmentStatus: string;
  }[];
  readonly signInPath?: string;
}

async function loadExactBundle(programVersionId: ProgramVersionId) {
  const response = await fetch(
    `/api/catalog/program-versions/${encodeURIComponent(programVersionId)}`,
    { headers: { accept: "application/json" } },
  );
  if (!response.ok) return undefined;
  const payload = (await response.json()) as {
    readonly bundle?: PublishedProgramBundle;
  };
  return payload.bundle;
}

async function loadTodayView(programVersionId: ProgramVersionId) {
  const query = new URLSearchParams({ programVersionId });
  const response = await fetch(`/api/learner-views/today?${query}`, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) return undefined;
  return (await response.json()) as LearnerTodayView;
}

export function TodayPageClient() {
  const [mounted, setMounted] = useState(false);
  const [views, setViews] = useState<readonly LearnerTodayView[]>([]);
  const [localBundles, setLocalBundles] = useState<
    readonly PublishedProgramBundle[]
  >([]);
  const [signInPath, setSignInPath] = useState<string>();

  useEffect(() => {
    let active = true;

    const load = async (synchronize: boolean) => {
      const store = readProgressStore();
      const localEnrolledIds = Object.entries(store.programs ?? {})
        .filter(([, program]) => program.enrollment?.status === "enrolled")
        .map(([programVersionId]) => programVersionId as ProgramVersionId);

      if (synchronize) {
        await Promise.all(
          localEnrolledIds.map((programVersionId) =>
            syncStoredProgram(programVersionId),
          ),
        );
      }

      const programsResponse = await fetch("/api/learner-views", {
        headers: { accept: "application/json" },
        cache: "no-store",
      });
      const programsPayload = (await programsResponse
        .json()
        .catch(() => ({ authenticated: false }))) as LearnerProgramsResponse;
      const cloudEnrolledIds = programsPayload.authenticated
        ? (programsPayload.programs ?? [])
            .filter((program) => program.enrollmentStatus === "enrolled")
            .map((program) => program.programVersionId)
        : [];
      const cloudViews = (
        await Promise.all(cloudEnrolledIds.map(loadTodayView))
      ).filter((view): view is LearnerTodayView => view !== undefined);
      const cloudIds = new Set(
        cloudViews.map((view) => view.program.programVersionId),
      );
      const localOnlyIds = localEnrolledIds.filter((id) => !cloudIds.has(id));
      const exactBundles = (
        await Promise.all(localOnlyIds.map(loadExactBundle))
      ).filter(
        (bundle): bundle is PublishedProgramBundle => bundle !== undefined,
      );

      if (!active) return;
      setViews(cloudViews);
      setLocalBundles(exactBundles);
      setSignInPath(programsPayload.signInPath);
      setMounted(true);
    };

    void load(true);
    const handleProgress = () => void load(false);
    const handleReconnect = () => void load(true);
    window.addEventListener(PROGRESS_EVENT, handleProgress);
    window.addEventListener("online", handleReconnect);
    return () => {
      active = false;
      window.removeEventListener(PROGRESS_EVENT, handleProgress);
      window.removeEventListener("online", handleReconnect);
    };
  }, []);

  if (!mounted) {
    return (
      <div style={{ padding: "1rem", border: "var(--stroke, 1px) solid var(--rule, #ccc)" }}>
        Loading your active study plan...
      </div>
    );
  }

  if (views.length === 0 && localBundles.length === 0) {
    return (
      <div
        style={{
          padding: "1rem",
          background: "var(--accent-soft, #f0f4ff)",
          border: "var(--stroke, 1px) solid var(--link-ink, #0000ee)",
          marginBottom: "1.5rem",
        }}
      >
        <strong>You are not enrolled in a program yet.</strong>{" "}
        <Link href="/#programs">Choose a published pathway</Link> to set a
        start date and weekly pace.
        {signInPath && (
          <>
            {" "}Already have cloud progress? <a href={signInPath}>Sign in</a>.
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      {views.map((view) => (
        <TodayDashboardComponent
          key={view.program.programVersionId}
          view={view}
        />
      ))}
      {localBundles.map((bundle) => (
        <TodayDashboardComponent
          key={bundle.programVersion.id}
          bundle={bundle}
        />
      ))}
    </div>
  );
}
