import type {
  AssessmentKind,
  PublishedCourseVersion,
  ResourceKind,
} from "../../app/domain/catalog";

export type MechanicalEngineeringCompetencyKey =
  | "math-physics"
  | "solids-materials"
  | "thermal-fluids"
  | "dynamics-control"
  | "design-manufacturing"
  | "experimentation-computation"
  | "professional-practice";

export type MechanicalEngineeringConcentrationKey =
  | "robotics-autonomous-systems"
  | "aerospace-propulsion"
  | "sustainable-energy";

export type MechanicalEngineeringTopicSpec = {
  readonly key: string;
  readonly title: string;
  readonly assessmentPosition?: "applied" | "final";
};

type EightTopics = readonly [
  MechanicalEngineeringTopicSpec,
  MechanicalEngineeringTopicSpec,
  MechanicalEngineeringTopicSpec,
  MechanicalEngineeringTopicSpec,
  MechanicalEngineeringTopicSpec,
  MechanicalEngineeringTopicSpec,
  MechanicalEngineeringTopicSpec,
  MechanicalEngineeringTopicSpec,
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

export type MechanicalEngineeringCourseSpec = {
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
  readonly competencyKeys: readonly MechanicalEngineeringCompetencyKey[];
  readonly topics: EightTopics;
  readonly assessmentKinds?: readonly [AssessmentKind, AssessmentKind];
  readonly appliedBrief: string;
  readonly finalBrief: string;
  readonly safetyNote?: string;
  readonly concentrationKey?: MechanicalEngineeringConcentrationKey;
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
 * coherent two-course concentrations. A learner selects thirty courses,
 * representing 120 Course Atlas credits and approximately 4,800 hours.
 */
export const mechanicalEngineeringCourseSpecs = [
  {
    key: "engineering-calculus-1",
    code: "MATH101",
    slug: "engineering-calculus-1",
    title: "Engineering Calculus I",
    term: 1,
    credits: 4,
    format: "theory",
    summary:
      "Limits, derivatives, integrals, series, approximation, and single-variable models of mechanical systems.",
    primaryOutcome:
      "Formulate, solve, check, and explain calculus models of motion, loading, work, and accumulation.",
    prerequisiteKeys: [],
    competencyKeys: ["math-physics", "experimentation-computation"],
    topics: topics(
      "functions, units, limits, and continuity",
      "derivatives, linearization, and sensitivity",
      "optimization and related rates",
      "mechanical modeling with derivatives",
      "definite integrals and conservation",
      "integration methods and numerical quadrature",
      "sequences, Taylor series, and error",
      "cumulative calculus modeling and defense",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Optimize a constrained mechanism or thermal enclosure, verify the result numerically, and report units, sensitivity, and model limits.",
    finalBrief:
      "Complete a cumulative written exam and defend a compact model that uses differentiation, integration, and error bounds.",
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
    key: "physics-mechanics-waves",
    code: "PHYS101",
    slug: "university-physics-1-mechanics-waves",
    title: "University Physics I: Mechanics and Waves",
    term: 1,
    credits: 4,
    format: "laboratory",
    summary:
      "Newtonian mechanics, momentum, energy, rotation, oscillation, waves, and evidence from safe experiments.",
    primaryOutcome:
      "Predict mechanical behavior from diagrams and conservation laws, then test the prediction with uncertainty-aware evidence.",
    prerequisiteKeys: [],
    competencyKeys: ["math-physics", "dynamics-control"],
    topics: topics(
      "measurement, vectors, kinematics, and uncertainty",
      "Newton's laws and free-body diagrams",
      "work, energy, and conservative models",
      "momentum and collision investigation",
      "rotation, torque, and angular momentum",
      "static equilibrium and elasticity",
      "oscillations, waves, and resonance",
      "cumulative mechanics experiment and exam",
    ),
    assessmentKinds: ["lab", "exam"],
    appliedBrief:
      "Run or simulate a collision study, reconcile momentum and energy accounts, and quantify uncertainty and non-ideal loss.",
    finalBrief:
      "Sit a cumulative mechanics exam and defend a reproducible oscillation or rigid-body experiment with corrected residuals.",
    safetyNote:
      "Use low-energy bench experiments or simulation. Restrain moving masses, wear eye protection where appropriate, and do not improvise high-speed or high-force rigs.",
    resource: resource(
      "mit-8-01sc-classical-mechanics",
      "8.01SC: Classical Mechanics",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/",
      "course",
      ["Walter Lewin", "Deepto Chakrabarty", "Peter Dourmashkin"],
    ),
  },
  {
    key: "chemistry-materials-foundations",
    code: "CHEM101",
    slug: "chemistry-materials-foundations",
    title: "Chemistry and Materials Foundations",
    term: 1,
    credits: 4,
    format: "laboratory",
    summary:
      "Bonding, crystal structure, defects, phase behavior, reactions, electrochemistry, corrosion, and engineering material families.",
    primaryOutcome:
      "Explain how composition and structure produce properties, degradation, and defensible material choices.",
    prerequisiteKeys: [],
    competencyKeys: ["math-physics", "solids-materials"],
    topics: topics(
      "atoms, bonding, and molecular structure",
      "crystals, defects, diffusion, and microstructure",
      "thermochemistry and chemical equilibrium",
      "phase diagrams and material selection",
      "reaction kinetics and processing",
      "electrochemistry, batteries, and corrosion",
      "metals, ceramics, polymers, and composites",
      "structure-property-degradation case defense",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Select a material for a loaded and environmentally exposed component using a phase/property argument, corrosion risk, and lifecycle evidence.",
    finalBrief:
      "Complete a cumulative exam and defend a failure case from atomic bonding through processing, microstructure, property, and degradation.",
    safetyNote:
      "Use datasets, household-safe demonstrations, or supervised institutional labs; do not handle corrosive, toxic, reactive, or high-temperature materials independently.",
    resource: resource(
      "mit-3-091sc-solid-state-chemistry",
      "3.091SC: Introduction to Solid State Chemistry",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/3-091sc-introduction-to-solid-state-chemistry-fall-2010/",
      "course",
      ["Donald Sadoway"],
    ),
  },
  {
    key: "programming-engineering-computation",
    code: "COMP101",
    slug: "programming-engineering-computation",
    title: "Programming and Engineering Computation",
    term: 1,
    credits: 4,
    format: "laboratory",
    summary:
      "Python, numerical arrays, algorithms, visualization, testing, version control, and reproducible engineering notebooks.",
    primaryOutcome:
      "Build and validate a maintainable computational model from equations, data, tests, and documented assumptions.",
    prerequisiteKeys: [],
    competencyKeys: ["math-physics", "experimentation-computation"],
    topics: topics(
      "variables, functions, units, and control flow",
      "arrays, vectors, tables, and visualization",
      "decomposition, algorithms, and complexity intuition",
      "tested numerical model of a physical system",
      "root finding, integration, and error",
      "data cleaning, fitting, and residuals",
      "version control, documentation, and reproducibility",
      "cumulative engineering software release",
    ),
    assessmentKinds: ["project", "portfolio"],
    appliedBrief:
      "Implement and test a parameterized motion or heat-balance model, including units, plots, convergence checks, and a fault log.",
    finalBrief:
      "Release and defend an engineering computation package with tests, a reproducible environment, validation data, and explicit validity limits.",
    resource: resource(
      "mit-6-0001-introduction-to-computer-science-programming-python",
      "6.0001: Introduction to Computer Science and Programming in Python",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/",
      "course",
      ["Ana Bell", "Eric Grimson", "John Guttag"],
    ),
  },
  {
    key: "engineering-graphics-cad-design",
    code: "DES101",
    slug: "engineering-graphics-cad-design-studio",
    title: "Engineering Graphics, CAD, and Design Studio",
    term: 1,
    credits: 4,
    format: "studio",
    summary:
      "Sketching, orthographic communication, parametric CAD, assemblies, tolerancing, requirements, prototyping, and design critique.",
    primaryOutcome:
      "Translate a human need into an unambiguous, reviewable, and safely prototyped mechanical design package.",
    prerequisiteKeys: [],
    competencyKeys: ["design-manufacturing", "professional-practice"],
    topics: topics(
      "need finding, requirements, and engineering sketches",
      "orthographic views, sections, and dimensioning",
      "parametric solid modeling and design intent",
      "CAD assembly with interfaces and motion checks",
      "fits, tolerances, GD&T foundations, and drawings",
      "concept generation, selection, and critique",
      "safe mockups, prototypes, and design iteration",
      "complete design package and review",
    ),
    assessmentKinds: ["project", "presentation"],
    appliedBrief:
      "Create a constrained parametric assembly, drawings, interface checks, and a revision log for an everyday mechanism.",
    finalBrief:
      "Deliver and defend a need-to-prototype design package with requirements traceability, CAD, drawings, risk review, and user feedback.",
    safetyNote:
      "Simulation and low-risk mockups are valid. Any shop, laser, printer, or powered-tool use requires local training, guards, ventilation, PPE, and qualified supervision.",
    resource: resource(
      "mit-2-007-design-manufacturing-1",
      "2.007: Design and Manufacturing I",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/2-007-design-and-manufacturing-i-spring-2009/",
      "course",
      ["Daniel Frey", "David Gossard"],
    ),
  },
  {
    key: "multivariable-calculus-vector-analysis",
    code: "MATH201",
    slug: "multivariable-calculus-vector-analysis",
    title: "Multivariable Calculus and Vector Analysis",
    term: 2,
    credits: 4,
    format: "theory",
    summary:
      "Vectors, partial derivatives, multiple integrals, vector fields, integral theorems, and constrained optimization.",
    primaryOutcome:
      "Use multivariable and vector calculus to derive and check models of fields, transport, mass properties, and geometry.",
    prerequisiteKeys: ["engineering-calculus-1"],
    competencyKeys: ["math-physics", "experimentation-computation"],
    topics: topics(
      "vectors, geometry, and coordinate systems",
      "vector-valued motion and curvature",
      "partial derivatives, gradients, and linearization",
      "constrained optimization of an engineering design",
      "double and triple integrals with mass properties",
      "line integrals, work, and circulation",
      "Green, Stokes, and divergence theorems",
      "cumulative field model and exam",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Optimize a geometry under constraints and independently verify its mass, centroid, and sensitivity with numerical integration.",
    finalBrief:
      "Complete a cumulative exam and defend a flux/circulation model using differential and integral forms with unit checks.",
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
    key: "linear-algebra-differential-equations-numerical-methods",
    code: "MATH202",
    slug: "linear-algebra-differential-equations-numerical-methods",
    title: "Linear Algebra, Differential Equations, and Numerical Methods",
    term: 2,
    credits: 4,
    format: "laboratory",
    summary:
      "Linear systems, eigenanalysis, ordinary differential equations, transforms, discretization, stability, and numerical solution.",
    primaryOutcome:
      "Derive, solve, simulate, and validate coupled linear and differential models of mechanical systems.",
    prerequisiteKeys: ["engineering-calculus-1", "programming-engineering-computation"],
    competencyKeys: ["math-physics", "experimentation-computation"],
    topics: topics(
      "matrices, elimination, rank, and conditioning",
      "vector spaces, bases, least squares, and projections",
      "eigenvalues, modes, and matrix exponentials",
      "ODE model and numerical solver validation",
      "first-order systems and phase portraits",
      "second-order systems, resonance, and damping",
      "Laplace transforms, discretization, and stability",
      "cumulative coupled-system analysis and defense",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Model a coupled mass or thermal system, implement two numerical solvers, and compare stability, convergence, and conservation.",
    finalBrief:
      "Sit a cumulative exam and defend an eigenvalue/ODE model against analytical checks, numerical evidence, and perturbed parameters.",
    resource: resource(
      "mit-18-03sc-differential-equations",
      "18.03SC: Differential Equations",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/",
      "course",
      ["Haynes Miller", "Arthur Mattuck"],
    ),
  },
  {
    key: "physics-electricity-magnetism-circuits",
    code: "PHYS201",
    slug: "university-physics-2-electricity-magnetism-circuits",
    title: "University Physics II: Electricity, Magnetism, and Circuits",
    term: 2,
    credits: 4,
    format: "laboratory",
    summary:
      "Electric and magnetic fields, potential, capacitance, induction, circuits, electromagnetic waves, and electromechanical effects.",
    primaryOutcome:
      "Connect field and circuit models to measurable electrical behavior in sensors, motors, and energy-storage elements.",
    prerequisiteKeys: ["engineering-calculus-1", "physics-mechanics-waves"],
    competencyKeys: ["math-physics", "dynamics-control"],
    topics: topics(
      "charge, Coulomb's law, and electric fields",
      "potential, energy, conductors, and capacitance",
      "current, resistance, and DC circuit models",
      "safe low-voltage RC measurement and model test",
      "magnetic fields, forces, and torque",
      "induction, inductance, and transient energy",
      "Maxwell synthesis and electromagnetic waves",
      "field-to-actuator cumulative exam and defense",
    ),
    assessmentKinds: ["lab", "exam"],
    appliedBrief:
      "Measure or simulate an RC transient, fit its parameter, quantify residuals, and explain stored versus dissipated energy.",
    finalBrief:
      "Complete a cumulative exam and defend the field-to-force-to-motion chain in a motor, solenoid, or magnetic sensor.",
    safetyNote:
      "Use simulation or extra-low-voltage, current-limited circuits only. Never work on mains, exposed high voltage, large capacitors, or high-current batteries without qualified local supervision.",
    resource: resource(
      "mit-8-02-physics-2-electricity-magnetism",
      "8.02: Physics II — Electricity and Magnetism",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2019/",
      "course",
      ["MIT Physics"],
    ),
  },
  {
    key: "statics-structural-equilibrium",
    code: "MECH201",
    slug: "statics-structural-equilibrium",
    title: "Statics and Structural Equilibrium",
    term: 2,
    credits: 4,
    format: "theory",
    summary:
      "Free-body diagrams, equilibrium, distributed loading, friction, trusses, frames, centroids, and moments of inertia.",
    primaryOutcome:
      "Idealize a physical structure, calculate reactions and internal actions, and defend every assumption and safety factor.",
    prerequisiteKeys: ["engineering-calculus-1", "physics-mechanics-waves"],
    competencyKeys: ["math-physics", "solids-materials"],
    topics: topics(
      "force vectors, moments, couples, and resultants",
      "free-body diagrams and equilibrium",
      "distributed loads, centroids, and resultants",
      "truss analysis and independent equilibrium check",
      "frames, machines, and internal forces",
      "friction, belts, screws, and wedges",
      "area and mass moments of inertia",
      "cumulative structural idealization and exam",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Analyze a determinate truss by two methods, test a scale or simulated model, and reconcile load-path discrepancies.",
    finalBrief:
      "Complete a cumulative exam and defend the idealization, load path, reactions, and stability of an unfamiliar structure.",
    resource: resource(
      "engineering-statics-open-interactive",
      "Engineering Statics: Open and Interactive",
      "Daniel W. Baker and William Haynes",
      "https://engineeringstatics.org/",
      "textbook",
      ["Daniel W. Baker", "William Haynes"],
    ),
  },
  {
    key: "materials-manufacturing-metrology",
    code: "MANU201",
    slug: "materials-manufacturing-metrology",
    title: "Materials, Manufacturing, and Metrology",
    term: 2,
    credits: 4,
    format: "laboratory",
    summary:
      "Mechanical properties, phase and process effects, casting, forming, machining, polymers, additive processes, tolerances, and inspection.",
    primaryOutcome:
      "Select a material-process-measurement route that can repeatedly produce a safe component to specification.",
    prerequisiteKeys: ["chemistry-materials-foundations", "engineering-graphics-cad-design"],
    competencyKeys: ["solids-materials", "design-manufacturing"],
    topics: topics(
      "stress-strain behavior, hardness, and toughness",
      "microstructure, heat treatment, and processing",
      "casting, forming, joining, and powder routes",
      "process selection and manufacturability plan",
      "machining, cutting mechanics, and tool wear",
      "polymers, composites, and additive manufacturing",
      "fits, tolerances, surface finish, and metrology",
      "manufacturing route and inspection defense",
    ),
    assessmentKinds: ["project", "presentation"],
    appliedBrief:
      "Choose a material and manufacturing chain for a toleranced part, estimate capability and cost, and create its inspection plan.",
    finalBrief:
      "Defend a complete material-process-quality route using drawings, process limits, measurement evidence, hazards, and lifecycle tradeoffs.",
    safetyNote:
      "A process-planning and simulation route is valid. Foundry, welding, machining, pressure, laser, resin, or powder work requires approved facilities, training, PPE, ventilation, guarding, and supervision.",
    resource: resource(
      "mit-3-044-materials-processing-manufacturing",
      "3.044: Materials Processing in Manufacturing",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/3-044-materials-processing-spring-2013/",
      "course",
      ["Chris Schuh"],
    ),
  },
  {
    key: "rigid-body-dynamics-vibrations",
    code: "MECH301",
    slug: "rigid-body-dynamics-mechanical-vibrations",
    title: "Rigid-Body Dynamics and Mechanical Vibrations",
    term: 3,
    credits: 4,
    format: "laboratory",
    summary:
      "Particle and rigid-body kinematics, force-mass-acceleration, work-energy, impulse-momentum, vibration, damping, and resonance.",
    primaryOutcome:
      "Model, simulate, measure, and explain the transient and vibratory behavior of a mechanical system.",
    prerequisiteKeys: ["statics-structural-equilibrium", "linear-algebra-differential-equations-numerical-methods"],
    competencyKeys: ["dynamics-control", "solids-materials"],
    topics: topics(
      "particle kinematics in multiple coordinate systems",
      "particle kinetics with force, energy, and momentum",
      "rigid-body translation, rotation, and relative motion",
      "dynamic mechanism simulation and balance check",
      "planar rigid-body force and energy methods",
      "free and forced single-degree vibration",
      "damping, resonance, isolation, and modal intuition",
      "cumulative dynamics and vibration defense",
    ),
    assessmentKinds: ["project", "exam"],
    appliedBrief:
      "Derive and simulate a moving mechanism, then close independent force, energy, and kinematic consistency checks.",
    finalBrief:
      "Complete a cumulative exam and defend a vibration model against measured or synthetic frequency-response data.",
    safetyNote:
      "Use simulation or restrained, low-energy oscillators. High-speed rotating, impact, or resonant testing requires guarding, remote operation, rated fixtures, and qualified supervision.",
    resource: resource(
      "mit-2-003sc-engineering-dynamics",
      "2.003SC: Engineering Dynamics",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/2-003sc-engineering-dynamics-fall-2011/",
      "course",
      ["J. Kim Vandiver", "David Gossard"],
    ),
  },
  {
    key: "mechanics-materials-solid-structures",
    code: "SOLI301",
    slug: "mechanics-materials-solid-structures",
    title: "Mechanics of Materials and Solid Structures",
    term: 3,
    credits: 4,
    format: "laboratory",
    summary:
      "Stress, strain, constitutive behavior, axial and torsional loading, beam bending, deflection, buckling, combined stress, and failure.",
    primaryOutcome:
      "Predict deformation and failure of a component, verify the model, and communicate a justified margin of safety.",
    prerequisiteKeys: ["statics-structural-equilibrium", "materials-manufacturing-metrology", "multivariable-calculus-vector-analysis"],
    competencyKeys: ["solids-materials", "experimentation-computation"],
    topics: topics(
      "stress, strain, constitutive response, and safety factors",
      "axial loading, thermal strain, and indeterminacy",
      "torsion of shafts and thin-walled members",
      "beam stress and deflection model validation",
      "shear force, bending moment, and energy methods",
      "multiaxial stress, transformations, and failure criteria",
      "columns, buckling, fatigue, and fracture introduction",
      "cumulative component sizing and defense",
    ),
    assessmentKinds: ["lab", "exam"],
    appliedBrief:
      "Size and test or simulate a beam, compare measured and predicted strain/deflection, and diagnose model discrepancy.",
    finalBrief:
      "Complete a cumulative exam and defend a safety-critical component across static, buckling, fatigue, and uncertainty cases.",
    safetyNote:
      "Simulation or low-load coupons are valid. Destructive, pressurized, fatigue, or high-force testing requires rated frames, shields, PPE, exclusion zones, and trained supervision.",
    resource: resource(
      "mit-2-001-mechanics-materials-1",
      "2.001: Mechanics and Materials I",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/",
      "course",
      ["Carol Livermore"],
    ),
  },
  {
    key: "engineering-thermodynamics",
    code: "THER301",
    slug: "engineering-thermodynamics",
    title: "Engineering Thermodynamics",
    term: 3,
    credits: 4,
    format: "theory",
    summary:
      "Properties, equations of state, first and second laws, control volumes, entropy, exergy, cycles, mixtures, and combustion foundations.",
    primaryOutcome:
      "Analyze energy-conversion systems with transparent property assumptions, conservation balances, efficiency, and second-law limits.",
    prerequisiteKeys: ["engineering-calculus-1", "physics-mechanics-waves", "chemistry-materials-foundations"],
    competencyKeys: ["math-physics", "thermal-fluids"],
    topics: topics(
      "systems, properties, states, and equations of state",
      "work, heat, and the first law for closed systems",
      "mass and energy balances for control volumes",
      "cycle energy audit and property verification",
      "second law, entropy, irreversibility, and exergy",
      "power and refrigeration cycles",
      "mixtures, psychrometrics, and combustion foundations",
      "cumulative thermodynamic system defense",
    ),
    assessmentKinds: ["problem set", "exam"],
    appliedBrief:
      "Build a reproducible energy and exergy audit for a power or refrigeration cycle and check every property state independently.",
    finalBrief:
      "Complete a cumulative exam and defend a conversion system with first-law closure, entropy generation, efficiency, and operating limits.",
    safetyNote:
      "Use property software and simulation. Refrigerants, pressure vessels, boilers, combustion, cryogens, and hot surfaces require certified facilities and qualified supervision.",
    resource: resource(
      "mit-thermodynamics-climate-change",
      "Thermodynamics and Climate Change",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/res-2-008-thermodynamics-and-climate-change-summer-2020/",
      "course",
      ["Peter Godart"],
    ),
  },
  {
    key: "fluid-mechanics",
    code: "FLUI301",
    slug: "fluid-mechanics",
    title: "Fluid Mechanics",
    term: 3,
    credits: 4,
    format: "laboratory",
    summary:
      "Fluid properties, hydrostatics, conservation laws, dimensional analysis, internal and external flow, boundary layers, and turbomachinery foundations.",
    primaryOutcome:
      "Derive, compute, and validate a fluid-flow model while stating its regime, boundary conditions, losses, and uncertainty.",
    prerequisiteKeys: ["multivariable-calculus-vector-analysis", "linear-algebra-differential-equations-numerical-methods", "physics-mechanics-waves"],
    competencyKeys: ["thermal-fluids", "experimentation-computation"],
    topics: topics(
      "fluid properties, pressure, and hydrostatics",
      "kinematics, streamlines, and control volumes",
      "mass, momentum, and energy balances",
      "pipe-flow loss experiment or simulation",
      "dimensional analysis, similarity, and scaling",
      "viscous internal flow and networks",
      "boundary layers, drag, lift, and turbomachinery",
      "cumulative flow-system design and defense",
    ),
    assessmentKinds: ["lab", "exam"],
    appliedBrief:
      "Identify pressure-drop or discharge behavior from measured or synthetic data and reconcile it with dimensional and loss models.",
    finalBrief:
      "Complete a cumulative exam and defend a pump-pipe or external-flow design across regimes, uncertainty, and cavitation or separation limits.",
    safetyNote:
      "Use simulation or low-pressure water/air rigs. Pressurized gas, vacuum implosion, high-speed jets, pumps, and rotating test equipment require rated hardware and trained supervision.",
    resource: resource(
      "mit-2-06-fluid-dynamics",
      "2.06: Fluid Dynamics",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/2-06-fluid-dynamics-spring-2013/",
      "course",
      ["Kripa K. Varanasi"],
    ),
  },
  {
    key: "electronics-sensors-data-acquisition",
    code: "ELEC301",
    slug: "electronics-sensors-data-acquisition",
    title: "Electronics, Sensors, and Data Acquisition",
    term: 3,
    credits: 4,
    format: "laboratory",
    summary:
      "Circuit analysis, op-amps, filtering, transducers, bridges, sampling, ADCs, calibration, noise, and safe data acquisition.",
    primaryOutcome:
      "Design and calibrate a low-voltage measurement chain whose transfer, uncertainty, bandwidth, and failure modes are evidenced.",
    prerequisiteKeys: ["physics-electricity-magnetism-circuits", "programming-engineering-computation"],
    competencyKeys: ["dynamics-control", "experimentation-computation"],
    topics: topics(
      "DC circuits, network laws, and loading",
      "operational amplifiers and signal conditioning",
      "dynamic circuits, filtering, and frequency response",
      "sensor interface calibration and uncertainty",
      "resistive, capacitive, optical, and thermal sensors",
      "sampling, aliasing, ADCs, and quantization",
      "noise, grounding, shielding, and fault protection",
      "complete data-acquisition chain defense",
    ),
    assessmentKinds: ["lab", "project"],
    appliedBrief:
      "Build or simulate a conditioned sensor channel, calibrate it against a reference, and report bandwidth, noise, uncertainty, and saturation.",
    finalBrief:
      "Release and defend a multi-channel acquisition system with schematics, firmware, calibration, fault tests, and a reproducible dataset.",
    safetyNote:
      "Use simulation or extra-low-voltage, current-limited hardware. Never probe mains-referenced circuits, high-current batteries, or rotating machinery without isolation and qualified supervision.",
    resource: resource(
      "mit-6-002-circuits-electronics",
      "6.002: Circuits and Electronics",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/",
      "course",
      ["Anant Agarwal", "Jeffrey Lang"],
    ),
  },
  {
    key: "heat-mass-transfer",
    code: "HEAT401",
    slug: "heat-mass-transfer",
    title: "Heat and Mass Transfer",
    term: 4,
    credits: 4,
    format: "laboratory",
    summary:
      "Steady and transient conduction, convection, radiation, heat exchangers, diffusion, coupled transport, and thermal design.",
    primaryOutcome:
      "Construct and validate a thermal model, choose correlations responsibly, and design within temperature, efficiency, and safety limits.",
    prerequisiteKeys: ["engineering-thermodynamics", "fluid-mechanics", "linear-algebra-differential-equations-numerical-methods"],
    competencyKeys: ["thermal-fluids", "experimentation-computation"],
    topics: topics(
      "conduction, thermal resistance, and boundary conditions",
      "fins, multidimensional conduction, and shape factors",
      "transient conduction and lumped-capacitance limits",
      "thermal experiment and inverse parameter estimate",
      "forced and natural convection correlations",
      "radiation exchange and participating surfaces",
      "heat exchangers, diffusion, and coupled transport",
      "cumulative thermal design and defense",
    ),
    assessmentKinds: ["lab", "exam"],
    appliedBrief:
      "Estimate a thermal property or convection coefficient from data, propagate uncertainty, and test competing model assumptions.",
    finalBrief:
      "Complete a cumulative exam and defend a heat-exchanger or electronics-cooling design with operating envelope and safety case.",
    safetyNote:
      "Use simulation or low-temperature experiments. Hot surfaces, flames, lasers, cryogens, refrigerants, and pressurized loops require approved facilities and supervision.",
    resource: resource(
      "mit-2-51-intermediate-heat-mass-transfer",
      "2.51: Intermediate Heat and Mass Transfer",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/2-51-intermediate-heat-and-mass-transfer-fall-2008/",
      "course",
      ["Bora Mikic"],
    ),
  },
  {
    key: "machine-elements-mechanical-design",
    code: "DES401",
    slug: "machine-elements-mechanical-design",
    title: "Machine Elements and Mechanical Design",
    term: 4,
    credits: 4,
    format: "studio",
    summary:
      "Load paths, failure criteria, fatigue, shafts, bearings, gears, fasteners, springs, brakes, clutches, tolerances, and embodiment design.",
    primaryOutcome:
      "Design a manufacturable mechanical assembly whose components, interfaces, life, and failure margins trace to requirements.",
    prerequisiteKeys: ["mechanics-materials-solid-structures", "rigid-body-dynamics-vibrations", "materials-manufacturing-metrology", "engineering-graphics-cad-design"],
    competencyKeys: ["solids-materials", "design-manufacturing"],
    topics: topics(
      "requirements, load cases, uncertainty, and design factors",
      "static failure, fatigue, and stress concentration",
      "shafts, keys, couplings, and critical speed",
      "bearing and shaft subsystem design review",
      "gears, belts, chains, and power transmission",
      "fasteners, joints, springs, brakes, and clutches",
      "tolerances, lubrication, sealing, and maintainability",
      "complete machine assembly design defense",
    ),
    assessmentKinds: ["project", "presentation"],
    appliedBrief:
      "Size a shaft-bearing-transmission subsystem under duty-cycle loads and issue drawings, life calculations, and a design review closure log.",
    finalBrief:
      "Defend a complete machine assembly with traceable requirements, calculations, CAD, tolerance stack, FMEA, cost, and maintenance plan.",
    safetyNote:
      "Use CAD and simulation by default. Physical drives require guards, rated parts, safe torque/speed limits, emergency stop, and supervised testing.",
    resource: resource(
      "mit-2-72-elements-mechanical-design",
      "2.72: Elements of Mechanical Design",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/2-72-elements-of-mechanical-design-spring-2009/",
      "course",
      ["Martin Culpepper"],
    ),
  },
  {
    key: "system-dynamics-feedback-control",
    code: "CTRL401",
    slug: "system-dynamics-feedback-control",
    title: "System Dynamics and Feedback Control",
    term: 4,
    credits: 4,
    format: "laboratory",
    summary:
      "Lumped-parameter modeling, transfer functions, state space, transient and frequency response, stability, PID, estimation, and implementation limits.",
    primaryOutcome:
      "Identify, design, simulate, and verify a feedback controller with explicit stability, robustness, saturation, and timing evidence.",
    prerequisiteKeys: ["rigid-body-dynamics-vibrations", "linear-algebra-differential-equations-numerical-methods", "programming-engineering-computation"],
    competencyKeys: ["dynamics-control", "experimentation-computation"],
    topics: topics(
      "energy-based lumped models and linearization",
      "transfer functions, poles, zeros, and response",
      "stability, root locus, and transient specifications",
      "PID design on an identified plant",
      "frequency response, margins, and robustness",
      "state space, controllability, and observability",
      "sampling, saturation, estimation, and implementation",
      "closed-loop system verification and defense",
    ),
    assessmentKinds: ["project", "exam"],
    appliedBrief:
      "Identify a plant from data, design and compare controllers, and verify tracking, disturbance rejection, margins, and saturation behavior.",
    finalBrief:
      "Complete a cumulative exam and defend a closed-loop release against nominal, uncertain, delayed, noisy, and faulted scenarios.",
    safetyNote:
      "Simulation is sufficient. Physical control systems require bounded force/speed, independent emergency stop, fail-safe state, guarded test space, and supervision.",
    resource: resource(
      "feedback-systems-astrom-murray",
      "Feedback Systems: An Introduction for Scientists and Engineers",
      "Caltech",
      "https://fbsbook.org/",
      "textbook",
      ["Karl J. Astrom", "Richard M. Murray"],
    ),
  },
  {
    key: "probability-measurement-experimental-methods",
    code: "LAB401",
    slug: "engineering-probability-measurement-experimental-methods",
    title: "Engineering Probability, Measurement, and Experimental Methods",
    term: 4,
    credits: 4,
    format: "laboratory",
    summary:
      "Probability, estimation, uncertainty, regression, design of experiments, calibration, dynamic measurement, reproducibility, and technical reporting.",
    primaryOutcome:
      "Design and execute an experiment whose instrumentation, statistics, uncertainty, and conclusions can survive independent review.",
    prerequisiteKeys: ["electronics-sensors-data-acquisition", "linear-algebra-differential-equations-numerical-methods", "programming-engineering-computation"],
    competencyKeys: ["experimentation-computation", "professional-practice"],
    topics: topics(
      "probability models, random variables, and sampling",
      "estimation, confidence intervals, and hypothesis tests",
      "calibration, traceability, resolution, and bias",
      "designed experiment with uncertainty budget",
      "regression, residuals, and model selection",
      "factorial experiments and sensitivity",
      "dynamic measurement, filtering, and reproducibility",
      "complete experimental paper and oral defense",
    ),
    assessmentKinds: ["lab", "presentation"],
    appliedBrief:
      "Pre-register and execute a safe experiment, then publish raw data, calibration, uncertainty propagation, residuals, and a reproducible analysis.",
    finalBrief:
      "Write and defend a journal-style experimental report, including a blinded or held-out validation and corrections after peer review.",
    safetyNote:
      "Every physical experiment needs a hazard analysis, energy inventory, safe state, stop criteria, appropriate PPE, and local supervision; simulation/data-only routes are valid.",
    resource: resource(
      "mit-2-671-measurement-instrumentation",
      "2.671: Measurement and Instrumentation",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/2-671-measurement-and-instrumentation-fall-2006/",
      "course",
      ["James H. Williams Jr."],
    ),
  },
  {
    key: "advanced-manufacturing-product-realization",
    code: "MANU401",
    slug: "advanced-manufacturing-product-realization",
    title: "Advanced Manufacturing and Product Realization",
    term: 4,
    credits: 4,
    format: "studio",
    summary:
      "Process physics, CNC, additive and polymer processing, tooling, assembly, design for manufacture, process capability, quality, automation, and lifecycle.",
    primaryOutcome:
      "Release a manufacturable product definition with process plan, quality controls, cost, traceability, and lifecycle evidence.",
    prerequisiteKeys: ["materials-manufacturing-metrology", "mechanics-materials-solid-structures", "engineering-graphics-cad-design"],
    competencyKeys: ["design-manufacturing", "experimentation-computation"],
    topics: topics(
      "process planning, datum strategy, and tolerance chains",
      "machining mechanics, CNC planning, and fixture design",
      "forming, molding, additive, and hybrid processes",
      "design-for-manufacture and process capability study",
      "assembly, joining, automation, and mistake proofing",
      "quality planning, statistical control, and traceability",
      "cost, supply chain, sustainability, and end of life",
      "production release and readiness defense",
    ),
    assessmentKinds: ["project", "presentation"],
    appliedBrief:
      "Redesign a component for one production process and demonstrate capability using tolerance, cycle, cost, quality, and inspection evidence.",
    finalBrief:
      "Issue and defend a production-release package with drawings, process flow, fixtures, control plan, costed BOM, risks, and lifecycle route.",
    safetyNote:
      "Digital manufacturing plans are valid. CNC, molding, welding, additive powders/resins, robots, and inspection equipment require approved training, controls, PPE, ventilation, and supervision.",
    resource: resource(
      "mit-2-008-design-manufacturing-2",
      "2.008: Design and Manufacturing II",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/2-008-design-and-manufacturing-ii-spring-2004/",
      "course",
      ["Jung-Hoon Chun", "Sang-Gook Kim"],
    ),
  },
  {
    key: "computational-mechanics-fea-cfd",
    code: "CAE501",
    slug: "computational-mechanics-fea-cfd",
    title: "Computational Mechanics: FEA and CFD",
    term: 5,
    credits: 4,
    format: "laboratory",
    summary:
      "Weak forms, discretization, finite elements, finite volumes, meshing, solver behavior, convergence, verification, validation, and multiphysics judgment.",
    primaryOutcome:
      "Build and defend credible solid and fluid simulations using analytical checks, convergence studies, validation evidence, and explicit uncertainty.",
    prerequisiteKeys: ["mechanics-materials-solid-structures", "fluid-mechanics", "heat-mass-transfer", "linear-algebra-differential-equations-numerical-methods", "programming-engineering-computation"],
    competencyKeys: ["solids-materials", "thermal-fluids", "experimentation-computation"],
    topics: topics(
      "governing equations, boundary conditions, and discretization",
      "weighted residuals, weak forms, and finite elements",
      "element formulation, assembly, constraints, and solvers",
      "mesh-converged structural FEA benchmark",
      "finite-volume conservation and transport discretization",
      "pressure-velocity coupling, turbulence, and stability",
      "verification, validation, uncertainty, and credibility",
      "multiphysics simulation portfolio and defense",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Solve a benchmark structure with at least three meshes, compare against an analytical result, and quantify discretization and modeling error.",
    finalBrief:
      "Deliver and orally defend linked FEA/CFD studies with solver independence, conservation checks, validation data, uncertainty, and decision limits.",
    resource: resource(
      "mit-2-094-finite-element-analysis-solids-fluids-2",
      "2.094: Finite Element Analysis of Solids and Fluids II",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/2-094-finite-element-analysis-of-solids-and-fluids-ii-spring-2011/",
      "course",
      ["Klaus-Jurgen Bathe"],
    ),
  },
  {
    key: "mechatronics-embedded-control",
    code: "MECH501",
    slug: "mechatronics-embedded-control",
    title: "Mechatronics and Embedded Control",
    term: 5,
    credits: 4,
    format: "laboratory",
    summary:
      "Actuators, sensors, microcontrollers, real-time software, power interfaces, state machines, digital control, communications, faults, and system integration.",
    primaryOutcome:
      "Integrate mechanics, electronics, firmware, and feedback into a bounded-energy system with measured timing, performance, and safe failure behavior.",
    prerequisiteKeys: ["electronics-sensors-data-acquisition", "system-dynamics-feedback-control", "machine-elements-mechanical-design"],
    competencyKeys: ["dynamics-control", "design-manufacturing"],
    topics: topics(
      "mechatronic architecture, interfaces, and power budgets",
      "motors, actuators, drives, and transmission matching",
      "microcontrollers, timers, interrupts, and peripherals",
      "closed-loop actuator prototype in simulation",
      "real-time scheduling, sampling, latency, and jitter",
      "state machines, communications, and diagnostics",
      "fault handling, watchdogs, safe states, and HIL tests",
      "integrated mechatronic release and defense",
    ),
    assessmentKinds: ["lab", "project"],
    appliedBrief:
      "Implement a simulated position, speed, or temperature controller and measure tracking, saturation, timing jitter, and fault recovery.",
    finalBrief:
      "Release and defend an integrated mechatronic system with interface contracts, code, controller evidence, power budget, hazard log, and regression tests.",
    safetyNote:
      "Simulation and hardware-in-the-loop are sufficient. Physical systems must be extra-low-voltage and force/speed limited with guards, current limiting, emergency stop, and supervision.",
    resource: resource(
      "mit-2-737-mechatronics",
      "2.737: Mechatronics",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/2-737-mechatronics-fall-2014/",
      "course",
      ["David Trumper"],
    ),
  },
  {
    key: "integrated-mechanical-systems-laboratory",
    code: "LAB501",
    slug: "integrated-mechanical-systems-laboratory",
    title: "Integrated Mechanical Systems Laboratory",
    term: 5,
    credits: 4,
    format: "laboratory",
    summary:
      "Integrated solid, thermal, fluid, vibration, and control experiments with instrumentation planning, uncertainty, model calibration, faults, and reproducible reporting.",
    primaryOutcome:
      "Plan and close a multidisciplinary verification campaign that distinguishes model, instrument, process, and implementation failures.",
    prerequisiteKeys: ["probability-measurement-experimental-methods", "heat-mass-transfer", "system-dynamics-feedback-control", "machine-elements-mechanical-design"],
    competencyKeys: ["experimentation-computation", "professional-practice"],
    topics: topics(
      "verification strategy, hazards, configuration, and traceability",
      "structural load-strain-deflection experiment",
      "vibration, modal, and frequency-response experiment",
      "thermal-fluid parameter identification practical",
      "closed-loop dynamic-system experiment",
      "multisensor synchronization and data integrity",
      "fault injection, root cause, and corrective action",
      "integrated verification campaign and defense",
    ),
    assessmentKinds: ["lab", "presentation"],
    appliedBrief:
      "Identify a thermal or flow parameter from a controlled dataset, propagate calibration uncertainty, and challenge the model on held-out conditions.",
    finalBrief:
      "Execute or simulate a multidisciplinary verification campaign and defend requirements traceability, raw evidence, anomalies, corrections, and remaining risk.",
    safetyNote:
      "Simulation and public datasets can satisfy every unit. Physical work requires an approved hazard analysis, rated rigs, energy isolation, guards, PPE, emergency stop, and qualified supervision.",
    resource: resource(
      "mit-2-672-project-laboratory",
      "2.672: Project Laboratory",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/2-672-project-laboratory-spring-2009/",
      "course",
      ["Douglas Hart", "Wai Cheng"],
    ),
  },
  {
    key: "capstone-design-1",
    code: "CAP501",
    slug: "capstone-design-1-needs-requirements-architecture-prototype",
    title: "Capstone Design I: Needs, Requirements, Architecture, and Prototype",
    term: 5,
    credits: 4,
    format: "capstone",
    summary:
      "Stakeholder research, requirements, ethics, system architecture, trade studies, modeling, risk, project planning, prototyping, and design review.",
    primaryOutcome:
      "Turn a consequential need into a feasible, ethical, testable system definition and evidence-backed prototype plan.",
    prerequisiteKeys: ["machine-elements-mechanical-design", "advanced-manufacturing-product-realization", "probability-measurement-experimental-methods"],
    competencyKeys: ["design-manufacturing", "experimentation-computation", "professional-practice"],
    topics: topics(
      "stakeholders, context, need, and success measures",
      "requirements, interfaces, standards, and traceability",
      "concept generation, architecture, and trade studies",
      "preliminary design review with model evidence",
      "hazards, ethics, accessibility, and misuse",
      "project plan, budget, configuration, and team practice",
      "critical experiments, prototypes, and risk retirement",
      "critical design review and prototype defense",
    ),
    assessmentKinds: ["project", "presentation"],
    appliedBrief:
      "Hold a preliminary design review with stakeholder evidence, requirements, architecture, alternatives, first-principles models, risks, and closure actions.",
    finalBrief:
      "Pass a critical design review with a safe prototype or digital twin, verified interfaces, manufacturing/test plan, budget, ethics case, and open-risk register.",
    safetyNote:
      "A simulation-only capstone is fully valid. Physical work requires qualified local supervision, approved facilities, a living hazard log, safe state, emergency response, and explicit stop criteria.",
    resource: resource(
      "mit-15-783j-product-design-development",
      "15.783J: Product Design and Development",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/15-783j-product-design-and-development-spring-2006/",
      "course",
      ["Matthew Kressy", "Steven Eppinger", "Thomas Roemer", "Warren Seering"],
    ),
  },
  {
    key: "thermal-fluid-systems-energy-conversion",
    code: "ENER601",
    slug: "thermal-fluid-systems-energy-conversion",
    title: "Thermal-Fluid Systems Design and Energy Conversion",
    term: 6,
    credits: 4,
    format: "studio",
    summary:
      "Integrated cycles, pumps, compressors, turbines, heat exchangers, piping, thermal management, optimization, control, economics, emissions, and off-design behavior.",
    primaryOutcome:
      "Design and optimize an integrated thermal-fluid system whose performance, cost, environmental impact, and off-design limits are evidenced.",
    prerequisiteKeys: ["engineering-thermodynamics", "fluid-mechanics", "heat-mass-transfer", "probability-measurement-experimental-methods"],
    competencyKeys: ["thermal-fluids", "design-manufacturing"],
    topics: topics(
      "requirements, loads, architectures, and operating envelopes",
      "pumps, compressors, turbines, and component maps",
      "piping networks, heat exchangers, and thermal integration",
      "integrated cycle model and design trade study",
      "off-design performance, transients, and controls",
      "efficiency, exergy, economics, and emissions",
      "optimization, uncertainty, maintenance, and safety",
      "thermal-fluid system release and defense",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Build and optimize an integrated cycle or thermal-management model, checking component maps, balances, costs, and off-design cases.",
    finalBrief:
      "Defend a complete system release with architecture, sizing, controls, economics, emissions, uncertainty, hazards, and verification plan.",
    safetyNote:
      "Simulation is the standard route. Combustion, pressure, rotating machinery, refrigerants, hot fluids, and high-power testing require certified equipment and professional supervision.",
    resource: resource(
      "nptel-design-optimization-energy-systems",
      "Design and Optimization of Energy Systems",
      "NPTEL · IIT Madras",
      "https://nptel.ac.in/courses/112106064",
      "course",
      ["C. Balaji"],
    ),
  },
  {
    key: "failure-reliability-safety-lifecycle",
    code: "RELI601",
    slug: "failure-reliability-safety-lifecycle-engineering",
    title: "Failure, Reliability, Safety, and Lifecycle Engineering",
    term: 6,
    credits: 4,
    format: "studio",
    summary:
      "Failure analysis, fatigue and fracture, reliability statistics, FMEA, fault trees, maintainability, risk, design assurance, lifecycle, and incident learning.",
    primaryOutcome:
      "Build a defensible safety and reliability case linking failure physics, probabilistic evidence, controls, verification, and lifecycle decisions.",
    prerequisiteKeys: ["mechanics-materials-solid-structures", "machine-elements-mechanical-design", "advanced-manufacturing-product-realization", "probability-measurement-experimental-methods"],
    competencyKeys: ["solids-materials", "professional-practice"],
    topics: topics(
      "failure evidence, root cause, and competing hypotheses",
      "fatigue, fracture, wear, corrosion, and creep",
      "reliability distributions, censoring, and confidence",
      "FMEA and fault-tree risk assessment",
      "design assurance, derating, redundancy, and fail safety",
      "maintainability, inspection, and condition monitoring",
      "lifecycle, recall, incident response, and learning",
      "complete reliability and safety case defense",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Perform an FMEA and quantitative fault-tree analysis for a mechanical subsystem, then tie top risks to controls and verification evidence.",
    finalBrief:
      "Defend a lifecycle safety case for an incident-prone product, including failure physics, uncertainty, maintenance, residual risk, and recall criteria.",
    safetyNote:
      "Analyze supplied evidence or simulations. Do not reproduce dangerous failures; destructive, fire, pressure, impact, or overspeed testing belongs only in qualified facilities.",
    resource: resource(
      "mit-22-38-reliability-quality-risk",
      "22.38: Probability and Its Applications to Reliability, Quality Control, and Risk Assessment",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/22-38-probability-and-its-applications-to-reliability-quality-control-and-risk-assessment-fall-2005/",
      "course",
      ["George Apostolakis"],
    ),
  },
  {
    key: "engineering-practice",
    code: "PROF601",
    slug: "engineering-practice-ethics-economics-communication-leadership",
    title: "Engineering Practice: Ethics, Economics, Communication, and Leadership",
    term: 6,
    credits: 4,
    format: "seminar",
    summary:
      "Professional responsibility, codes and standards, public safety, accessibility, sustainability, engineering economics, project leadership, negotiation, and technical communication.",
    primaryOutcome:
      "Make and communicate an accountable engineering recommendation that integrates technical evidence, economics, safety, ethics, and public consequences.",
    prerequisiteKeys: ["capstone-design-1"],
    competencyKeys: ["professional-practice"],
    topics: topics(
      "professional duty, codes, standards, and licensure boundaries",
      "stakeholders, justice, accessibility, and informed consent",
      "hazard, uncertainty, whistleblowing, and case analysis",
      "ethical decision memo under conflicting incentives",
      "time value, lifecycle cost, and engineering economy",
      "project planning, teams, conflict, and negotiation",
      "technical reports, presentations, and public communication",
      "board-level recommendation and oral defense",
    ),
    assessmentKinds: ["portfolio", "presentation"],
    appliedBrief:
      "Write a decision memo for a safety/economic conflict, identify duties and affected groups, quantify alternatives, and state dissent and escalation routes.",
    finalBrief:
      "Present and defend a deploy, redesign, or stop recommendation to a mixed technical/public panel with evidence, economics, ethics, and uncertainty.",
    resource: resource(
      "mit-esd-932-engineering-ethics",
      "ESD.932: Engineering Ethics",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/esd-932-engineering-ethics-spring-2006/",
      "course",
      ["Taft Broome"],
    ),
  },
  {
    key: "capstone-design-2",
    code: "CAP602",
    slug: "capstone-design-2-build-verify-validate-defend",
    title: "Capstone Design II: Build, Verify, Validate, and Defend",
    term: 6,
    credits: 4,
    format: "capstone",
    summary:
      "Detailed design, implementation, integration, configuration control, verification, user validation, failure correction, release, demonstration, and public defense.",
    primaryOutcome:
      "Deliver a reproducible mechanical-system release whose requirements, risks, implementation, evidence, limitations, and ownership survive external review.",
    prerequisiteKeys: ["capstone-design-1", "integrated-mechanical-systems-laboratory"],
    competencyKeys: ["design-manufacturing", "experimentation-computation", "professional-practice"],
    topics: topics(
      "design baseline, interfaces, configuration, and readiness",
      "implementation, procurement, manufacturing, and integration",
      "test fixtures, procedures, traceability, and data integrity",
      "test-readiness review and critical verification",
      "failure triage, root cause, redesign, and regression",
      "stakeholder validation, usability, and lifecycle evidence",
      "release package, limitations, maintenance, and handoff",
      "public demonstration, portfolio, and oral defense",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Pass test-readiness review, execute the highest-risk verification, and close failures with controlled revisions and regression evidence.",
    finalBrief:
      "Publish, demonstrate, and defend the complete system release, including reproducible artifacts, requirement coverage, safety case, limitations, and lessons learned.",
    safetyNote:
      "A verified digital twin is valid. Physical work must remain inside the approved hazard envelope with trained supervision, guarded energy, emergency stop, consent, and stop-work authority.",
    resource: resource(
      "mit-2-009-product-engineering-process-capstone",
      "2.009: Product Engineering Process",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/2-009-product-engineering-process-fall-2021/",
      "course",
      ["David Wallace", "MIT 2.009 course staff"],
    ),
  },
  {
    key: "robot-mechanics-kinematics-motion-planning",
    code: "ROBO501",
    slug: "robot-mechanics-kinematics-motion-planning",
    title: "Robot Mechanics, Kinematics, and Motion Planning",
    term: 5,
    credits: 4,
    format: "laboratory",
    summary:
      "Rigid transformations, forward and inverse kinematics, Jacobians, robot dynamics, trajectory generation, configuration space, collision checking, and planning.",
    primaryOutcome:
      "Model a robot, plan collision-free motion, and validate geometric and dynamic claims in reproducible simulation.",
    prerequisiteKeys: ["rigid-body-dynamics-vibrations", "linear-algebra-differential-equations-numerical-methods", "system-dynamics-feedback-control"],
    competencyKeys: ["dynamics-control", "design-manufacturing"],
    concentrationKey: "robotics-autonomous-systems",
    topics: topics(
      "configuration, rigid transforms, frames, and twists",
      "forward kinematics and workspace",
      "Jacobians, singularities, and differential motion",
      "inverse-kinematics solver and validation",
      "robot dynamics and actuator limits",
      "trajectory generation and tracking",
      "configuration space, collision checking, and planning",
      "planned robot mission and mechanics defense",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Implement and test an inverse-kinematics solver across reachable, singular, redundant, and unreachable targets with clear residual criteria.",
    finalBrief:
      "Complete and defend a simulated manipulation or mobile-robot mission with kinematics, dynamics, collision checks, planning, and limit evidence.",
    safetyNote:
      "Simulation is sufficient. Physical robots require guarded space, force/speed limits, emergency stop, collision monitoring, human override, and trained supervision.",
    resource: resource(
      "modern-robotics-mechanics-planning-control-track",
      "Modern Robotics: Mechanics, Planning, and Control",
      "Northwestern University",
      "https://modernrobotics.northwestern.edu/",
      "textbook",
      ["Kevin M. Lynch", "Frank C. Park"],
    ),
  },
  {
    key: "autonomous-machines-perception-estimation-control",
    code: "ROBO601",
    slug: "autonomous-machines-perception-estimation-control",
    title: "Autonomous Machines: Perception, Estimation, and Control",
    term: 6,
    credits: 4,
    format: "laboratory",
    summary:
      "Sensor models, calibration, Bayesian estimation, filtering, perception, localization, mapping, planning-control integration, uncertainty, safety monitors, and scenario testing.",
    primaryOutcome:
      "Build and defend an autonomous system whose state estimates, decisions, controls, failures, and safety envelope are quantitatively tested.",
    prerequisiteKeys: ["robot-mechanics-kinematics-motion-planning", "mechatronics-embedded-control", "probability-measurement-experimental-methods", "programming-engineering-computation"],
    competencyKeys: ["dynamics-control", "experimentation-computation"],
    concentrationKey: "robotics-autonomous-systems",
    topics: topics(
      "probabilistic state, sensor models, and calibration",
      "Bayesian filtering and Kalman estimation",
      "geometric perception and feature uncertainty",
      "localization pipeline with held-out validation",
      "mapping, data association, and loop closure",
      "planning and feedback under uncertainty",
      "faults, safety monitors, recovery, and human override",
      "autonomous mission benchmark and defense",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Build a localization estimator, benchmark it against ground truth and sensor dropouts, and calibrate reported uncertainty.",
    finalBrief:
      "Run and defend a reproducible autonomous mission across nominal, hidden, degraded, and recovery scenarios with independent safety monitoring.",
    safetyNote:
      "Use simulation by default. Physical autonomy requires a closed test area, conservative force/speed limits, emergency stop, safety driver, privacy review, and qualified supervision.",
    resource: resource(
      "underactuated-robotics",
      "Underactuated Robotics",
      "MIT Robot Locomotion Group",
      "https://underactuated.mit.edu/",
      "textbook",
      ["Russ Tedrake"],
    ),
  },
  {
    key: "aerodynamics-compressible-flow",
    code: "AERO501",
    slug: "aerodynamics-compressible-flow",
    title: "Aerodynamics and Compressible Flow",
    term: 5,
    credits: 4,
    format: "laboratory",
    summary:
      "Potential flow, airfoils, finite wings, boundary layers, drag, compressibility, shocks, nozzles, similarity, and aerodynamic testing or simulation.",
    primaryOutcome:
      "Predict and validate aerodynamic loads and losses across incompressible and compressible regimes with explicit model limits.",
    prerequisiteKeys: ["fluid-mechanics", "engineering-thermodynamics", "linear-algebra-differential-equations-numerical-methods"],
    competencyKeys: ["thermal-fluids", "experimentation-computation"],
    concentrationKey: "aerospace-propulsion",
    topics: topics(
      "aerodynamic forces, coefficients, and similarity",
      "potential flow, circulation, and lift",
      "airfoils, finite wings, induced drag, and stall",
      "airfoil data analysis and model validation",
      "boundary layers, separation, and viscous drag",
      "compressible flow, Mach waves, and stagnation properties",
      "normal and oblique shocks, expansions, and nozzles",
      "aircraft aerodynamic envelope and defense",
    ),
    assessmentKinds: ["project", "exam"],
    appliedBrief:
      "Analyze an open airfoil dataset or verified CFD case, reconcile lift/drag models, and identify Reynolds, Mach, stall, and uncertainty limits.",
    finalBrief:
      "Complete a cumulative exam and defend an aerodynamic design across low-speed, stall, compressible, and off-design conditions.",
    safetyNote:
      "Use public data or CFD. Wind tunnels, compressed gas, high-speed rotors, flight models, and outdoor testing require rated facilities, containment, permissions, and supervision.",
    resource: resource(
      "mit-16-100-aerodynamics",
      "16.100: Aerodynamics",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/16-100-aerodynamics-fall-2005/",
      "course",
      ["David Darmofal"],
    ),
  },
  {
    key: "propulsion-flight-systems-design",
    code: "AERO601",
    slug: "propulsion-flight-systems-design",
    title: "Propulsion and Flight Systems Design",
    term: 6,
    credits: 4,
    format: "studio",
    summary:
      "Aircraft performance, propulsion requirements, gas-turbine and rocket cycles, inlets, compressors, combustors, turbines, nozzles, matching, structures, controls, and mission design.",
    primaryOutcome:
      "Synthesize and defend a propulsion-flight system whose mission performance, component matching, thermal limits, risk, and emissions are evidenced.",
    prerequisiteKeys: ["aerodynamics-compressible-flow", "heat-mass-transfer", "rigid-body-dynamics-vibrations", "computational-mechanics-fea-cfd"],
    competencyKeys: ["thermal-fluids", "design-manufacturing"],
    concentrationKey: "aerospace-propulsion",
    topics: topics(
      "mission, flight mechanics, thrust, drag, and performance",
      "propulsive efficiency and cycle selection",
      "inlets, compressors, combustors, turbines, and nozzles",
      "matched engine-cycle model and design review",
      "rocket propulsion and nozzle expansion",
      "thermal, structural, material, and cooling limits",
      "off-design control, operability, emissions, and risk",
      "mission-propulsion system release and defense",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Build and match a gas-turbine or electric-propulsion cycle to a stated mission, then close thrust, energy, mass, and off-design checks.",
    finalBrief:
      "Defend a flight-propulsion design with mission analysis, component maps, thermal/structural limits, controls, emissions, hazards, and verification.",
    safetyNote:
      "This is a modeling course. Do not build or test combustors, rockets, pressure-fed systems, propellers, turbines, or flight vehicles outside licensed facilities and expert supervision.",
    resource: resource(
      "mit-16-50-introduction-propulsion-systems",
      "16.50: Introduction to Propulsion Systems",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/16-50-introduction-to-propulsion-systems-spring-2012/",
      "course",
      ["Manuel Martinez-Sanchez"],
    ),
  },
  {
    key: "advanced-energy-conversion",
    code: "SUST501",
    slug: "advanced-energy-conversion-turbomachinery-combustion-fuel-cells",
    title: "Advanced Energy Conversion: Turbomachinery, Combustion, and Fuel Cells",
    term: 5,
    credits: 4,
    format: "laboratory",
    summary:
      "Energy resources, thermo-mechanical conversion, turbomachinery, combustion, electrochemistry, fuel cells, batteries, solar conversion, storage, efficiency, and environmental impact.",
    primaryOutcome:
      "Compare and design energy-conversion pathways using first- and second-law performance, kinetics, materials, cost, emissions, and uncertainty.",
    prerequisiteKeys: ["engineering-thermodynamics", "fluid-mechanics", "heat-mass-transfer"],
    competencyKeys: ["thermal-fluids", "experimentation-computation"],
    concentrationKey: "sustainable-energy",
    topics: topics(
      "energy challenges, resources, exergy, and metrics",
      "thermo-mechanical conversion and turbomachinery",
      "combustion, reacting flows, emissions, and alternatives",
      "comparative conversion-system model and audit",
      "electrochemistry, fuel cells, electrolysis, and hydrogen",
      "batteries, degradation, and thermal management",
      "solar, wind, geothermal, and hybrid conversion",
      "energy-conversion portfolio and defense",
    ),
    assessmentKinds: ["project", "oral"],
    appliedBrief:
      "Model two competing conversion pathways for one service and compare exergy loss, efficiency, material intensity, cost, emissions, and sensitivity.",
    finalBrief:
      "Defend a conversion-and-storage portfolio under realistic demand, resource, degradation, safety, and environmental constraints.",
    safetyNote:
      "Use simulation and published datasets. Combustion, hydrogen, high-pressure gas, turbines, electrolysis, batteries, and high-temperature electrochemistry require certified facilities and experts.",
    resource: resource(
      "mit-2-60j-advanced-energy-conversion-track",
      "2.60J: Fundamentals of Advanced Energy Conversion",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/2-60j-fundamentals-of-advanced-energy-conversion-spring-2020/",
      "course",
      ["Ahmed F. Ghoniem"],
    ),
  },
  {
    key: "renewable-energy-storage-decarbonization",
    code: "SUST601",
    slug: "renewable-energy-thermal-storage-decarbonization",
    title: "Renewable Energy, Thermal Storage, and Decarbonization",
    term: 6,
    credits: 4,
    format: "studio",
    summary:
      "Renewable supply, thermal and electrochemical storage, HVAC and heat pumps, sector coupling, demand profiles, dispatch, lifecycle carbon, resilience, policy constraints, and transition design.",
    primaryOutcome:
      "Design and defend a resilient low-carbon energy system using hourly balances, storage dynamics, lifecycle evidence, economics, and equitable constraints.",
    prerequisiteKeys: ["advanced-energy-conversion", "probability-measurement-experimental-methods", "computational-mechanics-fea-cfd"],
    competencyKeys: ["thermal-fluids", "professional-practice"],
    concentrationKey: "sustainable-energy",
    topics: topics(
      "demand profiles, weather data, and renewable resources",
      "solar, wind, geothermal, waste heat, and electrification",
      "thermal storage, batteries, hydrogen, and degradation",
      "hourly system sizing and dispatch study",
      "heat pumps, HVAC, industry, transport, and sector coupling",
      "lifecycle carbon, materials, cost, and externalities",
      "resilience, uncertainty, policy, justice, and transition",
      "decarbonization portfolio and public defense",
    ),
    assessmentKinds: ["project", "presentation"],
    appliedBrief:
      "Size and dispatch a renewable-plus-storage system over an hourly dataset, then stress it against weather, demand, degradation, and outage cases.",
    finalBrief:
      "Present and defend a phased decarbonization plan with transparent balances, lifecycle carbon, cost, resilience, uncertainty, distributional effects, and stop conditions.",
    safetyNote:
      "Use simulation and public datasets. Do not build mains-connected generation, battery packs, hydrogen systems, refrigerant loops, or thermal stores without licensed facilities and supervision.",
    resource: resource(
      "mit-22-081j-introduction-sustainable-energy",
      "22.081J: Introduction to Sustainable Energy",
      "MIT OpenCourseWare",
      "https://ocw.mit.edu/courses/22-081j-introduction-to-sustainable-energy-fall-2010/pages/",
      "course",
      ["Michael Golay", "Randall Field", "William Green Jr.", "John C. Wright"],
    ),
  },
] as const satisfies readonly MechanicalEngineeringCourseSpec[];
