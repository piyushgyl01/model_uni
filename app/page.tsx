import Link from "next/link";
import { getRuntimeCatalogRepository } from "./catalog/cloudflare-catalog";
import { futureDirections } from "../content/catalog";

import { ActiveEnrollmentBanner } from "./active-enrollment-banner";

export const dynamic = "force-dynamic";

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

export default async function Home() {
  const catalogRepository = await getRuntimeCatalogRepository();
  const programs = await catalogRepository.listPrograms();
  const schools = Array.from(new Set(programs.map((program) => program.school)));

  const totalCourses = programs.reduce((sum, program) => sum + program.courseCount, 0);
  const totalUnits = programs.reduce((sum, program) => sum + program.learningUnitCount, 0);

  return (
    <div className="catalog-home">
      {/* Top Navigation */}
      <header className="topbar catalog-topbar">
        <a className="brand" href="#top" aria-label="Course Atlas home">
          <span className="brand-mark" aria-hidden="true" />
          <span>
            <strong>Course Atlas</strong>
            <small>Self-Study University Degrees</small>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="Homepage navigation">
          <Link href="/today">Today's Queue</Link>
          <Link href="/transcript">Transcript & Portfolio</Link>
          {homeNav.slice(1).map(([label, id]) => (
            <a key={id} href={`#${id}`}>{label}</a>
          ))}
        </nav>

        <a className="header-cta" href="#programs">
          Select a Degree ↓
        </a>
      </header>

      <main id="top">
        {/* Active Enrollment Banner if enrolled */}
        <div style={{ maxWidth: "1100px", margin: "1rem auto 0", padding: "0 1rem" }}>
          <ActiveEnrollmentBanner />
        </div>

        {/* Simple Hero */}
        <section className="catalog-hero">
          <div className="catalog-hero-copy">
            <p className="eyebrow">
              Free Open Curriculum · Self-Paced University Study
            </p>
            <h1>Choose an outcome.<br />Get the whole degree path.</h1>
            <p style={{ fontSize: "1.1rem", marginTop: "10px", color: "#333" }}>
              Study complete university degree programs on your own. We organize free textbooks, MIT & Stanford video lectures, assignments, and exams into step-by-step course sequences you can follow and complete.
            </p>
            <div className="hero-actions" style={{ marginTop: "20px" }}>
              <Link className="button button-primary" href="/programs/computer-science">
                Start Computer Science Degree →
              </Link>
              <Link className="button button-quiet" href="/programs/electrical-engineering">
                Start Electrical Engineering Degree →
              </Link>
            </div>
          </div>

          <aside className="catalog-manifesto" style={{ marginTop: "25px" }}>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "0.95rem" }}>
              <span><strong>{programs.length}</strong> complete programs</span>
              <span><strong>{totalCourses}</strong> courses across minimum paths</span>
              <span><strong>{totalUnits.toLocaleString("en-US")}</strong> executable learning units</span>
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
            <p style={{ color: "#555" }}>
              Different structures. One learning engine. Choose a degree program below to open its term-by-term curriculum, free learning materials, and progress tracker.
            </p>
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
                  <span style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "#666", fontWeight: "bold" }}>
                    {program.credentialLabel}
                  </span>
                  <h3>{program.title}</h3>
                  <p style={{ fontSize: "0.9rem", color: "#444", margin: "6px 0" }}>{program.summary}</p>
                </div>

                <div className="degree-card-facts">
                  <span>🗓️ <strong>Duration:</strong> {program.nominalDuration}</span>
                  <span>📚 <strong>Curriculum:</strong> {program.courseCount}-course minimum path</span>
                  {program.availableCourseCount !== program.courseCount && (
                    <span>🔀 <strong>Options:</strong> {program.availableCourseCount} course options</span>
                  )}
                  <span>📖 <strong>Units:</strong> {program.learningUnitCount} learning units</span>
                  <span>🔗 <strong>Free Resources:</strong> {program.resourceCount} reviewed resources</span>
                  <span>⏱️ <strong>Est. Workload:</strong> {hoursLabel(program.nominalHours)}</span>
                </div>

                <div style={{ marginTop: "15px" }}>
                  <Link className="button button-primary" style={{ width: "100%", textAlign: "center" }} href={`/programs/${program.slug}`}>
                    Start {program.title} →
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Research Roadmap */}
          <div className="catalog-roadmap" style={{ marginTop: "35px" }}>
            <h3 style={{ marginTop: 0 }}>Upcoming Programs in Research</h3>
            <p style={{ fontSize: "0.85rem", color: "#666" }}>In research—not advertised as published</p>
            {futureDirections.map((direction) => (
              <article key={direction.title} style={{ padding: "10px 0", borderTop: "1px solid #e0e0e0" }}>
                <small style={{ color: "#666" }}>{direction.school} · {direction.discipline}</small>
                <div style={{ fontWeight: "bold", fontSize: "1rem" }}>{direction.title}</div>
                <p style={{ margin: "4px 0", fontSize: "0.85rem" }}>{direction.description}</p>
                <small className="direction-status" style={{ color: "#888" }}>{direction.status} · {direction.note}</small>
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
              <article key={number} style={{ padding: "12px", border: "1px solid #ccc", background: "#fff" }}>
                <span style={{ fontFamily: "monospace", color: "#0000ee", fontWeight: "bold" }}>{number}</span>
                <h3 style={{ margin: "4px 0" }}>{title}</h3>
                <p style={{ fontSize: "0.85rem", color: "#444", margin: 0 }}>{note}</p>
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
                <article key={school} style={{ padding: "12px", border: "1px solid #ccc", background: "#fff" }}>
                  <span style={{ fontSize: "0.8rem", color: "#666", fontFamily: "monospace" }}>
                    School {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 style={{ margin: "4px 0" }}>{school}</h3>
                  <p style={{ fontSize: "0.85rem", color: "#444" }}>
                    {schoolPrograms.map((p) => p.discipline).join(" · ")}
                  </p>
                  <small style={{ color: "#666" }}>
                    {schoolPrograms.length} complete {schoolPrograms.length === 1 ? "program" : "programs"}
                  </small>
                </article>
              );
            })}
          </div>
        </section>

        {/* Scope & Notice */}
        <section className="catalog-about" id="scope" style={{ padding: "20px", border: "1px solid #222", background: "#fafafa" }}>
          <p className="section-index">04 / Honest scope</p>
          <h2>Rebuild the learning. Never fake the credential.</h2>
          <p style={{ fontSize: "0.95rem" }}>
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
          <p style={{ color: "#666", marginTop: "6px" }}>
            Programs are immutable publications loaded by one universal engine. Their calendars, courses, assessments and resources remain data.
          </p>
        </div>
        <div className="provenance">
          <strong>Available Degrees:</strong>
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginTop: "8px" }}>
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
