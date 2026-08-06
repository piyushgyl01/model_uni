import Link from "next/link";
import type {
  CalendarPeriodId,
  PublishedProgramBundle,
  RequirementGroup,
  ResourceVersionId,
  SchedulePlacement,
  SemanticVersion,
} from "./domain/catalog";
import ProgramProgress from "./program-progress";

export interface ProgramPageProps {
  readonly bundle: PublishedProgramBundle;
  readonly routeBase?: string;
  readonly availableVersions?: readonly SemanticVersion[];
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return value;
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
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
  availableVersions = [bundle.programVersion.version],
}: ProgramPageProps) {
  const {
    program,
    programVersion,
    courseVersions,
    learningUnits,
  } = bundle;
  const programSlug = program.canonicalSlug;
  const coursesById = new Map(bundle.courses.map((course) => [course.id, course]));
  const unitsById = new Map(learningUnits.map((unit) => [unit.id, unit]));
  const assessmentVersionsById = new Map(
    bundle.assessmentVersions.map((assessment) => [assessment.id, assessment]),
  );
  const assessmentsById = new Map(
    bundle.assessments.map((assessment) => [assessment.id, assessment]),
  );
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
  const periodsById = new Map(
    bundle.calendars.flatMap((calendar) =>
      calendar.periods.map((period) => [period.id, period] as const),
    ),
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
  const representativePathIds = new Set([
    ...coreCourseVersionIds,
    ...(concentrations[0]?.courseVersionIds ?? []),
  ]);
  const representativePathHours = courseVersions
    .filter((version) => representativePathIds.has(version.id))
    .reduce((total, version) => total + version.nominalHours, 0);

  const competencies = programVersion.competencyIds
    .map((id) => bundle.competencies.find((competency) => competency.id === id))
    .filter((competency): competency is NonNullable<typeof competency> =>
      Boolean(competency),
    );
  const competencyMappings = bundle.competencyMappings.filter(
    (mapping) =>
      mapping.subject.kind === "programVersion" &&
      mapping.subject.id === programVersion.id,
  );

  const schedule =
    bundle.schedules.find(
      (candidate) => candidate.id === programVersion.defaultScheduleId,
    ) ??
    bundle.schedules.find(
      (candidate) => candidate.programVersionId === programVersion.id,
    );
  const calendar = schedule
    ? bundle.calendars.find((candidate) => candidate.id === schedule.calendarId)
    : undefined;
  const periods = [...(calendar?.periods ?? [])].sort(
    (left, right) => left.order - right.order,
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
    [...(schedule?.placements ?? [])]
      .filter((placement) => placement.periodId === periodId)
      .sort((left, right) => left.order - right.order);
  const unassignedPlacements = [...(schedule?.placements ?? [])]
    .filter((placement) => !placement.periodId)
    .sort((left, right) => left.order - right.order);

  const resourceVersionsById = new Map(
    bundle.resourceVersions.map((resource) => [resource.id, resource]),
  );
  const resourcesById = new Map(
    bundle.resources.map((resource) => [resource.id, resource]),
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
          <span>
            <strong>Course Atlas</strong>
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
        <Link className="header-cta" href="/">
          All Degrees ←
        </Link>
      </header>

      <main id="main-content">
        {/* Degree Header */}
        <section className="hero universal-program-hero" aria-labelledby="program-title">
          <div className="program-breadcrumb" style={{ fontSize: "0.85rem", color: "#666", marginBottom: "8px" }}>
            <Link href="/">Degrees</Link> / <span>{program.school}</span>
          </div>

          <div style={{ borderBottom: "2px solid #222", paddingBottom: "15px", marginBottom: "20px" }}>
            <p className="eyebrow" style={{ fontSize: "0.85rem", fontFamily: "monospace", color: "#555" }}>
              {program.kind} · Independent-study pathway v{programVersion.version}
            </p>
            <h1 id="program-title" style={{ margin: "6px 0 10px 0" }}>{programVersion.title}</h1>
            <p className="hero-lede" style={{ fontSize: "1.05rem", color: "#333" }}>{programVersion.summary}</p>
          </div>

          <div className="program-meta-strip">
            <span>🗓️ <strong>Duration:</strong> {programVersion.nominalDuration}</span>
            <span>
              📚 <strong>Path:</strong> {representativePathIds.size} selected from {courseRecords.length} options
            </span>
            <span>⏱️ <strong>Workload:</strong> {representativePathHours} guided hours</span>
            <span>🏷️ <strong>Degree Level:</strong> {programVersion.credentialLabel}</span>
          </div>

          <div className="notice-strip universal-recognition-notice" role="note" style={{ margin: "15px 0", padding: "10px", background: "#f5f5f5", border: "1px solid #ccc", fontSize: "0.85rem" }}>
            <strong>Recognition and Transfer Notice:</strong>
            <p style={{ margin: "4px 0 0 0" }}>{programVersion.recognitionNotice}</p>
          </div>

          {/* Interactive Student Progress Checklist Tracker */}
          <div style={{ marginTop: "20px" }}>
            <ProgramProgress
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

        {/* SECTION 1: Study Schedule (Term-by-Term Recommended Sequence) */}
        <section
          className="section roadmap-section universal-schedule"
          id="schedule"
          aria-labelledby="schedule-title"
          style={{ marginTop: "35px" }}
        >
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

                      {placements.length > 0 ? (
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
            <p className="section-intro" style={{ color: "#555" }}>
              Click any course to open its full syllabus, free textbooks, lecture links, and unit exercises.
            </p>
          </div>

          <div className="course-list universal-course-list" style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
            {courseRecords.map(({ course, version }) => {
              const unitCount = learningUnits.filter(
                (unit) => unit.courseVersionId === version.id,
              ).length;
              return (
                <article className={`catalog-row kind-${version.format}`} key={version.id} style={{ border: "1px solid #ccc", padding: "12px", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ flex: "1 1 300px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#666" }}>
                      {course.codes[0]?.value ?? version.format}
                    </span>
                    <h3 style={{ margin: "2px 0 4px 0" }}>
                      <Link href={courseHref(routeBase, course.canonicalSlug)}>
                        {version.title}
                      </Link>
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "#444", margin: 0 }}>{version.summary}</p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <span style={{ fontSize: "0.85rem", fontFamily: "monospace" }}>{unitCount} units</span>
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
              <p className="section-intro" style={{ color: "#555" }}>
                Coherent specialization options to focus your degree.
              </p>
            </div>
            <div className="universal-concentration-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "15px", marginTop: "15px" }}>
              {concentrations.map((concentration) => (
                <article className="paper-card" key={concentration.id} style={{ border: "1px solid #ccc", padding: "14px", background: "#fff" }}>
                  <h3 style={{ margin: "0 0 6px 0" }}>{concentration.title}</h3>
                  <p style={{ fontSize: "0.85rem", color: "#444" }}>{concentration.description}</p>
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
                <article className="paper-card universal-requirement-group" key={group.id} style={{ border: "1px solid #ccc", padding: "14px", background: "#fff" }}>
                  <header style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee", paddingBottom: "6px" }}>
                    <h3 style={{ margin: 0 }}>{group.title}</h3>
                    <strong>{requirementRule(group)}</strong>
                  </header>
                  {group.description && <p style={{ fontSize: "0.85rem", color: "#555", margin: "6px 0" }}>{group.description}</p>}
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
            <article className="paper-card" style={{ border: "1px solid #ccc", padding: "14px", background: "#fff" }}>
              <h3>Outcomes</h3>
              <ol className="universal-outcome-list" style={{ paddingLeft: "20px", fontSize: "0.85rem" }}>
                {programVersion.outcomes.map((outcome, index) => (
                  <li key={`${index}-${outcome}`}>{outcome}</li>
                ))}
              </ol>
            </article>

            <article className="paper-card" style={{ border: "1px solid #ccc", padding: "14px", background: "#fff" }}>
              <h3>Competencies</h3>
              <div className="universal-competency-list" style={{ fontSize: "0.85rem" }}>
                {competencies.slice(0, 5).map((comp) => (
                  <div key={comp.id} style={{ margin: "6px 0" }}>
                    <strong>{comp.title}</strong> — {comp.domain}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        {/* SECTION 6: Resource Library & Provenance */}
        <section className="section library-section universal-resource-library" id="resources" style={{ marginTop: "40px" }}>
          <h3>Resource & Permissions Notice</h3>
          <p style={{ fontSize: "0.85rem", color: "#555" }}>
            Access is not the same as permission. All listed courses and learning units link directly to free open educational resources.
          </p>
        </section>
      </main>

      <footer className="universal-program-footer" style={{ borderTop: "2px solid #222", padding: "20px 0", marginTop: "50px", fontSize: "0.85rem" }}>
        <strong>Course Atlas</strong> — <small>Independent Study Pathway v{programVersion.version}</small>
      </footer>
    </div>
  );
}
