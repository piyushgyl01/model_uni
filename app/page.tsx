import Link from "next/link";
import { getRuntimeCatalogRepository } from "./catalog/cloudflare-catalog";
import { futureDirections } from "../content/catalog-release";

import { ActiveEnrollmentBanner } from "./active-enrollment-banner";
import type { ProgramKind } from "./domain/catalog";
import { ThemeSwitch } from "./theme";

export const dynamic = "force-dynamic";

interface HomeSearchParams {
  readonly q?: string;
  readonly cursor?: string;
  readonly school?: string;
  readonly discipline?: string;
  readonly kind?: string;
}

const PROGRAM_KINDS = new Set<ProgramKind>([
  "degree-equivalent pathway",
  "certificate pathway",
  "course sequence",
  "independent study",
]);

const homeNav = [
  ["Today's Queue", "today"],
  ["Degrees", "programs"],
  ["How it Works", "model"],
  ["Schools", "schools"],
  ["Notice", "scope"],
] as const;

function hoursLabel(hours: number) {
  if (hours >= 1000) return `${Math.round(hours / 100) / 10}k guided hours`;
  return `${hours} guided hours`;
}

export default async function Home({
  searchParams,
}: {
  readonly searchParams: Promise<HomeSearchParams>;
}) {
  const filters = await searchParams;
  const kind = PROGRAM_KINDS.has(filters.kind as ProgramKind)
    ? (filters.kind as ProgramKind)
    : undefined;
  const catalogRepository = await getRuntimeCatalogRepository();
  const [page, stats] = await Promise.all([
    catalogRepository.listProgramPage({
      limit: 24,
      ...(filters.cursor ? { cursor: filters.cursor } : {}),
      ...(filters.q ? { q: filters.q } : {}),
      ...(filters.school ? { school: filters.school } : {}),
      ...(filters.discipline ? { discipline: filters.discipline } : {}),
      ...(kind ? { kind } : {}),
    }),
    catalogRepository.getCatalogStats(),
  ]);
  if (!stats) {
    throw new Error("The indexed catalog statistics projection is unavailable.");
  }
  const programs = page.items;
  const schools = Array.from(new Set(programs.map((program) => program.school)));

  return (
    <div className="catalog-home">
      {/* Top Navigation */}
      <header className="topbar catalog-topbar">
        <a className="brand" href="#top" aria-label="Course Atlas home">
          <span className="brand-mark" aria-hidden="true" />
          <span><strong>Course Atlas</strong>
            <small>Self-Study University Degrees</small>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="Homepage navigation">
          <Link href="/today">Today&apos;s Queue</Link>
          <Link href="/transcript">Independent Learning Record</Link>
          {homeNav.slice(1).map(([label, id]) => (
            <a key={id} href={`#${id}`}>{label}</a>
          ))}
        </nav>

        <div className="topbar-actions">
          <ThemeSwitch />
          <a className="header-cta" href="#programs">
            Select a Degree ↓
          </a>
        </div>
      </header>

      <main id="top">
        {/* Active Enrollment Banner if enrolled */}
        <ActiveEnrollmentBanner />

        {/* Simple Hero */}
        <section className="catalog-hero">
          <div className="catalog-hero-copy">
            <p className="eyebrow">
              Free Open Curriculum · Self-Paced University Study
            </p>
            <h1>Choose an outcome.<br />Get the whole degree path.</h1>
            <p className="nb-lede">
              Study complete university degree programs on your own. We organize free textbooks, MIT & Stanford video lectures, assignments, and exams into step-by-step course sequences you can follow and complete.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/programs/computer-science">
                Start Computer Science Degree →
              </Link>
              <Link className="button button-quiet" href="/programs/electrical-engineering">
                Start Electrical Engineering Degree →
              </Link>
            </div>
          </div>

          <aside className="catalog-manifesto">
            <div className="nb-stats">
              <span className="nb-stat">
                <strong>{stats.activeProgramCount}</strong>
                <span>complete programs</span>
              </span>
              <span className="nb-stat">
                <strong>{stats.minimumPathCourseCount}</strong>
                <span>courses across minimum paths</span>
              </span>
              <span className="nb-stat">
                <strong>{stats.learningUnitCount.toLocaleString("en-US")}</strong>
                <span>executable learning units</span>
              </span>
            </div>
          </aside>
        </section>

        {/* Universal Engine Banner */}
        <div className="catalog-trust-strip" aria-label="Course Atlas model">
          <span>One universal renderer</span>
          <i aria-hidden="true">→</i>
          <span>Versioned program publications</span>
          <i aria-hidden="true">→</i>
          <span>Any duration, calendar, field or course count</span>
        </div>

        {/* Main Degree Selection Table */}
        <section className="catalog-section degree-directory" id="programs">
          <div className="catalog-section-heading">
            <p className="section-index">01 / Degree Catalog</p>
            <h2>Select a University Degree Program</h2>
            <p>
              Different structures. One learning engine. Choose a degree program below to open its term-by-term curriculum, free learning materials, and progress tracker.
            </p>
            <form action="/" method="get" className="nb-search">
              <label htmlFor="catalog-search">
                Search catalog
              </label>
              <input
                id="catalog-search"
                name="q"
                type="search"
                defaultValue={filters.q ?? ""}
                placeholder="Program title"
                style={{ flex: "1 1 260px", minWidth: 0 }}
              />
              <button className="button button-primary" type="submit">
                Search
              </button>
              {(filters.q || filters.cursor) && (
                <Link className="button button-quiet" href="/">
                  Clear
                </Link>
              )}
            </form>
          </div>

          <div className="degree-card-grid">
            {programs.map((program, index) => (
              <article
                className={`degree-directory-card ${index % 2 === 0 ? "degree-teal" : "degree-coral"} is-live`}
                key={program.programId}
              >
                <div className="degree-card-top">
                  <span>School: {program.school}</span>
                  <b>v{program.latestVersion}</b>
                </div>

                <div className="degree-card-title">
                  <span className="nb-kicker">{program.credentialLabel}</span>
                  <h3>{program.title}</h3>
                  <p className="nb-summary">{program.summary}</p>
                </div>

                <div className="degree-card-facts">
                  <span><strong>Duration:</strong> {program.nominalDuration}</span>
                  <span><strong>Curriculum:</strong> {program.courseCount}-course minimum path</span>
                  {program.availableCourseCount !== program.courseCount && (
                    <span><strong>Options:</strong> {program.availableCourseCount} course options</span>
                  )}
                  <span><strong>Units:</strong> {program.learningUnitCount} learning units</span>
                  <span><strong>Free Resources:</strong> {program.resourceCount} reviewed resources</span>
                  <span><strong>Est. Workload:</strong> {hoursLabel(program.nominalHours)}</span>
                </div>

                <div className="nb-card-action">
                  <Link className="button button-primary" href={`/programs/${program.slug}`}>
                    Start {program.title} →
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {programs.length === 0 && (
            <div className="nb-empty">
              No published programs match this catalog search.
            </div>
          )}

          {page.nextCursor && (
            <div className="nb-pager">
              <Link
                className="button button-quiet"
                href={`/?${new URLSearchParams({
                  ...(filters.q ? { q: filters.q } : {}),
                  ...(filters.school ? { school: filters.school } : {}),
                  ...(filters.discipline
                    ? { discipline: filters.discipline }
                    : {}),
                  ...(kind ? { kind } : {}),
                  cursor: page.nextCursor,
                }).toString()}#programs`}
              >
                Next catalog page →
              </Link>
            </div>
          )}

          {/* Research Roadmap */}
          <div className="catalog-roadmap">
            <h3>Upcoming Programs in Research</h3>
            <p className="nb-kicker">In research—not advertised as published</p>
            {futureDirections.map((direction) => (
              <article key={direction.title}>
                <span className="nb-kicker">{direction.school} · {direction.discipline}</span>
                <h4>{direction.title}</h4>
                <p className="nb-summary">{direction.description}</p>
                <small className="direction-status">{direction.status} · {direction.note}</small>
              </article>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="catalog-section degree-model" id="model">
          <div className="catalog-section-heading">
            <p className="section-index">02 / How Self-Study Works</p>
            <h2>The degree is one view. Mastery is the foundation.</h2>
            <p>
              Programs arrange reusable, versioned learning components into a recommended path. Semesters and weeks are projections—not assumptions embedded in every course.
            </p>
          </div>

          <div className="degree-stack" aria-label="Course Atlas learning model">
            {[
              ["01", "Competencies", "Specific abilities & technical skills you acquire"],
              ["02", "Learning units", "Structured lessons, practice problems, labs, and projects"],
              ["03", "Resources", "Direct links to free textbooks, MIT OCW, and video lectures"],
              ["04", "Assessments", "Problem sets and exams to test your understanding"],
              ["05", "Evidence", "Portfolio projects, code repositories, and lab reports"],
              ["06", "Mastery", "Track your progress unit-by-unit as you complete courses"],
            ].map(([number, title, note]) => (
              <article key={number}>
                <span className="nb-step-number">{number}</span>
                <h3>{title}</h3>
                <p className="nb-summary">{note}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Schools Index */}
        <section className="catalog-section school-index" id="schools">
          <div className="catalog-section-heading">
            <p className="section-index">03 / Academic Fields</p>
            <h2>Organize the catalog. Do not trap the content.</h2>
            <p>
              Schools and disciplines support discovery. Courses retain stable identities so they can later serve multiple programs without being copied into each one.
            </p>
          </div>

          <div className="school-home-grid">
            {schools.map((school, index) => {
              const schoolPrograms = programs.filter((p) => p.school === school);
              return (
                <article key={school}>
                  <span className="nb-kicker">
                    School {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{school}</h3>
                  <p className="nb-summary">
                    {schoolPrograms.map((p) => p.discipline).join(" · ")}
                  </p>
                  <small className="nb-kicker">
                    {schoolPrograms.length} complete {schoolPrograms.length === 1 ? "program" : "programs"}
                  </small>
                </article>
              );
            })}
          </div>
        </section>

        {/* Scope & Notice */}
        <section className="catalog-about" id="scope">
          <p className="section-index">04 / Honest scope</p>
          <h2>Rebuild the learning. Never fake the credential.</h2>
          <p>
            Course Atlas publishes independent study pathways, not enrollment, accreditation, transferable credit, licensure or university-issued degrees. Every program carries its own recognition, workload, provenance and resource-access notices.
          </p>
          <Link className="button button-quiet" href="/programs/electrical-engineering">
            Inspect the complete engineering publication →
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer id="catalog-footer">
        <div className="footer-brand">
          <a className="brand" href="#top">
            <strong>Course Atlas</strong> — <small>Self-Study Degree Catalog</small>
          </a>
          <p className="nb-footer-note">
            Programs are immutable publications loaded by one universal engine. Their calendars, courses, assessments and resources remain data.
          </p>
        </div>
        <div className="provenance">
          <strong>Programs on this page:</strong>
          <div className="nb-footer-links">
            {programs.map((p) => (
              <Link key={p.programId} href={`/programs/${p.slug}`}>
                {p.title} →
              </Link>
            ))}
          </div>
        </div>
        <div className="footer-meta" style={{ marginTop: "20px" }}>
          <span>Course Atlas · Universal program catalog</span>
          <span>What to learn · Where · Work · Evidence</span>
        </div>
      </footer>
    </div>
  );
}
