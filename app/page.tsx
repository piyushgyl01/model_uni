import Link from "next/link";
import { degreeCatalog, liveDegrees } from "./program-registry";

const homeNav = [
  ["Degrees", "degrees"],
  ["How it works", "model"],
  ["Schools", "schools"],
  ["About", "about"],
] as const;

export default function Home() {
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
            <small>complete degrees · free routes</small>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="Homepage navigation">
          {homeNav.map(([label, id]) => (
            <a key={id} href={`#${id}`}>{label}</a>
          ))}
        </nav>

        <a className="header-cta" href="#degrees">
          Browse degrees <span aria-hidden="true">↓</span>
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
              The university layer for the open web
            </p>
            <h1>Pick a degree.<br />Get the whole path.</h1>
            <p>
              Course Atlas turns the best free courses on the internet into complete,
              semester-by-semester programs. No link pile. No guessing what comes next.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/degrees/electrical-engineering">
                Open Electrical Engineering <span aria-hidden="true">→</span>
              </Link>
              <a className="button button-quiet" href="#model">
                See the degree model
              </a>
            </div>
          </div>

          <aside className="catalog-manifesto">
            <span>Course Atlas / Manifesto 01</span>
            <blockquote>
              A degree is not a building. It is a sequenced body of work, feedback,
              evidence, and standards.
            </blockquote>
            <div>
              <span><strong>{liveDegrees.length}</strong> complete degree live</span>
              <span><strong>{degreeCatalog.length}</strong> programs in the registry</span>
              <span><strong>∞</strong> programs the system can hold</span>
            </div>
          </aside>
        </section>

        <section className="catalog-trust-strip" aria-label="Course Atlas promise">
          <span>One homepage</span>
          <i aria-hidden="true">→</i>
          <span>Many independent degree pages</span>
          <i aria-hidden="true">→</i>
          <span>Every degree owns its semesters, courses, weeks, and resources</span>
        </section>

        <section className="catalog-section degree-directory" id="degrees">
          <div className="catalog-section-heading">
            <div>
              <p className="section-index">01 / Degree directory</p>
              <h2>Choose the program.<br />Enter its university.</h2>
            </div>
            <p>
              Each degree is a separate destination with its own roadmap, classrooms,
              assessments, labs, resources, progress, and specialization choices.
            </p>
          </div>

          <div className="degree-card-grid">
            {degreeCatalog.map((degree, index) => {
              const isLive = degree.status === "live";
              return (
                <article
                  className={`degree-directory-card degree-${degree.color} ${isLive ? "is-live" : ""}`}
                  key={degree.slug}
                >
                  <div className="degree-card-top">
                    <span>{String(index + 1).padStart(2, "0")} · {degree.school}</span>
                    <b>{isLive ? "Open now" : degree.status === "building" ? "Building" : "Planned"}</b>
                  </div>
                  <div className="degree-card-title">
                    <span>{degree.credential}</span>
                    <h3>{degree.name}</h3>
                    <p>{degree.description}</p>
                  </div>
                  <div className="degree-card-facts">
                    {degree.facts.map((fact) => <span key={fact}>{fact}</span>)}
                  </div>
                  {isLive ? (
                    <Link href={`/degrees/${degree.slug}`}>
                      Enter degree <span aria-hidden="true">→</span>
                    </Link>
                  ) : (
                    <span className="degree-card-locked">
                      Not published yet—no fake empty page
                    </span>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="catalog-section degree-model" id="model">
          <div className="catalog-section-heading">
            <div>
              <p className="section-index">02 / The degree model</p>
              <h2>Same structure.<br />Any field.</h2>
            </div>
            <p>
              The platform separates reusable university infrastructure from each
              program&apos;s academic content, so adding a degree does not make the
              homepage or another degree more complicated.
            </p>
          </div>

          <div className="degree-stack" aria-label="Scalable degree content model">
            {[
              ["01", "Degree registry", "Title, school, credential, status, and route"],
              ["02", "Semester map", "Five or six coordinated courses per term"],
              ["03", "Course classrooms", "Setup, prerequisites, outcomes, and assessments"],
              ["04", "Executable weeks", "What, where, work, evidence, and time"],
              ["05", "Resource graph", "Primary free course, backups, tools, and access labels"],
              ["06", "Local progress", "Continue exactly where you stopped"],
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
              <h2>A catalog built<br />to keep expanding.</h2>
            </div>
            <p>
              Schools organize related degrees. A new program joins the registry and
              receives its own route; it never gets squeezed into the Electrical
              Engineering page.
            </p>
          </div>

          <div className="school-home-grid">
            {Array.from(new Set(degreeCatalog.map((degree) => degree.school))).map(
              (school, index) => {
                const schoolDegrees = degreeCatalog.filter(
                  (degree) => degree.school === school,
                );
                return (
                  <article key={school}>
                    <span>School {String(index + 1).padStart(2, "0")}</span>
                    <h3>{school}</h3>
                    <p>{schoolDegrees.map((degree) => degree.name).join(" · ")}</p>
                    <small>
                      {schoolDegrees.filter((degree) => degree.status === "live").length} live ·{" "}
                      {schoolDegrees.length} registered
                    </small>
                  </article>
                );
              },
            )}
          </div>
        </section>

        <section className="catalog-about" id="about">
          <p className="section-index">04 / Honest scope</p>
          <h2>The learning can be rebuilt.<br />The credential cannot be faked.</h2>
          <p>
            Course Atlas reproduces curriculum structure, free learning routes,
            assessments, laboratory evidence, and portfolio work. It is independent
            self-study—not enrollment, accreditation, transferable credit, or a
            university-issued degree.
          </p>
          <Link href="/degrees/electrical-engineering">
            Explore the first complete degree <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>

      <footer id="catalog-footer">
        <div className="footer-brand">
          <a className="brand" href="#top">
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <span><strong>Course Atlas</strong><small>complete degrees · free routes</small></span>
          </a>
          <p>One degree registry. Independent program pages. A platform designed to hold every serious field without becoming one endless document.</p>
        </div>
        <div className="provenance">
          <span>Live now</span>
          <p>Electrical Engineering is the first complete program. Other cards are clearly labeled as building or planned until their full academic routes exist.</p>
          <div>
            <Link href="/degrees/electrical-engineering">Electrical Engineering <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="footer-meta">
          <span>Course Atlas · Degree catalog</span>
          <span>Every subject. One navigable education.</span>
        </div>
      </footer>
    </div>
  );
}
