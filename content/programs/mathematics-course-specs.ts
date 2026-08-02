import type {
  AssessmentKind,
  PublishedCourseVersion,
  ResourceKind,
} from "../../app/domain/catalog";

export type MathematicsCompetencyKey =
  | "rigorous-proof-abstraction"
  | "analysis-continuous-models"
  | "algebra-number-structure"
  | "geometry-topology-spatial"
  | "probability-discrete-optimization"
  | "computation-modeling-verification"
  | "research-communication-responsibility";

export type MathematicsConcentrationKey =
  | "pure-structures-number-theory"
  | "analysis-pdes-mathematical-physics"
  | "discrete-optimization-computation";

export type MathematicsTopicSpec = {
  readonly key: string;
  readonly title: string;
  readonly assessmentPosition?: "applied" | "final";
};

type EightTopics = readonly [
  MathematicsTopicSpec,
  MathematicsTopicSpec,
  MathematicsTopicSpec,
  MathematicsTopicSpec,
  MathematicsTopicSpec,
  MathematicsTopicSpec,
  MathematicsTopicSpec,
  MathematicsTopicSpec,
];

type EightTopicTitles = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

export type MathematicsCourseSpec = {
  readonly key: string;
  readonly code: string;
  readonly slug: string;
  readonly title: string;
  readonly term: 1 | 2 | 3 | 4 | 5 | 6;
  readonly credits: 4;
  readonly format: PublishedCourseVersion["format"];
  readonly summary: string;
  readonly primaryOutcome: string;
  readonly prerequisiteKeys: readonly string[];
  readonly competencyKeys: readonly MathematicsCompetencyKey[];
  readonly topics: EightTopics;
  readonly assessmentKinds?: readonly [AssessmentKind, AssessmentKind];
  readonly appliedBrief: string;
  readonly finalBrief: string;
  readonly safetyNote?: string;
  readonly concentrationKey?: MathematicsConcentrationKey;
  readonly resource: {
    readonly slug: string;
    readonly title: string;
    readonly provider: string;
    readonly url: string;
    readonly kind: ResourceKind;
    readonly authors: readonly string[];
  };
};

const topicKey = (title: string) =>
  title
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function topics(...titles: EightTopicTitles): EightTopics {
  return titles.map((title, index) => ({
    key: topicKey(title),
    title,
    ...(index === 3
      ? { assessmentPosition: "applied" as const }
      : index === 7
        ? { assessmentPosition: "final" as const }
        : {}),
  })) as unknown as EightTopics;
}

const resource = (
  slug: string,
  title: string,
  provider: string,
  url: string,
  kind: ResourceKind,
  authors: readonly string[],
) => ({ slug, title, provider, url, kind, authors });

/**
 * Thirty-four available courses: twenty-eight fixed courses plus three
 * coherent two-course concentrations. A learner selects thirty courses over
 * six terms: five fixed courses in terms one through four, four fixed courses
 * in terms five and six, and one matching concentration course in each of the
 * final two terms.
 */
export const mathematicsCourseSpecs = [
  {
    key: "calculus-1",
    code: "MATH101",
    slug: "calculus-1",
    title: "Calculus I",
    term: 1,
    credits: 4,
    format: "theory",
    summary:
      "Functions, limits, derivatives, integrals, sequences, series, approximation, and quantitative models of change.",
    primaryOutcome:
      "Formulate, solve, and verify single-variable calculus arguments and models using units, bounds, and limiting cases.",
    prerequisiteKeys: [],
    competencyKeys: ["analysis-continuous-models", "computation-modeling-verification"],
    topics: topics(
      "functions, limits, and continuity",
      "derivatives and local approximation",
      "mean value theorems and optimization",
      "rate model with sensitivity and units",
      "definite integrals and the fundamental theorem",
      "integration methods and improper integrals",
      "sequences, series, and Taylor approximation",
      "cumulative calculus model and proof defense",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Build a rate-and-accumulation model from an open dataset, compare analytic and numerical results, and report units, error, and sensitivity.",
    finalBrief:
      "Complete a cumulative examination and defend one solution that links limits, differentiation, integration, approximation, and an explicit error bound.",
    resource: resource(
      "mit-18-01-single-variable-calculus",
      "Single Variable Calculus",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-01-single-variable-calculus-fall-2005/",
      "course",
      ["Jason Starr"],
    ),
  },
  {
    key: "introduction-proofs-logic",
    code: "MATH102",
    slug: "introduction-to-proofs-and-logic",
    title: "Introduction to Proofs and Logic",
    term: 1,
    credits: 4,
    format: "seminar",
    summary:
      "Propositional and predicate logic, sets, functions, relations, induction, contradiction, construction, and precise mathematical writing.",
    primaryOutcome:
      "Translate claims into precise statements and construct readable, valid proofs while identifying hidden assumptions and counterexamples.",
    prerequisiteKeys: [],
    competencyKeys: ["rigorous-proof-abstraction", "research-communication-responsibility"],
    topics: topics(
      "statements, quantifiers, truth, and validity",
      "sets, functions, relations, and equivalence",
      "direct proof and proof by cases",
      "proof audit with counterexample construction",
      "contrapositive, contradiction, and existence",
      "induction, recursion, and invariants",
      "cardinality, countability, and diagonal reasoning",
      "cumulative proof portfolio and oral defense",
    ),
    assessmentKinds: ["problem set", "oral"],
    appliedBrief:
      "Audit a deliberately flawed theorem-and-proof packet, formalize each claim, repair valid arguments, and construct minimal counterexamples to false ones.",
    finalBrief:
      "Submit and orally defend a proof portfolio using at least four proof methods, with definitions, dependency notes, and revisions responding to critique.",
    safetyNote:
      "Submit original proofs, cite every consulted source and tool, and distinguish collaboration from authorship. Do not copy solution sets or present generated arguments you cannot verify and defend.",
    resource: resource(
      "book-of-proof",
      "Book of Proof",
      "Richard Hammack",
      "https://richardhammack.github.io/BookOfProof/",
      "textbook",
      ["Richard Hammack"],
    ),
  },
  {
    key: "linear-algebra-1",
    code: "MATH103",
    slug: "linear-algebra-1",
    title: "Linear Algebra I",
    term: 1,
    credits: 4,
    format: "theory",
    summary:
      "Linear systems, matrices, vector spaces, linear maps, rank, determinants, eigenvalues, orthogonality, and least squares.",
    primaryOutcome:
      "Represent and solve finite-dimensional linear problems while explaining structure, conditioning, and the meaning of a computed result.",
    prerequisiteKeys: [],
    competencyKeys: ["algebra-number-structure", "computation-modeling-verification"],
    topics: topics(
      "linear systems and elimination",
      "vectors, subspaces, span, and independence",
      "linear transformations, bases, and coordinates",
      "least-squares fit and residual diagnosis",
      "determinants, rank, and invertibility",
      "eigenvalues, eigenvectors, and diagonalization",
      "inner products, orthogonality, and projections",
      "cumulative linear model and structure defense",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Fit and diagnose a least-squares model, derive the normal equations, compare a stable solver with direct inversion, and interpret the residual geometry.",
    finalBrief:
      "Complete a cumulative exam and defend a linear transformation from matrix representation through invariant subspaces, spectrum, and numerical conditioning.",
    resource: resource(
      "linear-algebra-hefferon",
      "Linear Algebra",
      "Jim Hefferon",
      "https://hefferon.net/linearalgebra/",
      "textbook",
      ["Jim Hefferon"],
    ),
  },
  {
    key: "discrete-mathematics",
    code: "MATH104",
    slug: "discrete-mathematics",
    title: "Discrete Mathematics",
    term: 1,
    credits: 4,
    format: "theory",
    summary:
      "Logic, induction, counting, recurrences, graphs, trees, modular arithmetic, discrete probability, invariants, and algorithms.",
    primaryOutcome:
      "Model and prove properties of finite structures using counting, induction, graph reasoning, and transparent algorithms.",
    prerequisiteKeys: [],
    competencyKeys: ["rigorous-proof-abstraction", "probability-discrete-optimization"],
    topics: topics(
      "logical implication, sets, and functions",
      "induction, strong induction, and recursion",
      "sums, recurrences, and asymptotic growth",
      "finite-structure invariant and algorithm study",
      "permutations, combinations, and inclusion-exclusion",
      "graphs, trees, paths, and connectivity",
      "modular arithmetic and discrete probability",
      "cumulative discrete proof and algorithm defense",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Design and verify an algorithm for a finite scheduling or routing instance, state an invariant, and analyze correctness and growth without overstating scalability.",
    finalBrief:
      "Solve and defend a cumulative set spanning induction, counting, recurrences, graphs, modular arithmetic, and discrete probability.",
    resource: resource(
      "discrete-mathematics-open-introduction-4",
      "Discrete Mathematics: An Open Introduction, 4th ed.",
      "Open Math Books",
      "https://discrete.openmathbooks.org/dmoi4.html",
      "textbook",
      ["Oscar Levin"],
    ),
  },
  {
    key: "mathematical-programming",
    code: "MATH105",
    slug: "mathematical-programming",
    title: "Mathematical Programming",
    term: 1,
    credits: 4,
    format: "laboratory",
    summary:
      "Python and Julia foundations, numerical arrays, symbolic work, visualization, testing, version control, and reproducible notebooks.",
    primaryOutcome:
      "Implement a mathematical claim as readable, tested computation and distinguish evidence from proof and floating-point output from exact truth.",
    prerequisiteKeys: [],
    competencyKeys: ["computation-modeling-verification", "research-communication-responsibility"],
    topics: topics(
      "expressions, functions, types, and control flow",
      "arrays, data structures, and vectorization",
      "floating-point arithmetic and numerical error",
      "reproducible computational conjecture study",
      "symbolic algebra and exact computation",
      "visualization, data provenance, and communication",
      "testing, version control, and performance",
      "cumulative verified mathematics software defense",
    ),
    assessmentKinds: ["lab", "project"],
    appliedBrief:
      "Create a reproducible notebook that tests a mathematical conjecture across exact and floating-point cases, with provenance, automated checks, and failure examples.",
    finalBrief:
      "Deliver and defend a small mathematics library with documented contracts, property tests, numerical-error analysis, reproducible environment, and honest claim boundaries.",
    safetyNote:
      "Use public or synthetic data by default. Do not upload personal, confidential, licensed, or sensitive data to third-party services; computation can support but does not replace proof.",
    resource: resource(
      "mit-18-s191-introduction-computational-thinking-2022",
      "Introduction to Computational Thinking",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-s191-introduction-to-computational-thinking-fall-2022/",
      "course",
      ["Alan Edelman", "David P. Sanders", "Charles E. Leiserson"],
    ),
  },
  {
    key: "multivariable-calculus",
    code: "MATH201",
    slug: "multivariable-calculus",
    title: "Multivariable Calculus",
    term: 2,
    credits: 4,
    format: "theory",
    summary:
      "Vectors, partial derivatives, multiple integrals, vector fields, constrained optimization, and the integral theorems of vector calculus.",
    primaryOutcome:
      "Analyze multivariable change and accumulation geometrically and symbolically, with coordinate, orientation, and approximation checks.",
    prerequisiteKeys: ["calculus-1", "linear-algebra-1"],
    competencyKeys: ["analysis-continuous-models", "geometry-topology-spatial"],
    topics: topics(
      "vectors, coordinates, curves, and surfaces",
      "partial derivatives, gradients, and differentials",
      "chain rules, Hessians, and local approximation",
      "constrained optimization and sensitivity study",
      "double and triple integrals with change of variables",
      "line integrals, surface integrals, and orientation",
      "Green, Stokes, and divergence theorems",
      "cumulative vector-calculus model and defense",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Optimize a constrained spatial model, derive first- and second-order conditions, visualize the feasible geometry, and test sensitivity to parameter changes.",
    finalBrief:
      "Complete a cumulative exam and defend one vector-field calculation through parameterization, orientation, integral theorem, and independent numerical check.",
    resource: resource(
      "mit-18-02-multivariable-calculus",
      "Multivariable Calculus",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-02-multivariable-calculus-fall-2007/",
      "course",
      ["Denis Auroux"],
    ),
  },
  {
    key: "linear-algebra-2",
    code: "MATH202",
    slug: "linear-algebra-2",
    title: "Linear Algebra II",
    term: 2,
    credits: 4,
    format: "theory",
    summary:
      "Abstract vector spaces, duality, quotient spaces, canonical forms, spectral theory, bilinear forms, and proof-based linear algebra.",
    primaryOutcome:
      "Prove structural results about finite-dimensional linear maps and select coordinates that expose invariants rather than obscure them.",
    prerequisiteKeys: ["introduction-proofs-logic", "linear-algebra-1"],
    competencyKeys: ["rigorous-proof-abstraction", "algebra-number-structure"],
    topics: topics(
      "vector spaces, subspaces, and quotient spaces",
      "linear maps, isomorphisms, and universal properties",
      "dual spaces, annihilators, and transpose maps",
      "coordinate-free operator classification study",
      "minimal polynomials and canonical forms",
      "inner-product spaces and adjoint operators",
      "spectral theorems and quadratic forms",
      "cumulative linear-structure proof defense",
    ),
    assessmentKinds: ["problem set", "oral"],
    appliedBrief:
      "Classify a family of operators under change of basis, prove the invariants used, and compare symbolic canonical form with numerically stable decompositions.",
    finalBrief:
      "Submit and orally defend a theorem portfolio connecting quotient spaces, duality, canonical forms, adjoints, and a spectral theorem.",
    resource: resource(
      "linear-algebra-done-wrong",
      "Linear Algebra Done Wrong",
      "Brown University / Sergei Treil",
      "https://sites.google.com/a/brown.edu/sergei-treil-homepage/linear-algebra-done-wrong",
      "textbook",
      ["Sergei Treil"],
    ),
  },
  {
    key: "differential-equations",
    code: "MATH203",
    slug: "differential-equations",
    title: "Differential Equations",
    term: 2,
    credits: 4,
    format: "theory",
    summary:
      "First- and second-order ordinary differential equations, systems, phase portraits, transforms, stability, forcing, and numerical solution.",
    primaryOutcome:
      "Derive, solve, and validate differential-equation models while distinguishing exact, qualitative, and numerical conclusions.",
    prerequisiteKeys: ["calculus-1", "linear-algebra-1"],
    competencyKeys: ["analysis-continuous-models", "computation-modeling-verification"],
    topics: topics(
      "first-order equations and existence intuition",
      "linear second-order equations and oscillation",
      "Laplace transforms, impulses, and convolution",
      "parameter-estimated dynamical model study",
      "systems, eigenmodes, and matrix exponentials",
      "nonlinear phase lines, equilibria, and stability",
      "numerical solvers, stiffness, and error control",
      "cumulative differential-equation model defense",
    ),
    assessmentKinds: ["project", "exam"],
    appliedBrief:
      "Fit an ODE model to an open time series, estimate parameters, compare analytic and numerical solutions, and diagnose structural and measurement error.",
    finalBrief:
      "Complete a cumulative exam and defend a forced or nonlinear system using derivation, qualitative behavior, computation, and validation against limiting cases.",
    resource: resource(
      "mit-18-03-differential-equations",
      "Differential Equations",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-03-differential-equations-spring-2010/",
      "course",
      ["Haynes Miller", "Arthur Mattuck"],
    ),
  },
  {
    key: "probability-1",
    code: "MATH204",
    slug: "probability-1",
    title: "Probability I",
    term: 2,
    credits: 4,
    format: "theory",
    summary:
      "Probability spaces, conditioning, independence, random variables, expectation, transforms, limit theorems, simulation, and calibration.",
    primaryOutcome:
      "Construct and critique probabilistic models, derive distributions and expectations, and verify results through simulation and calibration.",
    prerequisiteKeys: ["calculus-1", "discrete-mathematics"],
    competencyKeys: ["probability-discrete-optimization", "computation-modeling-verification"],
    topics: topics(
      "sample spaces, events, axioms, and counting",
      "conditional probability, Bayes rules, and independence",
      "discrete random variables and expectation",
      "simulation and calibration of a probability model",
      "continuous variables, densities, and transformations",
      "joint laws, covariance, and conditional expectation",
      "laws of large numbers and central-limit reasoning",
      "cumulative probability model and evidence defense",
    ),
    assessmentKinds: ["project", "exam"],
    appliedBrief:
      "Specify and simulate a reliability or queueing model, compare empirical and analytic probabilities, and test sensitivity to independence assumptions.",
    finalBrief:
      "Complete a cumulative exam and defend a probabilistic model from sample space through conditioning, expectation, dependence, approximation, and calibration.",
    safetyNote:
      "Probability estimates must not be presented as individualized medical, legal, financial, or safety advice; disclose assumptions, uncertainty, and relevant base rates.",
    resource: resource(
      "mit-18-440-probability-random-variables",
      "Probability and Random Variables",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-440-probability-and-random-variables-spring-2014/",
      "course",
      ["Scott Sheffield"],
    ),
  },
  {
    key: "combinatorics-graph-theory",
    code: "MATH205",
    slug: "combinatorics-and-graph-theory",
    title: "Combinatorics and Graph Theory",
    term: 2,
    credits: 4,
    format: "theory",
    summary:
      "Enumerative methods, generating functions, extremal arguments, matchings, coloring, planarity, flows, probabilistic methods, and graph algorithms.",
    primaryOutcome:
      "Prove counting and graph results by selecting appropriate bijective, algebraic, extremal, probabilistic, or algorithmic methods.",
    prerequisiteKeys: ["introduction-proofs-logic", "discrete-mathematics"],
    competencyKeys: ["rigorous-proof-abstraction", "probability-discrete-optimization"],
    topics: topics(
      "bijections, double counting, and inclusion-exclusion",
      "recurrences and ordinary generating functions",
      "graphs, connectivity, trees, and traversal",
      "matching or coloring theorem computational study",
      "matchings, Hall's theorem, and network flows",
      "coloring, planarity, and Euler structure",
      "extremal and probabilistic methods",
      "cumulative combinatorial theorem defense",
    ),
    assessmentKinds: ["problem set", "oral"],
    appliedBrief:
      "Model a matching, coloring, or flow instance, implement a small solver, and connect its output to a proved certificate of feasibility or impossibility.",
    finalBrief:
      "Submit and orally defend solutions spanning generating functions, graph structure, matching, coloring, extremal reasoning, and one probabilistic argument.",
    resource: resource(
      "applied-combinatorics",
      "Applied Combinatorics",
      "Applied Combinatorics",
      "https://appliedcombinatorics.org/appcomb/",
      "textbook",
      ["Mitchel T. Keller", "William T. Trotter"],
    ),
  },
  {
    key: "real-analysis-1",
    code: "MATH301",
    slug: "real-analysis-1",
    title: "Real Analysis I",
    term: 3,
    credits: 4,
    format: "theory",
    summary:
      "Metric properties of the real line, sequences, continuity, differentiation, Riemann integration, function sequences, and rigorous convergence.",
    primaryOutcome:
      "Prove the central theorems underlying calculus and diagnose exactly which hypotheses make an analytic conclusion valid.",
    prerequisiteKeys: ["calculus-1", "introduction-proofs-logic"],
    competencyKeys: ["rigorous-proof-abstraction", "analysis-continuous-models"],
    topics: topics(
      "ordered fields, completeness, and supremum arguments",
      "sequences, subsequences, and Cauchy criteria",
      "limits and continuity in metric language",
      "hypothesis audit for a convergence theorem",
      "differentiation and mean value theorems",
      "Riemann integration and integrability",
      "sequences and series of functions",
      "cumulative analysis theorem portfolio defense",
    ),
    assessmentKinds: ["problem set", "oral"],
    appliedBrief:
      "Test a convergence claim by proving the strongest valid version, identifying every used hypothesis, and constructing counterexamples when each is removed.",
    finalBrief:
      "Submit and orally defend a connected proof portfolio from completeness through convergence, continuity, differentiation, integration, and uniform convergence.",
    resource: resource(
      "mit-18-100a-real-analysis",
      "Real Analysis",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-100a-real-analysis-fall-2020/",
      "course",
      ["Casey Rodriguez"],
    ),
  },
  {
    key: "abstract-algebra-1",
    code: "MATH302",
    slug: "abstract-algebra-1",
    title: "Abstract Algebra I",
    term: 3,
    credits: 4,
    format: "theory",
    summary:
      "Groups, subgroups, homomorphisms, quotient groups, group actions, Sylow theory, rings, ideals, and polynomial arithmetic.",
    primaryOutcome:
      "Recognize algebraic structure, prove results through homomorphisms and actions, and compute examples that expose or refute a conjecture.",
    prerequisiteKeys: ["introduction-proofs-logic", "linear-algebra-2"],
    competencyKeys: ["rigorous-proof-abstraction", "algebra-number-structure"],
    topics: topics(
      "groups, subgroups, generators, and cyclic structure",
      "homomorphisms, kernels, images, and quotients",
      "permutation groups and group actions",
      "finite-group classification and computation study",
      "orbit-stabilizer, class equations, and Sylow theory",
      "rings, subrings, ideals, and quotient rings",
      "polynomial rings and factorization",
      "cumulative algebra structure and proof defense",
    ),
    assessmentKinds: ["problem set", "oral"],
    appliedBrief:
      "Use a computer algebra system to enumerate a small group or ring family, formulate a structural conjecture, and prove or refute it without treating computation as proof.",
    finalBrief:
      "Submit and defend a theorem portfolio linking homomorphism theorems, actions, Sylow results, ideals, quotients, and polynomial factorization.",
    resource: resource(
      "abstract-algebra-theory-applications",
      "Abstract Algebra: Theory and Applications",
      "Judson Books",
      "https://judsonbooks.org/abstract-algebra-theory-and-applications/",
      "textbook",
      ["Thomas W. Judson"],
    ),
  },
  {
    key: "complex-analysis",
    code: "MATH303",
    slug: "complex-analysis",
    title: "Complex Analysis",
    term: 3,
    credits: 4,
    format: "theory",
    summary:
      "Holomorphic functions, contour integration, power series, residues, conformal maps, harmonic functions, and analytic continuation.",
    primaryOutcome:
      "Use complex differentiability and contour methods to prove analytic results, evaluate integrals, and explain geometric consequences.",
    prerequisiteKeys: ["multivariable-calculus", "introduction-proofs-logic"],
    competencyKeys: ["analysis-continuous-models", "geometry-topology-spatial"],
    topics: topics(
      "complex numbers, topology, and differentiability",
      "Cauchy-Riemann equations and harmonic functions",
      "contours, primitives, and Cauchy's theorem",
      "residue-based real-integral or field study",
      "Cauchy formulas, power series, and analyticity",
      "zeros, poles, residues, and argument principle",
      "conformal maps and analytic continuation",
      "cumulative complex-analysis proof defense",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Solve a contour-integral or planar potential problem by two methods, visualize the complex geometry, and justify singularities, orientations, and limiting steps.",
    finalBrief:
      "Complete a cumulative exam and defend a connected argument using Cauchy's theorem, series, residues, conformal structure, and a stated domain of validity.",
    resource: resource(
      "mit-18-04-complex-variables-applications",
      "Complex Variables with Applications",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-04-complex-variables-with-applications-spring-2018/",
      "course",
      ["Jeremy Orloff"],
    ),
  },
  {
    key: "numerical-analysis",
    code: "MATH304",
    slug: "numerical-analysis",
    title: "Numerical Analysis",
    term: 3,
    credits: 4,
    format: "laboratory",
    summary:
      "Floating-point error, conditioning, linear systems, approximation, interpolation, quadrature, nonlinear equations, eigenproblems, and stability.",
    primaryOutcome:
      "Choose, implement, and justify numerical methods using conditioning, convergence, stability, residuals, and reproducible error experiments.",
    prerequisiteKeys: ["multivariable-calculus", "linear-algebra-1", "mathematical-programming"],
    competencyKeys: ["analysis-continuous-models", "computation-modeling-verification"],
    topics: topics(
      "floating-point arithmetic and backward error",
      "conditioning and stable linear solvers",
      "nonlinear equations and iterative convergence",
      "algorithm comparison with manufactured truth",
      "interpolation and approximation theory",
      "numerical differentiation and quadrature",
      "eigenvalue algorithms and error certification",
      "cumulative numerical-method verification defense",
    ),
    assessmentKinds: ["lab", "exam"],
    appliedBrief:
      "Compare two algorithms on manufactured and ill-conditioned cases, measure convergence and backward error, and explain observed failure thresholds.",
    finalBrief:
      "Complete a cumulative exam and defend a reproducible solver with mathematical convergence rationale, test oracle, conditioning analysis, and honest accuracy claims.",
    safetyNote:
      "Numerical agreement is not a correctness certificate. Preserve exact inputs and provenance, test adversarial cases, and do not use an unvalidated solver for safety-critical decisions.",
    resource: resource(
      "mit-18-330-introduction-numerical-analysis",
      "Introduction to Numerical Analysis",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-330-introduction-to-numerical-analysis-spring-2012/",
      "course",
      ["Laurent Demanet"],
    ),
  },
  {
    key: "mathematical-modeling",
    code: "MATH305",
    slug: "mathematical-modeling",
    title: "Mathematical Modeling",
    term: 3,
    credits: 4,
    format: "studio",
    summary:
      "Problem framing, dimensional analysis, dynamical and probabilistic models, parameter estimation, sensitivity, validation, uncertainty, and communication.",
    primaryOutcome:
      "Turn a real question into a transparent mathematical model, test it against evidence, and communicate useful conclusions with limits and uncertainty.",
    prerequisiteKeys: ["differential-equations", "probability-1", "mathematical-programming"],
    competencyKeys: [
      "analysis-continuous-models",
      "computation-modeling-verification",
      "research-communication-responsibility",
    ],
    topics: topics(
      "questions, stakeholders, system boundaries, and assumptions",
      "dimensions, scaling, nondimensionalization, and estimation",
      "deterministic, stochastic, and discrete model choices",
      "calibrated open-data model with falsification test",
      "identifiability, parameter estimation, and sensitivity",
      "validation, residuals, uncertainty, and alternatives",
      "scenario analysis, communication, and decision limits",
      "cumulative modeling dossier and stakeholder defense",
    ),
    assessmentKinds: ["project", "presentation"],
    appliedBrief:
      "Frame and calibrate a model for an open environmental, mobility, or public-systems dataset, then attempt to falsify it with held-out evidence and alternatives.",
    finalBrief:
      "Deliver and defend a reproducible modeling dossier covering stakeholders, assumptions, derivation, calibration, uncertainty, validation, alternatives, and decision boundaries.",
    safetyNote:
      "Use public, aggregate, or synthetic data. Avoid operational medical, legal, financial, policing, or infrastructure recommendations; document affected groups and require domain review for consequential use.",
    resource: resource(
      "introduction-mathematical-modeling-lega",
      "Introduction to Mathematical Modeling",
      "University of Arizona Libraries",
      "https://opentextbooks.library.arizona.edu/mathematicalmodeling/",
      "textbook",
      ["Joceline Lega"],
    ),
  },
  {
    key: "real-analysis-2-measure",
    code: "MATH401",
    slug: "real-analysis-2-measure-and-integration",
    title: "Real Analysis II: Measure and Integration",
    term: 4,
    credits: 4,
    format: "theory",
    summary:
      "Sigma-algebras, measures, measurable functions, Lebesgue integration, convergence theorems, product measures, and differentiation of measures.",
    primaryOutcome:
      "Construct measure-theoretic arguments and use convergence theorems with precise hypotheses to control limits and integrals.",
    prerequisiteKeys: ["real-analysis-1"],
    competencyKeys: ["rigorous-proof-abstraction", "analysis-continuous-models"],
    topics: topics(
      "sigma-algebras, outer measure, and measurable sets",
      "measurable functions and modes of convergence",
      "Lebesgue integral and comparison with Riemann integration",
      "convergence-theorem hypothesis and counterexample study",
      "Fatou, monotone, and dominated convergence",
      "Lp spaces, inequalities, and completeness",
      "product measures, Fubini, and Radon-Nikodym ideas",
      "cumulative measure-theory proof defense",
    ),
    assessmentKinds: ["problem set", "oral"],
    appliedBrief:
      "Analyze an interchange of limits and integrals, prove a valid theorem under sufficient hypotheses, and build counterexamples to tempting invalid variants.",
    finalBrief:
      "Submit and orally defend a proof sequence from outer measure through Lebesgue integration, convergence, Lp structure, and product integration.",
    resource: resource(
      "measure-integration-real-analysis-axler",
      "Measure, Integration & Real Analysis",
      "Sheldon Axler",
      "https://measure.axler.net/",
      "textbook",
      ["Sheldon Axler"],
    ),
  },
  {
    key: "abstract-algebra-2",
    code: "MATH402",
    slug: "abstract-algebra-2",
    title: "Abstract Algebra II",
    term: 4,
    credits: 4,
    format: "theory",
    summary:
      "Modules, principal and Noetherian structures, field extensions, finite fields, Galois theory, tensor products, and representation foundations.",
    primaryOutcome:
      "Use module and field structure to prove classification and solvability results, tracking every finiteness and commutativity hypothesis.",
    prerequisiteKeys: ["abstract-algebra-1"],
    competencyKeys: ["rigorous-proof-abstraction", "algebra-number-structure"],
    topics: topics(
      "modules, submodules, quotients, and exactness intuition",
      "modules over principal ideal domains",
      "Noetherian conditions and polynomial structure",
      "finite-field construction and computation study",
      "field extensions and algebraic elements",
      "splitting fields and separability",
      "Galois groups and solvability by radicals",
      "cumulative advanced-algebra theorem defense",
    ),
    assessmentKinds: ["problem set", "oral"],
    appliedBrief:
      "Construct finite fields computationally, verify arithmetic and automorphisms on examples, then prove which observations generalize and why.",
    finalBrief:
      "Submit and defend a theorem portfolio connecting module classification, field extensions, splitting fields, Galois correspondence, and polynomial solvability.",
    resource: resource(
      "algebra-abstract-concrete-goodman",
      "Algebra: Abstract and Concrete",
      "University of Iowa / Frederick M. Goodman",
      "https://homepage.math.uiowa.edu/~goodman/algebrabook.dir/bookblurb.html",
      "textbook",
      ["Frederick M. Goodman"],
    ),
  },
  {
    key: "topology",
    code: "MATH403",
    slug: "topology",
    title: "Topology",
    term: 4,
    credits: 4,
    format: "theory",
    summary:
      "Topological spaces, continuity, bases, products, quotients, compactness, connectedness, separation, homotopy, and the fundamental group.",
    primaryOutcome:
      "Prove global properties of spaces using open-set, compactness, quotient, and homotopy arguments while constructing decisive examples.",
    prerequisiteKeys: ["real-analysis-1", "linear-algebra-2"],
    competencyKeys: ["rigorous-proof-abstraction", "geometry-topology-spatial"],
    topics: topics(
      "topological spaces, bases, and subspaces",
      "continuity, homeomorphisms, and product spaces",
      "quotient spaces and identification maps",
      "topological-invariant example and counterexample atlas",
      "compactness and local compactness",
      "connectedness and path connectedness",
      "homotopy, winding, and fundamental groups",
      "cumulative topology proof and space defense",
    ),
    assessmentKinds: ["problem set", "oral"],
    appliedBrief:
      "Build a visual atlas of related spaces and maps, prove which pairs are homeomorphic or distinguish them by invariants, and document failed intuitions.",
    finalBrief:
      "Submit and orally defend a connected proof portfolio using bases, quotients, compactness, connectedness, homotopy, and the fundamental group.",
    resource: resource(
      "mit-18-901-introduction-topology",
      "Introduction to Topology",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-901-introduction-to-topology-fall-2004/",
      "course",
      ["James Munkres"],
    ),
  },
  {
    key: "optimization",
    code: "MATH404",
    slug: "optimization",
    title: "Optimization",
    term: 4,
    credits: 4,
    format: "laboratory",
    summary:
      "Linear and convex optimization, duality, optimality conditions, gradient and Newton methods, constrained problems, robustness, and certificates.",
    primaryOutcome:
      "Formulate optimization problems, derive optimality and dual certificates, implement appropriate solvers, and test robustness and fairness constraints.",
    prerequisiteKeys: ["multivariable-calculus", "linear-algebra-1", "numerical-analysis"],
    competencyKeys: ["probability-discrete-optimization", "computation-modeling-verification"],
    topics: topics(
      "formulations, feasible sets, and linear programs",
      "convex sets, convex functions, and geometry",
      "duality, separating hyperplanes, and certificates",
      "resource-allocation model with sensitivity audit",
      "optimality conditions and constrained calculus",
      "gradient, Newton, and proximal methods",
      "robustness, integer decisions, and implementation gaps",
      "cumulative optimization model and certificate defense",
    ),
    assessmentKinds: ["project", "exam"],
    appliedBrief:
      "Formulate and solve an open-data allocation problem, provide a primal-dual certificate, and audit sensitivity, infeasibility, distributional impact, and implementation gaps.",
    finalBrief:
      "Complete a cumulative exam and defend an optimization model from variables and assumptions through convexity, algorithm, certificate, robustness, and responsible-use limits.",
    safetyNote:
      "Optimization objectives encode value choices. Do not deploy consequential allocation or ranking systems; disclose proxies, affected groups, constraints, uncertainty, and the need for stakeholder and domain review.",
    resource: resource(
      "convex-optimization-boyd-vandenberghe",
      "Convex Optimization",
      "Stanford University",
      "https://web.stanford.edu/~boyd/cvxbook/index.html",
      "textbook",
      ["Stephen Boyd", "Lieven Vandenberghe"],
    ),
  },
  {
    key: "stochastic-processes-statistical-inference",
    code: "MATH405",
    slug: "stochastic-processes-and-statistical-inference",
    title: "Stochastic Processes and Statistical Inference",
    term: 4,
    credits: 4,
    format: "laboratory",
    summary:
      "Markov chains, Poisson processes, martingales, estimation, likelihood, confidence, hypothesis testing, Bayesian reasoning, and model checking.",
    primaryOutcome:
      "Analyze stochastic systems and make reproducible statistical inferences with calibrated uncertainty, diagnostics, and explicit sampling assumptions.",
    prerequisiteKeys: ["probability-1", "linear-algebra-1", "mathematical-programming"],
    competencyKeys: ["probability-discrete-optimization", "computation-modeling-verification"],
    topics: topics(
      "discrete-time Markov chains and classification",
      "stationarity, recurrence, and long-run behavior",
      "Poisson processes, waiting times, and renewal ideas",
      "open time-series process and inference study",
      "likelihood, sufficiency, and point estimation",
      "confidence intervals and hypothesis tests",
      "Bayesian updating, diagnostics, and model criticism",
      "cumulative stochastic-inference evidence defense",
    ),
    assessmentKinds: ["project", "exam"],
    appliedBrief:
      "Fit a Markov or Poisson model to a preregistered open dataset, estimate parameters, check dependence and fit, and report uncertainty and alternative explanations.",
    finalBrief:
      "Complete a cumulative exam and defend an inference from stochastic assumptions through likelihood or posterior, diagnostics, sensitivity, and calibrated conclusion.",
    safetyNote:
      "Use public, aggregate, or synthetic data and avoid causal or individualized claims unsupported by design. Report multiple-testing choices, missingness, sampling limits, and uncertainty.",
    resource: resource(
      "introduction-probability-statistics-random-processes",
      "Introduction to Probability, Statistics, and Random Processes",
      "ProbabilityCourse.com",
      "https://www.probabilitycourse.com/",
      "textbook",
      ["Hossein Pishro-Nik"],
    ),
  },
  {
    key: "functional-analysis-fourier",
    code: "MATH501",
    slug: "functional-analysis-and-fourier-analysis",
    title: "Functional Analysis and Fourier Analysis",
    term: 5,
    credits: 4,
    format: "theory",
    summary:
      "Normed, Banach, and Hilbert spaces; bounded operators; compactness; major functional-analytic theorems; Fourier series and transforms.",
    primaryOutcome:
      "Use infinite-dimensional structure and Fourier methods to prove representation, convergence, and operator results with precise topology and hypotheses.",
    prerequisiteKeys: ["real-analysis-2-measure", "linear-algebra-2"],
    competencyKeys: ["rigorous-proof-abstraction", "analysis-continuous-models"],
    topics: topics(
      "normed spaces, Banach spaces, and examples",
      "Hilbert spaces, orthogonality, and projection",
      "bounded operators, duality, and weak convergence",
      "Fourier approximation and convergence experiment",
      "Baire category and uniform boundedness",
      "open mapping and closed graph theorems",
      "Fourier series, transforms, and spectral viewpoints",
      "cumulative functional-Fourier theorem defense",
    ),
    assessmentKinds: ["problem set", "oral"],
    appliedBrief:
      "Approximate a nonsmooth signal with Fourier truncations, measure convergence in several norms, expose Gibbs behavior, and prove the strongest supported convergence claim.",
    finalBrief:
      "Submit and defend a proof portfolio connecting Banach and Hilbert structure, bounded operators, one major theorem, Fourier representation, and convergence modes.",
    resource: resource(
      "mit-18-102-introduction-functional-analysis",
      "Introduction to Functional Analysis",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-102-introduction-to-functional-analysis-spring-2021/",
      "course",
      ["Casey Rodriguez"],
    ),
  },
  {
    key: "differential-geometry",
    code: "MATH502",
    slug: "differential-geometry",
    title: "Differential Geometry",
    term: 5,
    credits: 4,
    format: "theory",
    summary:
      "Smooth manifolds, tangent and cotangent spaces, differential forms, curves, surfaces, metrics, curvature, geodesics, and global theorems.",
    primaryOutcome:
      "Express geometric invariants in coordinates and intrinsically, prove their transformation properties, and connect local curvature to global structure.",
    prerequisiteKeys: ["multivariable-calculus", "linear-algebra-2", "topology"],
    competencyKeys: ["geometry-topology-spatial", "rigorous-proof-abstraction"],
    topics: topics(
      "smooth manifolds, charts, atlases, and maps",
      "tangent spaces, vector fields, and flows",
      "cotangent spaces, forms, and pullbacks",
      "surface or manifold computation and visualization",
      "Riemannian metrics, connections, and geodesics",
      "curvature of curves and surfaces",
      "Gauss-Bonnet and local-to-global reasoning",
      "cumulative geometric invariant defense",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Parameterize and visualize a curved surface or manifold, compute metric and curvature quantities in two charts, and verify coordinate invariance numerically and symbolically.",
    finalBrief:
      "Defend a geometric case from atlas and tangent data through metric, connection, curvature, geodesics, and one local-to-global theorem.",
    resource: resource(
      "mit-18-950-differential-geometry",
      "Differential Geometry",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-950-differential-geometry-fall-2008/",
      "course",
      ["Paul Seidel"],
    ),
  },
  {
    key: "research-expository-seminar",
    code: "MATH503",
    slug: "research-and-expository-seminar",
    title: "Research and Expository Seminar",
    term: 5,
    credits: 4,
    format: "seminar",
    summary:
      "Literature search, theorem reconstruction, examples, mathematical exposition, peer review, talks, research ethics, and question formation.",
    primaryOutcome:
      "Read advanced mathematics independently, reconstruct an argument, and communicate it accurately to distinct audiences through writing and speech.",
    prerequisiteKeys: ["real-analysis-1", "abstract-algebra-1", "mathematical-modeling"],
    competencyKeys: ["rigorous-proof-abstraction", "research-communication-responsibility"],
    topics: topics(
      "finding literature and tracing mathematical provenance",
      "reading definitions, theorem dependencies, and notation",
      "reconstructing omitted proof steps and examples",
      "peer-reviewed expository note and revision",
      "research questions, conjectures, and feasibility",
      "figures, computation, citation, and reproducibility",
      "talk design, questioning, and constructive review",
      "final expository paper and public oral defense",
    ),
    assessmentKinds: ["project", "presentation"],
    appliedBrief:
      "Write a self-contained expository note that reconstructs a published theorem, supplies missing examples or computation, cites primary sources, and revises after blind peer review.",
    finalBrief:
      "Deliver a polished paper and two audience-calibrated talks, then answer questions about definitions, proof dependencies, novelty limits, sources, and unresolved issues.",
    safetyNote:
      "Attribute ideas and text, distinguish original work from exposition, preserve source and computation provenance, disclose tool assistance, and never fabricate citations, results, or peer review.",
    resource: resource(
      "mit-18-821-project-laboratory-mathematics",
      "Project Laboratory in Mathematics",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-821-project-laboratory-in-mathematics-spring-2013/",
      "course",
      ["Haynes Miller", "Nat Stapleton", "Saul Glasman", "Susan Ruff"],
    ),
  },
  {
    key: "computational-mathematics",
    code: "MATH504",
    slug: "computational-mathematics",
    title: "Computational Mathematics",
    term: 5,
    credits: 4,
    format: "laboratory",
    summary:
      "Sparse linear algebra, iterative methods, spectral and finite-difference discretization, automatic differentiation, uncertainty, performance, and verification.",
    primaryOutcome:
      "Build scalable mathematical software whose discretization, solver, performance, and error claims are supported by theory and reproducible evidence.",
    prerequisiteKeys: ["numerical-analysis", "differential-equations", "optimization"],
    competencyKeys: ["computation-modeling-verification", "analysis-continuous-models"],
    topics: topics(
      "sparse matrices, graph structure, and storage",
      "iterative solvers, preconditioning, and convergence",
      "finite differences and consistency",
      "verified solver benchmark with manufactured solutions",
      "spectral methods and transform acceleration",
      "automatic differentiation and optimization interfaces",
      "performance profiling, reproducibility, and uncertainty",
      "cumulative computational-mathematics software defense",
    ),
    assessmentKinds: ["lab", "project"],
    appliedBrief:
      "Implement and benchmark sparse or spectral solvers on manufactured problems, demonstrate convergence order, profile cost, and explain deviations from theory.",
    finalBrief:
      "Deliver and defend a reproducible solver package with discretization derivation, convergence evidence, regression tests, performance analysis, and documented validity limits.",
    safetyNote:
      "Treat computation as evidence bounded by discretization, conditioning, implementation, and input assumptions; do not certify safety-critical systems from unreviewed software or simulation alone.",
    resource: resource(
      "mit-18-085-computational-science-engineering-1",
      "Computational Science and Engineering I",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-085-computational-science-and-engineering-i-summer-2020/",
      "course",
      ["Chengzhao (Richard) Zhang"],
    ),
  },
  {
    key: "algebraic-number-theory",
    code: "MATH511",
    slug: "algebraic-number-theory",
    title: "Algebraic Number Theory",
    term: 5,
    credits: 4,
    format: "theory",
    summary:
      "Algebraic numbers, number fields, rings of integers, ideals, factorization, valuations, completions, class groups, and arithmetic computation.",
    primaryOutcome:
      "Use ideals, valuations, and local-global structure to prove and compute arithmetic properties beyond unique factorization of elements.",
    prerequisiteKeys: ["abstract-algebra-2", "complex-analysis"],
    competencyKeys: ["algebra-number-structure", "rigorous-proof-abstraction"],
    concentrationKey: "pure-structures-number-theory",
    topics: topics(
      "algebraic numbers and number fields",
      "rings of integers, norms, traces, and discriminants",
      "Dedekind domains, ideals, and factorization",
      "number-field arithmetic computation and proof study",
      "ramification, splitting, and decomposition",
      "units, class groups, and Minkowski geometry",
      "valuations, completions, and local viewpoints",
      "cumulative algebraic-number-theory defense",
    ),
    assessmentKinds: ["problem set", "oral"],
    appliedBrief:
      "Compute invariants of selected quadratic or cyclotomic fields, check results with software, and prove the factorization and class-group claims used.",
    finalBrief:
      "Submit and defend a connected arithmetic dossier from number field and ring of integers through ideals, ramification, units, class group, and local structure.",
    resource: resource(
      "mit-18-785-number-theory-1",
      "Number Theory I",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-785-number-theory-i-fall-2021/",
      "course",
      ["Andrew V. Sutherland"],
    ),
  },
  {
    key: "partial-differential-equations",
    code: "MATH512",
    slug: "partial-differential-equations",
    title: "Partial Differential Equations",
    term: 5,
    credits: 4,
    format: "laboratory",
    summary:
      "Transport, wave, diffusion, Laplace, and Poisson equations; characteristics, separation, Fourier methods, weak formulations, energy estimates, and discretization.",
    primaryOutcome:
      "Classify, analyze, and approximate canonical PDEs while relating boundary data, regularity, conservation, stability, and numerical evidence.",
    prerequisiteKeys: ["real-analysis-2-measure", "differential-equations", "numerical-analysis"],
    competencyKeys: ["analysis-continuous-models", "computation-modeling-verification"],
    concentrationKey: "analysis-pdes-mathematical-physics",
    topics: topics(
      "PDE classification, domains, and boundary data",
      "transport equations and characteristics",
      "wave equations, energy, and finite propagation",
      "verified PDE simulation with energy or maximum check",
      "diffusion equations and maximum principles",
      "Laplace and Poisson equations with harmonic methods",
      "weak solutions, Fourier methods, and discretization",
      "cumulative PDE analysis and simulation defense",
    ),
    assessmentKinds: ["project", "exam"],
    appliedBrief:
      "Simulate a wave, diffusion, or Poisson problem with manufactured truth, verify convergence and a conservation or maximum principle, and diagnose boundary artifacts.",
    finalBrief:
      "Complete a cumulative exam and defend a PDE case from classification and well-posed data through analytic estimate, numerical method, verification, and physical limits.",
    safetyNote:
      "PDE simulation is not operational certification. Use non-hazardous scenarios and do not infer structural, medical, environmental, or public-safety adequacy without validated data and expert review.",
    resource: resource(
      "mit-18-152-introduction-partial-differential-equations",
      "Introduction to Partial Differential Equations",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-152-introduction-to-partial-differential-equations-fall-2011/",
      "course",
      ["Jared Speck"],
    ),
  },
  {
    key: "combinatorial-optimization",
    code: "MATH513",
    slug: "combinatorial-optimization",
    title: "Combinatorial Optimization",
    term: 5,
    credits: 4,
    format: "laboratory",
    summary:
      "Network flows, matchings, matroids, integer programming, polyhedral combinatorics, approximation, complexity, and optimality certificates.",
    primaryOutcome:
      "Exploit discrete structure to design optimization algorithms and prove feasibility, optimality, approximation, or hardness claims.",
    prerequisiteKeys: ["combinatorics-graph-theory", "optimization"],
    competencyKeys: ["probability-discrete-optimization", "computation-modeling-verification"],
    concentrationKey: "discrete-optimization-computation",
    topics: topics(
      "shortest paths, spanning trees, and greedy proofs",
      "maximum flow, minimum cut, and integrality",
      "bipartite matching and assignment",
      "certified network-optimization implementation study",
      "matroids and general greedy structure",
      "integer programs, relaxations, and polyhedra",
      "approximation, complexity, and integrality gaps",
      "cumulative discrete-optimization certificate defense",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Implement a flow, matching, or assignment solver, emit independently checkable certificates, and test behavior on infeasible, degenerate, and adversarial instances.",
    finalBrief:
      "Defend an algorithmic dossier spanning formulation, structural theorem, correctness, complexity, certificate, relaxation quality, and limitations on real allocation use.",
    safetyNote:
      "Do not deploy ranking, routing, or allocation models that affect people. Audit objective choices, proxy variables, infeasibility handling, distributional effects, and opportunities for human appeal.",
    resource: resource(
      "mit-18-433-combinatorial-optimization",
      "Combinatorial Optimization",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-433-combinatorial-optimization-fall-2003/",
      "course",
      ["Santosh Vempala"],
    ),
  },
  {
    key: "dynamical-systems",
    code: "MATH601",
    slug: "dynamical-systems",
    title: "Dynamical Systems",
    term: 6,
    credits: 4,
    format: "laboratory",
    summary:
      "Discrete and continuous dynamics, fixed points, stability, bifurcations, invariant sets, Hamiltonian behavior, chaos, ergodic ideas, and computation.",
    primaryOutcome:
      "Combine qualitative theory and verified computation to explain how nonlinear systems change with state, parameter, and perturbation.",
    prerequisiteKeys: ["differential-equations", "real-analysis-1", "numerical-analysis"],
    competencyKeys: ["analysis-continuous-models", "computation-modeling-verification"],
    topics: topics(
      "maps, flows, orbits, and invariant sets",
      "fixed points, linearization, and stability",
      "phase portraits, Lyapunov functions, and limit cycles",
      "bifurcation diagram and numerical validation study",
      "local bifurcations and normal forms",
      "Hamiltonian systems, conserved structure, and perturbation",
      "chaos, symbolic dynamics, and ergodic viewpoints",
      "cumulative nonlinear-dynamics evidence defense",
    ),
    assessmentKinds: ["project", "exam"],
    appliedBrief:
      "Construct and validate a bifurcation diagram for a nonlinear map or flow, estimate stability and numerical sensitivity, and separate solver artifacts from dynamics.",
    finalBrief:
      "Complete a cumulative exam and defend one system through invariant structure, local stability, bifurcation, global behavior, computation, and model limits.",
    resource: resource(
      "mit-18-385j-nonlinear-dynamics-chaos",
      "Nonlinear Dynamics and Chaos",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-385j-nonlinear-dynamics-and-chaos-fall-2014/",
      "course",
      ["Rodolfo Rosales"],
    ),
  },
  {
    key: "advanced-probability-statistics",
    code: "MATH602",
    slug: "advanced-probability-and-statistics",
    title: "Advanced Probability and Statistics",
    term: 6,
    credits: 4,
    format: "laboratory",
    summary:
      "Measure-theoretic probability, conditional expectation, martingales, modes of convergence, asymptotic statistics, regression, resampling, and robust inference.",
    primaryOutcome:
      "Prove advanced probability results and design statistical analyses whose asymptotics, computation, diagnostics, and uncertainty are mutually consistent.",
    prerequisiteKeys: ["real-analysis-2-measure", "stochastic-processes-statistical-inference"],
    competencyKeys: [
      "probability-discrete-optimization",
      "rigorous-proof-abstraction",
      "computation-modeling-verification",
    ],
    topics: topics(
      "probability spaces, random variables, and integration",
      "conditional expectation and martingales",
      "almost-sure, probability, and distributional convergence",
      "preregistered robust-inference and simulation study",
      "laws of large numbers and central-limit theorems",
      "likelihood, asymptotic estimation, and information",
      "regression, resampling, robustness, and diagnostics",
      "cumulative probability-statistics theorem defense",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Preregister and run a simulation-backed inference study comparing classical and robust procedures under contamination, dependence, and misspecification.",
    finalBrief:
      "Defend an analysis from probability construction and convergence theorem through estimator, asymptotics, computation, diagnostics, uncertainty, and claim boundaries.",
    safetyNote:
      "Use public, aggregate, or synthetic data. Avoid unsupported causal, demographic, medical, legal, or financial claims; disclose selection, missingness, multiplicity, model choices, and uncertainty.",
    resource: resource(
      "mit-18-655-mathematical-statistics",
      "Mathematical Statistics",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-655-mathematical-statistics-spring-2016/",
      "course",
      ["Peter Kempthorne"],
    ),
  },
  {
    key: "mathematics-society-responsible-modeling",
    code: "MATH603",
    slug: "mathematics-society-and-responsible-modeling",
    title: "Mathematics, Society, and Responsible Modeling",
    term: 6,
    credits: 4,
    format: "seminar",
    summary:
      "Values in models, measurement and proxies, fairness, privacy, causal limits, risk communication, participatory review, reproducibility, and professional responsibility.",
    primaryOutcome:
      "Audit how mathematical systems shape decisions and redesign a model or analysis around transparent values, evidence, stakeholder rights, and contestability.",
    prerequisiteKeys: ["mathematical-modeling", "optimization", "stochastic-processes-statistical-inference"],
    competencyKeys: [
      "research-communication-responsibility",
      "computation-modeling-verification",
      "probability-discrete-optimization",
    ],
    topics: topics(
      "models as value-laden simplifications",
      "measurement, labels, proxies, and construct validity",
      "sampling, privacy, surveillance, and data governance",
      "sociotechnical model audit with stakeholder response",
      "fairness definitions, tradeoffs, and impossibility results",
      "causal claims, feedback loops, and distribution shift",
      "transparency, contestability, redress, and professional duty",
      "cumulative responsible-modeling public defense",
    ),
    assessmentKinds: ["reflection", "presentation"],
    appliedBrief:
      "Audit a documented public model or scoring system, reconstruct its mathematics, identify affected groups and failure modes, and propose a stakeholder-reviewable redesign.",
    finalBrief:
      "Present and defend a responsible-modeling dossier covering purpose, values, data rights, formal metrics, uncertainty, impacts, alternatives, governance, contestability, and redress.",
    safetyNote:
      "Do not collect sensitive data, profile real people, or deploy scoring systems. Use public documentation or synthetic examples, minimize harm in case descriptions, and center affected-community perspectives.",
    resource: resource(
      "ethics-working-mathematician",
      "Ethics for the Working Mathematician",
      "Cambridge University Ethics in Mathematics Society / Ethics in Mathematics Project",
      "https://cueims.soc.srcf.net/2021/",
      "course",
      ["Maurice Chiodo"],
    ),
  },
  {
    key: "senior-research-thesis",
    code: "MATH604",
    slug: "senior-research-thesis",
    title: "Senior Research Thesis",
    term: 6,
    credits: 4,
    format: "capstone",
    summary:
      "Question refinement, literature synthesis, original theorem or model work, reproducibility, mathematical writing, peer critique, and oral examination.",
    primaryOutcome:
      "Complete and publicly defend an independent mathematical contribution whose claims, provenance, proof or computation, and limitations withstand expert scrutiny.",
    prerequisiteKeys: ["research-expository-seminar", "computational-mathematics"],
    competencyKeys: [
      "rigorous-proof-abstraction",
      "computation-modeling-verification",
      "research-communication-responsibility",
    ],
    topics: topics(
      "research question, scope, supervision, and ethics plan",
      "literature map, definitions, and dependency ledger",
      "proof strategy, model design, or computational protocol",
      "proposal defense with feasibility and risk revision",
      "results, counterexamples, verification, and negative findings",
      "thesis architecture, figures, citation, and reproducibility",
      "peer review, replication, revision, and talk rehearsal",
      "archived thesis and public oral examination",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Defend a thesis proposal containing a precise question, literature map, definitions, methods, milestones, verification plan, ethical boundaries, and fallback contribution.",
    finalBrief:
      "Submit an archived, reproducible thesis and defend its central contribution, proof or evidence, source provenance, limitations, failed approaches, and future questions before a review panel.",
    safetyNote:
      "Obtain qualified supervision and required ethics approval before any human, sensitive, proprietary, hazardous, or consequential work. Attribute all assistance and never fabricate evidence or novelty.",
    resource: resource(
      "mit-21w-794-graduate-technical-writing-workshop",
      "Graduate Technical Writing Workshop",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/21w-794-graduate-technical-writing-workshop-january-iap-2019/",
      "course",
      [
        "Caroline Beimford",
        "Andreas Karatsolis",
        "Suzanne T. Lane",
        "Leslie Ann Roldan",
        "Jessie Stickgold-Sarah",
      ],
    ),
  },
  {
    key: "algebraic-geometry-representation-theory",
    code: "MATH611",
    slug: "algebraic-geometry-and-representation-theory",
    title: "Algebraic Geometry and Representation Theory",
    term: 6,
    credits: 4,
    format: "theory",
    summary:
      "Affine and projective varieties, coordinate rings, morphisms, dimension, singularities, group representations, characters, and geometric symmetry.",
    primaryOutcome:
      "Move fluently between geometric spaces, commutative algebra, and linear representations to prove structural results and compute revealing examples.",
    prerequisiteKeys: ["algebraic-number-theory", "abstract-algebra-2", "topology"],
    competencyKeys: [
      "algebra-number-structure",
      "geometry-topology-spatial",
      "rigorous-proof-abstraction",
    ],
    concentrationKey: "pure-structures-number-theory",
    topics: topics(
      "affine varieties, ideals, and coordinate rings",
      "Nullstellensatz and algebra-geometry correspondence",
      "projective space, morphisms, and rational maps",
      "symbolic variety and representation computation study",
      "dimension, tangent spaces, and singularities",
      "group representations, modules, and complete reducibility",
      "characters, symmetry, and geometric actions",
      "cumulative algebra-geometry-representation defense",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Compute equations, singularities, or character data for a small family, verify examples symbolically, and prove the structural claims that organize the computation.",
    finalBrief:
      "Defend a connected dossier linking coordinate rings and varieties, projective or singular structure, representations and characters, and a geometric symmetry case.",
    resource: resource(
      "mit-18-735-double-affine-hecke-algebras",
      "Double Affine Hecke Algebras in Representation Theory, Combinatorics, Geometry, and Mathematical Physics",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-735-double-affine-hecke-algebras-in-representation-theory-combinatorics-geometry-and-mathematical-physics-fall-2009/",
      "course",
      ["Pavel Etingof"],
    ),
  },
  {
    key: "calculus-variations-continuum",
    code: "MATH612",
    slug: "calculus-of-variations-and-continuum-models",
    title: "Calculus of Variations and Continuum Models",
    term: 6,
    credits: 4,
    format: "laboratory",
    summary:
      "Variational principles, Euler-Lagrange equations, direct methods, weak formulations, conservation laws, elasticity and fluid models, stability, and discretization.",
    primaryOutcome:
      "Derive and analyze continuum models from variational principles, then verify approximations through energy, invariance, and convergence checks.",
    prerequisiteKeys: ["partial-differential-equations", "functional-analysis-fourier", "differential-geometry"],
    competencyKeys: ["analysis-continuous-models", "geometry-topology-spatial", "computation-modeling-verification"],
    concentrationKey: "analysis-pdes-mathematical-physics",
    topics: topics(
      "functionals, first variation, and Euler-Lagrange equations",
      "constraints, multipliers, and natural boundary conditions",
      "direct methods, coercivity, and weak lower semicontinuity",
      "energy-minimizing continuum simulation study",
      "symmetry, Noether principles, and conservation",
      "elasticity, fluids, and constitutive assumptions",
      "finite-element ideas, stability, and convergence",
      "cumulative variational-continuum model defense",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Derive and approximate an energy-minimizing membrane or elastic model, verify boundary conditions and energy decay, and test mesh and parameter sensitivity.",
    finalBrief:
      "Defend a continuum model from constitutive and variational assumptions through Euler-Lagrange or weak form, existence logic, discretization, verification, and physical limits.",
    safetyNote:
      "Continuum models omit material, geometric, and operational failure modes. Do not use the project to certify real structures, vehicles, medical devices, or hazardous flows without expert validation.",
    resource: resource(
      "mit-18-354j-nonlinear-dynamics-2-continuum-systems",
      "Nonlinear Dynamics II: Continuum Systems",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-354j-nonlinear-dynamics-ii-continuum-systems-spring-2015/",
      "course",
      ["Jörn Dunkel"],
    ),
  },
  {
    key: "algorithms-complexity-coding",
    code: "MATH613",
    slug: "algorithms-complexity-and-coding",
    title: "Algorithms, Complexity, and Coding",
    term: 6,
    credits: 4,
    format: "theory",
    summary:
      "Algorithm design, reductions, randomized methods, tractability, NP-completeness, coding theory, finite fields, information bounds, and verification.",
    primaryOutcome:
      "Prove correctness and complexity results, recognize computational barriers, and design error-correcting codes with explicit assumptions and guarantees.",
    prerequisiteKeys: ["combinatorial-optimization", "abstract-algebra-1", "probability-1"],
    competencyKeys: [
      "probability-discrete-optimization",
      "algebra-number-structure",
      "computation-modeling-verification",
    ],
    concentrationKey: "discrete-optimization-computation",
    topics: topics(
      "algorithmic paradigms, invariants, and lower bounds",
      "randomized algorithms and concentration",
      "reductions, decision problems, and complexity classes",
      "reduction and error-correcting-code implementation study",
      "NP-completeness, approximation, and parameterized ideas",
      "information, entropy, and channel bounds",
      "linear codes, finite fields, decoding, and distance",
      "cumulative complexity-coding theorem defense",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Implement a linear code and decoder, measure errors against proved distance bounds, and pair it with a formal reduction demonstrating one computational barrier.",
    finalBrief:
      "Defend a dossier spanning algorithm correctness, asymptotic analysis, reduction, tractability limit, information bound, code construction, decoding guarantee, and experimental evidence.",
    safetyNote:
      "Educational coding schemes are not substitutes for reviewed production communications or cryptography. Do not make security, reliability, or privacy guarantees beyond proved and tested assumptions.",
    resource: resource(
      "mit-6-895-essential-coding-theory",
      "Essential Coding Theory",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/6-895-essential-coding-theory-fall-2004/",
      "course",
      ["Madhu Sudan"],
    ),
  },
] as const satisfies readonly MathematicsCourseSpec[];
