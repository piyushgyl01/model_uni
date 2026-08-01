import type {
  AssessmentKind,
  PublishedCourseVersion,
  ResourceKind,
} from "../../app/domain/catalog";

export type PhysicsCompetencyKey =
  | "mathematical-modeling"
  | "classical-fields"
  | "quantum-statistical"
  | "experiment-instrumentation"
  | "computation-data"
  | "research-communication"
  | "professional-practice";

export type PhysicsConcentrationKey =
  | "astrophysics-gravitation"
  | "quantum-science-materials"
  | "particle-nuclear-physics";

export type PhysicsTopicSpec = {
  readonly key: string;
  readonly title: string;
  readonly assessmentPosition?: "applied" | "final";
};

type EightTopics = readonly [
  PhysicsTopicSpec,
  PhysicsTopicSpec,
  PhysicsTopicSpec,
  PhysicsTopicSpec,
  PhysicsTopicSpec,
  PhysicsTopicSpec,
  PhysicsTopicSpec,
  PhysicsTopicSpec,
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

export type PhysicsCourseSpec = {
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
  readonly competencyKeys: readonly PhysicsCompetencyKey[];
  readonly topics: EightTopics;
  readonly assessmentKinds?: readonly [AssessmentKind, AssessmentKind];
  readonly appliedBrief: string;
  readonly finalBrief: string;
  readonly safetyNote?: string;
  readonly concentrationKey?: PhysicsConcentrationKey;
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
 * six terms. Campus-only facilities are replaced by simulation, public data,
 * remote instrumentation, or a separately supervised local laboratory.
 */
export const physicsCourseSpecs = [
  {
    key: "calculus-1",
    code: "MATH101",
    slug: "calculus-1-physical-modeling",
    title: "Calculus I and Physical Modeling",
    term: 1,
    credits: 4,
    format: "theory",
    summary:
      "Limits, derivatives, integrals, series, approximation, and single-variable models of physical change.",
    primaryOutcome:
      "Build, solve, check, and communicate calculus models with units, limiting cases, and quantified approximation error.",
    prerequisiteKeys: [],
    competencyKeys: ["mathematical-modeling", "computation-data"],
    topics: topics(
      "functions, dimensions, limits, and continuity",
      "derivatives, rates, and linearization",
      "optimization, scaling, and sensitivity",
      "motion model with measured uncertainty",
      "integrals, accumulation, work, and conservation",
      "integration methods and numerical quadrature",
      "Taylor series, convergence, and error bounds",
      "cumulative calculus model and oral defense",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Infer a motion law from a small measured dataset, estimate derivatives and integrals two ways, and report units, residuals, and uncertainty.",
    finalBrief:
      "Complete a cumulative written examination and defend one physical model that uses differentiation, integration, approximation, and limiting-case checks.",
    resource: resource(
      "mit-18-01sc-single-variable-calculus",
      "18.01SC: Single Variable Calculus",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/",
      "course",
      ["David Jerison", "MIT Mathematics"],
    ),
  },
  {
    key: "introductory-mechanics-relativity",
    code: "PHYS101",
    slug: "introductory-mechanics-special-relativity",
    title: "Introductory Mechanics and Special Relativity",
    term: 1,
    credits: 4,
    format: "theory",
    summary:
      "Kinematics, Newtonian dynamics, momentum, energy, rotation, oscillation, and the operational foundations of special relativity.",
    primaryOutcome:
      "Translate a physical situation into a predictive mechanics model and test it through conservation, dimensions, limits, and evidence.",
    prerequisiteKeys: [],
    competencyKeys: ["mathematical-modeling", "classical-fields"],
    topics: topics(
      "vectors, frames, kinematics, and estimation",
      "Newton's laws and constrained motion",
      "work, energy, potentials, and stability",
      "momentum, collisions, and center-of-mass evidence",
      "rotation, torque, and angular momentum",
      "oscillation, resonance, and normal-mode intuition",
      "Lorentz transformations, spacetime, and four-momentum",
      "cumulative mechanics and relativity defense",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Analyze a collision from video or simulation, reconcile momentum and energy accounts, and explain the dominant non-ideal effects and uncertainty.",
    finalBrief:
      "Solve and defend a cumulative portfolio spanning constrained motion, rotation, oscillation, conservation, and a relativistic consistency case.",
    safetyNote:
      "Use video, simulation, or low-energy tabletop work. Restrain moving masses and do not improvise high-speed, high-force, elevated, or projectile experiments.",
    resource: resource(
      "mit-8-012-classical-mechanics",
      "8.012: Physics I: Classical Mechanics",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/8-012-physics-i-classical-mechanics-fall-2008/",
      "course",
      ["Robert L. Jaffe"],
    ),
  },
  {
    key: "chemistry-physical-sciences",
    code: "CHEM101",
    slug: "chemistry-for-physical-sciences",
    title: "Chemistry for the Physical Sciences",
    term: 1,
    credits: 4,
    format: "laboratory",
    summary:
      "Atomic structure, bonding, thermochemistry, equilibrium, kinetics, electrochemistry, phases, and structure-property reasoning.",
    primaryOutcome:
      "Use microscopic models and quantitative evidence to explain chemical stability, transformation, and material behavior.",
    prerequisiteKeys: [],
    competencyKeys: ["mathematical-modeling", "quantum-statistical", "experiment-instrumentation"],
    topics: topics(
      "atoms, spectra, orbitals, and periodic structure",
      "bonding, geometry, symmetry, and intermolecular forces",
      "stoichiometry, gases, solutions, and dimensions",
      "calorimetry and thermochemical evidence",
      "entropy, free energy, phases, and equilibrium",
      "reaction kinetics, mechanisms, and rate models",
      "electrochemistry, solids, and material properties",
      "structure-energy-property case defense",
    ),
    assessmentKinds: ["lab", "exam"],
    appliedBrief:
      "Run a household-safe calorimetry study or analyze an equivalent open dataset, calibrate the apparatus model, and propagate measurement uncertainty.",
    finalBrief:
      "Complete a cumulative examination and defend a material or reaction case from electronic structure through thermodynamics, kinetics, and observed properties.",
    safetyNote:
      "Default to simulation, open data, or household-safe materials. Reactive, corrosive, toxic, pressurized, cryogenic, or high-temperature chemistry requires an approved laboratory and qualified supervision.",
    resource: resource(
      "mit-5-111sc-principles-chemical-science",
      "5.111SC: Principles of Chemical Science",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/",
      "course",
      ["Catherine Drennan", "Elizabeth Vogel Taylor"],
    ),
  },
  {
    key: "scientific-programming",
    code: "COMP101",
    slug: "scientific-programming",
    title: "Scientific Programming",
    term: 1,
    credits: 4,
    format: "laboratory",
    summary:
      "Python, numerical arrays, algorithms, visualization, testing, version control, reproducible environments, and scientific notebooks.",
    primaryOutcome:
      "Release a tested and reproducible program that turns a physical model or dataset into auditable numerical evidence.",
    prerequisiteKeys: [],
    competencyKeys: ["computation-data", "research-communication"],
    topics: topics(
      "variables, functions, units, and control flow",
      "arrays, vectors, tables, and visualization",
      "decomposition, algorithms, and complexity intuition",
      "tested simulation of a physical process",
      "root finding, integration, and numerical error",
      "data cleaning, fitting, and residual analysis",
      "version control, environments, and reproducibility",
      "cumulative scientific software release",
    ),
    assessmentKinds: ["project", "portfolio"],
    appliedBrief:
      "Implement and test a parameterized trajectory or decay simulation with units, convergence checks, plots, and a documented fault log.",
    finalBrief:
      "Release and defend a reusable scientific package with tests, provenance, a reproducible environment, validation evidence, and explicit validity limits.",
    resource: resource(
      "mit-6-100l-python",
      "6.100L: Introduction to CS and Programming Using Python",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/6-100l-introduction-to-cs-and-programming-using-python-fall-2022/",
      "course",
      ["Ana Bell"],
    ),
  },
  {
    key: "measurement-experimental-foundations",
    code: "LAB101",
    slug: "measurement-and-experimental-foundations",
    title: "Measurement and Experimental Foundations",
    term: 1,
    credits: 4,
    format: "laboratory",
    summary:
      "Measurement design, calibration, uncertainty, sensors, controlled comparisons, recordkeeping, visualization, and reproducible reports.",
    primaryOutcome:
      "Design a safe low-energy investigation whose data, uncertainty, provenance, and conclusions another learner can independently audit.",
    prerequisiteKeys: [],
    competencyKeys: ["experiment-instrumentation", "computation-data", "research-communication"],
    topics: topics(
      "questions, hypotheses, observables, and operational definitions",
      "units, standards, calibration, and traceability",
      "random and systematic uncertainty",
      "repeatable pendulum measurement and uncertainty budget",
      "sampling, controls, bias, and confounding",
      "sensors, resolution, dynamic range, and noise",
      "lab notebooks, plots, citations, and reproducibility",
      "independent replication package and defense",
    ),
    assessmentKinds: ["lab", "portfolio"],
    appliedBrief:
      "Measure or simulate a pendulum, estimate a parameter with repeated trials, and submit raw data, calibration evidence, code, and a full uncertainty budget.",
    finalBrief:
      "Design and execute a safe replication study, then defend whether the evidence supports the claim and what additional measurement would matter most.",
    safetyNote:
      "Use low-energy, household-safe apparatus or simulation. Complete a hazard check before physical work; do not use mains voltage, lasers, vacuum vessels, pressure systems, radiation sources, or cryogens.",
    resource: resource(
      "mit-8-01x-classical-mechanics-experimental-focus",
      "8.01X: Physics I: Classical Mechanics with an Experimental Focus",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/8-01x-physics-i-classical-mechanics-with-an-experimental-focus-fall-2002/",
      "course",
      ["MIT Physics"],
    ),
  },
  {
    key: "multivariable-vector-calculus",
    code: "MATH201",
    slug: "multivariable-and-vector-calculus",
    title: "Multivariable and Vector Calculus",
    term: 2,
    credits: 4,
    format: "theory",
    summary:
      "Partial derivatives, multiple integrals, vector fields, coordinate systems, and the integral theorems used throughout field physics.",
    primaryOutcome:
      "Represent scalar and vector fields in suitable coordinates and connect their local derivatives to global flux and circulation.",
    prerequisiteKeys: ["calculus-1"],
    competencyKeys: ["mathematical-modeling", "classical-fields"],
    topics: topics(
      "vectors, geometry, coordinate systems, and fields",
      "partial derivatives, gradients, and linearization",
      "constrained extrema and Lagrange multipliers",
      "field reconstruction from directional data",
      "multiple integrals and change of variables",
      "line and surface integrals",
      "divergence, curl, Green, Stokes, and Gauss",
      "cumulative vector-calculus field analysis",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Reconstruct a scalar field from sampled values, compute gradient and flux numerically and analytically, and quantify discretization error.",
    finalBrief:
      "Complete a cumulative examination and defend one field problem using coordinates, differential operators, integral theorems, and limiting cases.",
    resource: resource(
      "mit-18-02sc-multivariable-calculus",
      "18.02SC: Multivariable Calculus",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/",
      "course",
      ["Denis Auroux", "MIT Mathematics"],
    ),
  },
  {
    key: "linear-algebra-differential-equations",
    code: "MATH202",
    slug: "linear-algebra-and-differential-equations",
    title: "Linear Algebra and Differential Equations",
    term: 2,
    credits: 4,
    format: "theory",
    summary:
      "Vector spaces, eigenproblems, linear operators, ordinary differential equations, stability, transforms, and coupled physical systems.",
    primaryOutcome:
      "Reduce coupled linear physical models to interpretable modes and solve or approximate their time evolution with error checks.",
    prerequisiteKeys: ["calculus-1"],
    competencyKeys: ["mathematical-modeling", "computation-data"],
    topics: topics(
      "linear systems, matrices, elimination, and conditioning",
      "vector spaces, bases, rank, and orthogonality",
      "eigenvalues, eigenvectors, and normal modes",
      "coupled-oscillator modal analysis",
      "first-order ordinary differential equations",
      "linear systems, phase portraits, and stability",
      "Laplace transforms, forcing, resonance, and Green functions",
      "cumulative operator-and-evolution defense",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Construct a coupled-oscillator matrix, infer its modes, compare analytic and numerical trajectories, and explain sensitivity to parameters and conditioning.",
    finalBrief:
      "Solve and defend a cumulative portfolio spanning linear systems, eigenproblems, differential equations, forcing, stability, and numerical verification.",
    resource: resource(
      "mit-18-03sc-differential-equations",
      "18.03SC: Differential Equations",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/",
      "course",
      ["Haynes Miller", "Arthur Mattuck", "MIT Mathematics"],
    ),
  },
  {
    key: "electricity-magnetism-circuits",
    code: "PHYS201",
    slug: "electricity-magnetism-and-circuits",
    title: "Electricity, Magnetism, and Circuits",
    term: 2,
    credits: 4,
    format: "laboratory",
    summary:
      "Charge, electric and magnetic fields, potential, induction, Maxwell concepts, DC/AC circuits, and safe bench measurement.",
    primaryOutcome:
      "Predict field and circuit behavior, obtain safe measurements or simulations, and reconcile evidence with conservation and uncertainty.",
    prerequisiteKeys: ["calculus-1", "introductory-mechanics-relativity"],
    competencyKeys: ["classical-fields", "experiment-instrumentation", "mathematical-modeling"],
    topics: topics(
      "charge, Coulomb interaction, and electric fields",
      "Gauss's law, potential, energy, and capacitance",
      "current, resistance, Kirchhoff laws, and instruments",
      "low-voltage RC circuit calibration study",
      "magnetic fields, forces, and moments",
      "Faraday induction, inductance, and energy",
      "AC response, resonance, and Maxwell synthesis",
      "cumulative field-and-circuit investigation",
    ),
    assessmentKinds: ["lab", "exam"],
    appliedBrief:
      "Build only a current-limited low-voltage RC circuit or use a simulator, estimate its time constant, and reconcile component tolerance and instrument loading.",
    finalBrief:
      "Complete a cumulative examination and defend a reproducible field-and-circuit investigation with schematics, raw evidence, uncertainty, and safety controls.",
    safetyNote:
      "Use battery-powered, current-limited circuits or simulation. Never work on mains, exposed high voltage, large capacitors, strong magnets, or improvised RF transmitters without qualified supervision.",
    resource: resource(
      "mit-8-02x-electricity-magnetism-experimental-focus",
      "8.02X: Physics II: Electricity and Magnetism with an Experimental Focus",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/8-02x-physics-ii-electricity-magnetism-with-an-experimental-focus-spring-2005/",
      "course",
      ["MIT Physics"],
    ),
  },
  {
    key: "waves-oscillations-optics",
    code: "PHYS202",
    slug: "waves-oscillations-and-optics",
    title: "Waves, Oscillations, and Optics",
    term: 2,
    credits: 4,
    format: "laboratory",
    summary:
      "Coupled oscillators, wave equations, Fourier modes, interference, diffraction, polarization, imaging, and optical measurement.",
    primaryOutcome:
      "Model wave propagation and optical systems in time, frequency, and spatial domains, then test predictions safely.",
    prerequisiteKeys: ["calculus-1", "introductory-mechanics-relativity"],
    competencyKeys: ["classical-fields", "experiment-instrumentation", "mathematical-modeling"],
    topics: topics(
      "simple and damped harmonic motion",
      "coupled oscillators, normal modes, and resonance",
      "wave equations, traveling waves, and energy transport",
      "standing-wave spectrum and dispersion study",
      "Fourier superposition, packets, and coherence",
      "geometric optics, lenses, and imaging",
      "interference, diffraction, and polarization",
      "cumulative wave-and-optics experiment",
    ),
    assessmentKinds: ["lab", "exam"],
    appliedBrief:
      "Measure or simulate a standing-wave spectrum, fit a dispersion model, and distinguish resolution, systematic bias, and random uncertainty.",
    finalBrief:
      "Complete a cumulative examination and defend a wave or imaging experiment from governing equation through calibration, Fourier interpretation, and residuals.",
    safetyNote:
      "Prefer simulations, LEDs, or certified low-power educational sources. Never view a laser beam directly or through optics; higher-class lasers require controlled space, eyewear selection, and a trained supervisor.",
    resource: resource(
      "mit-8-03sc-physics-vibrations-waves",
      "8.03SC: Physics III: Vibrations and Waves",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/8-03sc-physics-iii-vibrations-and-waves-fall-2016/",
      "course",
      ["Hung Cheng", "MIT Physics"],
    ),
  },
  {
    key: "probability-data-experimental-methods",
    code: "DATA201",
    slug: "probability-data-and-experimental-methods",
    title: "Probability, Data, and Experimental Methods",
    term: 2,
    credits: 4,
    format: "laboratory",
    summary:
      "Probability models, sampling, estimation, uncertainty propagation, regression, hypothesis tests, experiment design, and reproducible inference.",
    primaryOutcome:
      "Turn a physical question and noisy evidence into a calibrated inference whose assumptions and failure modes are explicit.",
    prerequisiteKeys: ["calculus-1", "scientific-programming", "measurement-experimental-foundations"],
    competencyKeys: ["computation-data", "experiment-instrumentation", "research-communication"],
    topics: topics(
      "probability rules, conditional reasoning, and simulation",
      "discrete and continuous distributions",
      "expectation, variance, covariance, and propagation",
      "calibrated parameter estimate from noisy data",
      "sampling, estimators, confidence intervals, and coverage",
      "regression, residuals, model comparison, and diagnostics",
      "hypothesis tests, power, multiple testing, and bias",
      "preregistered experiment and reproducible inference report",
    ),
    assessmentKinds: ["lab", "project"],
    appliedBrief:
      "Estimate a physical parameter from blinded noisy measurements, validate interval coverage by simulation, and document every exclusion and transformation.",
    finalBrief:
      "Preregister, execute, and defend a controlled investigation or open-data reanalysis with power reasoning, diagnostics, uncertainty, provenance, and a replication package.",
    resource: resource(
      "mit-18-05-probability-statistics",
      "18.05: Introduction to Probability and Statistics",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/",
      "course",
      ["Jeremy Orloff", "Jonathan Bloom"],
    ),
  },
  {
    key: "analytical-mechanics-1",
    code: "PHYS301",
    slug: "analytical-mechanics-1",
    title: "Analytical Mechanics I",
    term: 3,
    credits: 4,
    format: "theory",
    summary:
      "Generalized coordinates, variational principles, Lagrangian dynamics, central forces, rigid bodies, oscillations, and continuous systems.",
    primaryOutcome:
      "Choose coordinates and symmetries that turn constrained classical systems into tractable equations and conserved quantities.",
    prerequisiteKeys: [
      "introductory-mechanics-relativity",
      "multivariable-vector-calculus",
      "linear-algebra-differential-equations",
    ],
    competencyKeys: ["mathematical-modeling", "classical-fields"],
    topics: topics(
      "generalized coordinates, constraints, and virtual work",
      "action, variational calculus, and Euler-Lagrange equations",
      "symmetries, Noether reasoning, and conserved quantities",
      "double-pendulum model and validation",
      "central-force motion, effective potentials, and scattering",
      "rigid-body kinematics, inertia, and Euler equations",
      "small oscillations, modes, and continuous limits",
      "cumulative variational-mechanics defense",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Derive a double-pendulum or coupled-rotor model from an action, integrate it numerically, and explain conservation drift and coordinate singularities.",
    finalBrief:
      "Complete a cumulative examination and defend one constrained-system derivation from coordinate choice through symmetry, dynamics, validation, and limits.",
    resource: resource(
      "mit-8-223-classical-mechanics-ii",
      "8.223: Classical Mechanics II",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/8-223-classical-mechanics-ii-january-iap-2017/",
      "course",
      ["Iain Stewart"],
    ),
  },
  {
    key: "electromagnetic-theory-1",
    code: "PHYS302",
    slug: "electromagnetic-theory-1",
    title: "Electromagnetic Theory I",
    term: 3,
    credits: 4,
    format: "theory",
    summary:
      "Electrostatics, boundary-value problems, dielectric and magnetic media, Maxwell equations, energy, momentum, and quasistatic fields.",
    primaryOutcome:
      "Solve field problems using symmetry, potentials, boundary conditions, and independent analytic or numerical checks.",
    prerequisiteKeys: [
      "multivariable-vector-calculus",
      "linear-algebra-differential-equations",
      "electricity-magnetism-circuits",
    ],
    competencyKeys: ["classical-fields", "mathematical-modeling"],
    topics: topics(
      "electrostatic fields, distributions, and uniqueness",
      "Poisson and Laplace equations with boundary conditions",
      "images, separation of variables, and multipoles",
      "electrostatic boundary-value solver and benchmark",
      "dielectrics, polarization, energy, and stress",
      "magnetostatics, vector potential, and multipoles",
      "magnetic media, induction, and Maxwell equations",
      "cumulative electromagnetic boundary-value defense",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Solve a nontrivial conductor or dielectric boundary-value problem analytically and numerically, then compare convergence, energy, and boundary residuals.",
    finalBrief:
      "Complete a cumulative examination and defend a field solution using source models, boundary conditions, uniqueness, energy, and asymptotic checks.",
    resource: resource(
      "mit-8-07-electromagnetism-2",
      "8.07: Electromagnetism II",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/8-07-electromagnetism-ii-fall-2012/",
      "course",
      ["Robert L. Jaffe"],
    ),
  },
  {
    key: "quantum-mechanics-1",
    code: "PHYS303",
    slug: "quantum-mechanics-1",
    title: "Quantum Mechanics I",
    term: 3,
    credits: 4,
    format: "theory",
    summary:
      "Wavefunctions, probability amplitudes, operators, measurement, one-dimensional systems, tunneling, harmonic oscillators, and quantum dynamics.",
    primaryOutcome:
      "Predict measurement statistics and time evolution from a normalized state while separating physical claims from representation choices.",
    prerequisiteKeys: [
      "linear-algebra-differential-equations",
      "waves-oscillations-optics",
      "chemistry-physical-sciences",
    ],
    competencyKeys: ["quantum-statistical", "mathematical-modeling"],
    topics: topics(
      "experiments, states, amplitudes, and Born probabilities",
      "Hilbert spaces, operators, eigenstates, and observables",
      "Schrodinger evolution, continuity, and stationary states",
      "finite-well spectrum and tunneling computation",
      "harmonic oscillator and ladder operators",
      "uncertainty, commutators, and compatible observables",
      "wave packets, propagators, and measurement updates",
      "cumulative one-dimensional quantum defense",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Compute bound and scattering states for a finite potential, verify normalization and current conservation, and map tunneling sensitivity to parameters.",
    finalBrief:
      "Complete a cumulative examination and defend one quantum prediction from state preparation through evolution, observable statistics, limits, and numerical checks.",
    resource: resource(
      "mit-8-04-quantum-physics-1",
      "8.04: Quantum Physics I",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/8-04-quantum-physics-i-spring-2016/",
      "course",
      ["Barton Zwiebach"],
    ),
  },
  {
    key: "thermal-physics",
    code: "PHYS304",
    slug: "thermal-physics",
    title: "Thermal Physics",
    term: 3,
    credits: 4,
    format: "laboratory",
    summary:
      "Temperature, equations of state, the laws of thermodynamics, entropy, engines, phase equilibrium, response functions, and transport intuition.",
    primaryOutcome:
      "Construct thermodynamic state and process models, calculate performance, and test consistency with entropy and uncertainty.",
    prerequisiteKeys: [
      "multivariable-vector-calculus",
      "probability-data-experimental-methods",
      "chemistry-physical-sciences",
    ],
    competencyKeys: ["quantum-statistical", "mathematical-modeling", "experiment-instrumentation"],
    topics: topics(
      "temperature, equilibrium, equations of state, and scales",
      "work, heat, internal energy, and the first law",
      "entropy, reversibility, and the second law",
      "heat-capacity experiment and loss model",
      "thermodynamic potentials and Maxwell relations",
      "engines, refrigerators, exergy, and efficiency",
      "phase equilibrium, stability, and response functions",
      "cumulative thermodynamic-cycle defense",
    ),
    assessmentKinds: ["lab", "exam"],
    appliedBrief:
      "Measure a safe thermal transient or analyze open data, infer heat capacity and loss parameters, and reconcile energy and entropy accounts with uncertainty.",
    finalBrief:
      "Complete a cumulative examination and defend a real or simulated thermal cycle with state diagrams, efficiency bounds, irreversibility, and sensitivity.",
    safetyNote:
      "Prefer simulation or mild-temperature household-safe work. Flames, pressure vessels, refrigerants, cryogens, vacuum apparatus, and exposed hot surfaces require approved facilities and trained supervision.",
    resource: resource(
      "mit-8-044-statistical-physics-1",
      "8.044: Statistical Physics I",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/8-044-statistical-physics-i-spring-2013/",
      "course",
      ["Mehran Kardar"],
    ),
  },
  {
    key: "mathematical-methods-physics",
    code: "MATH303",
    slug: "mathematical-methods-for-physics",
    title: "Mathematical Methods for Physics",
    term: 3,
    credits: 4,
    format: "theory",
    summary:
      "Complex variables, Fourier and Laplace analysis, partial differential equations, Green functions, special functions, tensors, and asymptotics.",
    primaryOutcome:
      "Select and justify a mathematical representation that exposes the structure, solvability, and approximation error of a physics problem.",
    prerequisiteKeys: [
      "multivariable-vector-calculus",
      "linear-algebra-differential-equations",
      "scientific-programming",
    ],
    competencyKeys: ["mathematical-modeling", "computation-data"],
    topics: topics(
      "complex numbers, analytic functions, and contour integration",
      "Fourier series, transforms, spectra, and distributions",
      "partial differential equations and classification",
      "boundary-value solution by spectral expansion",
      "Green functions, impulses, and response operators",
      "special functions, orthogonality, and Sturm-Liouville theory",
      "tensors, scaling, perturbation, and asymptotics",
      "cumulative mathematical-method selection defense",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Solve a heat, wave, or potential boundary-value problem by spectral expansion and computation, then quantify truncation and boundary residuals.",
    finalBrief:
      "Complete a cumulative examination and defend why a chosen transform, Green function, special-function basis, or asymptotic method fits a new physical problem.",
    resource: resource(
      "nptel-selected-topics-mathematical-physics",
      "Selected Topics in Mathematical Physics",
      "NPTEL / IIT Madras",
      "https://nptel.ac.in/courses/115106086",
      "course",
      ["V. Balakrishnan"],
    ),
  },
  {
    key: "advanced-classical-nonlinear-dynamics",
    code: "PHYS401",
    slug: "advanced-classical-and-nonlinear-dynamics",
    title: "Advanced Classical and Nonlinear Dynamics",
    term: 4,
    credits: 4,
    format: "theory",
    summary:
      "Hamiltonian mechanics, canonical transformations, action-angle variables, perturbation theory, nonlinear maps, chaos, and continuum modes.",
    primaryOutcome:
      "Analyze integrable and nonlinear dynamical systems using phase-space geometry, invariants, perturbation, and computational evidence.",
    prerequisiteKeys: ["analytical-mechanics-1", "mathematical-methods-physics"],
    competencyKeys: ["mathematical-modeling", "classical-fields", "computation-data"],
    topics: topics(
      "Hamiltonian formulation and phase-space flow",
      "Poisson brackets, canonical transformations, and generators",
      "Hamilton-Jacobi theory and action-angle variables",
      "nonlinear pendulum phase portrait and separatrix study",
      "perturbation, resonance, and adiabatic invariants",
      "nonlinear maps, Lyapunov exponents, and chaos",
      "continuum limits, fields, and normal modes",
      "cumulative nonlinear-dynamics portfolio defense",
    ),
    assessmentKinds: ["project", "exam"],
    appliedBrief:
      "Map a nonlinear pendulum or driven oscillator across parameter space, identify fixed points and separatrices, and estimate a Lyapunov exponent with convergence checks.",
    finalBrief:
      "Complete a cumulative examination and defend a computational phase-space study that distinguishes integrable, perturbed, resonant, and chaotic behavior.",
    resource: resource(
      "mit-8-09-classical-mechanics-3",
      "8.09: Classical Mechanics III",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/8-09-classical-mechanics-iii-fall-2014/",
      "course",
      ["Hong Liu"],
    ),
  },
  {
    key: "electrodynamics-radiation",
    code: "PHYS402",
    slug: "electrodynamics-and-radiation",
    title: "Electrodynamics and Radiation",
    term: 4,
    credits: 4,
    format: "theory",
    summary:
      "Time-dependent Maxwell fields, electromagnetic waves, waveguides, radiation, relativistic covariance, scattering, and field energy-momentum.",
    primaryOutcome:
      "Derive and test predictions for propagating and radiating electromagnetic fields with causal, energetic, and asymptotic checks.",
    prerequisiteKeys: ["electromagnetic-theory-1", "mathematical-methods-physics"],
    competencyKeys: ["classical-fields", "mathematical-modeling"],
    topics: topics(
      "Maxwell equations, potentials, gauge freedom, and causality",
      "electromagnetic waves, polarization, and interfaces",
      "waveguides, cavities, dispersion, and modes",
      "numerical waveguide or antenna-field benchmark",
      "retarded potentials and multipole radiation",
      "radiation reaction, scattering, and optical theorem intuition",
      "covariant electrodynamics and stress-energy",
      "cumulative radiation-field defense",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Compute a waveguide mode or dipole radiation field, verify boundary conditions and power balance, and benchmark an asymptotic regime.",
    finalBrief:
      "Complete a cumulative examination and defend a time-dependent field solution from sources and gauge through propagation, radiation, energy, and limiting behavior.",
    safetyNote:
      "Use analytic work and simulation. Do not construct high-voltage, microwave, RF-transmitting, pulsed-power, or ionizing-radiation apparatus without licensed facilities and qualified oversight.",
    resource: resource(
      "mit-8-311-electromagnetic-theory",
      "8.311: Electromagnetic Theory",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/8-311-electromagnetic-theory-spring-2004/",
      "course",
      ["MIT Physics"],
    ),
  },
  {
    key: "quantum-mechanics-2",
    code: "PHYS403",
    slug: "quantum-mechanics-2",
    title: "Quantum Mechanics II",
    term: 4,
    credits: 4,
    format: "theory",
    summary:
      "Angular momentum, spin, identical particles, approximation methods, scattering, mixed states, entanglement, and quantum dynamics.",
    primaryOutcome:
      "Construct and test quantum predictions for composite, approximate, and scattering systems using symmetry and controlled error.",
    prerequisiteKeys: ["quantum-mechanics-1", "mathematical-methods-physics"],
    competencyKeys: ["quantum-statistical", "mathematical-modeling"],
    topics: topics(
      "rotations, angular momentum, and addition rules",
      "spin, Stern-Gerlach measurements, and two-level dynamics",
      "central potentials, hydrogen, and symmetry",
      "variational estimate and perturbative benchmark",
      "identical particles, exchange, and many-body foundations",
      "time-dependent perturbation and transition rates",
      "scattering, density matrices, and entanglement",
      "cumulative advanced-quantum defense",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Estimate an interacting or anharmonic system by variational and perturbative methods, then benchmark both against numerical diagonalization.",
    finalBrief:
      "Complete a cumulative examination and defend a composite-system or scattering prediction using symmetry, approximation control, measurement statistics, and limiting cases.",
    resource: resource(
      "mit-8-05-quantum-physics-2",
      "8.05: Quantum Physics II",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/8-05-quantum-physics-ii-fall-2013/",
      "course",
      ["Barton Zwiebach"],
    ),
  },
  {
    key: "statistical-mechanics",
    code: "PHYS404",
    slug: "statistical-mechanics",
    title: "Statistical Mechanics",
    term: 4,
    credits: 4,
    format: "theory",
    summary:
      "Microstates, ensembles, partition functions, quantum statistics, phase transitions, fluctuations, transport, and nonequilibrium reasoning.",
    primaryOutcome:
      "Derive macroscopic behavior from explicit microscopic assumptions and test ensemble, thermodynamic-limit, and fluctuation claims.",
    prerequisiteKeys: [
      "thermal-physics",
      "quantum-mechanics-1",
      "probability-data-experimental-methods",
    ],
    competencyKeys: ["quantum-statistical", "mathematical-modeling", "computation-data"],
    topics: topics(
      "microstates, entropy, multiplicity, and information",
      "microcanonical, canonical, and grand ensembles",
      "partition functions and thermodynamic observables",
      "Monte Carlo test of an interacting spin model",
      "classical gases and quantum ideal gases",
      "phase transitions, symmetry breaking, and criticality",
      "fluctuations, response, transport, and irreversibility",
      "cumulative microscopic-to-macroscopic defense",
    ),
    assessmentKinds: ["project", "exam"],
    appliedBrief:
      "Implement a Monte Carlo spin or lattice-gas model, demonstrate equilibration and finite-size effects, and compare measured observables with theory.",
    finalBrief:
      "Complete a cumulative examination and defend one emergence claim from microstate model through ensemble, partition function, fluctuations, and thermodynamic limit.",
    resource: resource(
      "mit-8-333-statistical-mechanics-1",
      "8.333: Statistical Mechanics I",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/8-333-statistical-mechanics-i-statistical-mechanics-of-particles-fall-2013/",
      "course",
      ["Mehran Kardar"],
    ),
  },
  {
    key: "computational-physics",
    code: "COMP401",
    slug: "computational-physics",
    title: "Computational Physics",
    term: 4,
    credits: 4,
    format: "laboratory",
    summary:
      "Numerical linear algebra, differential equations, spectral methods, Monte Carlo, optimization, inverse problems, verification, and reproducible performance.",
    primaryOutcome:
      "Choose, implement, verify, and communicate a numerical method whose error and computational cost fit a physical question.",
    prerequisiteKeys: [
      "mathematical-methods-physics",
      "probability-data-experimental-methods",
      "scientific-programming",
    ],
    competencyKeys: ["computation-data", "mathematical-modeling", "research-communication"],
    topics: topics(
      "floating-point arithmetic, conditioning, and stability",
      "linear algebra, sparse systems, and eigenproblems",
      "ordinary differential equations and structure preservation",
      "verified orbital or quantum time-evolution solver",
      "partial differential equations and spectral methods",
      "Monte Carlo, stochastic processes, and uncertainty",
      "optimization, inverse problems, profiling, and reproducibility",
      "cumulative computational-physics release",
    ),
    assessmentKinds: ["project", "portfolio"],
    appliedBrief:
      "Implement two solvers for an orbital, wave, diffusion, or quantum evolution problem and document convergence, invariant drift, cost, and failure cases.",
    finalBrief:
      "Release and defend a reproducible computational investigation with analytic benchmarks, independent checks, uncertainty, provenance, tests, and performance evidence.",
    resource: resource(
      "mit-22-15-essential-numerical-methods",
      "22.15: Essential Numerical Methods",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/22-15-essential-numerical-methods-fall-2014/",
      "course",
      ["Kord Smith"],
    ),
  },
  {
    key: "advanced-experimental-physics-1",
    code: "LAB501",
    slug: "advanced-experimental-physics-1-electronics-optics",
    title: "Advanced Experimental Physics I: Electronics and Optics",
    term: 5,
    credits: 4,
    format: "laboratory",
    summary:
      "Analog and digital instrumentation, noise, feedback, modulation, optical systems, imaging, acquisition, calibration, and open-ended experiment design.",
    primaryOutcome:
      "Design and validate a safe instrument chain whose bandwidth, noise, calibration, uncertainty, and reproducibility support a physics claim.",
    prerequisiteKeys: [
      "electricity-magnetism-circuits",
      "waves-oscillations-optics",
      "probability-data-experimental-methods",
      "computational-physics",
    ],
    competencyKeys: ["experiment-instrumentation", "computation-data", "research-communication"],
    topics: topics(
      "instrument architecture, requirements, and calibration plans",
      "amplifiers, impedance, feedback, and loading",
      "noise sources, spectra, filtering, and shielding",
      "low-voltage sensor and amplifier characterization",
      "sampling, aliasing, triggering, and data acquisition",
      "modulation, phase-sensitive detection, and control",
      "optical trains, detectors, imaging, and aberrations",
      "independent instrument-and-measurement defense",
    ),
    assessmentKinds: ["lab", "oral"],
    appliedBrief:
      "Characterize a simulated or current-limited low-voltage sensor-amplifier chain, measuring gain, bandwidth, noise, loading, and calibration uncertainty.",
    finalBrief:
      "Deliver and orally defend an open-ended optical or electronic measurement with requirements, hazard review, schematics, calibration, raw data, analysis code, and replication protocol.",
    safetyNote:
      "Simulation, remote instrumentation, and low-voltage kits are valid. Mains voltage, high voltage, higher-class lasers, exposed intense light, strong magnets, vacuum, pressure, cryogens, and wet-lab work require approved facilities and qualified supervision.",
    resource: resource(
      "mit-20-309-instrumentation-measurement",
      "20.309: Biological Engineering II: Instrumentation and Measurement",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/20-309-biological-engineering-ii-instrumentation-and-measurement-fall-2006/",
      "course",
      ["Sebastian Seung", "Peter So"],
    ),
  },
  {
    key: "relativity-gravitation",
    code: "PHYS501",
    slug: "relativity-and-gravitation",
    title: "Relativity and Gravitation",
    term: 5,
    credits: 4,
    format: "theory",
    summary:
      "Relativistic mechanics and fields, spacetime geometry, equivalence, curvature, Einstein equations, black holes, and observational tests.",
    primaryOutcome:
      "Use invariant spacetime reasoning to calculate relativistic and gravitational effects and connect them to measurable observables.",
    prerequisiteKeys: [
      "analytical-mechanics-1",
      "advanced-classical-nonlinear-dynamics",
      "electrodynamics-radiation",
    ],
    competencyKeys: ["mathematical-modeling", "classical-fields"],
    topics: topics(
      "spacetime intervals, Lorentz symmetry, and four-vectors",
      "relativistic dynamics, fields, and stress-energy",
      "equivalence principle, metrics, and geodesics",
      "orbital precession and gravitational-time model",
      "connections, curvature, and geodesic deviation",
      "Einstein equations and weak-field gravity",
      "Schwarzschild spacetime, horizons, and observational tests",
      "cumulative relativity-and-gravity defense",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Model a satellite-clock correction, orbital precession, or light-deflection observable, and separate coordinate choices from invariant predictions.",
    finalBrief:
      "Complete a cumulative examination and defend a spacetime model from symmetry and metric through geodesics, field equations, observables, and approximation limits.",
    resource: resource(
      "mit-8-033-relativity",
      "8.033: Relativity",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/8-033-relativity-fall-2006/",
      "course",
      ["Scott A. Hughes"],
    ),
  },
  {
    key: "condensed-matter-amo-foundations",
    code: "PHYS502",
    slug: "condensed-matter-and-amo-foundations",
    title: "Condensed Matter and AMO Foundations",
    term: 5,
    credits: 4,
    format: "theory",
    summary:
      "Crystals, reciprocal space, bands, semiconductors, magnetism, dielectric response, atoms, light-matter interaction, spectroscopy, and collective behavior.",
    primaryOutcome:
      "Connect microscopic quantum structure and symmetry to measurable electronic, optical, magnetic, and atomic behavior.",
    prerequisiteKeys: ["quantum-mechanics-2", "statistical-mechanics", "electrodynamics-radiation"],
    competencyKeys: ["quantum-statistical", "classical-fields", "mathematical-modeling"],
    topics: topics(
      "crystal symmetry, lattices, reciprocal space, and diffraction",
      "free electrons, Bloch states, bands, and Fermi surfaces",
      "semiconductors, carriers, junctions, and transport",
      "band-structure and optical-response case study",
      "dielectric response, phonons, magnetism, and collective modes",
      "atomic structure, selection rules, and spectroscopy",
      "light-matter interaction, line shapes, and coherent control",
      "cumulative structure-to-observable defense",
    ),
    assessmentKinds: ["project", "exam"],
    appliedBrief:
      "Infer a simple band or level model from open spectral or transport data and test its predictions against temperature, polarization, or composition.",
    finalBrief:
      "Complete a cumulative examination and defend a material or atomic observable from symmetry and quantum states through response, experiment, and model limitations.",
    safetyNote:
      "Use simulation and published spectra or transport data. Lasers, cryogens, high magnetic fields, vacuum, deposition, x-rays, and reactive materials require certified facilities and trained supervision.",
    resource: resource(
      "mit-3-024-material-properties",
      "3.024: Electronic, Optical and Magnetic Properties of Materials",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/3-024-electronic-optical-and-magnetic-properties-of-materials-spring-2013/",
      "course",
      ["Polina Anikeeva"],
    ),
  },
  {
    key: "research-methods-proposal",
    code: "RES501",
    slug: "research-methods-scientific-communication-proposal",
    title: "Research Methods, Scientific Communication, and Proposal",
    term: 5,
    credits: 4,
    format: "seminar",
    summary:
      "Literature search, question formation, reproducibility, research design, ethics, project planning, scientific writing, peer review, and proposal defense.",
    primaryOutcome:
      "Produce a feasible, ethical, evidence-grounded research proposal with explicit methods, risks, resources, milestones, and falsifiable success criteria.",
    prerequisiteKeys: [
      "probability-data-experimental-methods",
      "computational-physics",
      "quantum-mechanics-2",
    ],
    competencyKeys: ["research-communication", "professional-practice", "computation-data"],
    topics: topics(
      "research questions, novelty, feasibility, and scope",
      "literature search, source evaluation, citation, and synthesis",
      "reproducibility, preregistration, provenance, and open workflows",
      "critical replication or pilot-study protocol",
      "methods, controls, power, validation, and decision rules",
      "research ethics, safety, dual use, and responsible conduct",
      "planning, resources, milestones, budgets, and contingencies",
      "written proposal and oral review defense",
    ),
    assessmentKinds: ["project", "presentation"],
    appliedBrief:
      "Write and preregister a replication or pilot protocol that includes a literature map, methods, uncertainty, data plan, hazards, resources, and stop criteria.",
    finalBrief:
      "Submit and publicly defend a thesis proposal with a falsifiable question, evidence synthesis, executable method, validation plan, schedule, ethics, risks, and fallback scope.",
    resource: resource(
      "mit-22-tht-undergraduate-thesis-tutorial",
      "22.THT: Undergraduate Thesis Tutorial",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/22-tht-undergraduate-thesis-tutorial-fall-2015/",
      "course",
      ["Michael Short"],
    ),
  },
  {
    key: "astrophysics",
    code: "ASTRO501",
    slug: "astrophysics-stars-galaxies-high-energy-universe",
    title: "Astrophysics: Stars, Galaxies, and the High-Energy Universe",
    term: 5,
    credits: 4,
    format: "theory",
    summary:
      "Radiation, spectra, stellar structure and evolution, compact objects, interstellar media, galaxies, distance scales, and survey inference.",
    primaryOutcome:
      "Infer physical properties of astronomical systems from photons, dynamics, population models, and uncertainty-aware public data.",
    prerequisiteKeys: [
      "analytical-mechanics-1",
      "thermal-physics",
      "electrodynamics-radiation",
      "statistical-mechanics",
    ],
    competencyKeys: ["classical-fields", "quantum-statistical", "computation-data"],
    concentrationKey: "astrophysics-gravitation",
    topics: topics(
      "astronomical coordinates, flux, luminosity, magnitudes, and distance",
      "radiation processes, spectra, telescopes, and selection effects",
      "hydrostatic equilibrium, stellar structure, and energy generation",
      "color-magnitude diagram and cluster-age inference",
      "stellar evolution, remnants, and compact objects",
      "interstellar media, star formation, and chemical evolution",
      "galaxy dynamics, dark matter evidence, and active nuclei",
      "cumulative astrophysical-inference defense",
    ),
    assessmentKinds: ["project", "exam"],
    appliedBrief:
      "Use an open star-cluster catalog to build a color-magnitude diagram, infer distance and age, and audit extinction, completeness, and model degeneracy.",
    finalBrief:
      "Complete a cumulative examination and defend an evidence chain from detected radiation or dynamics to a stellar, galactic, or compact-object claim.",
    safetyNote:
      "Use public astronomical data or remote observatories. Never observe the Sun without purpose-built certified solar equipment and experienced supervision.",
    resource: resource(
      "openstax-astronomy-2e",
      "Astronomy 2e",
      "OpenStax",
      "https://openstax.org/books/astronomy-2e/pages/1-introduction",
      "textbook",
      ["Andrew Fraknoi", "David Morrison", "Sidney C. Wolff"],
    ),
  },
  {
    key: "quantum-information-amo",
    code: "QSCI501",
    slug: "quantum-information-and-amo",
    title: "Quantum Information and AMO",
    term: 5,
    credits: 4,
    format: "theory",
    summary:
      "Qubits, composite states, circuits, entanglement, channels, measurement, information tasks, atomic control, and realistic noise.",
    primaryOutcome:
      "Model a quantum information protocol from state preparation through operations, measurement, noise, and verifiable classical evidence.",
    prerequisiteKeys: ["quantum-mechanics-2", "electrodynamics-radiation", "statistical-mechanics"],
    competencyKeys: ["quantum-statistical", "computation-data", "mathematical-modeling"],
    concentrationKey: "quantum-science-materials",
    topics: topics(
      "qubits, Bloch sphere, gates, and measurement",
      "tensor products, entanglement, and reduced states",
      "circuits, universality, simulation, and resource accounting",
      "noisy teleportation or interference protocol benchmark",
      "mixed states, channels, decoherence, and process descriptions",
      "information, distinguishability, entropy, and coding intuition",
      "atomic control, spectroscopy, and experimental architectures",
      "cumulative quantum-protocol defense",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Simulate an entanglement or teleportation protocol under at least two noise channels and validate its statistics against analytic limits.",
    finalBrief:
      "Design and orally defend a small quantum experiment or protocol, including state preparation, controls, measurement, noise model, resource costs, and falsifiable tests.",
    safetyNote:
      "Use simulators or cloud-access systems. Lasers, high voltage, vacuum, cryogens, trapped ions, strong fields, and microwave systems require certified facilities and specialist supervision.",
    resource: resource(
      "mit-8-370x-quantum-information-science-1",
      "8.370x: Quantum Information Science I",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/8-370x-quantum-information-science-i-spring-2018/",
      "course",
      ["Peter Shor", "Isaac Chuang"],
    ),
  },
  {
    key: "nuclear-radiation-detectors",
    code: "NUC501",
    slug: "nuclear-physics-radiation-and-detectors",
    title: "Nuclear Physics, Radiation, and Detectors",
    term: 5,
    credits: 4,
    format: "laboratory",
    summary:
      "Nuclear structure, decay, reactions, radiation-matter interaction, detector physics, counting statistics, dosimetry, shielding, and safety culture.",
    primaryOutcome:
      "Interpret nuclear and detector data quantitatively while applying conservative radiation-protection and uncertainty principles.",
    prerequisiteKeys: [
      "quantum-mechanics-2",
      "statistical-mechanics",
      "probability-data-experimental-methods",
    ],
    competencyKeys: ["quantum-statistical", "experiment-instrumentation", "professional-practice"],
    concentrationKey: "particle-nuclear-physics",
    topics: topics(
      "nuclear size, binding, liquid-drop and shell models",
      "radioactive decay, chains, activity, and age inference",
      "radiation interaction, stopping, attenuation, and shielding",
      "open gamma-spectrum calibration and isotope identification",
      "gas, scintillation, semiconductor, and calorimetric detectors",
      "counting statistics, backgrounds, efficiency, and dead time",
      "reactions, fission, fusion, dosimetry, and protection",
      "cumulative detector-data and safety defense",
    ),
    assessmentKinds: ["lab", "oral"],
    appliedBrief:
      "Analyze a published detector spectrum, calibrate energy and efficiency, subtract background, identify peaks, and quantify detection limits and ambiguity.",
    finalBrief:
      "Defend a detector-and-shielding analysis using open data or simulation, including physics, calibration, uncertainty, dose assumptions, ethics, and safety controls.",
    safetyNote:
      "Use simulations and public detector datasets only unless working in a licensed radiation facility. Never acquire, handle, transport, concentrate, or irradiate radioactive material independently.",
    resource: resource(
      "mit-22-01-nuclear-engineering-ionizing-radiation",
      "22.01: Introduction to Nuclear Engineering and Ionizing Radiation",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/22-01-introduction-to-nuclear-engineering-and-ionizing-radiation-fall-2016/",
      "course",
      ["Michael Short"],
    ),
  },
  {
    key: "advanced-experimental-physics-2",
    code: "LAB601",
    slug: "advanced-experimental-physics-2-independent-investigation",
    title: "Advanced Experimental Physics II: Independent Investigation",
    term: 6,
    credits: 4,
    format: "laboratory",
    summary:
      "Open-ended measurement, instrument commissioning, systematic-error hunts, blind analysis, replication, collaboration, and publication-grade reporting.",
    primaryOutcome:
      "Execute or reproduce a substantial experiment whose claims survive independent checks of apparatus, calibration, analysis, uncertainty, and provenance.",
    prerequisiteKeys: ["advanced-experimental-physics-1", "research-methods-proposal"],
    competencyKeys: ["experiment-instrumentation", "research-communication", "professional-practice"],
    topics: topics(
      "measurement requirements, collaboration roles, and readiness review",
      "apparatus models, commissioning, calibration, and traceability",
      "noise budgets, drift, backgrounds, and systematic-error hunts",
      "blind pilot run and independent analysis cross-check",
      "automation, data quality, metadata, and provenance",
      "uncertainty synthesis, robustness, and adversarial tests",
      "replication, discrepancy resolution, and technical writing",
      "publication package and oral experiment defense",
    ),
    assessmentKinds: ["lab", "oral"],
    appliedBrief:
      "Commission a simulated, remote, or supervised apparatus through a blind pilot, then pass a readiness review covering calibration, hazards, data quality, and independent analysis.",
    finalBrief:
      "Submit and orally defend a publication-grade experiment or replication package with raw data, code, calibration, uncertainty, negative results, provenance, and reviewer response.",
    safetyNote:
      "Remote experiments, simulation, and public-data replication are first-class routes. Lasers, high voltage, radiation, cryogens, vacuum, pressure, chemicals, magnets, and machine tools require institutional controls and qualified supervision.",
    resource: resource(
      "mit-8-13-14-experimental-physics",
      "8.13/8.14: Experimental Physics I and II (Junior Lab)",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/8-13-14-experimental-physics-i-ii-junior-lab-fall-2016-spring-2017/",
      "course",
      ["MIT Physics Junior Lab staff"],
    ),
  },
  {
    key: "data-intensive-bayesian-physics",
    code: "DATA601",
    slug: "data-intensive-and-bayesian-physics",
    title: "Data-Intensive and Bayesian Physics",
    term: 6,
    credits: 4,
    format: "laboratory",
    summary:
      "Bayesian inference, hierarchical models, computation, selection effects, time series, classification, unfolding, causal limits, and open scientific data.",
    primaryOutcome:
      "Build and criticize a probabilistic model that turns a large or complex physics dataset into calibrated claims and decisions.",
    prerequisiteKeys: [
      "probability-data-experimental-methods",
      "computational-physics",
      "research-methods-proposal",
    ],
    competencyKeys: ["computation-data", "mathematical-modeling", "research-communication"],
    topics: topics(
      "Bayesian updating, priors, likelihoods, and posterior checks",
      "sampling, optimization, Monte Carlo, and convergence diagnostics",
      "hierarchical models, latent variables, and partial pooling",
      "open-data parameter inference with posterior predictive checks",
      "time series, signals, spectra, and correlated noise",
      "classification, calibration, selection effects, and domain shift",
      "inverse problems, unfolding, causality limits, and reproducibility",
      "cumulative probabilistic-physics release and defense",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Infer a physical parameter from an open survey, detector, or time-series dataset and stress-test prior sensitivity, selection effects, convergence, and calibration.",
    finalBrief:
      "Release and orally defend a reproducible probabilistic analysis with model criticism, independent checks, uncertainty, provenance, ethical data use, and decision-relevant limitations.",
    resource: resource(
      "mit-18-650-statistics-applications",
      "18.650: Statistics for Applications",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-650-statistics-for-applications-fall-2016/",
      "course",
      ["Philippe Rigollet"],
    ),
  },
  {
    key: "physics-society-ethics",
    code: "PROF601",
    slug: "physics-society-ethics-and-professional-practice",
    title: "Physics, Society, Ethics, and Professional Practice",
    term: 6,
    credits: 4,
    format: "seminar",
    summary:
      "Research integrity, uncertainty in public decisions, dual use, safety, climate and energy, equity, authorship, peer review, careers, and accountable communication.",
    primaryOutcome:
      "Make and communicate a defensible professional decision that integrates evidence, uncertainty, affected communities, safety, law, and ethical duties.",
    prerequisiteKeys: ["research-methods-proposal"],
    competencyKeys: ["professional-practice", "research-communication"],
    topics: topics(
      "professional duties, research integrity, and responsible conduct",
      "authorship, peer review, conflicts, incentives, and correction",
      "risk, safety culture, regulation, and precaution",
      "dual-use physics case and stakeholder decision memo",
      "uncertainty, misinformation, and public communication",
      "energy, climate, radiation, security, and distributive effects",
      "careers, collaboration, inclusion, and lifelong accountability",
      "public evidence hearing and professional-practice defense",
    ),
    assessmentKinds: ["reflection", "presentation"],
    appliedBrief:
      "Write a decision memo for a dual-use, energy, radiation, surveillance, or environmental physics case, identifying stakeholders, uncertainties, duties, and safeguards.",
    finalBrief:
      "Participate in a public evidence hearing and defend a professional recommendation under technical challenge, conflicting values, uncertainty, and new evidence.",
    resource: resource(
      "nptel-ethics-engineering-practice",
      "Ethics in Engineering Practice",
      "NPTEL / IIT Kharagpur",
      "https://nptel.ac.in/courses/110105097",
      "course",
      ["Susmita Mukhopadhyay"],
    ),
  },
  {
    key: "senior-research-thesis",
    code: "RES602",
    slug: "senior-research-thesis-and-defense",
    title: "Senior Research Thesis and Defense",
    term: 6,
    credits: 4,
    format: "capstone",
    summary:
      "Independent theoretical, computational, experimental, or data-intensive research from approved proposal through execution, thesis, artifact release, and oral defense.",
    primaryOutcome:
      "Produce and defend an original or rigorously replicated physics contribution whose evidence, methods, uncertainty, provenance, and limits are auditable.",
    prerequisiteKeys: [
      "research-methods-proposal",
      "advanced-experimental-physics-1",
      "computational-physics",
    ],
    competencyKeys: ["research-communication", "professional-practice", "computation-data"],
    topics: topics(
      "proposal revision, mentor agreement, scope, and governance",
      "literature synthesis, baseline reproduction, and success criteria",
      "method implementation, pilot evidence, and readiness review",
      "midpoint research review and risk-controlled rescope",
      "full execution, analysis, verification, and uncertainty",
      "adversarial checks, replication, negative results, and limitations",
      "thesis writing, artifact preservation, and reviewer response",
      "public thesis release and oral defense",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Pass a midpoint review with a reproduced baseline, pilot result, updated risk register, data and code audit, decision log, and evidence-based rescope if needed.",
    finalBrief:
      "Release and orally defend a thesis plus reproducibility archive containing source evidence, methods, data or simulations, code, uncertainty, failed approaches, ethics, and future tests.",
    safetyNote:
      "A theoretical, simulation, or public-data thesis is fully valid. Any physical work beyond low-risk tabletop activity requires a named qualified supervisor, institutional approvals, training, documented hazards, and stop-work authority.",
    resource: resource(
      "mit-2-tha-undergraduate-thesis",
      "2.ThA: Undergraduate Thesis for Course 2-A",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/2-tha-undergraduate-thesis-for-course-2-a-january-iap-2007/",
      "course",
      ["Alexander H. Slocum"],
    ),
  },
  {
    key: "cosmology-gravitational-waves",
    code: "ASTRO601",
    slug: "cosmology-and-gravitational-waves",
    title: "Cosmology and Gravitational Waves",
    term: 6,
    credits: 4,
    format: "theory",
    summary:
      "Homogeneous cosmology, expansion history, thermal universe, perturbations, dark components, curved spacetime waves, sources, detectors, and multimessenger inference.",
    primaryOutcome:
      "Connect relativistic cosmological models to observable distances, backgrounds, structure, and gravitational-wave signals using public data.",
    prerequisiteKeys: ["astrophysics", "relativity-gravitation"],
    competencyKeys: ["classical-fields", "computation-data", "research-communication"],
    concentrationKey: "astrophysics-gravitation",
    topics: topics(
      "cosmological principle, metrics, redshift, and distance",
      "Friedmann dynamics, components, horizons, and expansion history",
      "thermal history, nucleosynthesis, recombination, and backgrounds",
      "supernova or background-data cosmological inference",
      "perturbations, growth, dark matter, and large-scale structure",
      "gravitational waves, generation, propagation, and polarization",
      "compact-binary signals, detectors, selection, and multimessenger tests",
      "cumulative cosmology-and-wave evidence defense",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Fit an expansion-history model to a public supernova or background dataset and audit calibration, covariance, selection effects, and parameter degeneracy.",
    finalBrief:
      "Defend a joint cosmology or gravitational-wave inference from relativistic model through detector or survey response, uncertainty, alternative explanations, and future tests.",
    resource: resource(
      "mit-8-962-general-relativity",
      "8.962: General Relativity",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/8-962-general-relativity-spring-2020/",
      "course",
      ["Scott A. Hughes"],
    ),
  },
  {
    key: "quantum-materials",
    code: "QSCI601",
    slug: "quantum-materials-and-many-body-physics",
    title: "Quantum Materials and Many-Body Physics",
    term: 6,
    credits: 4,
    format: "theory",
    summary:
      "Second quantization, lattice models, correlations, quasiparticles, superconductivity, topology, quantum sensing materials, and experimental signatures.",
    primaryOutcome:
      "Relate a many-body Hamiltonian and symmetry to phases, excitations, measurable response, and limits of approximation.",
    prerequisiteKeys: ["quantum-information-amo", "condensed-matter-amo-foundations"],
    competencyKeys: ["quantum-statistical", "mathematical-modeling", "computation-data"],
    concentrationKey: "quantum-science-materials",
    topics: topics(
      "second quantization, Fock space, and many-body observables",
      "tight binding, lattice models, and symmetry",
      "Fermi liquids, quasiparticles, and response",
      "numerical lattice-model phase and spectrum study",
      "interactions, magnetism, correlations, and collective order",
      "superconductivity, pairing, coherence, and signatures",
      "topological bands, quantum materials, and sensing interfaces",
      "cumulative many-body material defense",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Diagonalize a finite lattice or mean-field model, map an observable across parameters, and distinguish numerical finite-size behavior from physical claims.",
    finalBrief:
      "Defend a candidate quantum-material phase from Hamiltonian and symmetry through approximation, computation, experimental signature, decoherence, and competing explanations.",
    safetyNote:
      "Use theory, simulation, and published data. Cryogens, high magnetic fields, pressure cells, x-rays, lasers, vacuum deposition, reactive precursors, and nanofabrication require certified facilities and specialist supervision.",
    resource: resource(
      "mit-8-511-theory-solids-1",
      "8.511: Theory of Solids I",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/8-511-theory-of-solids-i-fall-2004/",
      "course",
      ["Patrick A. Lee"],
    ),
  },
  {
    key: "particle-physics-standard-model",
    code: "PART601",
    slug: "particle-physics-and-the-standard-model",
    title: "Particle Physics and the Standard Model",
    term: 6,
    credits: 4,
    format: "theory",
    summary:
      "Relativistic scattering, symmetries, particles and interactions, gauge structure, quarks, neutrinos, Higgs physics, collider detectors, and open-event inference.",
    primaryOutcome:
      "Connect a symmetry-based particle model to calculable rates, detector signatures, statistical evidence, and unresolved questions.",
    prerequisiteKeys: ["nuclear-radiation-detectors", "relativity-gravitation"],
    competencyKeys: ["quantum-statistical", "experiment-instrumentation", "computation-data"],
    concentrationKey: "particle-nuclear-physics",
    topics: topics(
      "relativistic kinematics, cross sections, and decay rates",
      "symmetries, conservation laws, fields, and Feynman reasoning",
      "leptons, quarks, hadrons, and strong interactions",
      "open collider-event reconstruction and background test",
      "electroweak interactions, neutrinos, and flavor",
      "Higgs mechanism, masses, and symmetry breaking",
      "detectors, triggers, likelihoods, limits, and discovery standards",
      "cumulative Standard Model evidence defense",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Reconstruct a kinematic observable from an open collider dataset, compare signal and background hypotheses, and report calibration, efficiency, and look-elsewhere limits.",
    finalBrief:
      "Defend a Standard Model measurement or search from symmetry and process through detector response, statistical evidence, systematic uncertainty, and possible new-physics alternatives.",
    safetyNote:
      "Use open collider data and simulation. Particle beams, accelerators, high voltage, ionizing radiation, cryogenics, strong magnets, and detector gases require licensed facilities and expert teams.",
    resource: resource(
      "mit-8-701-nuclear-particle-physics",
      "8.701: Introduction to Nuclear and Particle Physics",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/8-701-introduction-to-nuclear-and-particle-physics-fall-2020/",
      "course",
      ["Markus Klute"],
    ),
  },
] as const satisfies readonly PhysicsCourseSpec[];
