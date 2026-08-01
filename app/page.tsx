import Link from "next/link";
import { getRuntimeCatalogRepository } from "./catalog/cloudflare-catalog";
import { futureDirections } from "../content/catalog";

export const dynamic = "force-dynamic";

const homeNav = [
  ["Programs", "programs"],
  ["Learning model", "model"],
  ["Schools", "schools"],
  ["Scope", "scope"],
] as const;

function hoursLabel(hours: number) {
  if (hours >= 1000) return `${Math.round(hours / 100) / 10}k guided hours`;
  return `${hours} guided hours`;
}

export default async function Home() {
  const catalogRepository = await getRuntimeCatalogRepository();
  const programs = await catalogRepository.listPrograms();
  const schools = Array.from(new Set(programs.map((program) => program.school)));

  return (
    <div className="catalog-home">
      <header className="topbar catalog-topbar">
        <a className="brand" href="#top" aria-label="Course Atlas home">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            <strong>Course Atlas</strong>
            <small>executable learning paths</small>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="Homepage navigation">
          {homeNav.map(([label, id]) => (
            <a key={id} href={`#${id}`}>{label}</a>
          ))}
        </nav>

        <a className="header-cta" href="#programs">
          Browse programs <span aria-hidden="true">↓</span>
        </a>

        <details className="mobile-nav">
          <summary aria-label="Open navigation">Menu</summary>
          <nav aria-label="Mobile navigation">
            {homeNav.map(([label, id]) => (
              <a key={id} href={`#${id}`}>{label}</a>
            ))}
          </nav>
        </details>
      </header>

      <main id="top">
        <section className="catalog-hero">
          <div className="catalog-hero-grid" aria-hidden="true" />
          <div className="catalog-hero-copy">
            <p className="eyebrow">
              <span className="status-dot" />
              A learning operating system for the open web
            </p>
            <h1>Choose an outcome.<br />Get the whole path.</h1>
            <p>
              Course Atlas turns free courses, documentation, projects and
              assessments into complete programs that tell you what to learn,
              where to learn it, what to do and what evidence to keep.
            </p>
            <div className="hero-actions">
              <Link
                className="button button-primary"
                href="/programs/computer-science"
              >
                Open Computer Science <span aria-hidden="true">→</span>
              </Link>
              <Link
                className="button button-quiet"
                href="/programs/electrical-engineering"
              >
                Open Electrical Engineering
              </Link>
            </div>
          </div>

          <aside className="catalog-manifesto">
            <span>Course Atlas / Publication model</span>
            <blockquote>
              A program is a versioned sequence of competencies, work,
              assessment and evidence—not a custom webpage.
            </blockquote>
            <div>
              <span><strong>{programs.length}</strong> complete programs</span>
              <span>
                <strong>{programs.reduce((sum, program) => sum + program.courseCount, 0)}</strong>{" "}
                courses across minimum paths
              </span>
              <span>
                <strong>{programs.reduce((sum, program) => sum + program.learningUnitCount, 0)}</strong>{" "}
                executable learning units
              </span>
            </div>
          </aside>
        </section>

        <section className="catalog-trust-strip" aria-label="Course Atlas model">
          <span>One universal renderer</span>
          <i aria-hidden="true">→</i>
          <span>Versioned program publications</span>
          <i aria-hidden="true">→</i>
          <span>Any duration, calendar, field or course count</span>
        </section>

        <section className="catalog-section degree-directory" id="programs">
          <div className="catalog-section-heading">
            <div>
              <p className="section-index">01 / Published programs</p>
              <h2>Different structures.<br />One learning engine.</h2>
            </div>
            <p>
              Three complete computing and engineering pathways, each spanning
              three years, and an eight-week spreadsheet sprint are rendered
              from the same content contract. Adding the next program does not
              require another custom page.
            </p>
          </div>

          <div className="degree-card-grid">
            {programs.map((program, index) => (
              <article
                className={`degree-directory-card ${
                  index % 2 === 0 ? "degree-teal" : "degree-coral"
                } is-live`}
                key={program.programId}
              >
                <div className="degree-card-top">
                  <span>{String(index + 1).padStart(2, "0")} · {program.school}</span>
                  <b>Published v{program.latestVersion}</b>
                </div>
                <div className="degree-card-title">
                  <span>{program.credentialLabel}</span>
                  <h3>{program.title}</h3>
                  <p>{program.summary}</p>
                </div>
                <div className="degree-card-facts">
                  <span>{program.nominalDuration}</span>
                  <span>{program.courseCount}-course minimum path</span>
                  {program.availableCourseCount !== program.courseCount && (
                    <span>{program.availableCourseCount} course options</span>
                  )}
                  <span>{program.learningUnitCount} learning units</span>
                  <span>{program.resourceCount} reviewed resources</span>
                  <span>{hoursLabel(program.nominalHours)}</span>
                </div>
                <Link href={`/programs/${program.slug}`}>
                  Enter program <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>

          <div className="catalog-roadmap">
            <span>In research—not advertised as published</span>
            {futureDirections.map((direction) => (
              <article key={direction.title}>
                <small>{direction.school} · {direction.discipline}</small>
                <strong>{direction.title}</strong>
                <p>{direction.description}</p>
                <small className="direction-status">{direction.status} · {direction.note}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="catalog-section degree-model" id="model">
          <div className="catalog-section-heading">
            <div>
              <p className="section-index">02 / The learning model</p>
              <h2>The degree is one view.<br />Mastery is the foundation.</h2>
            </div>
            <p>
              Programs arrange reusable, versioned learning components into a
              recommended path. Semesters and weeks are projections—not
              assumptions embedded in every course.
            </p>
          </div>

          <div className="degree-stack" aria-label="Course Atlas learning model">
            {[
              ["01", "Competencies", "The abilities a learner is expected to develop"],
              ["02", "Learning units", "Lessons, practice, laboratories, projects and reviews"],
              ["03", "Resources", "Exact free routes with access, rights and freshness separated"],
              ["04", "Assessments", "Course-specific demonstrations instead of one global exam template"],
              ["05", "Evidence", "Workbooks, code, measurements, reports, portfolios and defenses"],
              ["06", "Mastery", "Version-aware progress tied to exact units and course versions"],
            ].map(([number, title, note]) => (
              <article key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="catalog-section school-index" id="schools">
          <div className="catalog-section-heading">
            <div>
              <p className="section-index">03 / Schools</p>
              <h2>Organize the catalog.<br />Do not trap the content.</h2>
            </div>
            <p>
              Schools and disciplines support discovery. Courses retain stable
              identities so they can later serve multiple programs without
              being copied into each one.
            </p>
          </div>

          <div className="school-home-grid">
            {schools.map((school, index) => {
              const schoolPrograms = programs.filter(
                (program) => program.school === school,
              );
              return (
                <article key={school}>
                  <span>School {String(index + 1).padStart(2, "0")}</span>
                  <h3>{school}</h3>
                  <p>
                    {schoolPrograms
                      .map((program) => program.discipline)
                      .join(" · ")}
                  </p>
                  <small>
                    {schoolPrograms.length} complete{" "}
                    {schoolPrograms.length === 1 ? "program" : "programs"}
                  </small>
                </article>
              );
            })}
          </div>
        </section>

        <section className="catalog-about" id="scope">
          <p className="section-index">04 / Honest scope</p>
          <h2>Rebuild the learning.<br />Never fake the credential.</h2>
          <p>
            Course Atlas publishes independent study pathways, not enrollment,
            accreditation, transferable credit, licensure or university-issued
            degrees. Every program carries its own recognition, workload,
            provenance and resource-access notices.
          </p>
          <Link href="/programs/electrical-engineering">
            Inspect the complete engineering publication{" "}
            <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>

      <footer id="catalog-footer">
        <div className="footer-brand">
          <a className="brand" href="#top">
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>
              <strong>Course Atlas</strong>
              <small>executable learning paths</small>
            </span>
          </a>
          <p>
            Programs are immutable publications loaded by one universal engine.
            Their calendars, courses, assessments and resources remain data.
          </p>
        </div>
        <div className="provenance">
          <span>Published now</span>
          <div>
            {programs.map((program) => (
              <Link key={program.programId} href={`/programs/${program.slug}`}>
                {program.title} <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="footer-meta">
          <span>Course Atlas · Universal program catalog</span>
          <span>What to learn · Where · Work · Evidence</span>
        </div>
      </footer>
    </div>
  );
}
