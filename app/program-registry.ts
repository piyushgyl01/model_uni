export type DegreeStatus = "live" | "building" | "planned";

export type DegreeCatalogEntry = {
  slug: string;
  programId: string;
  school: string;
  discipline: string;
  name: string;
  credential: string;
  description: string;
  status: DegreeStatus;
  facts: string[];
  color: "teal" | "coral" | "amber" | "blue";
};

export const degreeCatalog: DegreeCatalogEntry[] = [
  {
    slug: "electrical-engineering",
    programId: "ee-beng",
    school: "School of Engineering",
    discipline: "Electrical Engineering",
    name: "Electrical Engineering",
    credential: "Bachelor-level independent study",
    description:
      "Circuits, electronics, signals, embedded computing, control, communications, fields, energy, specialization, and a defended capstone.",
    status: "live",
    facts: ["3 years", "6 semesters", "31 courses", "496 planned weeks"],
    color: "teal",
  },
  {
    slug: "computer-science",
    programId: "cs-bsc",
    school: "School of Computing",
    discipline: "Computer Science",
    name: "Computer Science",
    credential: "Bachelor-level independent study",
    description:
      "Programming, systems, algorithms, theory, data, artificial intelligence, software engineering, and a substantial final build.",
    status: "building",
    facts: ["Registry created", "Curriculum research next"],
    color: "coral",
  },
  {
    slug: "mathematics",
    programId: "math-bsc",
    school: "School of Natural Sciences",
    discipline: "Mathematics",
    name: "Mathematics",
    credential: "Bachelor-level independent study",
    description:
      "Proof, algebra, analysis, geometry, probability, computation, applications, and a learner-selected depth route.",
    status: "planned",
    facts: ["Framework planned"],
    color: "blue",
  },
  {
    slug: "economics",
    programId: "econ-ba",
    school: "School of Humanities & Society",
    discipline: "Economics",
    name: "Economics",
    credential: "Bachelor-level independent study",
    description:
      "Microeconomics, macroeconomics, econometrics, institutions, public policy, development, and independent empirical work.",
    status: "planned",
    facts: ["Framework planned"],
    color: "amber",
  },
];

export const liveDegrees = degreeCatalog.filter((degree) => degree.status === "live");

export function getDegreeBySlug(slug: string) {
  return degreeCatalog.find((degree) => degree.slug === slug);
}
