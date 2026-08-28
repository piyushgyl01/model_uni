"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PROGRESS_EVENT, readProgressStore } from "./progress-storage";

export function ActiveEnrollmentBanner() {
  const [mounted, setMounted] = useState(false);
  const [activePrograms, setActivePrograms] = useState<
    { versionId: string; pace: number }[]
  >([]);

  useEffect(() => {
    const update = () => {
      const store = readProgressStore();
      const enrolled = Object.entries(store.programs ?? {})
        .filter(([, program]) => program.enrollment?.status === "enrolled")
        .map(([versionId, program]) => ({
          versionId,
          pace: program.enrollment?.paceHoursPerWeek ?? 40,
        }));
      setActivePrograms(enrolled);
      setMounted(true);
    };

    update();
    const handleEvent = () => update();
    window.addEventListener(PROGRESS_EVENT, handleEvent);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, handleEvent);
    };
  }, []);

  if (!mounted || activePrograms.length === 0) return null;

  return (
    <div
      style={{
        border: "var(--stroke-strong, 2px) solid var(--ink, #000)",
        background: "var(--link-ink, #0000ee)",
        color: "var(--paper, #fff)",
        padding: "0.85rem 1.25rem",
        marginBottom: "1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.75rem",
        boxShadow: "3px 3px 0px var(--ink, #000)",
      }}
    >
      <div>
        <strong style={{ fontSize: "1.1rem" }}>
          Active Enrollment ({activePrograms.length} {activePrograms.length === 1 ? "Degree" : "Degrees"})
        </strong>
        <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
          Your daily study tasks are ready.
        </div>
      </div>
      <Link
        href="/today"
        style={{
          background: "var(--paper, #fff)",
          color: "var(--ink, #000)",
          padding: "0.4rem 1rem",
          fontWeight: "bold",
          border: "var(--stroke, 1px) solid var(--ink, #000)",
          textDecoration: "none",
        }}
      >
        Open Today&apos;s Study Queue →
      </Link>
    </div>
  );
}
