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
        <nav className="desktop-nav" aria-label="Program sections">
          <a href="#outcomes">Outcomes</a>
          <a href="#requirements">Requirements</a>
          <a href="#schedule">Schedule</a>
          <a href="#courses">Courses</a>
          <a href="#resources">Resources</a>
        </nav>
        <Link className="header-cta" href="/">
          All programs <span aria-hidden="true">←</span>
        </Link>
      </header>

      <main id="main-content">
        <section className="hero universal-program-hero" aria-labelledby="program-title">
          <div className="program-breadcrumb">
            <Link href="/">Program catalog</Link>
            <span aria-hidden="true">/</span>
            <span>{program.school}</span>
          </div>
          {availableVersions.length > 1 && (
            <nav className="publication-versions" aria-label="Program versions">
              <span>Publication</span>
              {availableVersions.map((version) => (
                <Link
                  aria-current={
                    version === programVersion.version ? "page" : undefined
                  }
                  href={
                    version === availableVersions[0]
                      ? `/programs/${programSlug}`
                      : `/programs/${programSlug}/versions/${version}`
                  }
                  key={version}
                >
                  v{version}
                </Link>
              ))}
            </nav>
          )}
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">
                {program.kind} · Published curriculum v{programVersion.version}
              </p>
              <h1 id="program-title">{programVersion.title}</h1>
              <p className="hero-lede">{programVersion.summary}</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#schedule">
                  Open the study plan <span aria-hidden="true">↓</span>
                </a>
                <a className="button button-quiet" href="#courses">
                  Browse every course
                </a>
              </div>
            </div>

            <aside className="paper-card universal-program-facts" aria-label="Program facts">
              <dl>
                <div>
                  <dt>Credential target</dt>
                  <dd>{programVersion.credentialLabel}</dd>
                </div>
                <div>
                  <dt>Nominal duration</dt>
                  <dd>{programVersion.nominalDuration}</dd>
                </div>
                <div>
                  <dt>Minimum course path</dt>
                  <dd>
                    {representativePathIds.size}
                    {courseRecords.length !== representativePathIds.size
                      ? ` selected from ${courseRecords.length} options`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt>Path workload</dt>
                  <dd>{representativePathHours} guided hours</dd>
                </div>
                <div>
                  <dt>Discipline</dt>
                  <dd>{program.discipline}</dd>
                </div>
                <div>
                  <dt>Published</dt>
                  <dd>{formatDate(programVersion.publishedAt)}</dd>
                </div>
              </dl>
            </aside>
          </div>

          <div className="notice-strip universal-recognition-notice" role="note">
            <span className="notice-icon" aria-hidden="true">i</span>
            <div>
              <strong>Recognition and transfer notice</strong>
              <p>{programVersion.recognitionNotice}</p>
            </div>
          </div>

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
        </section>

        <section
          className="section overview-section universal-outcomes"
          id="outcomes"
          aria-labelledby="outcomes-title"
        >
          <div className="section-heading-row">
            <div>
              <span className="section-index">01</span>
              <p className="eyebrow">Destination before itinerary</p>
              <h2 id="outcomes-title">What this program develops</h2>
            </div>
            <p className="section-intro">{programVersion.workloadPolicy}</p>
          </div>

          <div className="universal-outcomes-grid">
            <article className="paper-card">
              <h3>Program outcomes</h3>
              <ol className="universal-outcome-list">
                {programVersion.outcomes.map((outcome, index) => (
                  <li key={`${index}-${outcome}`}>{outcome}</li>
                ))}
              </ol>
            </article>

            <article className="paper-card">
              <h3>Competencies</h3>
              {competencies.length > 0 ? (
                <div className="universal-competency-list">
                  {competencies.map((competency) => {
                    const mapping = competencyMappings.find(
                      (candidate) => candidate.competencyId === competency.id,
                    );
                    return (
                      <section key={competency.id}>
                        <span>{competency.domain}</span>
                        <h4>{competency.title}</h4>
                        <p>{competency.description}</p>
                        {mapping && (
                          <small>
                            {mapping.relationship} · target {mapping.targetLevel}
                          </small>
                        )}
                      </section>
                    );
                  })}
                </div>
              ) : (
                <p>No program-level competency records are published in this version.</p>
              )}
            </article>
          </div>
        </section>

        <section
          className="section universal-requirements"
          id="requirements"
          aria-labelledby="requirements-title"
        >
          <div className="section-heading-row">
            <div>
              <span className="section-index">02</span>
              <p className="eyebrow">Rules, not hidden assumptions</p>
              <h2 id="requirements-title">Program requirements</h2>
            </div>
            <p className="section-intro">
              Every group states exactly how many options and credits count.
            </p>
          </div>

          <div className="universal-requirement-groups">
            {[...programVersion.requirements]
              .sort((left, right) => left.order - right.order)
              .map((group) => (
                <article className="paper-card universal-requirement-group" key={group.id}>
                  <header>
                    <div>
                      <p className="eyebrow">Requirement group</p>
                      <h3>{group.title}</h3>
                    </div>
                    <strong>{requirementRule(group)}</strong>
                  </header>
                  {group.description && <p>{group.description}</p>}
                  <ul className="universal-requirement-options">
                    {group.options.map((option) => {
                      const record = courseRecordByVersionId.get(
                        option.courseVersionId,
                      );
                      const concentration = option.concentrationId
                        ? concentrationsById.get(option.concentrationId)
                        : undefined;
                      const recommendedPeriod = option.recommendedPeriodId
                        ? periodsById.get(option.recommendedPeriodId)
                        : undefined;
                      return (
                        <li key={option.id}>
                          <div>
                            {record ? (
                              <Link
                                href={courseHref(
                                  routeBase,
                                  record.course.canonicalSlug,
                                )}
                              >
                                <strong>{record.version.title}</strong>
                              </Link>
                            ) : (
                              <strong>{option.courseVersionId}</strong>
                            )}
                            {record?.course.codes.length ? (
                              <small>
                                {record.course.codes
                                  .map((code) => `${code.namespace} ${code.value}`)
                                  .join(" · ")}
                              </small>
                            ) : null}
                          </div>
                          <div className="universal-option-meta">
                            <span>
                              {option.credits.value} {option.credits.system}
                            </span>
                            {recommendedPeriod && (
                              <span>Recommended: {recommendedPeriod.label}</span>
                            )}
                            {concentration && (
                              <span>Concentration: {concentration.title}</span>
                            )}
                          </div>
                          {option.note && <p>{option.note}</p>}
                        </li>
                      );
                    })}
                  </ul>
                </article>
              ))}
          </div>
        </section>

        <section
          className="section roadmap-section universal-schedule"
          id="schedule"
          aria-labelledby="schedule-title"
        >
          <div className="section-heading-row">
            <div>
              <span className="section-index">03</span>
              <p className="eyebrow">
                {calendar?.structure ?? "Self-paced"} calendar
              </p>
              <h2 id="schedule-title">
                {schedule?.title ?? "Build a schedule that fits your life"}
              </h2>
            </div>
            <p className="section-intro">
              Periods are guidance, not platform assumptions. Follow them in order
              or adjust the pace while preserving prerequisites.
            </p>
          </div>

          {schedule && calendar ? (
            <>
              <div className="universal-period-grid">
                {periods.map((period) => {
                  const placements = placementsForPeriod(period.id);
                  const milestones = calendar.milestones.filter(
                    (milestone) => milestone.periodId === period.id,
                  );
                  return (
                    <article className="semester-card universal-period-card" key={period.id}>
                      <header className="semester-top">
                        <div>
                          <span>
                            {calendar.structure === "terms" ? "Term" : "Period"}{" "}
                            {period.order}
                          </span>
                          <h3>{period.label}</h3>
                        </div>
                        {(period.startDate || period.endDate) && (
                          <small>
                            {period.startDate ? formatDate(period.startDate) : "Open"}
                            {" — "}
                            {period.endDate ? formatDate(period.endDate) : "Open"}
                          </small>
                        )}
                      </header>
                      {placements.length > 0 ? (
                        <ol className="universal-placement-list">
                          {placements.map((placement) => {
                            const subject = describePlacement(placement);
                            return (
                              <li key={placement.id}>
                                <span>{subject.label}</span>
                                {subject.href ? (
                                  <Link href={subject.href}>{subject.title}</Link>
                                ) : (
                                  <strong>{subject.title}</strong>
                                )}
                                {(placement.startsOn || placement.dueOn) && (
                                  <small>
                                    {placement.startsOn
                                      ? `Starts ${formatDate(placement.startsOn)}`
                                      : ""}
                                    {placement.startsOn && placement.dueOn ? " · " : ""}
                                    {placement.dueOn
                                      ? `Due ${formatDate(placement.dueOn)}`
                                      : ""}
                                  </small>
                                )}
                                {placement.note && <p>{placement.note}</p>}
                              </li>
                            );
                          })}
                        </ol>
                      ) : (
                        <p>No scheduled learning activity in this period.</p>
                      )}
                      {milestones.length > 0 && (
                        <div className="universal-milestones">
                          <strong>Milestones</strong>
                          <ul>
                            {milestones.map((milestone) => (
                              <li key={milestone.id}>
                                {milestone.label}
                                {milestone.date
                                  ? ` · ${formatDate(milestone.date)}`
                                  : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              {unassignedPlacements.length > 0 && (
                <article className="paper-card universal-flexible-placements">
                  <h3>Flexible placements</h3>
                  <p>These activities are ordered but are not pinned to a period.</p>
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
                          {placement.note ? ` — ${placement.note}` : ""}
                        </li>
                      );
                    })}
                  </ol>
                </article>
              )}
            </>
          ) : (
            <div className="paper-card empty-state">
              <h3>No prescribed calendar in this publication</h3>
              <p>
                Use the requirement order and course prerequisites to assemble a
                self-paced route. Progress tracking does not assume semesters or a
                fixed number of weeks.
              </p>
            </div>
          )}
        </section>

        {concentrations.length > 0 && (
          <section
            className="section tracks-section universal-concentrations"
            id="concentrations"
            aria-labelledby="concentrations-title"
          >
            <div className="section-heading-row">
              <div>
                <span className="section-index">04</span>
                <p className="eyebrow">Optional focus areas</p>
                <h2 id="concentrations-title">Concentrations</h2>
              </div>
              <p className="section-intro">
                Focus the shared foundation without changing the identity of the
                underlying courses.
              </p>
            </div>
            <div className="universal-concentration-grid">
              {concentrations.map((concentration) => (
                <article className="paper-card" key={concentration.id}>
                  <h3>{concentration.title}</h3>
                  <p>{concentration.description}</p>
                  <h4>Courses</h4>
                  <ul>
                    {concentration.courseVersionIds.map((id) => {
                      const record = courseRecordByVersionId.get(id);
                      return (
                        <li key={id}>
                          {record ? (
                            <Link
                              href={courseHref(
                                routeBase,
                                record.course.canonicalSlug,
                              )}
                            >
                              {record.version.title}
                            </Link>
                          ) : (
                            id
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {concentration.capstoneIdeas.length > 0 && (
                    <>
                      <h4>Capstone directions</h4>
                      <ul>
                        {concentration.capstoneIdeas.map((idea) => (
                          <li key={idea}>{idea}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        <section
          className="section courses-section universal-course-directory"
          id="courses"
          aria-labelledby="courses-title"
        >
          <div className="section-heading-row">
            <div>
              <span className="section-index">
                {concentrations.length > 0 ? "05" : "04"}
              </span>
              <p className="eyebrow">Complete published inventory</p>
              <h2 id="courses-title">Course directory</h2>
            </div>
            <p className="section-intro">
              Each course opens as a standalone executable syllabus with its own
              resources, assessments and versioned progress.
            </p>
          </div>

          <div className="course-list universal-course-list">
            {courseRecords.map(({ course, version }) => {
              const unitCount = learningUnits.filter(
                (unit) => unit.courseVersionId === version.id,
              ).length;
              return (
                <article className={`catalog-row kind-${version.format}`} key={version.id}>
                  <div className="catalog-code">
                    <span>{course.codes[0]?.value ?? version.format}</span>
                    <small>{course.codes[0]?.namespace ?? course.discipline}</small>
                  </div>
                  <div className="catalog-drilldown">
                    <span>{version.format}</span>
                    <h3>
                      <Link href={courseHref(routeBase, course.canonicalSlug)}>
                        {version.title}
                      </Link>
                    </h3>
                    <p>{version.summary}</p>
                    <div className="universal-course-facts">
                      <span>{version.nominalHours} guided hours</span>
                      <span>
                        {unitCount} learning {unitCount === 1 ? "unit" : "units"}
                      </span>
                      <span>Version {version.version}</span>
                    </div>
                  </div>
                  <Link
                    className="course-open"
                    href={courseHref(routeBase, course.canonicalSlug)}
                    aria-label={`Open ${version.title}`}
                  >
                    Open course <span aria-hidden="true">→</span>
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section
          className="section library-section universal-resource-library"
          id="resources"
          aria-labelledby="resources-title"
        >
          <div className="section-heading-row">
            <div>
              <span className="section-index">
                {concentrations.length > 0 ? "06" : "05"}
              </span>
              <p className="eyebrow">Access is not the same as permission</p>
              <h2 id="resources-title">Resource library</h2>
            </div>
            <p className="section-intro">
              Every resource separates learner access, reuse rights and the latest
              availability check.
            </p>
          </div>

          <div className="resource-table universal-resource-table">
            <div className="resource-table-head" aria-hidden="true">
              <span>Resource</span>
              <span>Access</span>
              <span>Rights</span>
              <span>Freshness</span>
            </div>
            {[...resourceVersionsById.values()]
              .sort((left, right) => left.title.localeCompare(right.title))
              .map((version) => {
                const resource = resourcesById.get(version.resourceId);
                const offers = accessByResourceVersion.get(version.id) ?? [];
                const rightsRecords = rightsByResourceVersion.get(version.id) ?? [];
                const freshnessRecords =
                  freshnessByResourceVersion.get(version.id) ?? [];
                return (
                  <article className="resource-row universal-resource-row" key={version.id}>
                    <div className="resource-title">
                      <span>{resource?.kind ?? "resource"}</span>
                      <a
                        href={version.canonicalUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <strong>{version.title}</strong>
                        <small>
                          {resource?.provider ?? "Unknown provider"}
                          {version.authors.length
                            ? ` · ${version.authors.join(", ")}`
                            : ""}
                        </small>
                      </a>
                    </div>
                    <div className="universal-resource-fact">
                      <strong>Access</strong>
                      {offers.length > 0 ? (
                        offers.map((offer) => (
                          <span key={offer.id}>
                            {offer.type} · {offer.region}
                            {offer.loginRequired ? " · login required" : ""}
                            {offer.price
                              ? ` · ${offer.price.amount} ${offer.price.currency}`
                              : ""}
                            <small>Checked {formatDate(offer.checkedAt)}</small>
                            {offer.note && <small>{offer.note}</small>}
                          </span>
                        ))
                      ) : (
                        <span>Access has not been checked.</span>
                      )}
                    </div>
                    <div className="universal-resource-fact">
                      <strong>Rights</strong>
                      {rightsRecords.length > 0 ? (
                        rightsRecords.map((rights) => (
                          <span key={rights.id}>
                            {rights.licenseUrl ? (
                              <a
                                href={rights.licenseUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {rights.licenseIdentifier ?? rights.status}
                              </a>
                            ) : (
                              rights.licenseIdentifier ?? rights.status
                            )}
                            <small>
                              Mirror: {rights.mayMirror ? "yes" : "no"} · Adapt:{" "}
                              {rights.mayAdapt ? "yes" : "no"}
                            </small>
                            {rights.note && <small>{rights.note}</small>}
                          </span>
                        ))
                      ) : (
                        <span>Reuse rights are unknown.</span>
                      )}
                    </div>
                    <div className="universal-resource-fact">
                      <strong>Freshness</strong>
                      {freshnessRecords.length > 0 ? (
                        freshnessRecords.map((freshness) => (
                          <span key={freshness.id}>
                            {freshness.status}
                            <small>
                              {freshness.checkedAt
                                ? `Checked ${formatDate(freshness.checkedAt)}`
                                : "Not yet checked"}
                              {freshness.httpStatus
                                ? ` · HTTP ${freshness.httpStatus}`
                                : ""}
                            </small>
                            {freshness.note && <small>{freshness.note}</small>}
                          </span>
                        ))
                      ) : (
                        <span>Freshness has not been checked.</span>
                      )}
                    </div>
                  </article>
                );
              })}
          </div>
        </section>

        <section
          className="section provenance universal-provenance"
          id="provenance"
          aria-labelledby="provenance-title"
        >
          <div className="section-heading-row">
            <div>
              <span className="section-index">
                {concentrations.length > 0 ? "07" : "06"}
              </span>
              <p className="eyebrow">Inspect the editorial trail</p>
              <h2 id="provenance-title">Sources and provenance</h2>
            </div>
            <p className="section-intro">
              Publication evidence is linked instead of being reduced to an
              unsupported “inspired by” claim.
            </p>
          </div>

          {bundle.provenance.length > 0 ? (
            <div className="universal-provenance-list">
              {[...bundle.provenance]
                .sort((left, right) => left.sourceTitle.localeCompare(right.sourceTitle))
                .map((evidence) => (
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
                    <p>
                      Retrieved {formatDate(evidence.retrievedAt)} · Supports{" "}
                      {evidence.subjects.length} published{" "}
                      {evidence.subjects.length === 1 ? "record" : "records"}
                    </p>
                    {evidence.note && <small>{evidence.note}</small>}
                  </article>
                ))}
            </div>
          ) : (
            <div className="paper-card empty-state">
              No provenance evidence is published for this version.
            </div>
          )}
        </section>
      </main>

      <footer className="universal-program-footer">
        <div className="footer-brand">
          <strong>Course Atlas</strong>
          <p>Complete paths assembled from inspectable learning resources.</p>
        </div>
        <div className="footer-meta">
          <span>
            Program {program.id} · version {programVersion.version}
          </span>
          <span>Bundle {bundle.id}</span>
          <span>Published {formatDate(bundle.publishedAt)}</span>
        </div>
      </footer>
    </div>
  );
}
