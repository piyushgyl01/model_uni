"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CourseClassroom from "./course-classroom";
import { getCoursePlan } from "./course-plans";
import {
  assessments,
  cadence,
  courses,
  disclaimer,
  labRoutes,
  provenanceSources,
  programs,
  resources,
  schools,
  semesters,
  tracks,
  disciplines,
  type Course,
  type TrackId,
} from "./data";

const navItems = [
  ["Degree home", "top"],
  ["Catalog", "catalog"],
  ["Schools", "schools"],
  ["Programs", "programs"],
  ["Planner", "roadmap"],
  ["Library", "library"],
] as const;

const courseKinds = [
  ["all", "All courses"],
  ["theory", "Theory"],
  ["lab", "Lab"],
  ["studio", "Studio"],
  ["humanities", "Humanities"],
  ["capstone", "Capstone"],
] as const;

const trackSlots: Record<string, number> = {
  TRK401: 0,
  TRK402: 1,
};

function courseSlug(code: string) {
  return `course-${code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function compactCourseTitle(course: Course, selectedTrack: TrackId) {
  const slot = trackSlots[course.code];
  if (slot === undefined) return course.title;
  return tracks.find((track) => track.id === selectedTrack)?.courseNames[slot] ?? course.title;
}

function courseProgressKey(code: string, track: TrackId) {
  return trackSlots[code] === undefined ? code : `${code}:${track}`;
}

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

export default function DegreePage() {
  const [selectedTrack, setSelectedTrack] = useState<TrackId>("chips");
  const [completed, setCompleted] = useState<string[]>([]);
  const [weekProgress, setWeekProgress] = useState<Record<string, number[]>>({});
  const [semesterFilter, setSemesterFilter] = useState<number | "all">("all");
  const [courseQuery, setCourseQuery] = useState("");
  const [courseKind, setCourseKind] = useState<(typeof courseKinds)[number][0]>("all");
  const [resourceQuery, setResourceQuery] = useState("");
  const [resourceArea, setResourceArea] = useState("All");
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLab, setActiveLab] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeTrack = tracks.find((track) => track.id === selectedTrack) ?? tracks[0];
  const completion = Math.round((completed.length / courses.length) * 100);

  useEffect(() => {
    const hydrationFrame = window.requestAnimationFrame(() => {
      const savedTrack = window.localStorage.getItem("course-atlas-track") as TrackId | null;
      if (savedTrack && tracks.some((track) => track.id === savedTrack)) {
        setSelectedTrack(savedTrack);
      }

      try {
        const savedProgress = JSON.parse(
          window.localStorage.getItem("course-atlas-ee-progress") ?? "[]",
        );
        if (Array.isArray(savedProgress)) {
          setCompleted(savedProgress.filter((code) => typeof code === "string"));
        }
      } catch {
        setCompleted([]);
      }

      try {
        const savedWeeks = JSON.parse(
          window.localStorage.getItem("course-atlas-week-progress-v1") ?? "{}",
        );
        if (savedWeeks && typeof savedWeeks === "object" && !Array.isArray(savedWeeks)) {
          const cleanWeeks = Object.fromEntries(
            Object.entries(savedWeeks).map(([key, value]) => [
              key,
              Array.isArray(value)
                ? value.filter(
                    (week): week is number =>
                      typeof week === "number" && week >= 1 && week <= 16,
                  )
                : [],
            ]),
          );
          setWeekProgress(cleanWeeks);
        }
      } catch {
        setWeekProgress({});
      }
    });

    const openFromHash = () => {
      const hash = window.location.hash.slice(1);
      const linkedCourse = courses.find((course) => courseSlug(course.code) === hash);
      if (linkedCourse) setActiveCourse(linkedCourse);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => {
      window.cancelAnimationFrame(hydrationFrame);
      window.removeEventListener("hashchange", openFromHash);
    };
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveCourse(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    if (!activeCourse) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeCourse]);

  const chooseTrack = (id: TrackId) => {
    setSelectedTrack(id);
    window.localStorage.setItem("course-atlas-track", id);
  };

  const setCourseDone = (code: string, done: boolean) => {
    setCompleted((current) => {
      const next = done
        ? Array.from(new Set([...current, code]))
        : current.filter((item) => item !== code);
      window.localStorage.setItem("course-atlas-ee-progress", JSON.stringify(next));
      return next;
    });
  };

  const toggleCourse = (code: string) => {
    const markComplete = !completed.includes(code);
    setCourseDone(code, markComplete);
    const key = courseProgressKey(code, selectedTrack);
    setWeekProgress((current) => {
      const next = {
        ...current,
        [key]: markComplete ? Array.from({ length: 16 }, (_, index) => index + 1) : [],
      };
      window.localStorage.setItem(
        "course-atlas-week-progress-v1",
        JSON.stringify(next),
      );
      return next;
    });
  };

  const toggleCourseWeek = (code: string, week: number) => {
    const key = courseProgressKey(code, selectedTrack);
    const currentWeeks = weekProgress[key] ?? [];
    const nextWeeks = currentWeeks.includes(week)
      ? currentWeeks.filter((item) => item !== week)
      : [...currentWeeks, week].sort((a, b) => a - b);
    const next = { ...weekProgress, [key]: nextWeeks };
    setWeekProgress(next);
    window.localStorage.setItem("course-atlas-week-progress-v1", JSON.stringify(next));
    setCourseDone(code, nextWeeks.length === 16);
  };

  const showCourse = (course: Course) => {
    setActiveCourse(course);
    setCopied(false);
    window.history.replaceState(null, "", `#${courseSlug(course.code)}`);
  };

  const closeCourse = () => {
    setActiveCourse(null);
    window.history.replaceState(null, "", "#courses");
  };

  const copyCourseLink = async () => {
    if (!activeCourse) return;
    await navigator.clipboard.writeText(
      `${window.location.origin}${window.location.pathname}#${courseSlug(activeCourse.code)}`,
    );
    setCopied(true);
  };

  const visibleSemesters = semesterFilter === "all"
    ? semesters
    : semesters.filter((semester) => semester.number === semesterFilter);

  const filteredCourses = useMemo(() => {
    const normalized = courseQuery.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesSemester =
        semesterFilter === "all" || course.semester === semesterFilter;
      const matchesKind = courseKind === "all" || course.kind === courseKind;
      const displayTitle = compactCourseTitle(course, selectedTrack);
      const matchesQuery =
        !normalized ||
        `${course.code} ${course.title} ${displayTitle} ${course.summary}`
          .toLowerCase()
          .includes(normalized);
      return matchesSemester && matchesKind && matchesQuery;
    });
  }, [courseKind, courseQuery, selectedTrack, semesterFilter]);

  const resourceAreas = useMemo(
    () => ["All", ...Array.from(new Set(resources.map((resource) => resource.area)))],
    [],
  );

  const filteredResources = useMemo(() => {
    const normalized = resourceQuery.trim().toLowerCase();
    return resources.filter((resource) => {
      const matchesArea = resourceArea === "All" || resource.area === resourceArea;
      const matchesQuery =
        !normalized ||
        `${resource.title} ${resource.provider} ${resource.note} ${resource.area}`
          .toLowerCase()
          .includes(normalized);
      return matchesArea && matchesQuery;
    });
  }, [resourceArea, resourceQuery]);

  const continueCourse =
    courses.find((course) => !completed.includes(course.code)) ?? courses[0];
  const continueWeeks =
    weekProgress[courseProgressKey(continueCourse.code, selectedTrack)] ?? [];
  const continueWeek =
    Array.from({ length: 16 }, (_, index) => index + 1).find(
      (week) => !continueWeeks.includes(week),
    ) ?? 16;

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>

      <header className="topbar">
        <Link className="brand" href="/" aria-label="Course Atlas degree catalog">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            <strong>Course Atlas</strong>
            <small>every subject · one path</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map(([label, id]) => (
            <a key={id} href={`#${id}`}>{label}</a>
          ))}
        </nav>

        <Link className="header-cta" href="/">
          All degrees <span aria-hidden="true">←</span>
        </Link>

        <details className="mobile-nav">
          <summary aria-label="Open navigation">Menu</summary>
          <nav aria-label="Mobile navigation">
            {navItems.map(([label, id]) => (
              <a key={id} href={`#${id}`}>{label}</a>
            ))}
          </nav>
        </details>
      </header>

      <main id="main-content">
        <section className="hero" id="top">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" />
              A complete route · Built from free courses
            </p>
            <h1>Your three-year electrical engineering university.</h1>
            <p className="hero-lede">
              Six semesters. Thirty-one courses. Every course tells you what to
              learn this week, exactly where to learn it for free, what to build or
              submit, and how your work will be tested.
            </p>
            <div className="hero-actions">
              <button
                className="button button-primary"
                type="button"
                onClick={() => showCourse(continueCourse)}
              >
                {continueWeeks.length
                  ? `Continue ${continueCourse.code} · Week ${continueWeek}`
                  : "Start Semester 1 · Week 1"}{" "}
                <span aria-hidden="true">→</span>
              </button>
              <a className="button button-quiet" href="#roadmap">
                See the full three-year route
              </a>
            </div>
            <div className="hero-note">
              <span aria-hidden="true">✦</span>
              <p>
                <strong>This replaces the learning structure, not the legal credential.</strong>{" "}
                It is independent self-study with real exams, lab evidence, projects,
                and a portfolio—not enrollment or an accredited degree.
              </p>
            </div>
          </div>

          <aside className="program-card" aria-label="Launch catalog at a glance">
            <div className="program-card-head">
              <span>Launch catalog</span>
              <span className="issue-tag">CA–01</span>
            </div>
            <div className="program-stats">
              <div>
                <strong>{schools.length}</strong>
                <span>school live</span>
              </div>
              <div>
                <strong>{programs.length}</strong>
                <span>program live</span>
              </div>
              <div>
                <strong>{courses.length}</strong>
                <span>complete courses</span>
              </div>
              <div>
                <strong>{courses.length * 16}</strong>
                <span>planned weeks</span>
              </div>
            </div>
            <div className="route-slip">
              <span className="route-label">First complete route</span>
              <span className="track-swatch" />
              <div>
                <strong>Electrical Engineering</strong>
                <small>School of Engineering · 3 years</small>
              </div>
              <a href="#programs" aria-label="Open Electrical Engineering program">Open</a>
            </div>
            <div className="progress-block">
              <div className="progress-label">
                <span>Your EE progress</span>
                <strong>{completed.length}/{courses.length}</strong>
              </div>
              <div
                className="progress-rail"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={courses.length}
                aria-valuenow={completed.length}
                aria-label={`${completion}% of courses marked complete`}
              >
                <span style={{ width: `${completion}%` }} />
              </div>
              <small>Stored only in this browser. No account required.</small>
            </div>
            <div className="program-stamp" aria-hidden="true">
              <span>LAUNCH</span>
              <b>CATALOG</b>
            </div>
          </aside>
        </section>

        <section className="notice-strip" aria-label="Important program status">
          <span className="notice-icon" aria-hidden="true">!</span>
          <p>{disclaimer}</p>
          <a href="#provenance">Read provenance</a>
        </section>

        <section className="section platform-section" id="catalog">
          <div className="section-intro">
            <p className="section-index">01 / The atlas</p>
            <h2>A degree is a sequence of work,<br />not a campus.</h2>
            <p>
              Open the semester, choose the course, and start the next week. The
              syllabus, free lessons, exercises, labs, submissions, midterms, and
              finals are already connected.
            </p>
          </div>

          <div className="atlas-chain" aria-label="Course Atlas content hierarchy">
            {[
              ["01", "Schools", "Broad homes for related disciplines"],
              ["02", "Disciplines", "Fields of study and practice"],
              ["03", "Programs", "Complete, sequenced learning paths"],
              ["04", "Courses", "Focused bodies of knowledge"],
              ["05", "Weeks", "Specific lessons, work, evidence, and checkpoints"],
              ["06", "Resources", "Exact free courses, texts, tools, and alternatives"],
            ].map(([number, label, note], index) => (
              <div key={label}>
                <span>{number}</span>
                <strong>{label}</strong>
                <small>{note}</small>
                {index < 5 && <i aria-hidden="true">→</i>}
              </div>
            ))}
          </div>

          <div className="catalog-status-grid">
            <article className="launch-school" id="schools">
              <div className="launch-school-head">
                <span>Live now · School 01</span>
                <b>Fully mapped</b>
              </div>
              <p>School</p>
              <h3>{schools[0].name}</h3>
              <small>{schools[0].kicker}</small>
              <div className="catalog-drilldown">
                <span><i>Discipline</i>{disciplines[0].name}</span>
                <span><i>Program</i>{programs[0].name}</span>
                <span><i>Depth</i>{semesters.length} semesters · {courses.length} courses · {courses.length * 16} executable weeks</span>
              </div>
              <a className="button button-primary" href="#programs">
                Open launch program <span aria-hidden="true">→</span>
              </a>
            </article>

            <aside className="upcoming-schools" aria-label="Schools planned for future releases">
              <div>
                <span>Growing next</span>
                <p>These are roadmap directions, not published programs or inflated catalog counts.</p>
              </div>
              {[
                ["School of Computing", "Computer science, software, data, and AI"],
                ["School of Natural Sciences", "Mathematics, physics, chemistry, and life sciences"],
                ["School of Humanities & Society", "History, philosophy, economics, and public life"],
                ["School of Design & Built Environment", "Design, architecture, and sustainable places"],
              ].map(([name, description]) => (
                <article key={name}>
                  <span>Framework planned</span>
                  <h3>{name}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </aside>
          </div>

          <div className="atlas-principles">
            <article>
              <span>01</span>
              <h3>Whole paths, not isolated classes</h3>
              <p>Prerequisites, load, assessments, labs, and outcomes stay visible from the first click.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Depth before catalog size</h3>
              <p>A school appears only when at least one complete program is genuinely usable.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Free access, labeled honestly</h3>
              <p>Openly licensed material, free tools, and free courses are distinguished instead of blurred together.</p>
            </article>
          </div>
        </section>

        <section className="section overview-section" id="programs">
          <div className="program-breadcrumb" aria-label="Program location">
            <Link href="/">Degree catalog</Link><b>→</b>
            <span>School of Engineering</span><b>→</b>
            <span>Electrical Engineering</span>
          </div>
          <div className="program-title-lockup">
            <div>
              <p className="section-index">02 / Launch program</p>
              <h2>Electrical Engineering</h2>
            </div>
            <div>
              <span>Program status</span>
              <strong>Complete first edition</strong>
              <small>{courses.length} courses · {programs[0].totalCredits} internal credits · {semesters.length} semesters</small>
            </div>
          </div>
          <nav className="program-nav" aria-label="Electrical Engineering program navigation">
            <span>EE program</span>
            <a href="#programs">Overview</a>
            <a href="#roadmap">Roadmap</a>
            <a href="#courses">Courses</a>
            <a href="#assessments">Assessments</a>
            <a href="#labs">Labs</a>
            <a href="#tracks">Tracks</a>
            <a href="#library">Library</a>
          </nav>
          <div className="section-intro">
            <h2>Designed like a real program.<br />Owned entirely by you.</h2>
            <p>
              The common core builds mathematical and physical intuition before
              specialization. Every semester pairs theory with evidence: code,
              measurements, design reviews, and artifacts you can show.
            </p>
          </div>

          <div className="principles-grid">
            <article className="principle-card principle-wide">
              <span className="card-number">01</span>
              <div className="mini-circuit" aria-hidden="true">
                <i /><i /><i /><i />
              </div>
              <h3>Learn → model → build → defend</h3>
              <p>
                Concepts become simulations, simulations become experiments, and
                experiments become decisions you can explain under questioning.
              </p>
              <div className="sequence" aria-label="Learning sequence">
                <span>First principles</span><b>→</b>
                <span>Prediction</span><b>→</b>
                <span>Test evidence</span><b>→</b>
                <span>Oral defense</span>
              </div>
            </article>

            <article className="principle-card">
              <span className="card-number">02</span>
              <h3>One foundation, four directions</h3>
              <p>
                Sixty-four common credits establish breadth. Choose a 24-credit
                specialization after Semester 4 without closing off adjacent fields.
              </p>
              <a className="text-link" href="#tracks">Compare tracks <ArrowIcon /></a>
            </article>

            <article className="principle-card paper-card">
              <span className="card-number">03</span>
              <h3>Portfolio is the transcript</h3>
              <p>
                Graduate with at least six substantial artifacts, lab notebooks,
                verified source histories, and a two-semester capstone.
              </p>
              <div className="artifact-list" aria-label="Portfolio artifacts">
                <span>schematics</span>
                <span>firmware</span>
                <span>datasets</span>
                <span>test reports</span>
              </div>
            </article>

            <article className="principle-card accent-card">
              <span className="card-number">04</span>
              <p className="big-quote">
                “Free” means no required proprietary software, paid course, or
                expensive instrument blocks a learning outcome.
              </p>
              <a className="text-link" href="#labs">See the three lab routes <ArrowIcon /></a>
            </article>
          </div>

          <div className="outcomes-band">
            <div>
              <p className="eyebrow">On completion, you can</p>
              <h3>Reason across the whole electrical system.</h3>
            </div>
            <ol>
              <li><span>01</span>Model circuits, signals, fields, feedback, and energy systems.</li>
              <li><span>02</span>Program computers and embedded processors in Python and C.</li>
              <li><span>03</span>Design experiments and distinguish a model from measured reality.</li>
              <li><span>04</span>Build within safety, ethics, accessibility, and environmental constraints.</li>
            </ol>
          </div>
        </section>

        <section className="section roadmap-section" id="roadmap">
          <div className="section-heading-row">
            <div className="section-intro compact">
            <p className="section-index">03 / EE roadmap</p>
              <h2>Six semesters. Three focused years.</h2>
              <p>
                Each term carries five or six coordinated courses over 16 weeks.
                Open any course for the actual free route and week-by-week work;
                progress stays on this device.
              </p>
            </div>
            <button className="print-button" type="button" onClick={() => window.print()}>
              <span aria-hidden="true">⇩</span> Print study plan
            </button>
          </div>

          <div className="semester-tabs" role="group" aria-label="Filter by semester">
            <button
              type="button"
              className={semesterFilter === "all" ? "is-active" : ""}
              onClick={() => setSemesterFilter("all")}
              aria-pressed={semesterFilter === "all"}
            >
              Full path
            </button>
            {semesters.map((semester) => (
              <button
                type="button"
                key={semester.number}
                className={semesterFilter === semester.number ? "is-active" : ""}
                onClick={() => setSemesterFilter(semester.number)}
                aria-pressed={semesterFilter === semester.number}
              >
                S{semester.number}
              </button>
            ))}
          </div>

          <div className="roadmap-grid">
            {visibleSemesters.map((semester) => {
              const termCourses = semester.courseCodes
                .map((code) => courses.find((course) => course.code === code))
                .filter((course): course is Course => Boolean(course));
              const termCompleted = termCourses.filter((course) =>
                completed.includes(course.code),
              ).length;
              return (
                <article
                  className="semester-card"
                  id={`semester-${semester.number}`}
                  key={semester.number}
                >
                  <div className="semester-top">
                    <div>
                      <span>Year {semester.year}</span>
                      <h3>Semester {semester.number}</h3>
                    </div>
                    <div className="semester-credit">
                      <strong>{semester.credits}</strong>
                      <small>credits</small>
                    </div>
                  </div>
                  <p className="semester-theme">{semester.theme}</p>
                  <div className="term-load">
                    <span>{semester.hours} h / week</span>
                    <span>{termCompleted}/{termCourses.length} complete</span>
                  </div>
                  <div className="course-list">
                    {termCourses.map((course) => {
                      const finishedWeeks =
                        weekProgress[courseProgressKey(course.code, selectedTrack)] ?? [];
                      const nextCourseWeek =
                        Array.from({ length: 16 }, (_, index) => index + 1).find(
                          (week) => !finishedWeeks.includes(week),
                        ) ?? 16;
                      const courseStatus = completed.includes(course.code)
                        ? "Completed"
                        : finishedWeeks.length
                          ? `Continue Week ${nextCourseWeek} · ${finishedWeeks.length}/16 done`
                          : "Start Week 1 · free route ready";

                      return (
                        <div
                          className={`roadmap-course ${completed.includes(course.code) ? "is-complete" : ""}`}
                          key={course.code}
                        >
                          <label title="Mark all sixteen course weeks complete">
                            <input
                              type="checkbox"
                              checked={completed.includes(course.code)}
                              onChange={() => toggleCourse(course.code)}
                            />
                            <span className="custom-check" aria-hidden="true">✓</span>
                            <span className="course-code">{course.code}</span>
                          </label>
                          <button type="button" onClick={() => showCourse(course)}>
                            <span>{compactCourseTitle(course, selectedTrack)}</span>
                            <small>
                              {trackSlots[course.code] !== undefined
                                ? `${activeTrack.name} · ${courseStatus}`
                                : courseStatus}
                            </small>
                          </button>
                          <span className="course-credits">{course.credits} cr</span>
                        </div>
                      );
                    })}
                  </div>
                  {semester.number === 4 && (
                    <a className="decision-marker" href="#tracks">
                      <span>Track decision</span>
                      Choose your specialization <span aria-hidden="true">→</span>
                    </a>
                  )}
                  {semester.number === 6 && (
                    <div className="finish-marker">
                      <span aria-hidden="true">✦</span>
                      Capstone defense + portfolio review
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="section courses-section" id="courses">
          <div className="section-intro compact">
            <p className="section-index">04 / EE course catalog</p>
            <h2>Every course has a job to do.</h2>
            <p>
              Search the complete route. Open a course to get its primary free
              course, alternatives, setup, sixteen weekly assignments, labs,
              midterms, final, and required evidence.
            </p>
          </div>

          <div className="catalog-toolbar">
            <label className="search-field">
              <span aria-hidden="true">⌕</span>
              <span className="sr-only">Search courses</span>
              <input
                type="search"
                value={courseQuery}
                onChange={(event) => setCourseQuery(event.target.value)}
                placeholder="Search signals, Python, ethics…"
              />
              {courseQuery && (
                <button
                  type="button"
                  onClick={() => setCourseQuery("")}
                  aria-label="Clear course search"
                >
                  ×
                </button>
              )}
            </label>
            <label className="select-field">
              <span className="sr-only">Filter course semester</span>
              <select
                value={semesterFilter}
                onChange={(event) =>
                  setSemesterFilter(
                    event.target.value === "all" ? "all" : Number(event.target.value),
                  )
                }
              >
                <option value="all">All semesters</option>
                {semesters.map((semester) => (
                  <option value={semester.number} key={semester.number}>
                    Semester {semester.number}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="filter-row" role="group" aria-label="Filter by course format">
            {courseKinds.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={courseKind === value ? "is-active" : ""}
                aria-pressed={courseKind === value}
                onClick={() => setCourseKind(value)}
              >
                {label}
              </button>
            ))}
            <span>{filteredCourses.length} shown</span>
          </div>

          <div className="catalog-list">
            {filteredCourses.map((course) => (
              <article className="catalog-row" key={course.code}>
                <div className={`kind-marker kind-${course.kind}`} aria-hidden="true" />
                <div className="catalog-code">
                  <strong>{course.code}</strong>
                  <span>Semester {course.semester}</span>
                </div>
                <div className="catalog-main">
                  <h3>{compactCourseTitle(course, selectedTrack)}</h3>
                  <p>{course.summary}</p>
                  <div>
                    <span>{course.kind}</span>
                    <span>{course.hours} h/week</span>
                    <span>{course.credits} credits</span>
                  </div>
                </div>
                <button
                  className="course-open"
                  type="button"
                  onClick={() => showCourse(course)}
                  aria-label={`View ${compactCourseTitle(course, selectedTrack)} details`}
                >
                  <span aria-hidden="true">→</span>
                </button>
              </article>
            ))}
            {filteredCourses.length === 0 && (
              <div className="empty-state">
                <span aria-hidden="true">∿</span>
                <h3>No courses match that circuit.</h3>
                <p>Try a broader term or clear one of the filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setCourseQuery("");
                    setCourseKind("all");
                    setSemesterFilter("all");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="section assessments-section" id="assessments">
          <div className="section-intro">
            <p className="section-index">05 / EE assessments</p>
            <h2>A predictable academic rhythm.</h2>
            <p>
              Every 16-week semester uses the same major checkpoints. Individual
              courses vary the evidence, but never spring the calendar on you.
            </p>
          </div>

          <div className="cadence-key" aria-label="Major semester checkpoints">
            <span><i className="key-teal" /> Learn &amp; practice</span>
            <span><i className="key-amber" /> Review &amp; test</span>
            <span><i className="key-coral" /> Demonstrate &amp; defend</span>
          </div>

          <div className="cadence-grid">
            {cadence.map((item) => (
              <article
                className={`week-card ${item.tone ? `week-${item.tone}` : ""}`}
                key={item.week}
              >
                <span className="week-number">W{String(item.week).padStart(2, "0")}</span>
                <h3>{item.label}</h3>
                <p>{item.focus}</p>
                <small>{item.checkpoint}</small>
              </article>
            ))}
          </div>

          <div className="major-checkpoints">
            <div><span>W6</span><strong>Midterm I</strong><small>15–20%</small></div>
            <i aria-hidden="true" />
            <div><span>W11</span><strong>Midterm II / practical</strong><small>10–15%</small></div>
            <i aria-hidden="true" />
            <div><span>W15</span><strong>Demo &amp; expo</strong><small>project evidence</small></div>
            <i aria-hidden="true" />
            <div><span>W16</span><strong>Cumulative final</strong><small>one per day max</small></div>
          </div>

          <div className="assessment-grid">
            {assessments.map((assessment) => (
              <article className="assessment-card" key={assessment.name}>
                <span className="assessment-audience">{assessment.audience}</span>
                <h3>{assessment.name}</h3>
                <div className="weight-list">
                  {assessment.parts.map((part) => (
                    <div className="weight-row" key={part.label}>
                      <div>
                        <span>{part.label}</span>
                        <strong>{part.weight}%</strong>
                      </div>
                      <span className="weight-rail">
                        <i style={{ width: `${part.weight}%` }} />
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section labs-section" id="labs">
          <div className="section-heading-row">
            <div className="section-intro compact">
              <p className="section-index">06 / EE laboratories</p>
              <h2>The instrument is a route,<br />not a gate.</h2>
              <p>
                Every practical course offers three equivalent ways to produce
                evidence. Choose by access—not prestige.
              </p>
            </div>
            <div className="lab-promise">
              <span aria-hidden="true">◎</span>
              <p><strong>Same outcome.</strong><br />Different bench.</p>
            </div>
          </div>

          <div className="lab-layout">
            <div className="lab-route-tabs" role="tablist" aria-label="Laboratory routes">
              {labRoutes.map((route, index) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeLab === index}
                  aria-controls={`lab-route-${index}`}
                  id={`lab-tab-${index}`}
                  className={activeLab === index ? "is-active" : ""}
                  key={route.name}
                  onClick={() => setActiveLab(index)}
                >
                  <span>Route {String.fromCharCode(65 + index)}</span>
                  <strong>{route.name}</strong>
                  <small>{route.label}</small>
                </button>
              ))}
            </div>

            <article
              className="lab-route-panel"
              id={`lab-route-${activeLab}`}
              role="tabpanel"
              aria-labelledby={`lab-tab-${activeLab}`}
            >
              <div className="bench-illustration" aria-hidden="true">
                <span className="bench-screen">
                  <i /><i /><i /><i /><i />
                </span>
                <span className="bench-node node-one" />
                <span className="bench-node node-two" />
                <span className="bench-wire wire-one" />
                <span className="bench-wire wire-two" />
              </div>
              <div>
                <p className="eyebrow">Route {String.fromCharCode(65 + activeLab)}</p>
                <h3>{labRoutes[activeLab].name}</h3>
                <p>{labRoutes[activeLab].description}</p>
                <ul>
                  {labRoutes[activeLab].tools.map((tool) => (
                    <li key={tool}><span aria-hidden="true">✓</span>{tool}</li>
                  ))}
                </ul>
              </div>
            </article>
          </div>

          <div className="evidence-strip">
            <span>Every lab record includes</span>
            <ul>
              <li>prediction</li>
              <li>raw data</li>
              <li>uncertainty</li>
              <li>model comparison</li>
              <li>failure analysis</li>
              <li>reproduction notes</li>
            </ul>
          </div>
        </section>

        <section className="section tracks-section" id="tracks">
          <div className="section-intro">
            <p className="section-index">07 / EE specialization tracks</p>
            <h2>Choose depth without losing breadth.</h2>
            <p>
              Your selected route gives direction to two specialization studios
              across Semesters 5–6. The studio sequence and two-part capstone turn
              depth into work you can reproduce and defend. Change the route any
              time; your choice is saved on this device.
            </p>
          </div>

          <div className="track-selector" role="radiogroup" aria-label="Select specialization">
            {tracks.map((track, index) => (
              <button
                type="button"
                role="radio"
                aria-checked={selectedTrack === track.id}
                className={`track-choice track-${track.id} ${selectedTrack === track.id ? "is-selected" : ""}`}
                key={track.id}
                onClick={() => chooseTrack(track.id)}
              >
                <span className="track-choice-top">
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  <b>{selectedTrack === track.id ? "Selected" : "Choose track"}</b>
                </span>
                <strong>{track.name}</strong>
                <small>{track.kicker}</small>
              </button>
            ))}
          </div>

          <article className={`track-detail track-${activeTrack.id}`}>
            <div className="track-detail-intro">
              <p className="eyebrow">Your current route</p>
              <h3>{activeTrack.name}</h3>
              <p>{activeTrack.description}</p>
              <div className="track-meta">
                <span><strong>2</strong> linked studios</span>
                <span><strong>4</strong> routes</span>
                <span><strong>S5–S6</strong> depth phase</span>
              </div>
            </div>
            <div className="track-course-map">
              <p className="track-map-label">Your two studios follow one coherent route</p>
              {activeTrack.courseNames.map((name, index) => (
                <div key={name}>
                  <span>Studio {index + 1}</span>
                  <i aria-hidden="true">{index + 1}</i>
                  <strong>{name}</strong>
                </div>
              ))}
            </div>
            <div className="capstone-ideas">
              <span>Capstone directions</span>
              {activeTrack.capstoneIdeas.map((idea) => (
                <p key={idea}><i aria-hidden="true">↳</i>{idea}</p>
              ))}
            </div>
          </article>
        </section>

        <section className="section library-section" id="library">
          <div className="section-heading-row">
            <div className="section-intro compact">
              <p className="section-index">08 / Open resource library</p>
              <h2>Your shelf of free, serious resources.</h2>
              <p>
                Direct links to open courses, textbooks, references, and engineering
                tools. Each access label describes what is free—not merely auditable.
              </p>
            </div>
            <span className="resource-count">
              <strong>{resources.length}</strong> verified starting points
            </span>
          </div>

          <div className="library-toolbar">
            <label className="search-field library-search">
              <span aria-hidden="true">⌕</span>
              <span className="sr-only">Search library</span>
              <input
                type="search"
                value={resourceQuery}
                onChange={(event) => setResourceQuery(event.target.value)}
                placeholder="Search provider, subject, or tool…"
              />
              {resourceQuery && (
                <button
                  type="button"
                  onClick={() => setResourceQuery("")}
                  aria-label="Clear resource search"
                >
                  ×
                </button>
              )}
            </label>
            <div className="area-filters" role="group" aria-label="Filter resources by area">
              {resourceAreas.map((area) => (
                <button
                  type="button"
                  key={area}
                  className={resourceArea === area ? "is-active" : ""}
                  aria-pressed={resourceArea === area}
                  onClick={() => setResourceArea(area)}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          <div className="resource-table" role="list">
            <div className="resource-table-head" aria-hidden="true">
              <span>Resource</span>
              <span>Area</span>
              <span>Access</span>
              <span />
            </div>
            {filteredResources.map((resource) => (
              <a
                className="resource-row"
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                key={`${resource.provider}-${resource.title}`}
                role="listitem"
              >
                <span className="resource-title">
                  <strong>{resource.title}</strong>
                  <small>{resource.provider} · {resource.note}</small>
                </span>
                <span className="resource-area">{resource.area}</span>
                <span className={`access-label access-${resource.access.toLowerCase().replace(/\s/g, "-")}`}>
                  {resource.access}
                </span>
                <span className="resource-arrow" aria-hidden="true">↗</span>
              </a>
            ))}
            {filteredResources.length === 0 && (
              <div className="empty-state">
                <span aria-hidden="true">⌕</span>
                <h3>No resource found.</h3>
                <p>Try a wider subject or show all resource areas.</p>
                <button
                  type="button"
                  onClick={() => {
                    setResourceQuery("");
                    setResourceArea("All");
                  }}
                >
                  Reset library
                </button>
              </div>
            )}
          </div>
          <p className="verification-note">
            <span aria-hidden="true">✓</span>
            URLs were checked against primary publishers while this curriculum was
            assembled. Availability can change; report broken links in your own study log.
          </p>
        </section>

        <section className="capstone-section" aria-labelledby="capstone-title">
          <div className="capstone-grid" aria-hidden="true" />
          <div>
            <p className="section-index">The finish line</p>
            <h2 id="capstone-title">One system.<br />Two semesters.<br />No hand-waving.</h2>
          </div>
          <div className="capstone-path">
            <article>
              <span>S5 · CAP 401</span>
              <h3>Define &amp; prototype</h3>
              <p>Stakeholder need, requirements, hazards, architecture, test plan, budget, and proof of concept.</p>
            </article>
            <i aria-hidden="true">→</i>
            <article>
              <span>S6 · CAP 402</span>
              <h3>Build, verify &amp; defend</h3>
              <p>Integrated artifact, test evidence, design history, public demonstration, report, and individual viva.</p>
            </article>
          </div>
          <div className="capstone-output">
            <span>Required release package</span>
            <div>
              <b>01</b><p>Working artifact</p>
              <b>02</b><p>Test evidence</p>
              <b>03</b><p>Safety case</p>
              <b>04</b><p>Public portfolio</p>
            </div>
          </div>
        </section>
      </main>

      <footer id="provenance">
        <div className="footer-brand">
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <span><strong>Course Atlas</strong><small>every subject · one path</small></span>
          </Link>
          <p>{disclaimer}</p>
        </div>
        <div className="provenance">
          <span>Curricular provenance</span>
          <p>
            The launch program is an original synthesis informed by the published
            structures of leading EE programs—not a reproduction of any one degree.
          </p>
          <div>
            {provenanceSources.map((source) => (
              <a href={source.url} target="_blank" rel="noreferrer" key={source.name}>
                {source.name} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>
        <div className="footer-meta">
          <span>Launch catalog · July 2026</span>
          <span>Every subject. One navigable education.</span>
        </div>
      </footer>

      {activeCourse && (
        <CourseClassroom
          course={activeCourse}
          displayTitle={compactCourseTitle(activeCourse, selectedTrack)}
          trackName={
            trackSlots[activeCourse.code] === undefined
              ? undefined
              : activeTrack.name
          }
          plan={getCoursePlan(activeCourse.code, selectedTrack)}
          completedWeeks={
            weekProgress[courseProgressKey(activeCourse.code, selectedTrack)] ?? []
          }
          copied={copied}
          onClose={closeCourse}
          onCopy={copyCourseLink}
          onToggleWeek={(week) => toggleCourseWeek(activeCourse.code, week)}
          onToggleCourse={() => toggleCourse(activeCourse.code)}
        />
      )}
    </div>
  );
}
