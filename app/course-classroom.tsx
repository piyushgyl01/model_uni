"use client";

import { resources, type Course } from "./data";
import type { CoursePlan } from "./course-plans";

type CourseClassroomProps = {
  course: Course;
  displayTitle: string;
  trackName?: string;
  plan?: CoursePlan;
  completedWeeks: number[];
  copied: boolean;
  onClose: () => void;
  onCopy: () => void;
  onToggleWeek: (week: number) => void;
  onToggleCourse: () => void;
};

function ResourceLink({
  title,
  label,
  className,
}: {
  title: string;
  label?: string;
  className?: string;
}) {
  const resource = resources.find((item) => item.title === title);

  if (!resource) {
    return (
      <span className={className}>
        <strong>{title}</strong>
        <small>Resource record unavailable</small>
      </span>
    );
  }

  return (
    <a
      className={className}
      href={resource.url}
      target="_blank"
      rel="noreferrer"
    >
      <span>
        <strong>{label ?? resource.title}</strong>
        <small>{resource.provider} · {resource.access}</small>
      </span>
      <i aria-hidden="true">↗</i>
    </a>
  );
}

export default function CourseClassroom({
  course,
  displayTitle,
  trackName,
  plan,
  completedWeeks,
  copied,
  onClose,
  onCopy,
  onToggleWeek,
  onToggleCourse,
}: CourseClassroomProps) {
  const completeCount = completedWeeks.length;
  const progress = Math.round((completeCount / 16) * 100);
  const nextWeek =
    Array.from({ length: 16 }, (_, index) => index + 1).find(
      (week) => !completedWeeks.includes(week),
    ) ?? 16;
  const primary = plan
    ? resources.find((resource) => resource.title === plan.primaryResource)
    : undefined;

  return (
    <div className="modal-backdrop classroom-backdrop" role="presentation" onMouseDown={onClose}>
      <article
        className="course-classroom"
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-classroom-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={`modal-band kind-${course.kind}`} />
        <button
          type="button"
          className="modal-close classroom-close"
          onClick={onClose}
          aria-label="Close course classroom"
          autoFocus
        >
          ×
        </button>

        <header className="classroom-header">
          <div className="classroom-heading">
            <p className="classroom-kicker">
              Course classroom · {course.code} · Semester {course.semester}
            </p>
            <h2 id="course-classroom-title">{displayTitle}</h2>
            {trackName && <p className="track-context">Selected route · {trackName}</p>}
            <p className="classroom-summary">{course.summary}</p>
          </div>

          <aside className="classroom-progress">
            <div>
              <span>Course progress</span>
              <strong>{completeCount}/16</strong>
            </div>
            <div
              className="progress-rail"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={16}
              aria-valuenow={completeCount}
              aria-label={`${progress}% of course weeks complete`}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <small>{progress}% · saved in this browser</small>
          </aside>
        </header>

        <div className="classroom-facts">
          <span><strong>{course.credits}</strong> workload credits</span>
          <span><strong>{course.hours}</strong> focused hours / week</span>
          <span><strong>16</strong> planned weeks</span>
          <span><strong>W6 · W11</strong> midterms</span>
          <span><strong>W15 · W16</strong> demo + final</span>
        </div>

        {plan ? (
          <>
            <section className="start-here" aria-labelledby="start-here-title">
              <div className="start-here-index" aria-hidden="true">01</div>
              <div className="start-here-copy">
                <span>Start here · primary free route</span>
                <h3 id="start-here-title">{plan.primaryResource}</h3>
                <p>{plan.firstAction}</p>
                {primary && (
                  <small>{primary.provider} · {primary.access} · checked July 2026</small>
                )}
              </div>
              <div className="start-here-actions">
                {primary && (
                  <a href={primary.url} target="_blank" rel="noreferrer">
                    Open the free course <span aria-hidden="true">↗</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(`${course.code.toLowerCase()}-week-${nextWeek}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                >
                  {completeCount ? `Continue Week ${nextWeek}` : "Open Week 1"}{" "}
                  <span aria-hidden="true">↓</span>
                </button>
              </div>
            </section>

            <div className="classroom-layout">
              <aside className="classroom-sidebar">
                <section>
                  <span className="classroom-label">Course outcome</span>
                  <p>{course.outcome}</p>
                </section>
                <section>
                  <span className="classroom-label">Prerequisites</span>
                  <p>
                    {course.prerequisites.length
                      ? course.prerequisites.join(" · ")
                      : "No formal prerequisites. Start with the Week 1 diagnostic."}
                  </p>
                </section>
                <section>
                  <span className="classroom-label">Set up before Week 1</span>
                  <ul className="setup-list">
                    {plan.setup.map((item) => (
                      <li key={item}><span aria-hidden="true">□</span>{item}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <span className="classroom-label">Free alternatives</span>
                  <div className="route-links">
                    {plan.alternatives.map((title) => (
                      <ResourceLink title={title} key={title} />
                    ))}
                  </div>
                </section>
                {plan.safetyLabNote && (
                  <section className="safety-note">
                    <span className="classroom-label">Lab and safety route</span>
                    <p>{plan.safetyLabNote}</p>
                  </section>
                )}
                <section className="honesty-note">
                  <span className="classroom-label">What this proves</span>
                  <p>
                    Keep every listed submission. Together they form auditable
                    evidence of learning; they are not accredited academic credit.
                  </p>
                </section>
              </aside>

              <section className="classroom-weeks" aria-labelledby="weekly-plan-title">
                <div className="weekly-plan-heading">
                  <div>
                    <span className="classroom-label">The executable syllabus</span>
                    <h3 id="weekly-plan-title">Sixteen weeks. No guessing.</h3>
                  </div>
                  <p>
                    Each week answers four questions: what to learn, where to learn
                    it, what to do, and what evidence to keep.
                  </p>
                </div>

                <div className="week-list">
                  {plan.weeks.map((week) => {
                    const resource = resources.find(
                      (item) => item.title === week.resourceTitle,
                    );
                    const isComplete = completedWeeks.includes(week.week);
                    const isCheckpoint = ["midterm", "presentation", "final"].includes(
                      week.assessmentType,
                    );

                    return (
                      <details
                        className={`classroom-week ${isComplete ? "is-complete" : ""} ${isCheckpoint ? "is-checkpoint" : ""}`}
                        id={`${course.code.toLowerCase()}-week-${week.week}`}
                        key={week.week}
                        open={week.week === nextWeek}
                      >
                        <summary>
                          <span className="week-checkbox" aria-hidden="true">
                            {isComplete ? "✓" : String(week.week).padStart(2, "0")}
                          </span>
                          <span>
                            <small>
                              Week {week.week}
                              {isCheckpoint && ` · ${week.assessmentType.replace("-", " ")}`}
                            </small>
                            <strong>{week.title}</strong>
                          </span>
                          <b>{week.hours}h</b>
                          <i aria-hidden="true">＋</i>
                        </summary>
                        <div className="week-workspace">
                          <article>
                            <span>What to learn</span>
                            <p>{week.topic}</p>
                          </article>
                          <article>
                            <span>Where to learn it</span>
                            {resource ? (
                              <a href={resource.url} target="_blank" rel="noreferrer">
                                <strong>{week.whereLabel}</strong>
                                <small>{resource.title} · {resource.provider} · {resource.access}</small>
                                <i aria-hidden="true">↗</i>
                              </a>
                            ) : (
                              <p>{week.whereLabel} · {week.resourceTitle}</p>
                            )}
                          </article>
                          <article>
                            <span>What to do</span>
                            <p>{week.action}</p>
                          </article>
                          <article className="week-evidence">
                            <span>What to submit / keep</span>
                            <p>{week.evidence}</p>
                          </article>
                          <div className="week-controls">
                            <span>{week.hours} focused hours</span>
                            <button
                              type="button"
                              className={isComplete ? "is-complete" : ""}
                              onClick={() => onToggleWeek(week.week)}
                            >
                              <span aria-hidden="true">{isComplete ? "✓" : "□"}</span>
                              {isComplete ? "Week complete" : "Mark week complete"}
                            </button>
                          </div>
                        </div>
                      </details>
                    );
                  })}
                </div>
              </section>
            </div>
          </>
        ) : (
          <section className="missing-plan">
            <span aria-hidden="true">!</span>
            <h3>This classroom route is being repaired.</h3>
            <p>The catalog record exists, but its executable week plan is missing.</p>
          </section>
        )}

        <div className="classroom-actions">
          <button
            type="button"
            className={completeCount === 16 ? "is-complete" : ""}
            onClick={onToggleCourse}
          >
            <span aria-hidden="true">✓</span>
            {completeCount === 16 ? "Course marked complete" : "Mark all 16 weeks complete"}
          </button>
          <button type="button" onClick={onCopy}>
            <span aria-hidden="true">⌁</span> {copied ? "Course link copied" : "Copy course link"}
          </button>
        </div>
      </article>
    </div>
  );
}
