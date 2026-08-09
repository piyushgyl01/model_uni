"use client";

import { useMemo, useState } from "react";
import type {
  PrerequisiteWaiverBasis,
} from "./learner-progress-contract";
import { useCourseAccess } from "./course-access-context";
import { syncStoredProgram } from "./progress-sync-client";
import {
  revokeLocalPrerequisiteWaiver,
  writeLocalPrerequisiteWaiver,
} from "./progress-storage";

function clientEntityId() {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `waiver-${suffix}`;
}

export function PrerequisiteLockBanner() {
  const {
    bundle,
    courseVersion,
    progress,
    prerequisites,
    hydrated,
    refresh,
  } = useCourseAccess();
  const [basis, setBasis] = useState<PrerequisiteWaiverBasis>("placement");
  const [selectedPrerequisiteId, setSelectedPrerequisiteId] = useState("");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const activeWaivers = useMemo(
    () =>
      Object.values(progress?.prerequisiteWaivers ?? {}).filter(
        (waiver) =>
          waiver.courseVersionId === courseVersion.id && !waiver.revokedAt,
      ),
    [courseVersion.id, progress?.prerequisiteWaivers],
  );
  const missingPrerequisites = prerequisites.missingRequired;
  const selectedPrerequisite =
    missingPrerequisites.find(
      (prerequisite) => prerequisite.courseVersionId === selectedPrerequisiteId,
    ) ?? missingPrerequisites[0];

  if (!hydrated || (missingPrerequisites.length === 0 && activeWaivers.length === 0)) {
    return null;
  }

  const sync = async () => {
    refresh();
    await syncStoredProgram(bundle.programVersion.id);
    refresh();
  };

  const grantWaiver = async () => {
    if (!selectedPrerequisite) return;
    if (!reason.trim()) {
      setError("Record why the prerequisite is being waived.");
      return;
    }
    if (basis === "placement" && !evidence.trim()) {
      setError("Record the placement-test result or a link to its evidence.");
      return;
    }
    setBusy(true);
    setError("");
    const now = new Date().toISOString();
    const saved = writeLocalPrerequisiteWaiver(bundle.programVersion.id, {
      id: clientEntityId(),
      courseVersionId: courseVersion.id,
      prerequisiteCourseVersionId: selectedPrerequisite.courseVersionId,
      basis,
      reason: reason.trim(),
      ...(evidence.trim() ? { evidence: evidence.trim() } : {}),
      grantedAt: now,
      updatedAt: now,
    });
    if (!saved) {
      setError("The waiver could not be saved on this device.");
      setBusy(false);
      return;
    }
    setReason("");
    setEvidence("");
    try {
      await sync();
    } catch {
      setError("The waiver is saved on this device and will sync when online.");
    } finally {
      setBusy(false);
    }
  };

  const revokeWaiver = async (waiverId: string) => {
    setBusy(true);
    setError("");
    const saved = revokeLocalPrerequisiteWaiver(
      bundle.programVersion.id,
      waiverId,
    );
    if (!saved) {
      setError("The waiver could not be revoked on this device.");
      setBusy(false);
      return;
    }
    try {
      await sync();
    } catch {
      setError("The revocation is saved on this device and will sync when online.");
    } finally {
      setBusy(false);
    }
  };

  const courseTitleByVersionId = new Map(
    bundle.courseVersions.map((version) => [version.id, version.title]),
  );

  return (
    <div
      style={{
        border: `2px solid ${missingPrerequisites.length > 0 ? "#cc0000" : "#8a5a00"}`,
        background: missingPrerequisites.length > 0 ? "#fff5f5" : "#fff8e6",
        padding: "1.25rem",
        marginBottom: "1.5rem",
        boxShadow: `3px 3px 0px ${missingPrerequisites.length > 0 ? "#cc0000" : "#8a5a00"}`,
      }}
    >
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem" }}>
        {missingPrerequisites.length > 0
          ? "🔒 Prerequisite controls locked"
          : "Prerequisite waiver on record"}
      </h3>

      {missingPrerequisites.length > 0 && (
        <>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.95rem" }}>
            Progress controls are disabled until each required course is passed or
            an explicit placement result or waiver is recorded.
          </p>
          <ul style={{ margin: "0 0 1rem", paddingLeft: "1.25rem" }}>
            {missingPrerequisites.map((prerequisite) => (
              <li key={prerequisite.courseVersionId}>
                <a
                  href={`/programs/${bundle.program.canonicalSlug}/courses/${prerequisite.canonicalSlug}`}
                >
                  <strong>{prerequisite.title}</strong>
                </a>{" "}
                — required
              </li>
            ))}
          </ul>

          <div style={{ borderTop: "1px solid #cc0000", paddingTop: "0.75rem" }}>
            <strong>Record a placement result or waiver</strong>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
              <label style={{ fontSize: "0.85rem" }}>
                Prerequisite
                <select
                  value={selectedPrerequisite?.courseVersionId ?? ""}
                  onChange={(event) => setSelectedPrerequisiteId(event.target.value)}
                  disabled={busy}
                  style={{ width: "100%", display: "block" }}
                >
                  {missingPrerequisites.map((prerequisite) => (
                    <option key={prerequisite.courseVersionId} value={prerequisite.courseVersionId}>
                      {prerequisite.title}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ fontSize: "0.85rem" }}>
                Basis
                <select
                  value={basis}
                  onChange={(event) => setBasis(event.target.value as PrerequisiteWaiverBasis)}
                  disabled={busy}
                  style={{ width: "100%", display: "block" }}
                >
                  <option value="placement">Placement test</option>
                  <option value="prior_learning">Prior learning evidence</option>
                  <option value="review">External review</option>
                  <option value="manual">Administrative waiver</option>
                </select>
              </label>
            </div>
            <label style={{ display: "block", marginTop: "0.5rem", fontSize: "0.85rem" }}>
              Reason
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={busy}
                style={{ width: "100%", display: "block", boxSizing: "border-box" }}
              />
            </label>
            <label style={{ display: "block", marginTop: "0.5rem", fontSize: "0.85rem" }}>
              Evidence or placement-test result {basis === "placement" ? "(required)" : "(optional)"}
              <input
                value={evidence}
                onChange={(event) => setEvidence(event.target.value)}
                disabled={busy}
                placeholder="Score, reviewer, artifact, or evidence link"
                style={{ width: "100%", display: "block", boxSizing: "border-box" }}
              />
            </label>
            <button
              type="button"
              className="button button-quiet"
              disabled={busy}
              onClick={() => void grantWaiver()}
              style={{ marginTop: "0.6rem" }}
            >
              Record waiver
            </button>
          </div>
        </>
      )}

      {activeWaivers.length > 0 && (
        <div style={{ marginTop: missingPrerequisites.length > 0 ? "1rem" : 0 }}>
          <strong>Active waiver record</strong>
          <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.25rem" }}>
            {activeWaivers.map((waiver) => {
              const waivedCourseTitle = courseTitleByVersionId.get(
                waiver.prerequisiteCourseVersionId,
              );
              return (
                <li key={waiver.id} style={{ marginBottom: "0.4rem" }}>
                  {waivedCourseTitle ?? waiver.prerequisiteCourseVersionId} · {waiver.basis.replace("_", " ")} · {waiver.reason}{" "}
                  <button
                    type="button"
                    className="button button-quiet"
                    disabled={busy}
                    onClick={() => void revokeWaiver(waiver.id)}
                    style={{ marginLeft: "0.5rem" }}
                  >
                    Revoke
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {error && <p role="alert" style={{ color: "#aa0000", margin: "0.6rem 0 0" }}>{error}</p>}
    </div>
  );
}
