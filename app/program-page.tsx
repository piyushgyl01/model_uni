import Link from "next/link";
import type {
  PublishedProgramBundle,
  RequirementGroup,
  ResourceVersionId,
  SemanticVersion,
} from "./domain/catalog";
import { resolveLearnerPath } from "./domain/learner-path";
import ProgramProgress from "./program-progress";
import ProgramStudyPlan from "./program-study-plan";
import { TodayDashboardComponent } from "./today-dashboard-component";
import { ThemeSwitch } from "./theme";

export interface ProgramPageProps {
  readonly bundle: PublishedProgramBundle;
  readonly routeBase?: string;
  readonly availableVersions?: readonly SemanticVersion[];
}

function courseHref(routeBase: string, courseSlug: string) {
  return `${routeBase}/courses/${courseSlug}`;
}

function requirementRule(group: RequirementGroup) {
  const pieces: string[] = [];
  if (
    group.rule.maxSelections !== undefined &&
    group.rule.maxSelections === group.rule.minSelections
  ) {
    pieces.push(
      `Complete exactly ${group.rule.minSelections} ${
        group.rule.minSelections === 1 ? "course" : "courses"
      }`,
    );
  } else {
    pieces.push(
      `Complete at least ${group.rule.minSelections} ${
        group.rule.minSelections === 1 ? "course" : "courses"
      }`,
    );
    if (group.rule.maxSelections !== undefined) {
      pieces.push(`up to ${group.rule.maxSelections} may count`);
    }
  }
  if (group.rule.minCredits) {
    pieces.push(
      `minimum ${group.rule.minCredits.value} ${group.rule.minCredits.system} credits`,
    );
  }
  if (group.allowSharedCourseCounting) pieces.push("shared counting permitted");
  return pieces.join(" · ");
}

export default function ProgramPage({
  bundle,
  routeBase = `/programs/${bundle.program.canonicalSlug}`,
}: ProgramPageProps) {
  const clientBundle = {
    ...bundle,
    programVersion: {
      ...bundle.programVersion,
      changelog: undefined,
    },
    // Learner widgets need identities, prerequisites, hours, and schedule
    // data—not classroom setup prose. Keep that prose server-rendered on the
    // course page and out of this already-large client payload.
    courseVersions: bundle.courseVersions.map((courseVersion) => ({
      ...courseVersion,
      setup: [],
    })),
  };
  const {
    program,
    programVersion,
    courseVersions,
    learningUnits,
  } = bundle;
  const coursesById = new Map(bundle.courses.map((course) => [course.id, course]));
  const concentrationsById = new Map(
    bundle.concentrations.map((concentration) => [
      concentration.id,
      concentration,
    ]),
  );
  const concentrations = programVersion.concentrationIds
    .map((id) => concentrationsById.get(id))
    .filter(
      (concentration): concentration is NonNullable<typeof concentration> =>
        Boolean(concentration),
    );
  const courseRecords = courseVersions
    .map((version) => {
      const course = coursesById.get(version.courseId);
      return course ? { course, version } : undefined;
    })
    .filter((record): record is NonNullable<typeof record> => Boolean(record))
    .sort((left, right) => left.version.title.localeCompare(right.version.title));

  const courseRecordByVersionId = new Map(
    courseRecords.map((record) => [record.version.id, record]),
  );
  const programProgressCourses = courseRecords.map(({ version }) => ({
    courseVersionId: version.id,
    title: version.title,
    unitIds: learningUnits
      .filter((unit) => unit.courseVersionId === version.id)
      .map((unit) => unit.id),
  }));
  const concentrationCourseIds = new Set(
    concentrations.flatMap((concentration) => concentration.courseVersionIds),
  );
  const coreCourseVersionIds = courseRecords
    .map(({ version }) => version.id)
    .filter((id) => !concentrationCourseIds.has(id));
  const representativePath = resolveLearnerPath(bundle);
  const representativePathIds = representativePath.selectedCourseVersionIdSet;
  const representativePathHours = representativePath.totals.nominalHours;
  const representativeCalendar = representativePath.calendar;
  const representativePeriods = [...(representativeCalendar?.periods ?? [])];

  const competencies = programVersion.competencyIds
    .map((id) => bundle.competencies.find((competency) => competency.id === id))
    .filter((competency): competency is NonNullable<typeof competency> =>
      Boolean(competency),
    );
  const resourceVersionsById = new Map(
    bundle.resourceVersions.map((resource) => [resource.id, resource]),
  );
  const accessByResourceVersion = new Map<ResourceVersionId, typeof bundle.accessOffers>();
  const rightsByResourceVersion = new Map<ResourceVersionId, typeof bundle.rights>();
  const freshnessByResourceVersion = new Map<ResourceVersionId, typeof bundle.freshness>();
  for (const version of bundle.resourceVersions) {
    accessByResourceVersion.set(
      version.id,
      bundle.accessOffers.filter((offer) => offer.resourceVersionId === version.id),
    );
    rightsByResourceVersion.set(
      version.id,
      bundle.rights.filter((rights) => rights.resourceVersionId === version.id),
    );
    freshnessByResourceVersion.set(
      version.id,
      bundle.freshness.filter(
        (freshness) => freshness.resourceVersionId === version.id,
      ),
    );
  }

  return (
    <div className="site-shell universal-program-page">
      <a className="skip-link" href="#main-content">
        Skip to program content
      </a>

      {/* Top Header */}
      <header className="topbar universal-topbar">
        <Link className="brand" href="/" aria-label="Course Atlas home">
          <span className="brand-mark" aria-hidden="true" />
          <span><strong>Course Atlas</strong>
            <small>Independent Study Pathway</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Program sections">
          <a href="#schedule">Study Plan</a>
          <a href="#courses">Courses</a>
          {concentrations.length > 0 && <a href="#concentrations">Focus Areas</a>}
          <a href="#requirements">Requirements</a>
          <a href="#outcomes">Outcomes</a>
        </nav>
        <div className="topbar-actions">
          <ThemeSwitch />
          <Link className="header-cta" href="/">
            All Degrees ←
          </Link>
        </div>
      </header>

      <main id="main-content">
        {/* Degree Header */}
        <section className="hero universal-program-hero" aria-labelledby="program-title">
          <div className="program-breadcrumb" style={{ fontSize: "0.85rem", color: "var(--ink-soft, #666)", marginBottom: "8px" }}>
            <Link href="/">Degrees</Link> / <span>{program.school}</span>
          </div>

          <div style={{ borderBottom: "var(--stroke-strong, 2px) solid var(--ink, #222)", paddingBottom: "15px", marginBottom: "20px" }}>
            <p className="eyebrow" style={{ fontSize: "0.85rem", fontFamily: "var(--mono-font, monospace)", color: "var(--ink-soft, #555)" }}>
              {program.kind} · Published curriculum v{programVersion.version}
            </p>
            <h1 id="program-title" style={{ margin: "6px 0 10px 0" }}>{programVersion.title}</h1>
            <p className="hero-lede" style={{ fontSize: "1.05rem", color: "var(--ink, #333)" }}>{programVersion.summary}</p>
          </div>

          <div className="program-meta-strip">
            <span><strong>Duration:</strong> {programVersion.nominalDuration}
              {/* Most published durations already read "3 years · 6 terms", so
                  appending the term count unconditionally printed it twice. */}
              {representativeCalendar?.structure === "terms" &&
                !/\bterms?\b/i.test(programVersion.nominalDuration) &&
                ` · ${representativePeriods.length} terms`}
            </span>
            <span><strong>Path:</strong> {representativePathIds.size}
              {courseRecords.length !== representativePathIds.size
                ? ` selected from ${courseRecords.length} options`
                : ""}
            </span>
            <span><strong>Workload:</strong> {representativePathHours} guided hours</span>
            <span><strong>Degree Level:</strong> {programVersion.credentialLabel}</span>
          </div>

          {/* Interactive Student Progress Checklist Tracker */}
          <div style={{ marginTop: "20px" }}>
            <ProgramProgress
              bundle={clientBundle}
              programVersionId={programVersion.id}
              courses={programProgressCourses}
              coreCourseVersionIds={coreCourseVersionIds}
              concentrations={concentrations.map((concentration) => ({
                id: concentration.id,
                title: concentration.title,
                courseVersionIds: concentration.courseVersionIds,
              }))}
            />
          </div>
        </section>

          {/* Kept in full, but placed after the overview. It answers a question
              a visitor has not asked yet when it sits under the title. */}
          <div className="notice-strip universal-recognition-notice" role="note">
            <strong>Recognition and Transfer Notice:</strong>
            <p style={{ margin: "4px 0 0 0" }}>{programVersion.recognitionNotice}</p>
          </div>


        {/* TODAY'S STUDY QUEUE & ENROLLMENT DASHBOARD */}
        <TodayDashboardComponent bundle={clientBundle} />

        {/* SECTION 1: Study Schedule (Term-by-Term Recommended Sequence) */}
        <ProgramStudyPlan bundle={clientBundle} routeBase={routeBase} />

        {/* SECTION 2: Course Directory (All Courses) */}
        <section
          className="section courses-section universal-course-directory"
          id="courses"
          aria-labelledby="courses-title"
          style={{ marginTop: "40px" }}
        >
          <div className="section-heading-row">
            <div>
              <span className="section-index">02 / Complete Course Catalog</span>
              <h2 id="courses-title">All Degree Courses</h2>
            </div>
            <p className="section-intro" style={{ color: "var(--ink-soft, #555)" }}>
              Click any course to open its full syllabus, free textbooks, lecture links, and unit exercises.
            </p>
          </div>

          <div className="course-list universal-course-list" style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
            {courseRecords.map(({ course, version }) => {
              const unitCount = learningUnits.filter(
                (unit) => unit.courseVersionId === version.id,
              ).length;
              return (
                <article className={`catalog-row kind-${version.format}`} key={version.id} style={{ border: "var(--stroke, 1px) solid var(--rule, #ccc)", padding: "12px", background: "var(--paper, #fff)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ flex: "1 1 300px" }}>
                    <span style={{ fontFamily: "var(--mono-font, monospace)", fontSize: "0.8rem", color: "var(--ink-soft, #666)" }}>
                      {course.codes[0]?.value ?? version.format}
                    </span>
                    <h3 style={{ margin: "2px 0 4px 0" }}>
                      <Link href={courseHref(routeBase, course.canonicalSlug)}>
                        {version.title}
                      </Link>
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--ink-soft, #444)", margin: 0 }}>{version.summary}</p>
                    {version.prerequisites && version.prerequisites.length > 0 && (
                      <p style={{ fontSize: "0.8rem", color: "var(--ink-soft, #666)", marginTop: "4px", margin: 0 }}>
                        <strong>Prerequisites:</strong>{" "}
                        {version.prerequisites
                          .map((prereq) => {
                            const prereqCv = courseVersions.find(
                              (cv) => cv.id === prereq.courseVersionId,
                            );
                            return prereqCv ? `${prereqCv.title} (${prereq.kind})` : prereq.courseVersionId;
                          })
                          .join(", ")}
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <span style={{ fontSize: "0.85rem", fontFamily: "var(--mono-font, monospace)" }}>{unitCount} units</span>
                    <Link className="button button-primary" href={courseHref(routeBase, course.canonicalSlug)}>
                      Open Course →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: Concentrations (If any) */}
        {concentrations.length > 0 && (
          <section
            className="section tracks-section universal-concentrations"
            id="concentrations"
            aria-labelledby="concentrations-title"
            style={{ marginTop: "40px" }}
          >
            <div className="section-heading-row">
              <div>
                <span className="section-index">03 / Specializations</span>
                <h2 id="concentrations-title">Concentrations</h2>
              </div>
              <p className="section-intro" style={{ color: "var(--ink-soft, #555)" }}>
                Coherent specialization options to focus your degree.
              </p>
            </div>
            <div className="universal-concentration-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "15px", marginTop: "15px" }}>
              {concentrations.map((concentration) => (
                <article className="paper-card" key={concentration.id} style={{ border: "var(--stroke, 1px) solid var(--rule, #ccc)", padding: "14px", background: "var(--paper, #fff)" }}>
                  <h3 style={{ margin: "0 0 6px 0" }}>{concentration.title}</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink-soft, #444)" }}>{concentration.description}</p>
                  <strong style={{ fontSize: "0.85rem" }}>Required Concentration Courses:</strong>
                  <ul style={{ paddingLeft: "18px", margin: "6px 0", fontSize: "0.85rem" }}>
                    {concentration.courseVersionIds.map((id) => {
                      const record = courseRecordByVersionId.get(id);
                      return (
                        <li key={id}>
                          {record ? (
                            <Link href={courseHref(routeBase, record.course.canonicalSlug)}>
                              {record.version.title}
                            </Link>
                          ) : (
                            id
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 4: Requirements */}
        <section
          className="section universal-requirements"
          id="requirements"
          aria-labelledby="requirements-title"
          style={{ marginTop: "40px" }}
        >
          <div className="section-heading-row">
            <div>
              <span className="section-index">04 / Academic Rules</span>
              <h2 id="requirements-title">Degree Requirements</h2>
            </div>
          </div>

          <div className="universal-requirement-groups" style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "15px" }}>
            {[...programVersion.requirements]
              .sort((left, right) => left.order - right.order)
              .map((group) => (
                <article className="paper-card universal-requirement-group" key={group.id} style={{ border: "var(--stroke, 1px) solid var(--rule, #ccc)", padding: "14px", background: "var(--paper, #fff)" }}>
                  <header style={{ display: "flex", justifyContent: "space-between", borderBottom: "var(--stroke, 1px) solid var(--paper-soft, #eee)", paddingBottom: "6px" }}>
                    <h3 style={{ margin: 0 }}>{group.title}</h3>
                    <strong>{requirementRule(group)}</strong>
                  </header>
                  {group.description && <p style={{ fontSize: "0.85rem", color: "var(--ink-soft, #555)", margin: "6px 0" }}>{group.description}</p>}
                </article>
              ))}
          </div>
        </section>

        {/* SECTION 5: Outcomes & Competencies */}
        <section
          className="section overview-section universal-outcomes"
          id="outcomes"
          aria-labelledby="outcomes-title"
          style={{ marginTop: "40px" }}
        >
          <div className="section-heading-row">
            <div>
              <span className="section-index">05 / Learning Objectives</span>
              <h2 id="outcomes-title">Program Outcomes</h2>
            </div>
          </div>

          <div className="universal-outcomes-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "15px" }}>
            <article className="paper-card" style={{ border: "var(--stroke, 1px) solid var(--rule, #ccc)", padding: "14px", background: "var(--paper, #fff)" }}>
              <h3>Outcomes</h3>
              <ol className="universal-outcome-list" style={{ paddingLeft: "20px", fontSize: "0.85rem" }}>
                {programVersion.outcomes.map((outcome, index) => (
                  <li key={`${index}-${outcome}`}>{outcome}</li>
                ))}
              </ol>
            </article>

            <article className="paper-card" style={{ border: "var(--stroke, 1px) solid var(--rule, #ccc)", padding: "14px", background: "var(--paper, #fff)" }}>
              <h3>Competencies</h3>
              <div className="universal-competency-list" style={{ fontSize: "0.85rem" }}>
                {competencies.map((comp) => (
                  <div key={comp.id} style={{ margin: "6px 0" }}>
                    <strong>{comp.title}</strong> — {comp.domain}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="section library-section universal-resource-library" id="resources" style={{ marginTop: "40px" }}>
          <span className="section-index">06 / Resource Library</span>
          <h2 id="resources-title">Resource library</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--ink-soft, #555)" }}>
            Access is not the same as permission. All listed courses and learning units link directly to free open educational resources.
          </p>
          <div className="universal-resource-list" style={{ marginTop: "10px", fontSize: "0.85rem" }}>
            {[...resourceVersionsById.values()].map((version) => (
              <div key={version.id} style={{ margin: "4px 0" }}>
                <a href={version.canonicalUrl} target="_blank" rel="noreferrer">
                  <strong>{version.title}</strong>
                </a>
              </div>
            ))}
          </div>
        </section>

        {bundle.provenance.length > 0 && (
          <section className="section provenance universal-provenance" id="provenance" style={{ marginTop: "40px" }}>
            <span className="section-index">07 / Provenance</span>
            <h2 id="provenance-title">Sources and provenance</h2>
            <div className="universal-provenance-list" style={{ marginTop: "10px", fontSize: "0.85rem" }}>
              {bundle.provenance.map((evidence) => (
                <div key={evidence.id} style={{ margin: "6px 0" }}>
                  <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">
                    <strong>{evidence.sourceTitle}</strong> ↗
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="universal-program-footer" style={{ borderTop: "var(--stroke-strong, 2px) solid var(--ink, #222)", padding: "20px 0", marginTop: "50px", fontSize: "0.85rem" }}>
        <strong>Course Atlas</strong> — <small>Independent Study Pathway v{programVersion.version}</small>
      </footer>
    </div>
  );
}
