"use client";

import { useEffect, useState } from "react";
import { ProgressBackupControls } from "../progress-backup-controls";
import type {
  LearnerProgramReference,
  LearnerRecordView,
} from "../catalog/learner-read-model-repository";
import type {
  ProgramVersionId,
  PublishedProgramBundle,
} from "../domain/catalog";
import {
  buildIndependentLearningRecord,
  EVIDENCE_REVIEW_LABELS,
  type LearningRecordEvidence,
} from "../domain/independent-learning-record";
import { syncStoredProgram } from "../progress-sync-client";
import {
  PROGRESS_EVENT,
  readProgressStore,
  type StoredProgramProgress,
} from "../progress-storage";

interface LearnerProgramsResponse {
  readonly authenticated: boolean;
  readonly programs?: readonly LearnerProgramReference[];
}

interface ProgramOption {
  readonly programVersionId: ProgramVersionId;
  readonly title: string;
  readonly enrolled: boolean;
  readonly source: "cloud" | "local";
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

function formatDate(value: string | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
}

function formatPercentage(value: number | undefined) {
  return value === undefined ? "—" : `${Math.round(value * 10) / 10}%`;
}

function EvidenceValue({ evidence }: { readonly evidence: LearningRecordEvidence }) {
  return evidence.textOrUrl.startsWith("http") ? (
    <a
      href={evidence.textOrUrl}
      target="_blank"
      rel="noreferrer"
      style={{ color: "#0000ee", fontWeight: "bold" }}
    >
      {evidence.textOrUrl} ↗
    </a>
  ) : (
    <span>{evidence.textOrUrl}</span>
  );
}

export function TranscriptPageClient() {
  const [mounted, setMounted] = useState(false);
  const [selectedProgramVersionId, setSelectedProgramVersionId] = useState<
    ProgramVersionId | ""
  >("");
  const [store, setStore] = useState<Record<string, StoredProgramProgress>>({});
  const [cloudPrograms, setCloudPrograms] = useState<
    readonly LearnerProgramReference[]
  >([]);
  const [localBundles, setLocalBundles] = useState<
    readonly PublishedProgramBundle[]
  >([]);
  const [recordEpoch, setRecordEpoch] = useState(0);
  const [cloudRecord, setCloudRecord] = useState<{
    readonly programVersionId: ProgramVersionId;
    readonly view: LearnerRecordView;
  }>();

  useEffect(() => {
    let active = true;
    const refreshPrograms = async (synchronize: boolean) => {
      const programs = readProgressStore().programs ?? {};
      const localIds = Object.keys(programs) as ProgramVersionId[];
      if (synchronize) {
        await Promise.all(localIds.map((id) => syncStoredProgram(id)));
      }
      const response = await fetch("/api/learner-views", {
        headers: { accept: "application/json" },
        cache: "no-store",
      });
      const payload = (await response
        .json()
        .catch(() => ({ authenticated: false }))) as LearnerProgramsResponse;
      const cloud = payload.authenticated ? (payload.programs ?? []) : [];
      const cloudIds = new Set(cloud.map((program) => program.programVersionId));
      const localOnlyIds = localIds.filter((id) => !cloudIds.has(id));
      const bundles = (
        await Promise.all(localOnlyIds.map(loadExactBundle))
      ).filter(
        (bundle): bundle is PublishedProgramBundle => bundle !== undefined,
      );
      if (!active) return;
      setStore(readProgressStore().programs ?? {});
      setCloudPrograms(cloud);
      setLocalBundles(bundles);
      setSelectedProgramVersionId((current) => {
        const available = new Set([
          ...cloud.map((program) => program.programVersionId),
          ...bundles.map((bundle) => bundle.programVersion.id),
        ]);
        if (current && available.has(current)) return current;
        return (
          cloud.find((program) => program.enrollmentStatus === "enrolled")
            ?.programVersionId ??
          bundles.find(
            (bundle) =>
              programs[bundle.programVersion.id]?.enrollment?.status ===
              "enrolled",
          )?.programVersion.id ??
          cloud[0]?.programVersionId ??
          bundles[0]?.programVersion.id ??
          ""
        );
      });
      setMounted(true);
    };

    void refreshPrograms(true);
    const handleEvent = () => {
      setRecordEpoch((value) => value + 1);
      void refreshPrograms(false);
    };
    const handleReconnect = () => void refreshPrograms(true);
    window.addEventListener(PROGRESS_EVENT, handleEvent);
    window.addEventListener("online", handleReconnect);
    return () => {
      active = false;
      window.removeEventListener(PROGRESS_EVENT, handleEvent);
      window.removeEventListener("online", handleReconnect);
    };
  }, []);

  useEffect(() => {
    if (
      !selectedProgramVersionId ||
      !cloudPrograms.some(
        (program) => program.programVersionId === selectedProgramVersionId,
      )
    ) {
      return;
    }
    let active = true;
    const load = async () => {
      const query = new URLSearchParams({
        programVersionId: selectedProgramVersionId,
      });
      const response = await fetch(`/api/learner-views/record?${query}`, {
        headers: { accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok || !active) return;
      const view = (await response.json()) as LearnerRecordView;
      if (active) {
        setCloudRecord({ programVersionId: selectedProgramVersionId, view });
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [cloudPrograms, recordEpoch, selectedProgramVersionId]);

  if (!mounted) {
    return (
      <div style={{ padding: "1.5rem", background: "#f9f9f9", border: "1px solid #ccc" }}>
        Loading Independent Learning Record...
      </div>
    );
  }

  const activeBundle = localBundles.find(
      (bundle) => bundle.programVersion.id === selectedProgramVersionId,
    );
  const selectedCloudRecord =
    cloudRecord?.programVersionId === selectedProgramVersionId
      ? cloudRecord.view
      : undefined;
  if (
    selectedProgramVersionId &&
    !activeBundle &&
    cloudPrograms.some(
      (program) => program.programVersionId === selectedProgramVersionId,
    ) &&
    !selectedCloudRecord
  ) {
    return (
      <div style={{ padding: "1.5rem", background: "#f9f9f9", border: "1px solid #ccc" }}>
        Loading Independent Learning Record...
      </div>
    );
  }
  if (!activeBundle && !selectedCloudRecord) {
    return (
      <>
        <div style={{ padding: "1rem", background: "#f9f9f9", border: "1px solid #ccc" }}>
          No learner pathways have progress yet. Start from a program page, enroll,
          and your Independent Learning Record will appear here.
        </div>
        {/* Restore matters most to someone whose browser is empty, so the
            controls must be reachable from the empty state too. */}
        <ProgressBackupControls />
      </>
    );
  }

  const programProgress = activeBundle
    ? store[activeBundle.programVersion.id]
    : undefined;
  const localRecord = activeBundle
    ? buildIndependentLearningRecord(activeBundle, programProgress)
    : undefined;
  const record = selectedCloudRecord?.record ?? localRecord!;
  const programTitle =
    selectedCloudRecord?.program.title ?? activeBundle!.programVersion.title;
  const programSchool =
    selectedCloudRecord?.program.school ?? activeBundle!.program.school;
  const programVersion =
    selectedCloudRecord?.program.version ?? activeBundle!.programVersion.version;
  const programSlug =
    selectedCloudRecord?.program.slug ?? activeBundle!.program.canonicalSlug;
  const concentrationTitle =
    selectedCloudRecord?.program.selectedConcentrationTitle ??
    activeBundle?.concentrations.find(
      (candidate) =>
        candidate.id === localRecord?.learnerPath.selectedConcentrationId,
    )?.title;
  const enrollment = selectedCloudRecord?.enrollment ?? programProgress?.enrollment;
  const requirementGroups = selectedCloudRecord
    ? selectedCloudRecord.requirementGroups
    : activeBundle!.programVersion.requirements.map((group) => ({
        id: group.id,
        title: group.title,
        minSelections: group.rule.minSelections,
        evaluation: record.requirementEvaluation.groups.find(
          (candidate) => candidate.requirementGroupId === group.id,
        ),
      }));
  const options: readonly ProgramOption[] = [
    ...cloudPrograms.map((program) => ({
      programVersionId: program.programVersionId,
      title: program.title,
      enrolled: program.enrollmentStatus === "enrolled",
      source: "cloud" as const,
    })),
    ...localBundles.map((bundle) => ({
      programVersionId: bundle.programVersion.id,
      title: bundle.programVersion.title,
      enrolled:
        store[bundle.programVersion.id]?.enrollment?.status === "enrolled",
      source: "local" as const,
    })),
  ];
  const completionPercentage = Math.round(
    (record.totals.completedLearningUnits /
      Math.max(1, record.totals.learningUnits)) *
      100,
  );
  const attemptedAssessments = record.courses.flatMap((course) =>
    course.assessments
      .filter((assessment) => assessment.attempts.length > 0)
      .map((assessment) => ({ course, assessment })),
  );
  const recordedProjects = record.projects.filter(
    (project) => project.completed || project.evidence,
  );

  return (
    <div>
      <div style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {options.map((option) => {
          const isSelected =
            option.programVersionId === selectedProgramVersionId;
          return (
            <button
              key={`${option.source}:${option.programVersionId}`}
              onClick={() =>
                setSelectedProgramVersionId(option.programVersionId)
              }
              style={{
                padding: "0.5rem 0.85rem",
                border: "2px solid #000",
                background: isSelected ? "#000" : "#fff",
                color: isSelected ? "#fff" : "#000",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              {option.enrolled ? "● " : ""}
              {option.title}
            </button>
          );
        })}

        <button
          onClick={() => window.print()}
          style={{
            marginLeft: "auto",
            padding: "0.5rem 1rem",
            border: "2px solid #000",
            background: "#0000ee",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          Print / Save PDF Record
        </button>
      </div>

      <ProgressBackupControls />

      <div
        style={{
          border: "2px solid #000",
          background: "#fff",
          padding: "2rem",
          boxShadow: "4px 4px 0px #000",
        }}
      >
        <div style={{ borderBottom: "2px solid #000", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "#555" }}>
                Course Atlas · Independent Learning Record
              </div>
              <h2 style={{ margin: "0.3rem 0", fontSize: "1.6rem" }}>
                {programTitle}
              </h2>
              <div style={{ fontSize: "0.95rem", color: "#333" }}>
                {programSchool}
                {concentrationTitle ? ` · ${concentrationTitle}` : ""}
              </div>
            </div>

            <div style={{ textAlign: "right", minWidth: "220px" }}>
              <div
                style={{
                  display: "inline-block",
                  padding: "0.4rem 0.85rem",
                  background: record.pathwayRequirementsCompleted
                    ? "#008800"
                    : "#fff9e6",
                  color: record.pathwayRequirementsCompleted ? "#fff" : "#000",
                  border: "2px solid #000",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                }}
              >
                {record.pathwayRequirementsCompleted
                  ? "PATHWAY REQUIREMENTS COMPLETED ✓"
                  : "PATHWAY IN PROGRESS"}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.4rem" }}>
                Catalog version {programVersion}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "0.85rem",
            border: "1px solid #000",
            background: "#fff9e6",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
          }}
        >
          <strong>What this record is:</strong> a learner-controlled account of
          work completed against a published Course Atlas pathway. It is not a
          university transcript, accredited degree, credit award, identity
          verification, or institutional credential. Hours are published nominal
          workload, not observed attendance. Evidence and results are labeled by
          their recorded review method below.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            background: "#f9f9f9",
            border: "1px solid #ccc",
            padding: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <div style={{ fontSize: "0.8rem", color: "#555" }}>Learning status</div>
            <strong>
              {enrollment?.status === "enrolled"
                ? "Actively enrolled"
                : enrollment?.status === "paused"
                  ? "Paused"
                  : "Independent study"}
            </strong>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#555" }}>Study pace</div>
            <strong>
              {enrollment
                ? `${enrollment.paceHoursPerWeek} hrs / week`
                : "Not recorded"}
            </strong>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#555" }}>Courses passed</div>
            <strong>
              {record.totals.passedCourses} of {record.totals.courses}
            </strong>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#555" }}>Learning work</div>
            <strong>
              {record.totals.completedLearningUnits} of {record.totals.learningUnits} units ({completionPercentage}%)
            </strong>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#555" }}>Published pathway workload</div>
            <strong>{record.totals.nominalPathHours.toLocaleString()} nominal hrs</strong>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#555" }}>Recorded learning work</div>
            <strong>
              {record.totals.completedLearningHours.toLocaleString()} nominal hrs checked
            </strong>
          </div>
        </div>

        <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1.1rem" }}>
          Pathway Requirement Audit
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "2rem" }}>
          {requirementGroups.map((group) => {
            const groupEvaluation = group.evaluation;
            const isSatisfied = groupEvaluation?.satisfied ?? false;
            const selectedCount =
              groupEvaluation?.selectedCourseVersionIds.length ?? 0;
            return (
              <div
                key={group.id}
                style={{
                  border: "1px solid #ccc",
                  padding: "0.75rem",
                  background: isSatisfied ? "#f0fff0" : "#fff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <strong>{group.title}</strong>
                  <span style={{ color: isSatisfied ? "#008800" : "#cc0000", fontWeight: "bold", textAlign: "right" }}>
                    {isSatisfied
                      ? "✓ Requirement completed"
                      : `${selectedCount} / ${group.minSelections} passed`}
                  </span>
                </div>
                {groupEvaluation && groupEvaluation.reasons.length > 0 && (
                  <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.2rem" }}>
                    {groupEvaluation.reasons.join(" ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1.1rem" }}>
          Course and Hours Record
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "2rem",
              fontSize: "0.9rem",
            }}
          >
            <thead>
              <tr style={{ background: "#f0f0f0", borderBottom: "2px solid #000", textAlign: "left" }}>
                <th style={{ padding: "0.5rem" }}>Code</th>
                <th style={{ padding: "0.5rem" }}>Course</th>
                <th style={{ padding: "0.5rem" }}>Published hours</th>
                <th style={{ padding: "0.5rem" }}>Learning work</th>
                <th style={{ padding: "0.5rem" }}>Assessment score</th>
                <th style={{ padding: "0.5rem" }}>Mastery state</th>
              </tr>
            </thead>
            <tbody>
              {record.courses.map((course) => (
                <tr key={course.courseVersionId} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>
                    {course.code}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    <a
                      href={
                        "canonicalPath" in course
                          ? course.canonicalPath
                          : `/programs/${programSlug}/courses/${course.canonicalSlug}`
                      }
                      style={{ fontWeight: "bold", color: "#000" }}
                    >
                      {course.title}
                    </a>
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    {course.nominalHours} nominal hrs
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    {course.completedUnits} / {course.totalUnits} units · {course.completedLearningHours} nominal hrs
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    {formatPercentage(course.weightedScorePercentage)}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    <span style={{ fontWeight: "bold", color: course.passed ? "#008800" : "#555" }}>
                      {course.passed ? "✓ " : ""}{course.masteryLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1.1rem" }}>
          Assessment Record ({record.totals.assessmentAttempts} attempts · {record.totals.assessments} published assessments)
        </h3>
        <p style={{ margin: "0 0 0.75rem", color: "#555", fontSize: "0.85rem" }}>
          Published assessment workload: {record.totals.assessmentHours} nominal hours. Results report the evaluation method stored with each attempt; they are not silently treated as institutionally reviewed.
        </p>
        {attemptedAssessments.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
            {attemptedAssessments.map(({ course, assessment }) => (
              <div key={assessment.assessmentVersionId} style={{ border: "1px solid #ccc", padding: "0.75rem", background: "#fafafa" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <strong>{course.title} · {assessment.title}</strong>
                    <div style={{ fontSize: "0.8rem", color: "#555" }}>
                      {assessment.kind} · {assessment.weight}% of course grade · {assessment.estimatedHours} nominal hrs
                      {assessment.requiredToPass ? " · required to pass" : ""}
                    </div>
                  </div>
                  <strong style={{ fontSize: "0.85rem" }}>
                    {assessment.attempts.length} attempt{assessment.attempts.length === 1 ? "" : "s"}
                  </strong>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.6rem" }}>
                  {assessment.attempts.map((attempt) => (
                    <div key={attempt.id} style={{ borderTop: "1px solid #ddd", paddingTop: "0.45rem", fontSize: "0.85rem" }}>
                      <strong>
                        Attempt {attempt.attemptNumber} · {attempt.status}
                      </strong>
                      {attempt.score !== undefined && (
                        <span>
                          {" "}· {attempt.score} / {attempt.maximumScore} ({formatPercentage(attempt.scorePercentage)}) · {attempt.passed ? "passed" : "did not pass"}
                        </span>
                      )}
                      <div style={{ color: "#555", marginTop: "0.15rem" }}>
                        Review provenance: {EVIDENCE_REVIEW_LABELS[attempt.reviewStatus]} · Started {formatDate(attempt.startedAt)} · Submitted {formatDate(attempt.submittedAt)} · Evaluated {formatDate(attempt.evaluatedAt)}
                      </div>
                      {attempt.feedback && (
                        <div style={{ marginTop: "0.15rem" }}>Feedback: {attempt.feedback}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "1rem", background: "#f9f9f9", border: "1px solid #ccc", fontSize: "0.9rem", color: "#666", marginBottom: "2rem" }}>
            No assessment attempts recorded. Published assessment requirements remain available on the course pages.
          </div>
        )}

        <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1.1rem" }}>
          Project and Practical Work ({recordedProjects.length} recorded · {record.totals.projects} required)
        </h3>
        {recordedProjects.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "2rem" }}>
            {recordedProjects.map((project) => (
              <div key={project.learningUnitId} style={{ border: "1px solid #ccc", padding: "0.65rem", fontSize: "0.85rem" }}>
                <strong>{project.courseTitle} · {project.title}</strong>
                <div style={{ color: "#555", marginTop: "0.15rem" }}>
                  {project.nominalHours} nominal hrs · {project.completed ? "Learning work completed" : "Learning work not completed"} · {project.evidence ? "Self-attested evidence attached" : "No evidence attached"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "1rem", background: "#f9f9f9", border: "1px solid #ccc", fontSize: "0.9rem", color: "#666", marginBottom: "2rem" }}>
            No completed or evidenced project work recorded yet. The selected pathway contains {record.totals.projects} required project or practical units.
          </div>
        )}

        <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1.1rem" }}>
          Evidence and Provenance ({record.evidence.length} records)
        </h3>
        {record.evidence.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {record.evidence.map((item) => (
              <div key={item.id} style={{ border: "1px solid #ccc", padding: "0.75rem", background: "#fafafa", fontSize: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ color: "#555", fontSize: "0.8rem", textTransform: "uppercase" }}>
                    {item.courseTitle} · {item.subjectTitle}
                  </div>
                  <strong>{EVIDENCE_REVIEW_LABELS[item.reviewStatus]}</strong>
                </div>
                <div style={{ margin: "0.2rem 0", fontFamily: "monospace", wordBreak: "break-all" }}>
                  <EvidenceValue evidence={item} />
                </div>
                <div style={{ color: "#555", fontSize: "0.8rem" }}>
                  Provenance: {item.provenance} Recorded {formatDate(item.recordedAt)}.
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "1rem", background: "#f9f9f9", border: "1px solid #ccc", fontSize: "0.9rem", color: "#666" }}>
            No evidence recorded yet. Add work links or notes to learning units and assessment attempts; each item will retain an explicit provenance label.
          </div>
        )}
      </div>
    </div>
  );
}
