"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readProgressStore } from "./progress-storage";

export function ActiveEnrollmentBanner() {
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
    };

    update();
    const handleEvent = () => update();
    window.addEventListener("course-atlas-progress-v2:changed", handleEvent);
    return () => {
      window.removeEventListener("course-atlas-progress-v2:changed", handleEvent);
    };
  }, []);

  if (activePrograms.length === 0) return null;

  return (
    <div
      style={{
        border: "2px solid #000",
        background: "#0000ee",
        color: "#fff",
        padding: "0.85rem 1.25rem",
        marginBottom: "1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.75rem",
        boxShadow: "3px 3px 0px #000",
      }}
    >
      <div>
        <strong style={{ fontSize: "1.1rem" }}>
          ⚡ Active Enrollment ({activePrograms.length} {activePrograms.length === 1 ? "Degree" : "Degrees"})
        </strong>
        <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
          Your daily study tasks are ready.
        </div>
      </div>
      <Link
        href="/today"
        style={{
          background: "#fff",
          color: "#000",
          padding: "0.4rem 1rem",
          fontWeight: "bold",
          border: "1px solid #000",
          textDecoration: "none",
        }}
      >
        Open Today's Study Queue →
      </Link>
    </div>
  );
}
