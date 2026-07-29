import Link from "next/link";
import { notFound } from "next/navigation";
import CourseProgress from "./course-progress";
import type {
  CourseResourceReference,
  LearningUnit,
  PublishedProgramBundle,
  ResourceVersionId,
} from "./domain/catalog";

export interface CoursePageProps {
  readonly bundle: PublishedProgramBundle;
  readonly courseSlug: string;
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

export default function CoursePage({ bundle, courseSlug }: CoursePageProps) {
  const course = bundle.courses.find(
    (candidate) => candidate.canonicalSlug === courseSlug,
  );
  if (!course) notFound();

  const courseVersion = bundle.courseVersions.find(
    (candidate) => candidate.courseId === course.id,
  );
  if (!courseVersion) notFound();

  const programHref = `/programs/${bundle.program.canonicalSlug}`;
  const courseHref = `${programHref}/courses/${course.canonicalSlug}`;
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
      >
        <header>
          <span>{role ?? resource?.kind ?? "resource"}</span>
          {compact ? <h5>
            <a href={version.canonicalUrl} target="_blank" rel="noreferrer">
              {version.title} <span aria-hidden="true">↗</span>
            </a>
          </h5> : <h3>
            <a href={version.canonicalUrl} target="_blank" rel="noreferrer">
              {version.title} <span aria-hidden="true">↗</span>
            </a>
          </h3>}
          <p>
            {resource?.provider ?? "Unknown provider"}
            {version.authors.length ? ` · ${version.authors.join(", ")}` : ""}
          </p>
        </header>
        {"note" in reference && reference.note && <p>{reference.note}</p>}
        <dl className="universal-resource-facts">
          <div>
            <dt>Access</dt>
            <dd>
              {offers.length
                ? offers
                    .map(
                      (offer) =>
                        `${offer.type} (${offer.region})${
                          offer.loginRequired ? ", login required" : ""
                        }`,
                    )
                    .join(" · ")
                : "Not checked"}
            </dd>
          </div>
          <div>
            <dt>Rights</dt>
            <dd>
              {rights.length
                ? rights
                    .map(
                      (record) =>
                        record.licenseIdentifier ?? record.status,
                    )
                    .join(" · ")
                : "Unknown"}
            </dd>
          </div>
          <div>
            <dt>Freshness</dt>
            <dd>
              {freshness.length
                ? freshness
                    .map(
                      (record) =>
                        `${record.status}${
                          record.checkedAt
                            ? `, checked ${formatDate(record.checkedAt)}`
                            : ""
                        }`,
                    )
                    .join(" · ")
                : "Not checked"}
            </dd>
          </div>
        </dl>
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
      >
        <header className="universal-unit-heading">
          <div>
            <span>
              {unit.kindLabel ?? unit.kind} · {unit.label}
            </span>
            <h3 id={`${unit.id}-title`}>{unit.title}</h3>
          </div>
          <strong>{unit.nominalHours} hours</strong>
        </header>

        <div className="universal-unit-workspace">
          <section>
            <span aria-hidden="true">01</span>
            <h4>What to learn</h4>
            <p>{unit.topic}</p>
          </section>
          <section>
            <span aria-hidden="true">02</span>
            <h4>Where to learn it</h4>
            {unit.resourceLocator && <p>{unit.resourceLocator}</p>}
            {unitResources.length > 0 ? (
              <div className="universal-unit-resources">
                {unitResources.map((reference) =>
                  renderResource(reference, true),
                )}
              </div>
            ) : (
              !unit.resourceLocator && (
                <p>Use the course resources listed above.</p>
              )
            )}
          </section>
          <section>
            <span aria-hidden="true">03</span>
            <h4>What to do</h4>
            <p>{unit.activity}</p>
          </section>
          <section>
            <span aria-hidden="true">04</span>
            <h4>Evidence to keep</h4>
            <p>{unit.evidence}</p>
            {unit.assessmentKind && (
              <small>Assessment mode: {unit.assessmentKind}</small>
            )}
          </section>
        </div>

        {children.length > 0 && (
          <div className="universal-unit-children">
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

      <header className="topbar universal-topbar">
        <Link className="brand" href="/" aria-label="Course Atlas home">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            <strong>Course Atlas</strong>
            <small>Executable learning paths</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Course sections">
          <a href="#start">Start</a>
          <a href="#learning-units">Learning plan</a>
          <a href="#assessments">Assessments</a>
          <a href="#course-provenance">Sources</a>
        </nav>
        <Link className="header-cta" href={programHref}>
          Program <span aria-hidden="true">←</span>
        </Link>
      </header>

      <main id="course-main">
        <section className="hero universal-course-hero" aria-labelledby="course-title">
          <div className="program-breadcrumb">
            <Link href="/">Program catalog</Link>
            <span aria-hidden="true">/</span>
            <Link href={programHref}>{bundle.programVersion.title}</Link>
            <span aria-hidden="true">/</span>
            <span>Course</span>
          </div>

          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">
                {course.codes
                  .map((code) => `${code.namespace} ${code.value}`)
                  .join(" · ") || course.discipline}
              </p>
              <h1 id="course-title">{courseVersion.title}</h1>
              <p className="hero-lede">{courseVersion.summary}</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#start">
                  Start this course <span aria-hidden="true">↓</span>
                </a>
                <a className="button button-quiet" href="#learning-units">
                  Inspect the syllabus
                </a>
              </div>
            </div>

            <aside className="paper-card universal-course-facts" aria-label="Course facts">
              <dl>
                <div>
                  <dt>Format</dt>
                  <dd>{courseVersion.format}</dd>
                </div>
                <div>
                  <dt>Guided workload</dt>
                  <dd>{courseVersion.nominalHours} hours</dd>
                </div>
                <div>
                  <dt>Learning units</dt>
                  <dd>{orderedUnits.length}</dd>
                </div>
                <div>
                  <dt>Passing score</dt>
                  <dd>{courseVersion.gradingPolicy.passingPercentage}%</dd>
                </div>
                <div>
                  <dt>Version</dt>
                  <dd>{courseVersion.version}</dd>
                </div>
                <div>
                  <dt>Published</dt>
                  <dd>{formatDate(courseVersion.publishedAt)}</dd>
                </div>
              </dl>
            </aside>
          </div>

          <CourseProgress
            programVersionId={bundle.programVersion.id}
            courseVersionId={courseVersion.id}
            units={orderedUnits.map((unit) => ({
              id: unit.id,
              label: unit.label,
              title: unit.title,
            }))}
          />
        </section>

        <section
          className="section universal-course-start"
          id="start"
          aria-labelledby="start-title"
        >
          <div className="section-heading-row">
            <div>
              <span className="section-index">01</span>
              <p className="eyebrow">Set up, then take the first action</p>
              <h2 id="start-title">Start here</h2>
            </div>
            <p className="section-intro">{courseVersion.firstAction}</p>
          </div>

          <div className="universal-course-start-grid">
            <article className="paper-card">
              <h3>Set up before learning</h3>
              {courseVersion.setup.length > 0 ? (
                <ul className="setup-list">
                  {courseVersion.setup.map((item) => (
                    <li key={item}>
                      <span aria-hidden="true">□</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No special setup is required.</p>
              )}
              {courseVersion.safetyNote && (
                <div className="safety-note" role="note">
                  <strong>Safety note</strong>
                  <p>{courseVersion.safetyNote}</p>
                </div>
              )}
            </article>

            <article className="paper-card">
              <h3>Prerequisites</h3>
              {prerequisites.length > 0 ? (
                <ul className="universal-prerequisite-list">
                  {prerequisites.map(({ prerequisite, version, course: prerequisiteCourse }) => (
                    <li key={prerequisite.courseVersionId}>
                      <span>{prerequisite.kind}</span>
                      {version && prerequisiteCourse ? (
                        <Link
                          href={`${programHref}/courses/${prerequisiteCourse.canonicalSlug}`}
                        >
                          <strong>{version.title}</strong>
                        </Link>
                      ) : (
                        <strong>{prerequisite.courseVersionId}</strong>
                      )}
                      {prerequisite.concurrentEnrollmentAllowed && (
                        <small>Concurrent enrollment is allowed.</small>
                      )}
                      {prerequisite.note && <p>{prerequisite.note}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No formal prerequisites are published for this course.</p>
              )}
            </article>

            <article className="paper-card universal-course-outcomes">
              <h3>By the end, you should be able to</h3>
              <ol>
                {courseVersion.outcomes.map((outcome) => (
                  <li key={outcome}>{outcome}</li>
                ))}
              </ol>
            </article>
          </div>
        </section>

        <section
          className="section library-section universal-course-routes"
          id="course-resources"
          aria-labelledby="course-resources-title"
        >
          <div className="section-heading-row">
            <div>
              <span className="section-index">02</span>
              <p className="eyebrow">Primary route plus real alternatives</p>
              <h2 id="course-resources-title">Course resources</h2>
            </div>
            <p className="section-intro">
              Choose a route that is accessible in your region. Access, reuse
              rights and freshness are reported separately.
            </p>
          </div>
          {courseVersion.resourceReferences.length > 0 ? (
            <div className="universal-course-resource-grid">
              {courseVersion.resourceReferences.map((reference) =>
                renderResource(reference),
              )}
            </div>
          ) : (
            <div className="paper-card empty-state">
              No course-level resources are published. Check the individual
              learning units for specific sources.
            </div>
          )}
        </section>

        <section
          className="section universal-learning-plan"
          id="learning-units"
          aria-labelledby="learning-units-title"
        >
          <div className="section-heading-row">
            <div>
              <span className="section-index">03</span>
              <p className="eyebrow">An executable syllabus at any length</p>
              <h2 id="learning-units-title">Learning plan</h2>
            </div>
            <p className="section-intro">
              Every unit answers what to learn, where to learn it, what to do and
              what evidence to keep. There is no fixed week count.
            </p>
          </div>
          {roots.length > 0 ? (
            <div className="universal-learning-unit-list">
              {roots.map((unit) => renderLearningUnit(unit))}
            </div>
          ) : (
            <div className="paper-card empty-state">
              This course version does not contain learning units yet.
            </div>
          )}
        </section>

        <section
          className="section assessments-section universal-course-assessments"
          id="assessments"
          aria-labelledby="assessments-title"
        >
          <div className="section-heading-row">
            <div>
              <span className="section-index">04</span>
              <p className="eyebrow">Demonstrate, do not merely consume</p>
              <h2 id="assessments-title">Assessments and grading</h2>
            </div>
            <p className="section-intro">
              Pass at {courseVersion.gradingPolicy.passingPercentage}%. Published
              weights refer to the final course score.
            </p>
          </div>

          {courseAssessmentVersions.length > 0 ? (
            <div className="assessment-grid universal-assessment-grid">
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
                  >
                    <header>
                      <span>{assessment?.kind ?? "assessment"}</span>
                      <strong>
                        {contribution
                          ? `${contribution.weight}% of final score`
                          : "Practice / unweighted"}
                      </strong>
                    </header>
                    <h3>{assessmentVersion.title}</h3>
                    <p>{assessmentVersion.instructions}</p>
                    <dl>
                      <div>
                        <dt>Estimated effort</dt>
                        <dd>{assessmentVersion.estimatedHours} hours</dd>
                      </div>
                      <div>
                        <dt>Maximum score</dt>
                        <dd>{assessmentVersion.maximumScore}</dd>
                      </div>
                      <div>
                        <dt>Required to pass</dt>
                        <dd>{contribution?.requiredToPass ? "Yes" : "No"}</dd>
                      </div>
                    </dl>
                    <h4>Submission evidence</h4>
                    <ul>
                      {assessmentVersion.submissionEvidence.map((evidence) => (
                        <li key={evidence}>{evidence}</li>
                      ))}
                    </ul>
                    {assessmentVersion.resourceVersionIds.length > 0 && (
                      <div className="universal-assessment-resources">
                        {assessmentVersion.resourceVersionIds.map(
                          (resourceVersionId) =>
                            renderResource({ resourceVersionId }, true),
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="paper-card empty-state">
              No scored assessments are published for this course version.
            </div>
          )}
        </section>

        <section
          className="section provenance universal-course-provenance"
          id="course-provenance"
          aria-labelledby="course-provenance-title"
        >
          <div className="section-heading-row">
            <div>
              <span className="section-index">05</span>
              <p className="eyebrow">Inspect the editorial trail</p>
              <h2 id="course-provenance-title">Course provenance</h2>
            </div>
            <p className="section-intro">
              These sources support the structure and claims in this exact
              published course version.
            </p>
          </div>

          {courseVersion.provenanceEvidenceIds.length > 0 ? (
            <div className="universal-provenance-list">
              {courseVersion.provenanceEvidenceIds.map((evidenceId) => {
                const evidence = bundle.provenance.find(
                  (candidate) => candidate.id === evidenceId,
                );
                return evidence ? (
                  <article className="paper-card" key={evidence.id}>
                    <span>{evidence.kind}</span>
                    <h3>
                      <a
                        href={evidence.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {evidence.sourceTitle} <span aria-hidden="true">↗</span>
                      </a>
                    </h3>
                    <p>Retrieved {formatDate(evidence.retrievedAt)}</p>
                    {evidence.note && <small>{evidence.note}</small>}
                  </article>
                ) : null;
              })}
            </div>
          ) : (
            <div className="paper-card empty-state">
              No course-specific provenance evidence is published.
            </div>
          )}
        </section>
      </main>

      <footer className="universal-program-footer">
        <div className="footer-brand">
          <strong>{courseVersion.title}</strong>
          <p>
            Part of{" "}
            <Link href={programHref}>{bundle.programVersion.title}</Link>.
          </p>
        </div>
        <div className="footer-meta">
          <span>
            Course {course.id} · version {courseVersion.version}
          </span>
          <Link href={courseHref}>Canonical course URL</Link>
        </div>
      </footer>
    </div>
  );
}
