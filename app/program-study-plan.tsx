"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  CalendarPeriodId,
  PublishedProgramBundle,
  SchedulePlacement,
} from "./domain/catalog";
import {
  resolveLearnerPath,
  type ResolvedLearnerPath,
} from "./domain/learner-path";
import {
  getStoredProgram,
  PROGRESS_EVENT,
} from "./progress-storage";
import { TermProgressWidget } from "./term-progress-widget";

interface ProgramStudyPlanProps {
  readonly bundle: PublishedProgramBundle;
  readonly routeBase: string;
}

function courseHref(routeBase: string, courseSlug: string) {
  return `${routeBase}/courses/${courseSlug}`;
}

export default function ProgramStudyPlan({
  bundle,
  routeBase,
}: ProgramStudyPlanProps) {
  const [learnerPath, setLearnerPath] = useState<ResolvedLearnerPath>(() =>
    resolveLearnerPath(bundle),
  );

  useEffect(() => {
    const updatePath = () => {
      const progress = getStoredProgram(bundle.programVersion.id);
      setLearnerPath(
        resolveLearnerPath(bundle, {
          selectedConcentrationId: progress?.selectedConcentrationId,
        }),
      );
    };

    updatePath();
    window.addEventListener(PROGRESS_EVENT, updatePath);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, updatePath);
    };
  }, [bundle]);

  const { schedule, calendar } = learnerPath;
  const periods = [...(calendar?.periods ?? [])].sort(
    (left, right) => left.order - right.order,
  );
  const coursesById = new Map(bundle.courses.map((course) => [course.id, course]));
  const courseRecordByVersionId = new Map(
    bundle.courseVersions.flatMap((version) => {
      const course = coursesById.get(version.courseId);
      return course ? [[version.id, { course, version }] as const] : [];
    }),
  );
  const unitsById = new Map(bundle.learningUnits.map((unit) => [unit.id, unit]));
  const assessmentVersionsById = new Map(
    bundle.assessmentVersions.map((assessment) => [assessment.id, assessment]),
  );
  const assessmentsById = new Map(
    bundle.assessments.map((assessment) => [assessment.id, assessment]),
  );

  const describePlacement = (placement: SchedulePlacement) => {
    if (placement.subject.kind === "courseVersion") {
      const record = courseRecordByVersionId.get(placement.subject.id);
      if (!record) return { label: "Course", title: placement.subject.id };
      return {
        label: record.version.format,
        title: record.version.title,
        href: courseHref(routeBase, record.course.canonicalSlug),
      };
    }

    if (placement.subject.kind === "learningUnit") {
      const unit = unitsById.get(placement.subject.id);
      const record = unit
        ? courseRecordByVersionId.get(unit.courseVersionId)
        : undefined;
      return {
        label: unit?.kindLabel ?? unit?.kind ?? "Learning unit",
        title: unit ? `${unit.label}: ${unit.title}` : placement.subject.id,
        note: placement.note ?? unit?.topic ?? unit?.resourceLocator,
        href:
          unit && record
            ? `${courseHref(routeBase, record.course.canonicalSlug)}#${unit.id}`
            : undefined,
      };
    }

    const assessmentVersion = assessmentVersionsById.get(placement.subject.id);
    const assessment = assessmentVersion
      ? assessmentsById.get(assessmentVersion.assessmentId)
      : undefined;
    const record = assessmentVersion
      ? courseRecordByVersionId.get(assessmentVersion.courseVersionId)
      : undefined;
    return {
      label: assessment?.kind ?? "Assessment",
      title: assessmentVersion?.title ?? placement.subject.id,
      href:
        assessmentVersion && record
          ? `${courseHref(
              routeBase,
              record.course.canonicalSlug,
            )}#assessment-${assessmentVersion.id}`
          : undefined,
    };
  };

  const placementsForPeriod = (periodId: CalendarPeriodId) =>
    learnerPath.placements
      .filter((placement) => placement.periodId === periodId)
      .sort((left, right) => left.order - right.order);
  const directlyPlacedCourseIds = new Set(
    learnerPath.placements.flatMap((placement) =>
      placement.subject.kind === "courseVersion"
        ? [placement.subject.id]
        : [],
    ),
  );
  const fallbackCoursesForPeriod = (periodId: CalendarPeriodId) =>
    learnerPath.courseVersions.filter(
      (courseVersion) =>
        learnerPath.coursePeriodIdByCourseVersionId.get(courseVersion.id) ===
          periodId && !directlyPlacedCourseIds.has(courseVersion.id),
    );
  const unassignedPlacements = learnerPath.placements
    .filter((placement) => !placement.periodId)
    .sort((left, right) => left.order - right.order);

  return (
    <section
      className="section roadmap-section universal-schedule"
      id="schedule"
      aria-labelledby="schedule-title"
      style={{ marginTop: "35px" }}
    >
      <TermProgressWidget bundle={bundle} />

      <div className="section-heading-row">
        <div>
          <span className="section-index">01 / Study Plan</span>
          <h2 id="schedule-title">
            {schedule?.title ?? "Recommended Study Sequence"}
          </h2>
        </div>
        <p className="section-intro" style={{ color: "#555" }}>
          {calendar?.structure === "terms" ? "Six-term recommended sequence" : "Self-directed study schedule"}. Follow terms in order to satisfy course prerequisites.
        </p>
      </div>

      {schedule && calendar ? (
        <>
          <div className="universal-period-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px", marginTop: "15px" }}>
            {periods.map((period) => {
              const placements = placementsForPeriod(period.id);
              const fallbackCourses = fallbackCoursesForPeriod(period.id);
              const milestones = calendar.milestones.filter(
                (milestone) => milestone.periodId === period.id,
              );
              return (
                <article className="semester-card universal-period-card" key={period.id} style={{ border: "1px solid #222", padding: "14px", background: "#fff" }}>
                  <header className="semester-top" style={{ borderBottom: "1px solid #ddd", paddingBottom: "6px", marginBottom: "10px" }}>
                    <strong>
                      {calendar.structure === "terms" ? "Term" : "Period"} {period.order}: {period.label}
                    </strong>
                  </header>

                  {placements.length > 0 || fallbackCourses.length > 0 ? (
                    <ol className="universal-placement-list" style={{ paddingLeft: "20px", margin: 0 }}>
                      {placements.map((placement) => {
                        const subject = describePlacement(placement);
                        return (
                          <li key={placement.id} style={{ margin: "6px 0" }}>
                            {subject.href ? (
                              <Link href={subject.href} style={{ fontWeight: "bold" }}>
                                {subject.title}
                              </Link>
                            ) : (
                              <strong>{subject.title}</strong>
                            )}
                            {subject.note && <p style={{ margin: "2px 0", fontSize: "0.8rem", color: "#555" }}>{subject.note}</p>}
                          </li>
                        );
                      })}
                      {fallbackCourses.map((courseVersion) => {
                        const record = courseRecordByVersionId.get(
                          courseVersion.id,
                        );
                        return (
                          <li
                            key={`resolved-course-${courseVersion.id}`}
                            style={{ margin: "6px 0" }}
                          >
                            {record ? (
                              <Link
                                href={courseHref(
                                  routeBase,
                                  record.course.canonicalSlug,
                                )}
                                style={{ fontWeight: "bold" }}
                              >
                                {courseVersion.title}
                              </Link>
                            ) : (
                              <strong>{courseVersion.title}</strong>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                    <p style={{ fontSize: "0.85rem", color: "#666" }}>No scheduled activities in this period.</p>
                  )}

                  {milestones.length > 0 && (
                    <div className="universal-milestones" style={{ marginTop: "10px", fontSize: "0.8rem", color: "#666" }}>
                      <strong>Milestones:</strong> {milestones.map((m) => m.label).join(", ")}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {unassignedPlacements.length > 0 && (
            <article className="paper-card universal-flexible-placements" style={{ marginTop: "20px", padding: "14px", border: "1px solid #ccc" }}>
              <h3>Flexible Placements & Electives</h3>
              <ol>
                {unassignedPlacements.map((placement) => {
                  const subject = describePlacement(placement);
                  return (
                    <li key={placement.id}>
                      {subject.href ? (
                        <Link href={subject.href}>{subject.title}</Link>
                      ) : (
                        subject.title
                      )}
                    </li>
                  );
                })}
              </ol>
            </article>
          )}
        </>
      ) : (
        <div className="paper-card empty-state" style={{ padding: "15px", border: "1px solid #ccc" }}>
          <h3>Eight-week self-directed schedule</h3>
          <p>Self-paced intensive schedule. Progress tracking does not assume semesters or a fixed number of weeks.</p>
        </div>
      )}
    </section>
  );
}
