import Link from "next/link";
import { notFound } from "next/navigation";
import CourseProgress from "./course-progress";
import { CourseAccessProvider } from "./course-access-context";
import { PrerequisiteLockBanner } from "./prerequisite-lock-banner";
import { UnitEvidenceInput } from "./unit-evidence-input";
import type {
  CourseResourceReference,
  LearningUnit,
  PublishedProgramBundle,
  ResourceVersionId,
} from "./domain/catalog";

export interface CoursePageProps {
  readonly bundle: PublishedProgramBundle;
  readonly courseSlug: string;
  readonly routeBase?: string;
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

function exactResourceUrl(value: string) {
  return value.match(/https?:\/\/[^\s)\]}]+/u)?.[0]?.replace(/[.,;:]$/u, "");
}

export default function CoursePage({
  bundle,
  courseSlug,
  routeBase = `/programs/${bundle.program.canonicalSlug}`,
}: CoursePageProps) {
  const course = bundle.courses.find(
    (candidate) => candidate.canonicalSlug === courseSlug,
  );
  if (!course) notFound();

  const courseVersion = bundle.courseVersions.find(
    (candidate) => candidate.courseId === course.id,
  );
  if (!courseVersion) notFound();

  const programHref = routeBase;
  const coursesById = new Map(bundle.courses.map((item) => [item.id, item]));
  const courseVersionsById = new Map(
    bundle.courseVersions.map((item) => [item.id, item]),
  );
  const resourcesById = new Map(
    bundle.resources.map((resource) => [resource.id, resource]),
  );
  const resourceVersionsById = new Map(
    bundle.resourceVersions.map((resource) => [resource.id, resource]),
  );

  const units = bundle.learningUnits.filter(
    (unit) => unit.courseVersionId === courseVersion.id,
  );
  const childrenByParent = new Map<string, LearningUnit[]>();
  for (const unit of units) {
    if (!unit.parentUnitId) continue;
    const children = childrenByParent.get(unit.parentUnitId) ?? [];
    children.push(unit);
    childrenByParent.set(
      unit.parentUnitId,
      children.sort((left, right) => left.order - right.order),
    );
  }
  const declaredRoots = courseVersion.rootUnitIds
    .map((id) => units.find((unit) => unit.id === id))
    .filter((unit): unit is LearningUnit => Boolean(unit));
  const undeclaredRoots = units.filter(
    (unit) =>
      !unit.parentUnitId &&
      !courseVersion.rootUnitIds.some((rootId) => rootId === unit.id),
  );
  const roots = [...declaredRoots, ...undeclaredRoots].sort(
    (left, right) => left.order - right.order,
  );

  const orderedUnits: LearningUnit[] = [];
  const visitedUnits = new Set<string>();
  const visit = (unit: LearningUnit) => {
    if (visitedUnits.has(unit.id)) return;
    visitedUnits.add(unit.id);
    orderedUnits.push(unit);
    for (const child of childrenByParent.get(unit.id) ?? []) visit(child);
  };
  for (const root of roots) visit(root);
  for (const unit of [...units].sort((left, right) => left.order - right.order)) {
    visit(unit);
  }

  const prerequisites = courseVersion.prerequisites.map((prerequisite) => {
    const version = courseVersionsById.get(prerequisite.courseVersionId);
    const prerequisiteCourse = version
      ? coursesById.get(version.courseId)
      : undefined;
    return { prerequisite, version, course: prerequisiteCourse };
  });

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

  const renderResource = (
    reference: CourseResourceReference | { resourceVersionId: ResourceVersionId; role?: string },
    compact = false,
  ) => {
    const version = resourceVersionsById.get(reference.resourceVersionId);
    if (!version) return null;
    const resource = resourcesById.get(version.resourceId);
    const offers = accessByResourceVersion.get(version.id) ?? [];
    const rights = rightsByResourceVersion.get(version.id) ?? [];
    const freshness = freshnessByResourceVersion.get(version.id) ?? [];
    const role = "role" in reference ? reference.role : undefined;

    return (
      <article
        className={`universal-course-resource${compact ? " is-compact" : ""}`}
        key={`${reference.resourceVersionId}-${role ?? "unit"}`}
        style={{ border: "1px solid #ccc", padding: "10px", margin: "8px 0", background: "#fff" }}
      >
        <header>
          <span style={{ fontSize: "0.8rem", color: "#666", textTransform: "uppercase" }}>{role ?? resource?.kind ?? "resource"}</span>
          {compact ? (
            <h5 style={{ margin: "2px 0 4px 0" }}>
              <a href={version.canonicalUrl} target="_blank" rel="noreferrer">
                <strong>{version.title}</strong> ↗
              </a>
            </h5>
          ) : (
            <h3 style={{ margin: "4px 0" }}>
              <a href={version.canonicalUrl} target="_blank" rel="noreferrer">
                <strong>{version.title}</strong> ↗
              </a>
            </h3>
          )}
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#444" }}>
            {resource?.provider ?? "Unknown provider"}
            {version.authors.length ? ` · ${version.authors.join(", ")}` : ""}
          </p>
        </header>
        {"note" in reference && reference.note && <p style={{ fontSize: "0.85rem" }}>{reference.note}</p>}
        
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", fontSize: "0.8rem", fontFamily: "monospace", marginTop: "6px", background: "#f5f5f5", padding: "4px 8px" }}>
          <div>
            <strong>Access:</strong>{" "}
            {offers.length
              ? offers.map((o) => `${o.type} (${o.region})`).join(" · ")
              : "Not checked"}
          </div>
          <div>
            <strong>Rights:</strong>{" "}
            {rights.length
              ? rights.map((r) => r.licenseIdentifier ?? r.status).join(" · ")
              : "Unknown"}
          </div>
          <div>
            <strong>Freshness:</strong>{" "}
            {freshness.length
              ? freshness.map((f) => f.status).join(" · ")
              : "Not checked"}
          </div>
        </div>
      </article>
    );
  };

  const courseAssessmentVersions = bundle.assessmentVersions
    .filter((assessment) => assessment.courseVersionId === courseVersion.id)
    .sort((left, right) => left.title.localeCompare(right.title));
  const assessmentsById = new Map(
    bundle.assessments.map((assessment) => [assessment.id, assessment]),
  );
  const contributionByVersionId = new Map(
    courseVersion.gradingPolicy.contributions.map((contribution) => [
      contribution.assessmentVersionId,
      contribution,
    ]),
  );

  const renderLearningUnit = (unit: LearningUnit, depth = 0) => {
    const unitResources = unit.resourceVersionIds.map((resourceVersionId) => ({
      resourceVersionId,
    }));
    const children = childrenByParent.get(unit.id) ?? [];
    return (
      <article
        className="universal-learning-unit"
        data-depth={depth}
        id={unit.id}
        key={unit.id}
        aria-labelledby={`${unit.id}-title`}
        style={{ border: "1px solid #222", padding: "16px", background: "#ffffff", marginBottom: "15px" }}
      >
        <header className="universal-unit-heading" style={{ borderBottom: "1px solid #ddd", paddingBottom: "8px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#666" }}>
              {[
                `Unit ${unit.order}`,
                unit.kindLabel ?? unit.kind,
                ...(unit.label === `Unit ${unit.order}` ? [] : [unit.label]),
              ].join(" · ")}
            </span>
            <h3 id={`${unit.id}-title`} style={{ margin: "2px 0 0 0" }}>{unit.title}</h3>
          </div>
          <strong style={{ fontFamily: "monospace" }}>{unit.nominalHours} hours</strong>
        </header>

        <div className="universal-unit-workspace" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <section style={{ border: "1px solid #eee", padding: "10px", background: "#fafafa" }}>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "0.85rem", color: "#0000ee" }}>What to learn</h4>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>{unit.topic}</p>
          </section>

          <section style={{ border: "1px solid #eee", padding: "10px", background: "#fafafa" }}>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "0.85rem", color: "#0000ee" }}>Where to learn it</h4>
            {unit.resourceLocator && <p style={{ margin: "0 0 6px 0", fontSize: "0.9rem" }}>{unit.resourceLocator}</p>}
            {unitResources.length > 0 ? (
              <div className="universal-unit-resources">
                {unitResources.map((reference) =>
                  renderResource(reference, true),
                )}
              </div>
            ) : (
              !unit.resourceLocator && (
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#666" }}>Use course resources.</p>
              )
            )}
          </section>

          <section style={{ border: "1px solid #eee", padding: "10px", background: "#fafafa" }}>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "0.85rem", color: "#0000ee" }}>What to do</h4>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>{unit.activity}</p>
          </section>

          <section style={{ border: "1px solid #eee", padding: "10px", background: "#fafafa" }}>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "0.85rem", color: "#0000ee" }}>Evidence to keep</h4>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>{unit.evidence}</p>
            {unit.assessmentKind && (
              <small style={{ color: "#666", display: "block", marginTop: "4px" }}>
                Assessment mode: {unit.assessmentKind}
              </small>
            )}

            <UnitEvidenceInput
              programVersionId={bundle.programVersion.id}
              courseVersionId={courseVersion.id}
              unitId={unit.id}
            />
          </section>
        </div>

        {unit.weeklyAssignments && unit.weeklyAssignments.length > 0 && (
          <section
            aria-label={`${unit.title} weekly assignments`}
            style={{ marginTop: "15px", borderTop: "1px solid #222", paddingTop: "12px" }}
          >
            <h4 style={{ margin: "0 0 8px 0" }}>Exact weekly assignments</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px" }}>
              {unit.weeklyAssignments.map((assignment) => {
                const resourceUrl = exactResourceUrl(assignment.resourceLocator);
                return (
                  <article
                    key={assignment.week}
                    style={{ border: "1px solid #ccc", padding: "10px", background: "#fafafa" }}
                  >
                    <header style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                      <strong>Week {assignment.week}: {assignment.title}</strong>
                      <span style={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>
                        {assignment.estimatedHours}h
                      </span>
                    </header>
                    <p style={{ margin: "8px 0 4px", fontSize: "0.85rem" }}>
                      <strong>Location:</strong> {assignment.resourceLocator}{" "}
                      {resourceUrl && (
                        <a href={resourceUrl} target="_blank" rel="noreferrer">
                          Open exact source ↗
                        </a>
                      )}
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "0.78rem", color: "#555" }}>
                      <strong>Source check:</strong>{" "}
                      {assignment.sourceEvidence.accessType === "free audit"
                        ? "Free to audit"
                        : "Free access"}
                      {" · "}
                      {assignment.sourceEvidence.licenseIdentifier ??
                        assignment.sourceEvidence.rightsStatus}
                      {" · checked "}
                      {formatDate(assignment.sourceEvidence.checkedAt)}
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "0.85rem" }}>
                      <strong>Assignment:</strong> {assignment.activity}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
                      <strong>Deliverable:</strong> {assignment.deliverable}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {children.length > 0 && (
          <div className="universal-unit-children" style={{ marginTop: "15px", paddingLeft: "15px", borderLeft: "2px solid #ddd" }}>
            {children.map((child) => renderLearningUnit(child, depth + 1))}
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="site-shell universal-course-page">
      <a className="skip-link" href="#course-main">
        Skip to course content
      </a>

      {/* Course Navigation Bar */}
      <header className="topbar universal-topbar">
        <Link className="brand" href="/" aria-label="Course Atlas home">
          <span className="brand-mark" aria-hidden="true" />
          <span>
            <strong>Course Atlas</strong>
            <small>Course Syllabus</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Course sections">
          <a href="#learning-units">Learning Plan</a>
          <a href="#course-resources">Course Resources</a>
          <a href="#assessments">Assessments</a>
          <a href="#start">Prerequisites & Setup</a>
        </nav>
        <Link className="header-cta" href={programHref}>
          Degree ←
        </Link>
      </header>

      <main id="course-main">
        <CourseAccessProvider
          bundle={bundle}
          courseVersionId={courseVersion.id}
        >
        {/* Prerequisite Lock Warning Banner if required prerequisites are unfulfilled */}
        <PrerequisiteLockBanner />

        {/* Course Header Banner */}
        <section className="hero universal-course-hero" aria-labelledby="course-title">
          <div className="program-breadcrumb" style={{ fontSize: "0.85rem", color: "#666", marginBottom: "8px" }}>
            <Link href="/">Degrees</Link> / <Link href={programHref}>{bundle.programVersion.title}</Link> / <span>Course</span>
          </div>

          <div style={{ borderBottom: "2px solid #222", paddingBottom: "15px", marginBottom: "15px" }}>
            <p className="eyebrow" style={{ fontSize: "0.85rem", fontFamily: "monospace", color: "#555" }}>
              {course.codes.map((code) => `${code.namespace} ${code.value}`).join(" · ") || course.discipline}
            </p>
            <h1 id="course-title" style={{ margin: "4px 0 8px 0" }}>{courseVersion.title}</h1>
            <p className="hero-lede" style={{ fontSize: "1.05rem", color: "#333" }}>{courseVersion.summary}</p>
          </div>

          <div className="course-meta-strip">
            <span>⏱️ <strong>Guided Workload:</strong> {courseVersion.nominalHours} hours</span>
            <span>📖 <strong>Syllabus:</strong> {orderedUnits.length} learning units</span>
            <span>🎯 <strong>Passing Score:</strong> {courseVersion.gradingPolicy.passingPercentage}%</span>
            <span>🏷️ <strong>Format:</strong> {courseVersion.format}</span>
          </div>

          {/* Interactive Unit Progress Checklist Tracker */}
          <div style={{ marginTop: "20px" }}>
            <CourseProgress
              programVersionId={bundle.programVersion.id}
              courseVersionId={courseVersion.id}
              units={orderedUnits.map((unit) => ({
                id: unit.id,
                label: unit.label,
                title: unit.title,
              }))}
            />
          </div>
        </section>

        {/* SECTION 1: Executable Learning Units / Syllabus (FRONT & CENTER) */}
        <section
          className="section universal-learning-plan"
          id="learning-units"
          aria-labelledby="learning-units-title"
          style={{ marginTop: "35px" }}
        >
          <div className="section-heading-row">
            <div>
              <span className="section-index">01 / Executable Syllabus</span>
              <h2 id="learning-units-title">Learning plan</h2>
            </div>
            <p className="section-intro" style={{ color: "#555" }}>
              Complete units in sequence. {orderedUnits.length} learning units designed for self-directed study.
            </p>
          </div>

          {roots.length > 0 ? (
            <div className="universal-learning-unit-list" style={{ marginTop: "15px" }}>
              {roots.map((unit) => renderLearningUnit(unit))}
            </div>
          ) : (
            <div className="paper-card empty-state" style={{ padding: "15px", border: "1px solid #ccc" }}>
              This course version does not contain learning units yet.
            </div>
          )}
        </section>

        {/* SECTION 2: Course Level Open Educational Resources */}
        <section
          className="section library-section universal-course-routes"
          id="course-resources"
          aria-labelledby="course-resources-title"
          style={{ marginTop: "40px" }}
        >
          <div className="section-heading-row">
            <div>
              <span className="section-index">02 / Open Textbooks & Videos</span>
              <h2 id="course-resources-title">Course resources</h2>
            </div>
            <p className="section-intro" style={{ color: "#555" }}>
              Free educational resources, lecture videos, and open textbooks for this course.
            </p>
          </div>
          {courseVersion.resourceReferences.length > 0 ? (
            <div className="universal-course-resource-grid" style={{ marginTop: "15px" }}>
              {courseVersion.resourceReferences.map((reference) =>
                renderResource(reference),
              )}
            </div>
          ) : (
            <div className="paper-card empty-state" style={{ padding: "15px", border: "1px solid #ccc" }}>
              No course-level resources are published. Check the individual learning units for specific sources.
            </div>
          )}
        </section>

        {/* SECTION 3: Assessments & Grading */}
        <section
          className="section assessments-section universal-course-assessments"
          id="assessments"
          aria-labelledby="assessments-title"
          style={{ marginTop: "40px" }}
        >
          <div className="section-heading-row">
            <div>
              <span className="section-index">03 / Assignments & Exams</span>
              <h2 id="assessments-title">Assessments and grading</h2>
            </div>
            <p className="section-intro" style={{ color: "#555" }}>
              Pass at {courseVersion.gradingPolicy.passingPercentage}%. Demonstrate understanding through projects and exercises.
            </p>
          </div>

          {courseAssessmentVersions.length > 0 ? (
            <div className="assessment-grid universal-assessment-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "15px", marginTop: "15px" }}>
              {courseAssessmentVersions.map((assessmentVersion) => {
                const assessment = assessmentsById.get(
                  assessmentVersion.assessmentId,
                );
                const contribution = contributionByVersionId.get(
                  assessmentVersion.id,
                );
                return (
                  <article
                    className="assessment-card"
                    id={`assessment-${assessmentVersion.id}`}
                    key={assessmentVersion.id}
                    style={{ border: "1px solid #ccc", padding: "14px", background: "#fff" }}
                  >
                    <header style={{ borderBottom: "1px solid #eee", paddingBottom: "6px" }}>
                      <span style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "#666" }}>
                        {[assessmentVersion.stage, assessment?.kind ?? "assessment"]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <strong style={{ display: "block" }}>
                        {contribution
                          ? `${contribution.weight}% of final score`
                          : "Practice / unweighted"}
                      </strong>
                    </header>
                    <h3 style={{ margin: "6px 0 4px 0" }}>{assessmentVersion.title}</h3>
                    <p style={{ fontSize: "0.85rem", color: "#444" }}>{assessmentVersion.instructions}</p>
                    <div style={{ fontSize: "0.85rem", fontFamily: "monospace", margin: "8px 0" }}>
                      Effort: {assessmentVersion.estimatedHours} hours | Max Score: {assessmentVersion.maximumScore}
                      {assessmentVersion.passingScore !== undefined
                        ? ` | Pass: ${assessmentVersion.passingScore}`
                        : ""}
                    </div>
                    <strong style={{ fontSize: "0.85rem" }}>Submission evidence:</strong>
                    <ul style={{ paddingLeft: "18px", margin: "4px 0", fontSize: "0.85rem" }}>
                      {assessmentVersion.submissionEvidence.map((evidence) => (
                        <li key={evidence}>{evidence}</li>
                      ))}
                    </ul>
                    {assessmentVersion.rubric && assessmentVersion.rubric.length > 0 && (
                      <div style={{ marginTop: "10px" }}>
                        <strong style={{ fontSize: "0.85rem" }}>Rubric:</strong>
                        <ul style={{ paddingLeft: "18px", margin: "4px 0", fontSize: "0.85rem" }}>
                          {assessmentVersion.rubric.map((criterion) => (
                            <li key={criterion.criterion}>
                              <strong>{criterion.criterion} ({criterion.points}):</strong>{" "}
                              {criterion.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="paper-card empty-state" style={{ padding: "15px", border: "1px solid #ccc" }}>
              No scored assessments are published for this course version.
            </div>
          )}
        </section>

        {/* SECTION 4: Setup & Prerequisites */}
        <section
          className="section universal-course-start"
          id="start"
          aria-labelledby="start-title"
          style={{ marginTop: "40px" }}
        >
          <div className="section-heading-row">
            <div>
              <span className="section-index">04 / Prerequisites & Setup</span>
              <h2 id="start-title">Start here</h2>
            </div>
            <p className="section-intro" style={{ color: "#555" }}>{courseVersion.firstAction}</p>
          </div>

          <div className="universal-course-start-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "15px" }}>
            <article className="paper-card" style={{ border: "1px solid #ccc", padding: "14px", background: "#fff" }}>
              <h3>Setup Before Learning</h3>
              {courseVersion.setup.length > 0 ? (
                <ul className="setup-list" style={{ paddingLeft: "18px" }}>
                  {courseVersion.setup.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No special setup is required.</p>
              )}
              {courseVersion.safetyNote && (
                <div className="safety-note" role="note" style={{ marginTop: "10px", padding: "8px", background: "#fff8f8", border: "1px solid #e00" }}>
                  <strong>Safety note:</strong>
                  <p style={{ margin: "2px 0 0 0" }}>{courseVersion.safetyNote}</p>
                </div>
              )}
            </article>

            <article className="paper-card" style={{ border: "1px solid #ccc", padding: "14px", background: "#fff" }}>
              <h3>Prerequisites</h3>
              {prerequisites.length > 0 ? (
                <ul className="universal-prerequisite-list" style={{ paddingLeft: "18px" }}>
                  {prerequisites.map(({ prerequisite, version, course: prerequisiteCourse }) => (
                    <li key={prerequisite.courseVersionId}>
                      {version && prerequisiteCourse ? (
                        <Link href={`${programHref}/courses/${prerequisiteCourse.canonicalSlug}`}>
                          <strong>{version.title}</strong>
                        </Link>
                      ) : (
                        <strong>{prerequisite.courseVersionId}</strong>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No formal prerequisites are published for this course.</p>
              )}
            </article>
          </div>
        </section>
        </CourseAccessProvider>
      </main>

      <footer className="universal-program-footer" style={{ borderTop: "2px solid #222", padding: "20px 0", marginTop: "50px", fontSize: "0.85rem" }}>
        <strong>{courseVersion.title}</strong> — <small>Part of <Link href={programHref}>{bundle.programVersion.title}</Link></small>
      </footer>
    </div>
  );
}
