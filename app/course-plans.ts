import type { TrackId } from "./data";

export type AssessmentType =
  | "study"
  | "practice"
  | "problem-set"
  | "quiz"
  | "lab"
  | "midterm"
  | "project"
  | "presentation"
  | "final";

export type CourseWeek = {
  week: number;
  title: string;
  topic: string;
  whereLabel: string;
  resourceTitle: string;
  action: string;
  evidence: string;
  hours: number;
  assessmentType: AssessmentType;
};

export type CoursePlan = {
  courseCode: string;
  primaryResource: string;
  alternatives: string[];
  setup: string[];
  firstAction: string;
  safetyLabNote?: string;
  weeks: CourseWeek[];
};

export type TrackCoursePlan = CoursePlan & {
  trackId: TrackId;
  trackName: string;
};

type WeekSpec = readonly [
  title: string,
  topic: string,
  whereLabel: string,
  resourceTitle: string,
  action: string,
  evidence: string,
  hours: number,
  assessmentType: AssessmentType,
];

type SixteenWeekSpecs = readonly [
  WeekSpec,
  WeekSpec,
  WeekSpec,
  WeekSpec,
  WeekSpec,
  WeekSpec,
  WeekSpec,
  WeekSpec,
  WeekSpec,
  WeekSpec,
  WeekSpec,
  WeekSpec,
  WeekSpec,
  WeekSpec,
  WeekSpec,
  WeekSpec,
];

type CoursePlanInput = Omit<CoursePlan, "weeks"> & {
  weeks: SixteenWeekSpecs;
};

type TrackCoursePlanInput = Omit<TrackCoursePlan, "weeks"> & {
  weeks: SixteenWeekSpecs;
};

function materializeWeeks(specs: SixteenWeekSpecs): CourseWeek[] {
  return specs.map(
    (
      [
        title,
        topic,
        whereLabel,
        resourceTitle,
        action,
        evidence,
        hours,
        assessmentType,
      ],
      index,
    ) => ({
      week: index + 1,
      title,
      topic,
      whereLabel,
      resourceTitle,
      action,
      evidence,
      hours,
      assessmentType,
    }),
  );
}

function defineCourse(input: CoursePlanInput): CoursePlan {
  return { ...input, weeks: materializeWeeks(input.weeks) };
}

function defineTrackCourse(input: TrackCoursePlanInput): TrackCoursePlan {
  return { ...input, weeks: materializeWeeks(input.weeks) };
}

export const coursePlans: Record<string, CoursePlan> = {
  MATH101: defineCourse({
    courseCode: "MATH101",
    primaryResource: "Single Variable Calculus",
    alternatives: ["The Feynman Lectures on Physics", "SciPy"],
    setup: [
      "Create a calculus notebook with one page for definitions, one for worked problems, and one for errors.",
      "Install Python with SciPy or use a browser notebook for numerical checks and plots.",
    ],
    firstAction:
      "Take the Single Variable Calculus diagnostic, then complete the first limits lecture and five warm-up problems.",
    weeks: [
      ["Measure change", "Functions, units, graphs, and engineering models", "Course introduction · functions and models", "Single Variable Calculus", "Model three measured relationships and state each domain, range, and unit.", "Three labeled plots plus model assumptions", 10, "study"],
      ["Approach a limit", "Limits from tables, graphs, and algebra", "Unit 1 · limits and continuity", "Single Variable Calculus", "Study the limits sessions and solve 15 mixed limit problems without a calculator.", "Checked limit problem set", 10, "problem-set"],
      ["Make continuity precise", "Continuity, intermediate values, and failure modes", "Unit 1 · continuity", "Single Variable Calculus", "Classify discontinuities and justify two existence claims with the intermediate value theorem.", "One-page continuity proof sheet", 10, "practice"],
      ["Build the derivative", "Derivative definition, tangent approximation, and velocity", "Unit 2 · differentiation", "Single Variable Calculus", "Derive five derivatives from first principles and compare a numerical slope estimate.", "Derivation notebook and slope plot", 10, "problem-set"],
      ["Differentiate systems", "Product, quotient, chain, implicit, and inverse rules", "Unit 2 · differentiation rules", "Single Variable Calculus", "Solve a timed mixed set and write an error log for every missed rule.", "Timed set and corrected error log", 10, "quiz"],
      ["Checkpoint I · rates", "Limits, continuity, derivatives, and interpretation", "Practice exams · Exam 1 route", "Single Variable Calculus", "Sit a closed-notes 90-minute exam, grade it, and repair every weak objective.", "Midterm I, score sheet, and corrections", 10, "midterm"],
      ["Use derivatives to predict", "Linearization, differentials, and uncertainty", "Unit 2 · approximation", "Single Variable Calculus", "Linearize two sensor models and estimate propagated measurement error.", "Two model cards with error bounds", 10, "lab"],
      ["Optimize a design", "Extrema, constraints, related rates, and curve shape", "Unit 3 · applications of differentiation", "Single Variable Calculus", "Solve an enclosure or power-transfer optimization and verify it numerically.", "Optimization memo with plot", 10, "project"],
      ["Accumulate change", "Antiderivatives, definite integrals, and net change", "Unit 4 · definite integral", "Single Variable Calculus", "Approximate an integral from sampled data, then compare with an analytic answer.", "Riemann-sum table and comparison", 10, "problem-set"],
      ["Connect rate and accumulation", "Fundamental theorem of calculus", "Unit 4 · fundamental theorem", "Single Variable Calculus", "Explain both parts of the theorem and solve 12 evaluation/differentiation problems.", "Concept map and solved set", 10, "practice"],
      ["Checkpoint II · modeling practical", "Derivative and integral models under time pressure", "Practice exams · cumulative route", "Single Variable Calculus", "Complete a two-hour modeling practical using motion and current/charge data.", "Midterm II practical and corrections", 10, "midterm"],
      ["Choose an integration method", "Substitution, parts, and numerical quadrature", "Unit 4 · techniques and numerical integration", "Single Variable Calculus", "Build a decision tree for methods and solve ten mixed integrals.", "Method decision tree and solutions", 10, "problem-set"],
      ["Solve differential models", "Separable equations, exponential growth, and time constants", "Unit 5 · differential equations", "Single Variable Calculus", "Fit and solve a charging, cooling, or population model from data.", "Parameter fit, solution, and residual plot", 10, "lab"],
      ["Approximate with series", "Taylor polynomials and remainder", "Unit 5 · approximation by series", "Single Variable Calculus", "Construct polynomial approximations for sine and exponential and measure error.", "Approximation notebook with error curves", 10, "project"],
      ["Demonstrate a model", "End-to-end calculus investigation", "Course review · modeling synthesis", "Single Variable Calculus", "Present a physical-data model that uses both a derivative and an integral.", "Five-minute demo, notebook, and peer critique", 10, "presentation"],
      ["Defend mastery", "Cumulative calculus and transfer to engineering", "Final exam materials", "Single Variable Calculus", "Sit the cumulative final, then write how its methods transfer to mechanics and circuits.", "Final exam, corrections, and transfer note", 10, "final"],
    ],
  }),
  PHYS101: defineCourse({
    courseCode: "PHYS101",
    primaryResource: "Classical Mechanics",
    alternatives: ["The Feynman Lectures on Physics", "SciPy"],
    setup: [
      "Keep a diagram-first physics notebook and a separate uncertainty table.",
      "Prepare a phone camera, ruler, household masses, and Python/SciPy for safe motion experiments.",
    ],
    firstAction:
      "Complete the Classical Mechanics vectors and kinematics reading, then record and analyze one falling or rolling object.",
    safetyLabNote:
      "Use low masses, clear drop zones, eye protection around stretched springs, and never create projectiles near people or fragile objects.",
    weeks: [
      ["Describe motion", "Units, vectors, position, velocity, and acceleration", "Week 1 · vectors and kinematics", "Classical Mechanics", "Solve the vector warm-up and extract position data from a short motion video.", "Vector set and position-time plot", 10, "lab"],
      ["Predict constant acceleration", "One- and two-dimensional kinematics", "Kinematics sessions · constant acceleration", "Classical Mechanics", "Solve 12 kinematics problems and test one prediction with video timing.", "Checked set and experiment residuals", 10, "problem-set"],
      ["Draw the forces", "Newton's laws and free-body diagrams", "Dynamics I · Newton's laws", "Classical Mechanics", "Draw and audit 15 free-body diagrams before writing any equations.", "Annotated free-body diagram portfolio", 10, "practice"],
      ["Model coupled forces", "Friction, tension, circular motion, and constraints", "Dynamics II · applications", "Classical Mechanics", "Solve a pulley/friction system and simulate its acceleration over a parameter sweep.", "Solution and parameter plot", 10, "problem-set"],
      ["Use work and energy", "Work, potential energy, and conservation", "Energy unit · work and potential", "Classical Mechanics", "Measure a rolling object's energy budget and explain non-conservative loss.", "Energy table and uncertainty note", 10, "lab"],
      ["Checkpoint I · particle mechanics", "Kinematics, forces, and energy", "Exam 1 materials", "Classical Mechanics", "Sit a closed-notes mechanics exam and redo each missed problem from a fresh diagram.", "Midterm I and corrected solutions", 10, "midterm"],
      ["Track momentum", "Impulse, momentum conservation, and center of mass", "Momentum unit", "Classical Mechanics", "Analyze a two-object collision from video or supplied data.", "Momentum-before/after analysis", 10, "lab"],
      ["Rotate the model", "Torque, angular momentum, and rigid-body rotation", "Rotation unit", "Classical Mechanics", "Solve rotational dynamics problems and estimate a household object's moment of inertia.", "Rotation set and inertia estimate", 10, "problem-set"],
      ["Understand equilibrium", "Statics, elasticity, and stress", "Static equilibrium and elasticity", "Classical Mechanics", "Design a paper or stick structure, predict loads, and test it below unsafe failure levels.", "Load diagram and test record", 10, "project"],
      ["Find oscillation", "Simple harmonic motion and energy", "Oscillations unit", "Classical Mechanics", "Measure a pendulum or spring period across parameters and fit the governing model.", "Fit plot and model-limit paragraph", 10, "lab"],
      ["Checkpoint II · mechanics practical", "Momentum, rotation, equilibrium, and oscillation", "Exam 2 and experimental review", "Classical Mechanics", "Complete a mixed written/practical checkpoint using an unseen data set.", "Midterm II practical and corrections", 10, "midterm"],
      ["Make waves", "Wave equation, speed, superposition, and standing waves", "Waves sessions", "The Feynman Lectures on Physics", "Create and analyze a simulated string or audio standing-wave pattern.", "Mode-frequency table and explanation", 10, "lab"],
      ["Connect modes to systems", "Resonance, normal modes, and damping", "Oscillation and resonance review", "Classical Mechanics", "Model a damped oscillator and identify under-, critical-, and over-damped cases.", "Simulation notebook and phase comparison", 10, "project"],
      ["Test a mechanics claim", "Experimental design and uncertainty", "Problem-solving and experimental methods", "Classical Mechanics", "Design a repeatable experiment that distinguishes two plausible mechanics models.", "Protocol, data, uncertainty, and conclusion", 10, "project"],
      ["Demonstrate the investigation", "Mechanics model, evidence, and limitations", "Course synthesis", "Classical Mechanics", "Give a seven-minute demonstration and answer questions from your raw evidence.", "Demo video, data archive, and peer feedback", 10, "presentation"],
      ["Defend mastery", "Cumulative mechanics and waves", "Final exam materials", "Classical Mechanics", "Sit the cumulative final and correct it with explicit diagram/model/unit checks.", "Final exam and mastery corrections", 10, "final"],
    ],
  }),
  CS101: defineCourse({
    courseCode: "CS101",
    primaryResource: "Introduction to Computer Science and Programming in Python",
    alternatives: ["SciPy", "Introduction to Algorithms"],
    setup: [
      "Install Python 3, a code editor, Git, and pytest, or use a browser development environment.",
      "Create one repository with folders for exercises, tests, data, and the final project.",
    ],
    firstAction:
      "Run the course's first Python program, commit it, and deliberately trigger then explain one syntax error.",
    weeks: [
      ["Make the machine respond", "Expressions, variables, types, and the Python execution model", "Lecture 1 · computation and Python basics", "Introduction to Computer Science and Programming in Python", "Complete the first finger exercises and commit a unit-aware calculator.", "Repository link and five passing examples", 8, "practice"],
      ["Control the path", "Conditionals, Boolean logic, and iteration", "Lectures 2–3 · branching and loops", "Introduction to Computer Science and Programming in Python", "Write and test three loop-based engineering conversions.", "Program, tests, and trace table", 8, "problem-set"],
      ["Package an idea", "Functions, scope, contracts, and decomposition", "Functions unit", "Introduction to Computer Science and Programming in Python", "Refactor a monolithic script into documented pure functions.", "Before/after code and test report", 8, "lab"],
      ["Represent data", "Strings, lists, tuples, and mutation", "Structured data unit", "Introduction to Computer Science and Programming in Python", "Parse a small sensor log and compute clean summary statistics.", "Parser, fixtures, and output table", 8, "problem-set"],
      ["Find and fix faults", "Testing, exceptions, debugging, and invariants", "Testing and debugging unit", "Introduction to Computer Science and Programming in Python", "Create failing tests for a buggy program, repair it, and record root causes.", "Test suite and debugging log", 8, "quiz"],
      ["Checkpoint I · program from spec", "Core Python, decomposition, and tests", "First quiz/problem-set review", "Introduction to Computer Science and Programming in Python", "Build a small unseen program in 90 minutes and submit tests plus a code walkthrough.", "Midterm I program, tests, and reflection", 8, "midterm"],
      ["Design abstractions", "Dictionaries, sets, modules, and interfaces", "Data structures and abstraction unit", "Introduction to Computer Science and Programming in Python", "Build a reusable measurement-record module with a documented interface.", "Module, API examples, and tests", 8, "lab"],
      ["Model with objects", "Classes, state, invariants, and composition", "Object-oriented programming unit", "Introduction to Computer Science and Programming in Python", "Implement a sensor or circuit-component class and test state transitions.", "Class implementation and invariant tests", 8, "problem-set"],
      ["Reason about cost", "Search, sort, recursion, and asymptotic growth", "Algorithms and complexity unit", "Introduction to Computer Science and Programming in Python", "Benchmark two search strategies and explain the measured growth.", "Benchmark plot and complexity note", 8, "lab"],
      ["Compute with data", "Arrays, numerical methods, and visualization", "Computational modeling unit", "SciPy", "Load noisy data, clean it, calculate a useful quantity, and plot uncertainty honestly.", "Reproducible notebook and figure", 8, "project"],
      ["Checkpoint II · data practical", "Debugging, abstraction, algorithms, and numerical data", "Cumulative programming route", "Introduction to Computer Science and Programming in Python", "Repair, extend, and test an unfamiliar data-analysis repository under time limit.", "Midterm II repository and repair log", 8, "midterm"],
      ["Simulate a system", "Time stepping, state updates, and validation", "Computational modeling unit", "SciPy", "Simulate projectile, RC, or thermal dynamics and compare against one analytic case.", "Simulation, validation test, and plot", 8, "project"],
      ["Work like a maintainer", "Version control, documentation, review, and reproducibility", "Course workflow and style guidance", "Introduction to Computer Science and Programming in Python", "Open a pull-request-style review of your own project and resolve five issues.", "Commit history, review checklist, README", 8, "practice"],
      ["Build the engineering tool", "Requirements, implementation, tests, and user interface", "Final project guidance", "Introduction to Computer Science and Programming in Python", "Implement a useful calculator, analyzer, or simulator around a real data set.", "Release candidate and automated tests", 8, "project"],
      ["Demo to a user", "Usability, evidence, and technical explanation", "Final project presentations", "Science Writing and New Media", "Run a live demo from a clean setup and collect structured user feedback.", "Demo recording and issue list", 8, "presentation"],
      ["Defend the code", "Cumulative programming, design choices, and limitations", "Final examination/project route", "Introduction to Computer Science and Programming in Python", "Complete the final code review and oral defense, then tag a reproducible release.", "Final project, defense notes, and release tag", 8, "final"],
    ],
  }),
  EE101: defineCourse({
    courseCode: "EE101",
    primaryResource: "Lessons in Electric Circuits",
    alternatives: ["CircuitJS1", "Wokwi", "PhET Circuit Construction Kit: DC"],
    setup: [
      "Bookmark CircuitJS1 and create a Wokwi account or local simulator workspace.",
      "If using hardware, gather only low-voltage USB/battery parts: breadboard, LEDs, resistors, button, and an inexpensive microcontroller.",
    ],
    firstAction:
      "Open CircuitJS1, modify a battery-resistor circuit, and capture voltage/current evidence for two resistor values.",
    safetyLabNote:
      "Use simulation by default. Hardware work must stay extra-low-voltage; never connect to mains, wall outlets, exposed power supplies, or unknown batteries.",
    weeks: [
      ["Map the field", "Circuits, signals, chips, control, communications, and energy", "Textbook index · orientation route", "Lessons in Electric Circuits", "Make a one-page map linking six EE domains to a device you use.", "Annotated EE systems map", 10, "study"],
      ["See voltage and current", "Charge, voltage, current, resistance, and power", "DC volume · basic concepts", "Lessons in Electric Circuits", "Simulate three resistor circuits and reconcile measured power with calculation.", "Schematics and measurement table", 10, "lab"],
      ["Measure without lying", "Meter placement, loading, units, and uncertainty", "DC volume · metering circuits", "Lessons in Electric Circuits", "Use virtual meters incorrectly and correctly, then explain each disturbed reading.", "Metering error gallery", 10, "lab"],
      ["Sense the world", "Voltage dividers, sensors, calibration, and data", "DC volume · divider circuits", "Lessons in Electric Circuits", "Model a light or temperature sensor and produce a two-point calibration.", "Calibration plot and circuit file", 10, "lab"],
      ["Make decisions with logic", "Bits, truth tables, gates, and combinational logic", "Digital volume · logic gates", "Lessons in Electric Circuits", "Implement a two-input alarm in logic and exhaustively test its truth table.", "Truth table, simulation, and test log", 10, "project"],
      ["Checkpoint I · explain and diagnose", "DC circuits, measurement, sensing, and logic", "DC and digital review route", "Lessons in Electric Circuits", "Diagnose four hidden faults and complete a short concept exam.", "Midterm I diagnosis sheet and corrections", 10, "midterm"],
      ["Give a system memory", "State, latches, counters, and timing", "Digital volume · sequential circuits", "Lessons in Electric Circuits", "Build a virtual counter and identify setup, clock, and reset behavior.", "Timing diagram and working simulation", 10, "lab"],
      ["Program a physical interface", "GPIO, firmware loops, inputs, and outputs", "Docs · first microcontroller project", "Wokwi", "Program a button-controlled LED with debounce and a visible state machine.", "Shareable simulation and code comments", 10, "lab"],
      ["Turn data into a signal", "Sampling, aliasing, noise, and filtering intuition", "AC volume · signals and filters", "Lessons in Electric Circuits", "Sample a synthetic waveform at three rates and explain the observed alias.", "Plots and sampling explanation", 10, "lab"],
      ["Close the loop", "Sensors, decisions, actuators, and feedback", "Projects route · control intuition", "Wokwi", "Build a simulated thermostat or motor-speed controller with hysteresis.", "Control trace and design rationale", 10, "project"],
      ["Checkpoint II · integration practical", "Debugging a sensor-to-actuator chain", "Integrated project workspace", "Wokwi", "Repair an unfamiliar embedded circuit/code pair and demonstrate all requirements.", "Midterm II practical, tests, and fault log", 10, "midterm"],
      ["Send information", "Encoding, modulation intuition, bandwidth, and noise", "AC volume · communication concepts", "Lessons in Electric Circuits", "Encode a message as pulses and measure its robustness after adding noise.", "Signal plots and recovered message", 10, "lab"],
      ["Account for energy", "Sources, conversion, efficiency, storage, and heat", "DC volume · power and energy", "Lessons in Electric Circuits", "Create an energy budget for the sensing system and identify its largest loss.", "Energy budget and improvement proposal", 10, "practice"],
      ["Build the sensing system", "Requirements, architecture, implementation, and tests", "Project route · sensor circuits", "Wokwi", "Integrate one sensor, decision rule, indicator/actuator, and recorded output.", "Release candidate and traceable test table", 10, "project"],
      ["Demonstrate the system", "Evidence, usability, faults, and explanation", "Project presentation route", "Science Writing and New Media", "Give a live demo including one injected fault and one measured limitation.", "Demo recording, poster, and peer review", 10, "presentation"],
      ["Defend engineering judgment", "Cumulative concepts and design defense", "Course synthesis route", "Lessons in Electric Circuits", "Sit the final concept check and defend the sensing system from schematic to consequence.", "Final exam, system archive, and defense notes", 10, "final"],
    ],
  }),
  HUM101: defineCourse({
    courseCode: "HUM101",
    primaryResource: "Writing Guide with Handbook",
    alternatives: ["Science Writing and New Media", "IEEE Code of Ethics"],
    setup: [
      "Create a source log with author, claim, evidence, link, date accessed, and license fields.",
      "Choose a citation manager or a consistent manual citation style and enable version history.",
    ],
    firstAction:
      "Write a 250-word explanation of an everyday electrical device for a curious non-engineer, then mark every unsupported claim.",
    weeks: [
      ["Write for a real reader", "Audience, purpose, genre, and constraints", "Unit 1 · rhetorical situation", "Writing Guide with Handbook", "Rewrite one technical paragraph for a peer and for a public reader.", "Two versions and a change rationale", 7, "practice"],
      ["Make a claim", "Thesis, reasons, evidence, and warrants", "Argument unit · position and support", "Writing Guide with Handbook", "Diagram the argument in a technology opinion and identify its missing warrant.", "Argument map and 300-word critique", 7, "problem-set"],
      ["Check the source", "Authority, currency, relevance, bias, and traceability", "Research unit · evaluating sources", "Writing Guide with Handbook", "Evaluate six sources on one engineering claim and rank their evidential value.", "Completed source-evaluation matrix", 7, "lab"],
      ["Explain a mechanism", "Sequence, causality, analogy, and definition", "Exposition unit · process and analysis", "Science Writing and New Media", "Explain how a sensor works using one diagram and no unexplained jargon.", "Illustrated 600-word mechanism brief", 7, "project"],
      ["Show the evidence", "Tables, figures, captions, uncertainty, and visual integrity", "Handbook · multimodal and visual writing", "Writing Guide with Handbook", "Redesign a misleading chart and write a caption that supports independent reading.", "Before/after figure and rationale", 7, "quiz"],
      ["Checkpoint I · source-aware memo", "Audience, argument, evidence, and visual explanation", "Professional writing route · memo", "Writing Guide with Handbook", "Produce a timed two-page recommendation memo from a supplied evidence packet.", "Midterm I memo and revision plan", 7, "midterm"],
      ["Report a method", "Reproducibility, methods, results, and limitations", "Science writing · reporting research", "Science Writing and New Media", "Turn a small experiment or data analysis into a method-and-results section.", "Methods, results, and reproducibility checklist", 7, "project"],
      ["Quote and paraphrase honestly", "Attribution, synthesis, plagiarism, and citation", "Research unit · integrating sources", "Writing Guide with Handbook", "Create a synthesis paragraph from three sources with an auditable claim trail.", "Paragraph, citations, and claim ledger", 7, "practice"],
      ["Revise structure", "Reverse outlining, cohesion, paragraph logic, and transitions", "Revision unit", "Writing Guide with Handbook", "Reverse-outline your memo and restructure it around reader questions.", "Outline, revised draft, and change log", 7, "project"],
      ["Edit the sentence", "Clarity, precision, verbs, concision, and accessible language", "Handbook · language, style, and grammar", "Writing Guide with Handbook", "Cut 20 percent from a dense technical passage without losing a claim.", "Tracked edit and readability note", 7, "quiz"],
      ["Checkpoint II · live edit", "Source checking, structure, figures, and line editing", "Editing and peer-review route", "Science Writing and New Media", "Audit and repair a flawed technical brief under a two-hour limit.", "Midterm II edited brief and audit notes", 7, "midterm"],
      ["Interview for understanding", "Question design, listening, consent, and quotation", "Research unit · primary research", "Writing Guide with Handbook", "Conduct and transcribe a short consented expert or user interview.", "Question guide, consent record, and synthesis", 7, "lab"],
      ["Write through uncertainty", "Calibrated claims, risk, unknowns, and responsible caveats", "Argument and research synthesis", "IEEE Code of Ethics", "Rewrite overconfident claims with quantitative or explicit uncertainty.", "Claim calibration table", 7, "practice"],
      ["Build the public explainer", "Narrative, evidence, visuals, links, and accessibility", "Final project route", "Science Writing and New Media", "Draft a 1,200-word public explainer on an electrical technology.", "Full draft, source ledger, and alt text", 7, "project"],
      ["Publish and present", "Oral delivery, slides, questions, and revision from feedback", "Presentation and new-media route", "Science Writing and New Media", "Deliver a six-minute talk and run a structured peer usability test.", "Talk recording, feedback, and revised explainer", 7, "presentation"],
      ["Defend every claim", "Cumulative writing portfolio and oral defense", "Portfolio and reflection route", "Writing Guide with Handbook", "Submit the portfolio and answer a random source-to-claim audit.", "Final portfolio, defense, and learning reflection", 7, "final"],
    ],
  }),
  MATH102: defineCourse({
    courseCode: "MATH102",
    primaryResource: "Multivariable Calculus",
    alternatives: ["Single Variable Calculus", "GNU Octave"],
    setup: [
      "Install GNU Octave or prepare a browser numerical notebook with 3D plotting.",
      "Keep a formula-to-geometry notebook and a weekly cumulative problem ledger.",
    ],
    firstAction:
      "Review integration and vectors, then plot three space curves from the Multivariable Calculus opening sessions.",
    weeks: [
      ["Enter three dimensions", "Vectors, dot/cross products, lines, planes, and coordinates", "Unit 1 · vectors and matrices", "Multivariable Calculus", "Solve the vector set and render three lines/planes numerically.", "Solutions and labeled 3D plots", 10, "problem-set"],
      ["Trace a moving point", "Vector-valued functions, velocity, acceleration, and arc length", "Unit 1 · vectors and motion", "Multivariable Calculus", "Analyze a helical trajectory and verify speed and curvature numerically.", "Derivation and trajectory notebook", 10, "lab"],
      ["Read a surface", "Functions of several variables, graphs, level sets, and limits", "Unit 2 · partial derivatives", "Multivariable Calculus", "Match six formulas to surfaces and justify continuity at selected points.", "Surface atlas and limit solutions", 10, "practice"],
      ["Differentiate a field", "Partial derivatives, gradient, tangent planes, and linearization", "Unit 2 · derivatives", "Multivariable Calculus", "Compute gradients for two physical fields and test directional predictions.", "Gradient maps and tangent-plane errors", 10, "problem-set"],
      ["Chain many variables", "Chain rule, implicit differentiation, and sensitivity", "Unit 2 · chain rule", "Multivariable Calculus", "Build a dependency graph for a sensor model and calculate sensitivities.", "Dependency graph and sensitivity table", 10, "quiz"],
      ["Checkpoint I · multivariable change", "Vectors, surfaces, gradients, and chain rule", "Practice exams · Exam 1 route", "Multivariable Calculus", "Sit a closed-notes exam and repair each geometric or algebraic error.", "Midterm I and corrected work", 10, "midterm"],
      ["Optimize many variables", "Critical points, Hessians, and constrained optimization", "Unit 2 · maxima and minima", "Multivariable Calculus", "Optimize a two-variable engineering objective and verify the classification.", "Optimization memo and contour plot", 10, "project"],
      ["Accumulate over regions", "Double integrals, coordinate changes, mass, and moments", "Unit 3 · double integrals", "Multivariable Calculus", "Evaluate a nonrectangular integral in Cartesian and polar coordinates.", "Two-method solution and numerical check", 10, "problem-set"],
      ["Integrate through space", "Triple integrals and cylindrical/spherical coordinates", "Unit 3 · triple integrals", "Multivariable Calculus", "Compute charge or mass in a 3D region and visualize the domain.", "Integral derivation and domain plot", 10, "lab"],
      ["Follow a vector field", "Line integrals, work, circulation, and conservative fields", "Unit 4 · line integrals", "Multivariable Calculus", "Calculate work along two paths and test path independence.", "Path comparison and potential function", 10, "problem-set"],
      ["Checkpoint II · field practical", "Optimization and multiple/line integrals", "Practice exams · Exam 2 route", "Multivariable Calculus", "Complete an unseen field-and-region modeling practical with numerical verification.", "Midterm II practical and corrections", 10, "midterm"],
      ["Use Green's theorem", "Circulation, flux, and planar integral theorems", "Unit 4 · Green's theorem", "Multivariable Calculus", "Verify Green's theorem on one vector field both symbolically and numerically.", "Boundary/area calculations and check", 10, "lab"],
      ["Measure flux in 3D", "Surface integrals, divergence, and Gauss's theorem", "Unit 4 · flux and divergence theorem", "Multivariable Calculus", "Compute flux through a closed surface and interpret divergence locally.", "Flux report with field sketch", 10, "problem-set"],
      ["Connect curl and boundary", "Curl, Stokes' theorem, and electromagnetic interpretation", "Unit 4 · curl and Stokes' theorem", "Multivariable Calculus", "Verify Stokes' theorem for a chosen surface and explain orientation.", "Computation, plot, and orientation note", 10, "project"],
      ["Demonstrate a field model", "Integrated gradient, divergence, curl, and flux analysis", "Course synthesis route", "Multivariable Calculus", "Present an electric, thermal, or flow field with one theorem-based validation.", "Demo notebook and seven-minute presentation", 10, "presentation"],
      ["Defend mastery", "Cumulative multivariable calculus", "Final exam materials", "Multivariable Calculus", "Sit the cumulative final and create a transfer map to electromagnetics.", "Final exam, corrections, and transfer map", 10, "final"],
    ],
  }),
  PHYS102: defineCourse({
    courseCode: "PHYS102",
    primaryResource: "Physics II: Electricity and Magnetism",
    alternatives: ["The Feynman Lectures on Physics", "PhET Circuit Construction Kit: DC"],
    setup: [
      "Prepare a diagram-first E&M notebook and a spreadsheet or Python notebook for field plots.",
      "Use simulations for charge, capacitor, magnet, and induction experiments; hardware must remain low-voltage.",
    ],
    firstAction:
      "Review vectors, then complete the electric charge/force opening material and map one two-charge field.",
    safetyLabNote:
      "Do not open mains-powered devices, charge large capacitors, or use improvised high-voltage sources. Simulate any experiment beyond low-voltage batteries.",
    weeks: [
      ["Feel electric force", "Charge, Coulomb's law, superposition, and units", "Electrostatics I · charge and force", "Physics II: Electricity and Magnetism", "Solve point-charge problems and plot the force on a test charge.", "Problem set and vector-force plot", 10, "problem-set"],
      ["Map the electric field", "Electric fields, field lines, and continuous charge", "Electrostatics II · electric field", "Physics II: Electricity and Magnetism", "Calculate and visualize fields for discrete and continuous distributions.", "Field-map notebook", 10, "lab"],
      ["Count flux", "Electric flux and Gauss's law", "Gauss's law unit", "Physics II: Electricity and Magnetism", "Use symmetry to solve three Gauss-law problems and audit each surface choice.", "Symmetry sketches and solutions", 10, "practice"],
      ["Work with potential", "Electric potential, energy, gradient, and equipotentials", "Electric potential unit", "Physics II: Electricity and Magnetism", "Construct potential/field maps and verify their gradient relationship.", "Equipotential map and calculation", 10, "lab"],
      ["Store field energy", "Conductors, capacitance, dielectrics, and energy", "Capacitance unit", "Physics II: Electricity and Magnetism", "Model parallel and series capacitors and explain dielectric effects.", "Capacitor model and energy table", 10, "quiz"],
      ["Checkpoint I · electrostatics", "Force, field, flux, potential, and capacitance", "First examination route", "Physics II: Electricity and Magnetism", "Sit a 90-minute electrostatics exam and redraw every flawed field argument.", "Midterm I and corrections", 10, "midterm"],
      ["Make current flow", "Current density, resistance, emf, and microscopic conduction", "Current and resistance unit", "Physics II: Electricity and Magnetism", "Connect microscopic drift to an I–V model and test it in a virtual circuit.", "Derivation, I–V plot, and circuit file", 10, "lab"],
      ["Build magnetic force", "Lorentz force, motion in fields, and force on wires", "Magnetism I · force", "Physics II: Electricity and Magnetism", "Predict charged-particle trajectories and solve wire-force problems.", "Trajectory plots and solved set", 10, "problem-set"],
      ["Find magnetic fields", "Biot–Savart law, Ampère's law, and magnetic dipoles", "Magnetism II · field sources", "Physics II: Electricity and Magnetism", "Compute fields for a wire, loop, and solenoid and compare approximations.", "Field comparison sheet", 10, "problem-set"],
      ["Induce a voltage", "Faraday's law, Lenz's law, and motional emf", "Induction unit", "Physics II: Electricity and Magnetism", "Run a safe virtual induction experiment and predict polarity before simulation.", "Prediction table and flux/emf plots", 10, "lab"],
      ["Checkpoint II · E&M practical", "Current, magnetic force/field, and induction", "Second examination route", "Physics II: Electricity and Magnetism", "Solve an unseen mixed-field practical including a simulation trace.", "Midterm II practical and corrections", 10, "midterm"],
      ["Store magnetic energy", "Inductance, mutual inductance, and RL transients", "Inductance unit", "Physics II: Electricity and Magnetism", "Model an RL transient and identify where field energy and losses go.", "Transient plot and energy accounting", 10, "lab"],
      ["Unify the laws", "Maxwell's equations and displacement current", "Maxwell equations synthesis", "The Feynman Lectures on Physics", "Make a concept map connecting integral and local meanings of all four laws.", "Maxwell concept map and examples", 10, "project"],
      ["Launch a wave", "Electromagnetic waves, energy flow, polarization, and spectrum", "Electromagnetic waves unit", "Physics II: Electricity and Magnetism", "Calculate wave relationships and analyze polarization with a simulation.", "Wave calculation set and lab note", 10, "project"],
      ["Demonstrate a field-to-device story", "From Maxwell-era physics to a capacitor, motor, or antenna", "Course synthesis route", "Physics II: Electricity and Magnetism", "Present one device from charge/field model through measurable behavior.", "Seven-minute demo and evidence sheet", 10, "presentation"],
      ["Defend mastery", "Cumulative electricity and magnetism", "Final examination route", "Physics II: Electricity and Magnetism", "Sit the cumulative final and correct it using field diagrams and unit checks.", "Final exam and mastery corrections", 10, "final"],
    ],
  }),
  CS102: defineCourse({
    courseCode: "CS102",
    primaryResource: "Introduction to C and C++",
    alternatives: ["Introduction to Algorithms", "Mathematics for Computer Science"],
    setup: [
      "Install a C compiler, make, Git, a debugger, and AddressSanitizer or use a compatible cloud workspace.",
      "Create a repository whose CI command compiles with warnings enabled and runs every test.",
    ],
    firstAction:
      "Compile the first C example with strict warnings, inspect its memory in a debugger, and commit a corrected version.",
    weeks: [
      ["See the compiled machine", "Compilation, types, operators, control flow, and warnings", "Opening lectures · C basics and compilation", "Introduction to C and C++", "Compile five small programs with strict warnings and explain each build stage.", "Programs, build script, and compilation diagram", 8, "lab"],
      ["Control memory", "Addresses, pointers, arrays, and stack layout", "Pointers and memory lectures", "Introduction to C and C++", "Trace pointer operations in a debugger and repair three invalid accesses.", "Memory diagrams and sanitizer-clean code", 8, "problem-set"],
      ["Own dynamic storage", "Heap allocation, lifetime, leaks, and ownership contracts", "Dynamic memory unit", "Introduction to C and C++", "Implement a resizable buffer with failure handling and leak tests.", "Buffer library and memory-check report", 8, "lab"],
      ["Build linked structures", "Structs, linked lists, interfaces, and invariants", "Data structures unit", "Introduction to C and C++", "Implement a linked queue behind a header interface and test edge cases.", "Library, tests, and invariant note", 8, "problem-set"],
      ["Measure algorithmic cost", "Asymptotic analysis, recurrence intuition, and benchmarking", "Asymptotic analysis opening", "Introduction to Algorithms", "Predict then measure three implementations across input sizes.", "Complexity table and benchmark plot", 8, "quiz"],
      ["Checkpoint I · safe C", "Compilation, pointers, allocation, structures, and complexity", "C/C++ review route", "Introduction to C and C++", "Build a small data structure from specification under sanitizer and time limits.", "Midterm I repository and code walkthrough", 8, "midterm"],
      ["Organize with stacks and queues", "Abstract data types and amortized operations", "Data structures route · stacks and queues", "Introduction to Algorithms", "Implement two ADTs and use one in an expression evaluator.", "ADT tests and evaluator demo", 8, "lab"],
      ["Search with trees and hashes", "Binary trees, traversal, hash tables, and collision handling", "Trees and hashing lectures", "Introduction to Algorithms", "Implement and compare a search tree and hash table on one data set.", "Implementations and performance report", 8, "problem-set"],
      ["Sort deliberately", "Comparison sorting, stability, and lower bounds", "Sorting unit", "Introduction to Algorithms", "Implement two sorts, test stability, and benchmark adversarial inputs.", "Sort suite and analysis", 8, "lab"],
      ["Cross an interface", "Files, binary formats, processes, and system calls", "Systems programming route", "Introduction to C and C++", "Write a robust binary-log reader with malformed-input tests.", "Reader, fixture corpus, and error report", 8, "project"],
      ["Checkpoint II · debug unfamiliar code", "ADTs, trees, hashing, sorting, files, and memory safety", "Cumulative systems practical", "Introduction to C and C++", "Diagnose performance and memory faults in an unfamiliar codebase.", "Midterm II patch, tests, and root-cause log", 8, "midterm"],
      ["Handle concurrency carefully", "Threads, races, synchronization, and shared-state contracts", "Advanced systems route · concurrency", "Introduction to C and C++", "Create, detect, and repair a small race using deterministic checks.", "Concurrent program and race explanation", 8, "lab"],
      ["Specify correctness", "Preconditions, invariants, induction, and graph reasoning", "Proof and graph units", "Mathematics for Computer Science", "Write correctness arguments for one recursive and one graph algorithm.", "Two proof sketches and test correspondence", 8, "practice"],
      ["Build the systems utility", "Requirements, data structures, file I/O, and resource limits", "Project route", "Introduction to Algorithms", "Implement a log indexer, scheduler, or packet analyzer with measurable constraints.", "Release candidate, benchmarks, and tests", 8, "project"],
      ["Audit the utility", "API review, fuzz cases, performance, and maintainability", "Project review route", "Introduction to C and C++", "Run a clean-build demo, adversarial tests, and peer code review.", "Demo recording, review findings, and fixes", 8, "presentation"],
      ["Defend the implementation", "Cumulative systems programming and algorithms", "Final route", "Introduction to Algorithms", "Sit the final analysis check and defend memory, correctness, and runtime choices.", "Final project, exam, and defense notes", 8, "final"],
    ],
  }),
  EE102: defineCourse({
    courseCode: "EE102",
    primaryResource: "Circuits and Electronics",
    alternatives: ["Lessons in Electric Circuits", "CircuitJS1", "PhET Circuit Construction Kit: DC"],
    setup: [
      "Use CircuitJS1 or ngspice for every lab; create folders for schematics, calculations, data, and reports.",
      "Optional hardware: low-voltage breadboard kit, multimeter, resistors, capacitors, and op-amp rated for the supply.",
    ],
    firstAction:
      "Complete the Circuits and Electronics orientation, then simulate and hand-calculate one series-parallel network.",
    safetyLabNote:
      "Simulation fully satisfies the labs. For hardware, use current-limited extra-low-voltage supplies only; discharge capacitors and never connect to mains.",
    weeks: [
      ["Name circuit variables", "Voltage, current, power, passive sign convention, and models", "Unit 1 · circuit abstractions", "Circuits and Electronics", "Annotate five circuits with variables and verify conservation of power.", "Variable diagrams and power audit", 10, "problem-set"],
      ["Apply KCL and KVL", "Node and loop laws with systematic equations", "Unit 1 · KCL and KVL", "Circuits and Electronics", "Solve six networks by inspection and by a linear equation system.", "Solutions and simulation comparison", 10, "problem-set"],
      ["Use nodal analysis", "Reference nodes, supernodes, and controlled sources", "Unit 2 · nodal analysis", "Circuits and Electronics", "Analyze and simulate four multi-node circuits including a dependent source.", "Node-voltage table and residuals", 10, "lab"],
      ["Replace a network", "Superposition, Thévenin, Norton, and source transformations", "Unit 2 · network theorems", "Circuits and Electronics", "Find and experimentally verify a Thévenin equivalent across three loads.", "Equivalent derivation and load-sweep plot", 10, "lab"],
      ["Design with op-amps", "Ideal op-amp constraints, amplifiers, summers, and saturation", "Amplifiers unit · operational amplifiers", "Circuits and Electronics", "Design an amplifier to a gain/output-range specification and test saturation.", "Schematic, calculations, and sweep", 10, "quiz"],
      ["Checkpoint I · resistive networks", "KCL/KVL, nodal analysis, equivalents, and op-amps", "First exam route", "Circuits and Electronics", "Complete a closed-notes exam plus one fault-diagnosis simulation.", "Midterm I, diagnosis, and corrections", 10, "midterm"],
      ["Store energy", "Capacitors, inductors, state variables, and continuity", "Energy-storage elements unit", "Circuits and Electronics", "Measure simulated capacitor/inductor energy during switching.", "Energy plots and conservation explanation", 10, "lab"],
      ["Solve first-order transients", "Natural and step responses, time constants, and initial conditions", "First-order circuits unit", "Circuits and Electronics", "Hand-solve and simulate RC and RL responses from nonzero initial state.", "Waveform overlay and error calculation", 10, "problem-set"],
      ["Shape timing behavior", "Pulse response, settling, and first-order design", "First-order design route", "Circuits and Electronics", "Design a debounce, delay, or sensor-smoothing circuit to a timing target.", "Design file and requirement tests", 10, "project"],
      ["Measure with uncertainty", "Instrument loading, tolerance, noise, and error propagation", "Lab and measurement route", "Lessons in Electric Circuits", "Run a Monte Carlo or tolerance sweep and compare with nominal results.", "Tolerance histogram and uncertainty budget", 10, "lab"],
      ["Checkpoint II · transient practical", "Initial conditions, RC/RL response, op-amps, and measurement", "Cumulative practical route", "Circuits and Electronics", "Diagnose a hidden transient-circuit fault and justify every measurement.", "Midterm II practical and fault tree", 10, "midterm"],
      ["Meet second-order behavior", "RLC dynamics, damping, and resonance preview", "Second-order circuits introduction", "Circuits and Electronics", "Simulate under-, critical-, and over-damped RLC cases.", "Pole/damping table and waveform gallery", 10, "lab"],
      ["Build an analog interface", "Sensor source models, loading, gain, filtering, and range", "Application route · sensor interface", "Lessons in Electric Circuits", "Design a front end for a resistive sensor with a specified output range.", "Schematic and traceable calculations", 10, "project"],
      ["Verify the interface", "Corner cases, component tolerance, noise, and fault tests", "Course project laboratory", "CircuitJS1", "Test the front end against nominal, limit, tolerance, and open/short cases.", "Verification matrix and revised circuit", 10, "project"],
      ["Demonstrate the circuit", "Requirement evidence and technical explanation", "Project presentation route", "Circuits and Electronics", "Run a live parameter/fault demo and explain the model-to-measurement gap.", "Demo recording and two-page report", 10, "presentation"],
      ["Defend mastery", "Cumulative DC and first-order circuit analysis", "Final exam materials", "Circuits and Electronics", "Sit the cumulative final and defend the interface design from specification to evidence.", "Final exam, archive, and defense notes", 10, "final"],
    ],
  }),
  HUM102: defineCourse({
    courseCode: "HUM102",
    primaryResource: "Engineering Ethics",
    alternatives: ["IEEE Code of Ethics", "Writing Guide with Handbook"],
    setup: [
      "Create a casebook with fields for actors, power, benefits, burdens, evidence, uncertainties, and possible remedies.",
      "Choose one local infrastructure or automation case to revisit throughout the semester.",
    ],
    firstAction:
      "Read the Engineering Ethics introduction and map who gains, who bears risk, and who gets to decide in your chosen case.",
    weeks: [
      ["See technology as a system", "Sociotechnical systems, institutions, infrastructure, and path dependence", "Course introduction · technology in context", "Engineering Ethics", "Draw a system map for an everyday infrastructure including invisible labor and rules.", "Annotated sociotechnical system map", 7, "study"],
      ["Read a historical choice", "Contingency, standards, lock-in, and alternative histories", "Case-study route · historical context", "Engineering Ethics", "Trace one technical standard to the decisions and interests that stabilized it.", "Two-page historical decision brief", 7, "problem-set"],
      ["Map stakeholders and power", "Stakeholder analysis, voice, exclusion, and decision rights", "Case analysis methods", "Engineering Ethics", "Interview or research three stakeholder positions and map power asymmetries.", "Stakeholder/power matrix with sources", 7, "lab"],
      ["Examine access", "Infrastructure, disability, affordability, geography, and the digital divide", "Public-interest case route", "Writing Guide with Handbook", "Audit an electrical or digital service for access barriers using observed evidence.", "Accessibility audit and photo/data log", 7, "project"],
      ["Interrogate automation", "Labor, deskilling, surveillance, bias, and accountability", "Technology-risk case route", "Engineering Ethics", "Compare two automation proposals using benefits, displaced work, and recourse.", "Comparative case memo", 7, "quiz"],
      ["Checkpoint I · public-reason memo", "History, stakeholders, power, access, and automation", "Case memo assignment", "Engineering Ethics", "Write a timed recommendation to a public decision maker from a supplied case file.", "Midterm I memo and claim ledger", 7, "midterm"],
      ["Reason about privacy", "Data flows, consent, inference, retention, and contextual integrity", "Professional responsibility cases", "IEEE Code of Ethics", "Create a data-flow map and identify where meaningful consent fails.", "Data-flow diagram and policy changes", 7, "lab"],
      ["Think at infrastructure scale", "Reliability, interdependence, public goods, and resilience", "Safety and systems case route", "Engineering Ethics", "Analyze one infrastructure failure across technical and institutional layers.", "Failure timeline and causal map", 7, "problem-set"],
      ["Measure unequal effects", "Distribution, environmental justice, and cumulative burden", "Public welfare case route", "Engineering Ethics", "Use public evidence to compare who receives benefits and harms.", "Distribution table and uncertainty note", 7, "project"],
      ["Govern emerging technology", "Regulation, standards, precaution, experimentation, and legitimacy", "Codes, standards, and governance", "IEEE Code of Ethics", "Stage a standards hearing and write criteria for a limited pilot.", "Hearing brief and governance criteria", 7, "presentation"],
      ["Checkpoint II · deliberation", "Privacy, infrastructure, distribution, and governance", "Cumulative case deliberation", "Engineering Ethics", "Defend an assigned stakeholder position, then write your independent judgment.", "Midterm II deliberation and reflection", 7, "midterm"],
      ["Plan participation", "Co-design, consultation, community expertise, and compensation", "Public engagement route", "Writing Guide with Handbook", "Design an engagement process that changes a real technical decision.", "Participation plan and decision gates", 7, "project"],
      ["Look beyond launch", "Maintenance, repair, obsolescence, waste, and long-term stewardship", "Life-cycle responsibility route", "Engineering Ethics", "Trace a device from extraction through end-of-life and identify orphaned duties.", "Life-cycle map and stewardship proposal", 7, "practice"],
      ["Build the public case", "Evidence synthesis, alternatives, tradeoffs, and accountable recommendation", "Final case-study route", "Engineering Ethics", "Draft a public-interest assessment of your semester case with three alternatives.", "1,500-word draft and evidence appendix", 7, "project"],
      ["Hold a public hearing", "Plain-language testimony, questioning, and revision", "Presentation and peer-review route", "Writing Guide with Handbook", "Give five-minute testimony and answer adversarial stakeholder questions.", "Hearing recording and revised recommendation", 7, "presentation"],
      ["Defend public reason", "Cumulative sociotechnical analysis", "Final portfolio route", "Engineering Ethics", "Submit and orally defend the casebook, recommendation, and limits of your evidence.", "Final portfolio and defense notes", 7, "final"],
    ],
  }),
  MATH201: defineCourse({
    courseCode: "MATH201",
    primaryResource: "Linear Algebra",
    alternatives: ["Differential Equations", "GNU Octave"],
    setup: [
      "Install GNU Octave and create one notebook for matrix experiments and one for differential-equation models.",
      "Keep a geometric interpretation beside every algebraic method.",
    ],
    firstAction:
      "Complete the Linear Algebra opening lecture and solve one system by elimination in both your notebook and GNU Octave.",
    weeks: [
      ["Solve linear systems", "Elimination, pivots, matrix form, and solution sets", "Unit I · Ax = b and elimination", "Linear Algebra", "Solve six systems by hand and verify residuals numerically.", "Row-reduction set and residual table", 10, "problem-set"],
      ["Understand matrix action", "Matrix multiplication, inverses, transposes, and transformations", "Unit I · matrix operations", "Linear Algebra", "Visualize three 2D transformations and explain composition order.", "Transformation plots and explanation", 10, "lab"],
      ["Describe vector spaces", "Subspaces, span, independence, basis, and dimension", "Unit II · vector spaces", "Linear Algebra", "Classify candidate subspaces and construct bases for four data sets.", "Proof-and-basis worksheet", 10, "practice"],
      ["Use the four subspaces", "Column, row, null, and left-null spaces; rank", "Unit II · four fundamental subspaces", "Linear Algebra", "Compute all four subspaces for two matrices and check dimension identities.", "Subspace portfolio and numerical check", 10, "problem-set"],
      ["Fit imperfect data", "Orthogonality, projections, least squares, and QR", "Unit III · least squares", "Linear Algebra", "Fit a noisy sensor calibration and diagnose residual structure.", "Least-squares notebook and residual plot", 10, "quiz"],
      ["Checkpoint I · linear models", "Systems, spaces, rank, orthogonality, and least squares", "Exam 1 route", "Linear Algebra", "Sit a closed-notes exam and repair each algebraic and geometric misconception.", "Midterm I and correction memo", 10, "midterm"],
      ["Find system modes", "Determinants, eigenvalues, eigenvectors, and diagonalization", "Unit IV · determinants and eigenvalues", "Linear Algebra", "Find and visualize modes of a coupled two-state system.", "Eigen-analysis and mode plots", 10, "lab"],
      ["Meet differential equations", "Slope fields, first-order ODEs, and initial-value problems", "Unit I · first-order ODEs", "Differential Equations", "Solve and numerically check separable and linear first-order models.", "ODE solutions and error comparison", 10, "problem-set"],
      ["Model second-order dynamics", "Homogeneous solutions, forcing, resonance, and damping", "Unit II · second-order ODEs", "Differential Equations", "Analyze a driven RLC or mechanical oscillator across damping cases.", "Response plots and parameter table", 10, "lab"],
      ["Use Laplace methods", "Laplace transform, steps, impulses, and transfer response", "Unit III · Laplace transform", "Differential Equations", "Solve a switched initial-value problem and verify it numerically.", "Transform solution and waveform overlay", 10, "problem-set"],
      ["Checkpoint II · dynamics practical", "Eigenmodes, first/second-order ODEs, and Laplace methods", "Cumulative applied route", "Differential Equations", "Model an unseen coupled dynamic system and validate one limiting case.", "Midterm II model, code, and corrections", 10, "midterm"],
      ["Write state-space models", "First-order systems, state transition, inputs, and outputs", "Unit IV · systems of differential equations", "Differential Equations", "Convert a coupled physical model into state space and simulate trajectories.", "State equations and phase plots", 10, "lab"],
      ["Judge stability", "Eigenvalue location, phase portraits, and qualitative behavior", "Systems and phase-plane route", "Differential Equations", "Classify equilibria and test sensitivity to initial conditions.", "Stability atlas and interpretation", 10, "project"],
      ["Estimate from measurements", "Least squares, state models, parameter fitting, and validation", "Applications synthesis", "GNU Octave", "Estimate unknown parameters of a dynamic data set and cross-validate them.", "Fitted model, residuals, and validation split", 10, "project"],
      ["Demonstrate a coupled system", "Geometry, dynamics, modes, and evidence", "Course synthesis route", "Linear Algebra", "Present a two-or-more-state engineering model from equations through measured behavior.", "Notebook, seven-minute demo, and peer audit", 10, "presentation"],
      ["Defend mastery", "Cumulative linear algebra and differential equations", "Final exam routes", "Differential Equations", "Sit the cumulative final and map each method to later signals/control use.", "Final exam, corrections, and transfer map", 10, "final"],
    ],
  }),
  EE201: defineCourse({
    courseCode: "EE201",
    primaryResource: "Circuits and Electronics",
    alternatives: ["Lessons in Electric Circuits", "LTspice"],
    setup: [
      "Install LTspice or ngspice and create reusable AC, transient, and parameter-sweep templates.",
      "Keep complex-number calculations, simulation files, and measured plots under version control.",
    ],
    firstAction:
      "Review first-order circuits, then hand-calculate and simulate a sinusoidally driven RC network.",
    safetyLabNote:
      "All requirements can be met in simulation. Keep any optional build isolated from mains and discharge reactive components before handling.",
    weeks: [
      ["Represent sinusoids", "Complex numbers, phasors, frequency, phase, and RMS", "AC circuits route · sinusoidal steady state", "Lessons in Electric Circuits", "Convert ten time signals to phasors and verify RMS power numerically.", "Phasor worksheet and waveform plots", 8, "practice"],
      ["Use impedance", "R, L, C impedance and phasor-domain KCL/KVL", "AC volume · reactance and impedance", "Lessons in Electric Circuits", "Solve and simulate four AC networks across frequency.", "Complex solutions and AC sweeps", 8, "problem-set"],
      ["Track AC power", "Real, reactive, apparent power, and power factor", "AC volume · power", "Lessons in Electric Circuits", "Compute a load power triangle and design a correction capacitor.", "Power audit and corrected simulation", 8, "lab"],
      ["Find frequency response", "Transfer functions, magnitude, phase, and Bode plots", "Frequency-response route", "Circuits and Electronics", "Derive and sweep two first-order transfer functions.", "Bode overlays and corner-frequency evidence", 8, "problem-set"],
      ["Meet resonance", "Second-order RLC response, Q, bandwidth, and damping", "RLC resonance route", "Lessons in Electric Circuits", "Tune a resonant network and measure Q two independent ways.", "Resonance report and sweep files", 8, "quiz"],
      ["Checkpoint I · AC networks", "Phasors, impedance, AC power, Bode response, and resonance", "First exam route", "Circuits and Electronics", "Complete a written exam and an LTspice diagnosis of one AC fault.", "Midterm I, simulation, and corrections", 8, "midterm"],
      ["Design passive filters", "Low/high/band-pass specifications and loading", "Filters route", "Lessons in Electric Circuits", "Design a passive filter to a two-frequency attenuation specification.", "Design calculations and verification sweep", 8, "project"],
      ["Handle dependent sources", "Small-signal models, controlled sources, and input/output resistance", "Amplifier modeling route", "Circuits and Electronics", "Extract two-port gains and resistances from a dependent-source model.", "Model sheet and simulation checks", 8, "problem-set"],
      ["Connect two-port networks", "z, y, h, and ABCD parameters; cascade", "Network representation route", "Lessons in Electric Circuits", "Characterize and cascade two simulated two-port blocks.", "Parameter matrices and end-to-end check", 8, "lab"],
      ["Use poles and zeros", "Natural response, transfer functions, pole-zero maps, and stability", "System functions route", "Circuits and Electronics", "Relate poles/zeros to three measured transient and frequency responses.", "Pole-zero atlas and annotations", 8, "project"],
      ["Checkpoint II · filter practical", "RLC, filters, two-ports, poles, and measurement", "Cumulative design route", "LTspice", "Design and diagnose an unseen second-order network under a time limit.", "Midterm II design file and fault log", 8, "midterm"],
      ["Include non-ideal components", "Parasitics, tolerances, source/load effects, and model limits", "Component models and simulation route", "LTspice", "Run corner and Monte Carlo studies on the filter.", "Yield plot and dominant-sensitivity note", 8, "lab"],
      ["Match a real specification", "Selectivity, gain, impedance, noise, and tradeoffs", "Design synthesis route", "Circuits and Electronics", "Translate a sensor/audio requirement into a complete network specification.", "Requirements table and architecture", 8, "project"],
      ["Build the network", "Schematic implementation, sweeps, transients, and verification", "Project workspace", "LTspice", "Implement and verify the specified second-order network across corners.", "Release candidate and verification matrix", 8, "project"],
      ["Demonstrate frequency behavior", "Measurement evidence, fault injection, and explanation", "Project presentation route", "LTspice", "Give a live sweep/transient demo including a component-tolerance fault.", "Demo recording and concise design report", 8, "presentation"],
      ["Defend mastery", "Cumulative AC and network analysis", "Final examination route", "Circuits and Electronics", "Sit the final and defend the network from phasors through non-ideal verification.", "Final exam, archive, and defense notes", 8, "final"],
    ],
  }),
  EE202: defineCourse({
    courseCode: "EE202",
    primaryResource: "Computation Structures",
    alternatives: ["Build a Modern Computer from First Principles", "Verilator"],
    setup: [
      "Install Verilator, a waveform viewer, make, and Git, or use the Nand2Tetris browser tools.",
      "Create separate RTL, testbench, waveform, synthesis-report, and documentation folders.",
    ],
    firstAction:
      "Complete the opening logic material and implement/test NAND, NOT, AND, and OR from a single primitive.",
    weeks: [
      ["Speak Boolean", "Binary representation, Boolean algebra, gates, and truth tables", "Part 1 · digital abstraction and combinational logic", "Computation Structures", "Simplify ten Boolean functions and exhaustively test four gate modules.", "Derivations, RTL, and test output", 8, "problem-set"],
      ["Design combinational blocks", "Muxes, decoders, adders, comparators, and hierarchy", "Combinational systems unit", "Computation Structures", "Build a parameterized ALU slice and test every opcode.", "RTL, exhaustive testbench, and waveform", 8, "lab"],
      ["Minimize logic", "Karnaugh maps, hazards, and implementation cost", "Logic minimization route", "Computation Structures", "Minimize a control function and detect a static hazard in simulation.", "K-map, implementation, and hazard trace", 8, "practice"],
      ["Store a bit", "Latches, flip-flops, setup/hold, and synchronous design", "Sequential logic unit", "Computation Structures", "Implement registers and document their timing contract.", "RTL, timing diagram, and tests", 8, "lab"],
      ["Create a state machine", "FSM specification, encoding, outputs, and verification", "Finite-state machines unit", "Computation Structures", "Design a protocol controller from an English requirement and cover every transition.", "State diagram, RTL, and coverage table", 8, "quiz"],
      ["Checkpoint I · logic design", "Combinational logic, timing, storage, and FSMs", "First examination/design route", "Computation Structures", "Complete a written exam and implement one unseen controller.", "Midterm I, RTL challenge, and corrections", 8, "midterm"],
      ["Build a datapath", "Registers, ALUs, buses, and register transfer", "Processor datapath unit", "Computation Structures", "Assemble a multi-cycle datapath and trace three instructions.", "Datapath schematic and cycle traces", 8, "project"],
      ["Control the datapath", "Instruction encoding, control signals, and micro-operations", "Instruction execution unit", "Computation Structures", "Implement control for arithmetic, load/store, and branch operations.", "Controller RTL and instruction tests", 8, "lab"],
      ["Write and run assembly", "ISA contracts, assembly, calling conventions, and I/O", "Assembly and programming route", "Build a Modern Computer from First Principles", "Write a small assembly program and trace state changes to completion.", "Program, trace, and expected-output test", 8, "problem-set"],
      ["Organize memory", "RAM, address decoding, locality, caches, and memory-mapped I/O", "Memory hierarchy unit", "Computation Structures", "Design an address map and measure hit behavior for two access patterns.", "Address map and cache experiment", 8, "project"],
      ["Checkpoint II · processor practical", "Datapath, control, ISA, assembly, and memory", "Cumulative processor route", "Computation Structures", "Debug an unfamiliar processor using failing instruction traces.", "Midterm II patch, waveform evidence, and fault log", 8, "midterm"],
      ["Handle the outside world", "Interrupts, synchronization, metastability, and peripherals", "I/O and synchronization unit", "Computation Structures", "Add a timer or input peripheral with synchronized signaling.", "Peripheral RTL and timing tests", 8, "lab"],
      ["Verify systematically", "Assertions, directed/random tests, coverage, and lint", "Verification route", "Verilator", "Create a regression suite with assertions for the processor subset.", "Automated regression and coverage report", 8, "project"],
      ["Integrate the digital system", "Processor, memory, I/O, program, and timing closure", "Final project route", "Computation Structures", "Integrate a small stored-program system that controls a visible output.", "Release candidate and full-system tests", 8, "project"],
      ["Demonstrate from instruction to pin", "Execution trace, fault injection, and performance", "Project presentation route", "Verilator", "Run the program live, inject one control fault, and explain the waveform.", "Demo recording and architecture poster", 8, "presentation"],
      ["Defend the hardware", "Cumulative logic, architecture, timing, and verification", "Final examination/project route", "Computation Structures", "Complete the final design review and defend every interface and test claim.", "Final exam, RTL archive, and defense notes", 8, "final"],
    ],
  }),
  EE203: defineCourse({
    courseCode: "EE203",
    primaryResource: "Introductory Analog Electronics Laboratory",
    alternatives: ["Lessons in Electric Circuits", "LTspice", "ngspice"],
    setup: [
      "Install LTspice or ngspice and make a bound lab notebook with immutable raw-data sections.",
      "Optional bench route: current-limited supply, CAT-rated multimeter used within rating, entry oscilloscope, probes, breadboard, and common components.",
    ],
    firstAction:
      "Read the first lab guidance, document instrument limits, and reproduce a DC divider measurement in simulation.",
    safetyLabNote:
      "Simulation is a complete route. Bench work stays extra-low-voltage with current limits; power down before rewiring, verify probe grounds, and never touch mains.",
    weeks: [
      ["Earn trust in a measurement", "Units, uncertainty, repeatability, accuracy, and notebook practice", "Laboratory 1 · measurement foundations", "Introductory Analog Electronics Laboratory", "Measure or simulate one divider repeatedly and separate random from systematic error.", "Timestamped raw data and uncertainty statement", 10, "lab"],
      ["Use meters correctly", "DMM modes, loading, source resistance, and safe connection", "DC metering route", "Lessons in Electric Circuits", "Predict and test meter-loading errors across three source resistances.", "Loading plot and corrected model", 10, "lab"],
      ["Read an oscilloscope", "Probe attenuation, coupling, triggering, bandwidth, and ground", "Laboratory instrumentation route", "Introductory Analog Electronics Laboratory", "Capture stable traces for DC, sine, pulse, and noisy signals; annotate settings.", "Four annotated captures", 10, "lab"],
      ["Characterize a component", "I–V curves, tolerance, temperature, and model fitting", "Device characterization lab", "Introductory Analog Electronics Laboratory", "Sweep a resistor/diode model and fit a defensible parameter model.", "I–V data, fitted model, and residuals", 10, "problem-set"],
      ["Calibrate a sensor", "Transfer curves, offsets, gain, range, and traceability", "Instrumentation design route", "Lessons in Electric Circuits", "Build a multi-point calibration with held-out validation data.", "Calibration certificate and error plot", 10, "quiz"],
      ["Checkpoint I · instrument practical", "DMM, oscilloscope, I–V measurement, uncertainty, and calibration", "First laboratory practical", "Introductory Analog Electronics Laboratory", "Plan and execute measurements on an unknown virtual circuit without step-by-step instructions.", "Midterm I notebook, results, and safety check", 10, "midterm"],
      ["Shape a signal", "RC filters, frequency sweeps, loading, and Bode evidence", "Filter laboratory", "Introductory Analog Electronics Laboratory", "Measure a filter response and reconcile it with its analytic corner frequency.", "Bode data, model overlay, and discrepancy note", 10, "lab"],
      ["Use an op-amp", "Closed-loop gain, rails, slew, bias, and saturation", "Operational-amplifier laboratory", "Introductory Analog Electronics Laboratory", "Characterize an amplifier across amplitude and frequency.", "Operating envelope and annotated traces", 10, "lab"],
      ["Reject interference", "Grounding, shielding, common-mode pickup, and noise", "Noise and grounding route", "Lessons in Electric Circuits", "Create a noise source, test two mitigations, and quantify improvement.", "Noise spectra/RMS table and wiring diagram", 10, "project"],
      ["Automate a test", "Sweeps, scripted analysis, file naming, and reproducibility", "Simulator scripting documentation", "ngspice", "Automate a parameter sweep and generate a report from raw output.", "Script, raw data, and regenerated figure", 10, "lab"],
      ["Checkpoint II · fault isolation", "Signal tracing, model comparison, and instrument artifacts", "Second laboratory practical", "Introductory Analog Electronics Laboratory", "Locate multiple faults in an unfamiliar signal chain using a written test strategy.", "Midterm II fault tree and measurement evidence", 10, "midterm"],
      ["Design a test fixture", "Observability, loading, connectors, protection, and repeatability", "Design-project route", "Introductory Analog Electronics Laboratory", "Design a fixture for repeated sensor/front-end tests.", "Fixture schematic and validation protocol", 10, "project"],
      ["Make evidence auditable", "Raw data, metadata, scripts, plots, and uncertainty budgets", "Laboratory reporting route", "Introductory Analog Electronics Laboratory", "Reproduce a prior figure from a clean checkout and peer-audit its claim.", "Reproducibility record and audit findings", 10, "practice"],
      ["Run the characterization campaign", "Requirements, experiments, calibration, faults, and conclusions", "Final design project", "Introductory Analog Electronics Laboratory", "Characterize an analog front end across nominal and corner conditions.", "Complete notebook and verification matrix", 10, "project"],
      ["Demonstrate measurement judgment", "Live measurement, anomaly response, and communication", "Final presentation route", "Introductory Analog Electronics Laboratory", "Run one live test, respond to an injected anomaly, and defend uncertainty.", "Demo recording and concise lab report", 10, "presentation"],
      ["Defend the notebook", "Cumulative instrumentation and reproducibility", "Final practical/portfolio route", "Introductory Analog Electronics Laboratory", "Submit the auditable notebook and complete an oral raw-data-to-claim audit.", "Final practical, notebook archive, and defense", 10, "final"],
    ],
  }),
  SCI201: defineCourse({
    courseCode: "SCI201",
    primaryResource: "Microelectronic Devices and Circuits",
    alternatives: ["The Feynman Lectures on Physics", "OpenModelica"],
    setup: [
      "Prepare a materials-property notebook and a spreadsheet or numerical notebook for structure–property plots.",
      "Use published data and simulation; no chemical processing or battery disassembly is required.",
    ],
    firstAction:
      "Review atomic bonding and semiconductor energy concepts, then compare conductor, semiconductor, and insulator band sketches.",
    safetyLabNote:
      "Do not open, puncture, heat, or charge improvised cells, and do not attempt wet-chemistry or fabrication processes outside a supervised laboratory.",
    weeks: [
      ["Connect bonds to properties", "Atomic bonding, energy, length scales, and material classes", "Opening material · physical foundations", "Microelectronic Devices and Circuits", "Build a table relating bond type to electrical, thermal, and mechanical behavior.", "Structure–property comparison table", 9, "study"],
      ["Read crystal structure", "Lattices, planes, defects, and diffraction intuition", "Semiconductor crystal foundations", "Microelectronic Devices and Circuits", "Sketch common lattices and calculate planar/atomic densities.", "Crystal worksheet and visual models", 9, "problem-set"],
      ["Use band models", "Energy bands, Fermi level, conductors, semiconductors, insulators", "Energy-band route", "Microelectronic Devices and Circuits", "Explain and plot band occupation for three material classes.", "Band diagrams and interpretation", 9, "practice"],
      ["Control carriers", "Intrinsic/extrinsic semiconductors, doping, carrier concentration", "Semiconductor statistics unit", "Microelectronic Devices and Circuits", "Calculate carrier concentrations over doping and temperature.", "Carrier plots and limiting-case checks", 9, "problem-set"],
      ["Move charge", "Drift, diffusion, mobility, conductivity, and scattering", "Carrier transport unit", "Microelectronic Devices and Circuits", "Fit a transport model to published conductivity data.", "Fit notebook and residual analysis", 9, "quiz"],
      ["Checkpoint I · electronic materials", "Bonding, crystals, bands, carriers, and transport", "First examination route", "Microelectronic Devices and Circuits", "Sit a closed-notes exam and correct each structure-to-property explanation.", "Midterm I and correction portfolio", 9, "midterm"],
      ["Form a junction", "pn equilibrium, depletion, built-in potential, and bias", "pn-junction unit", "Microelectronic Devices and Circuits", "Calculate and plot depletion width and field versus bias.", "Junction notebook and plots", 9, "lab"],
      ["Choose a dielectric", "Polarization, permittivity, breakdown, loss, and reliability", "Capacitors and dielectric route", "The Feynman Lectures on Physics", "Compare three dielectrics for a capacitor specification.", "Weighted selection matrix", 9, "project"],
      ["Understand metals and contacts", "Conductors, contacts, Schottky barriers, electromigration", "Contacts and interconnect route", "Microelectronic Devices and Circuits", "Analyze contact resistance and one interconnect failure mechanism.", "Contact model and failure brief", 9, "problem-set"],
      ["Store electrochemical energy", "Redox, cell voltage, capacity, rate, aging, and safety", "Energy-storage modeling route", "OpenModelica", "Model a published battery discharge curve without handling a cell.", "Discharge model and safety assumptions", 9, "lab"],
      ["Checkpoint II · material selection", "Junctions, dielectrics, contacts, and electrochemistry", "Cumulative application route", "Microelectronic Devices and Circuits", "Select materials for an unseen electronic component and defend the tradeoffs.", "Midterm II selection dossier", 9, "midterm"],
      ["See fabrication as materials engineering", "Oxidation, deposition, lithography, etching, implantation", "Fabrication overview", "Microelectronic Devices and Circuits", "Create a process flow for a simple device and identify material interfaces.", "Process traveler and cross-section sketches", 9, "project"],
      ["Predict degradation", "Thermal cycling, corrosion, diffusion, fatigue, and failure analysis", "Reliability route", "Microelectronic Devices and Circuits", "Build an evidence-based fault tree for one field failure.", "Failure tree and proposed tests", 9, "practice"],
      ["Count the life cycle", "Critical materials, embodied energy, toxicity, repair, and recycling", "Materials selection synthesis", "Engineering Ethics", "Compare two material choices across performance and environmental burden.", "Life-cycle comparison and recommendation", 9, "project"],
      ["Present a material decision", "Requirements, evidence, uncertainty, and sustainability", "Course synthesis route", "Microelectronic Devices and Circuits", "Defend a material stack for a sensor, package, cell, or interconnect.", "Seven-minute design review and dossier", 9, "presentation"],
      ["Defend mastery", "Cumulative electronics materials and chemistry", "Final examination route", "Microelectronic Devices and Circuits", "Sit the cumulative final and correct it with explicit mechanism chains.", "Final exam and mechanism corrections", 9, "final"],
    ],
  }),
  MATH202: defineCourse({
    courseCode: "MATH202",
    primaryResource: "Probabilistic Systems Analysis and Applied Probability",
    alternatives: ["Mathematics for Computer Science", "SciPy"],
    setup: [
      "Prepare a probability notebook with separate model, calculation, simulation, and interpretation sections.",
      "Install Python with SciPy and fix a random seed for reproducible Monte Carlo work.",
    ],
    firstAction:
      "Take the probability diagnostic, then model and simulate the opening sample-space examples.",
    weeks: [
      ["Define uncertainty", "Experiments, outcomes, events, axioms, and counting", "Unit 1 · probability models", "Probabilistic Systems Analysis and Applied Probability", "Construct sample spaces for three engineering experiments and check them by simulation.", "Event models and simulation notebook", 8, "problem-set"],
      ["Condition on evidence", "Conditional probability, total probability, and Bayes' rule", "Unit 1 · conditioning and Bayes", "Probabilistic Systems Analysis and Applied Probability", "Solve diagnostic-test and component-failure problems with probability trees.", "Solved set and interpretation notes", 8, "practice"],
      ["Use random variables", "PMFs, CDFs, expectation, variance, and transformations", "Unit 2 · discrete random variables", "Probabilistic Systems Analysis and Applied Probability", "Analyze and simulate two discrete measurement models.", "Distribution tables and Monte Carlo check", 8, "problem-set"],
      ["Model continuous noise", "PDFs, CDFs, common continuous distributions, and change of variables", "Unit 2 · continuous random variables", "Probabilistic Systems Analysis and Applied Probability", "Fit two candidate distributions to supplied noise data.", "Fit plots and goodness-of-fit note", 8, "lab"],
      ["Combine variables", "Joint distributions, covariance, correlation, and independence", "Unit 3 · multiple random variables", "Probabilistic Systems Analysis and Applied Probability", "Compute and simulate a correlated two-sensor model.", "Joint model, covariance matrix, and plots", 8, "quiz"],
      ["Checkpoint I · probability models", "Conditioning, variables, distributions, and joint behavior", "First examination route", "Probabilistic Systems Analysis and Applied Probability", "Sit a closed-notes exam and repair every model-selection error.", "Midterm I and corrected model log", 8, "midterm"],
      ["Transform and sum", "Functions of variables, sums, convolution, and characteristic intuition", "Unit 3 · derived distributions", "Probabilistic Systems Analysis and Applied Probability", "Derive a sum distribution and verify it by Monte Carlo.", "Derivation and convergence plot", 8, "problem-set"],
      ["Use limit laws", "Law of large numbers, central limit theorem, and confidence intuition", "Unit 4 · limit theorems", "Probabilistic Systems Analysis and Applied Probability", "Simulate sampling distributions and identify when Gaussian approximation fails.", "CLT experiment and failure-case note", 8, "lab"],
      ["Estimate a quantity", "Point estimation, bias, variance, maximum likelihood, and intervals", "Estimation route", "Probabilistic Systems Analysis and Applied Probability", "Design and compare two estimators for noisy measurements.", "Estimator benchmark and recommendation", 8, "project"],
      ["Make a decision", "Hypothesis tests, false alarms, detection, and ROC curves", "Detection/decision route", "Probabilistic Systems Analysis and Applied Probability", "Set a detection threshold and quantify both error types.", "ROC curve and threshold rationale", 8, "project"],
      ["Checkpoint II · inference practical", "Limit laws, estimation, intervals, and detection", "Cumulative inference route", "Probabilistic Systems Analysis and Applied Probability", "Analyze an unseen sensor data set under a two-hour limit.", "Midterm II notebook and corrections", 8, "midterm"],
      ["Model random sequences", "Random processes, stationarity, mean, autocorrelation, and covariance", "Random processes unit", "Probabilistic Systems Analysis and Applied Probability", "Estimate autocorrelation of measured or synthetic noise and test stationarity.", "Process plots and stationarity argument", 8, "lab"],
      ["Move to frequency", "Power spectral density and filtering random processes", "Random-process spectrum route", "SciPy", "Estimate PSD by two methods and explain resolution/variance tradeoffs.", "Reproducible PSD notebook", 8, "project"],
      ["Build the uncertainty study", "Model choice, estimation, validation, and sensitivity", "Course project route", "SciPy", "Complete an end-to-end noise or reliability study with held-out validation.", "Study draft, code, and evidence ledger", 8, "project"],
      ["Demonstrate calibrated inference", "Results, uncertainty, limitations, and reproducibility", "Project presentation route", "Probabilistic Systems Analysis and Applied Probability", "Present the study and answer a challenge about assumptions or sample size.", "Seven-minute demo and revised study", 8, "presentation"],
      ["Defend mastery", "Cumulative probability and random processes", "Final examination route", "Probabilistic Systems Analysis and Applied Probability", "Sit the cumulative final and map methods to signals, communications, and control.", "Final exam, corrections, and transfer map", 8, "final"],
    ],
  }),
  EE204: defineCourse({
    courseCode: "EE204",
    primaryResource: "Signals and Systems",
    alternatives: ["The Fourier Transform and Its Applications", "GNU Octave", "SciPy"],
    setup: [
      "Install GNU Octave or Python/SciPy and prepare reusable scripts for sequences, convolution, poles, and spectra.",
      "Keep every analytic result paired with a plotted or numerically checked example.",
    ],
    firstAction:
      "Complete the Signals and Systems opening material and classify ten signals by continuity, periodicity, energy, and symmetry.",
    weeks: [
      ["Describe a signal", "Continuous/discrete time, transformations, periodicity, energy, and power", "Unit 1 · signals and systems", "Signals and Systems", "Classify and plot ten signals, including shifted and scaled versions.", "Signal atlas and classification table", 11, "problem-set"],
      ["Test a system", "Linearity, time invariance, causality, memory, and stability", "Unit 1 · system properties", "Signals and Systems", "Test six input-output rules and construct counterexamples for failed properties.", "System-property proof sheet", 11, "practice"],
      ["Convolve deliberately", "Impulse response, CT/DT convolution, and LTI interpretation", "Unit 2 · convolution", "Signals and Systems", "Compute two convolutions by hand and validate them numerically.", "Convolution sketches and overlays", 11, "lab"],
      ["Use differential/difference models", "LTI equations, natural/forced response, and initial rest", "Unit 2 · LTI system models", "Signals and Systems", "Derive impulse responses for one differential and one difference equation.", "Derivations and response plots", 11, "problem-set"],
      ["Build Fourier series", "Harmonics, coefficients, convergence, and filtering periodic signals", "Unit 3 · Fourier series", "Signals and Systems", "Approximate a square or pulse train and quantify Gibbs behavior.", "Coefficient table and convergence animation/plots", 11, "quiz"],
      ["Checkpoint I · time and harmonics", "Signal/system properties, convolution, models, and Fourier series", "First exam route", "Signals and Systems", "Sit a closed-notes exam and complete one numerical convolution check.", "Midterm I and corrected solutions", 11, "midterm"],
      ["Transform aperiodic signals", "Continuous-time Fourier transform and properties", "Unit 3 · Fourier transform", "Signals and Systems", "Derive and plot transforms for pulses, exponentials, and modulated signals.", "Transform pairs and numerical spectra", 11, "problem-set"],
      ["Sample without aliases", "Sampling theorem, reconstruction, aliasing, and interpolation", "Sampling unit", "Signals and Systems", "Sample one bandlimited and one non-bandlimited signal at several rates.", "Sampling notebook and alias diagnosis", 11, "lab"],
      ["Use Laplace analysis", "ROC, poles/zeros, stability, causality, and transfer functions", "Unit 4 · Laplace transform", "Signals and Systems", "Analyze three rational systems including ROC-dependent cases.", "Pole-zero maps and property table", 11, "problem-set"],
      ["Use z analysis", "z-transform, ROC, inverse methods, and discrete LTI systems", "Unit 5 · z-transform", "Signals and Systems", "Solve and simulate an IIR difference equation from its transfer function.", "z-domain solution and waveform check", 11, "project"],
      ["Checkpoint II · transform practical", "Fourier, sampling, Laplace, z, poles, and stability", "Second exam/practical route", "Signals and Systems", "Analyze an unseen mixed CT/DT system and verify one result in code.", "Midterm II practical and corrections", 11, "midterm"],
      ["Connect systems", "Cascade, parallel, feedback, block diagrams, and equivalent response", "System interconnection route", "Signals and Systems", "Reduce and simulate a multi-block signal chain.", "Equivalent model and end-to-end test", 11, "lab"],
      ["Read real data", "Finite records, leakage, windowing, and spectrum interpretation", "Fourier applications route", "The Fourier Transform and Its Applications", "Analyze authentic audio or sensor data and distinguish signal from analysis artifact.", "Spectrum report and artifact checklist", 11, "project"],
      ["Build the signal-chain study", "Model, transforms, sampling, filtering, and validation", "Course project route", "Signals and Systems", "Design an analysis/reconstruction chain with measurable fidelity requirements.", "Release candidate and verification plots", 11, "project"],
      ["Demonstrate three views", "Time, frequency, and transform-domain explanation", "Course synthesis route", "Signals and Systems", "Present one system in all three views and respond to an injected parameter change.", "Demo notebook and seven-minute talk", 11, "presentation"],
      ["Defend mastery", "Cumulative signals and systems", "Final examination route", "Signals and Systems", "Sit the cumulative final and correct it with graphical and numerical checks.", "Final exam and mastery corrections", 11, "final"],
    ],
  }),
  EE205: defineCourse({
    courseCode: "EE205",
    primaryResource: "Microelectronic Devices and Circuits",
    alternatives: ["Analog Electronic Circuits", "LTspice"],
    setup: [
      "Install LTspice or ngspice with generic diode, BJT, and MOSFET models.",
      "Maintain a device notebook pairing each band/charge picture with equations, I–V curves, and circuit consequences.",
    ],
    firstAction:
      "Review carrier transport, then reproduce the course's pn-junction equilibrium band and charge diagrams.",
    safetyLabNote:
      "Device characterization may be simulated. Any optional hardware uses current-limited low voltage and observes component power/temperature ratings.",
    weeks: [
      ["Rebuild semiconductor physics", "Bands, carriers, doping, drift, diffusion, and equilibrium", "Part I · semiconductor fundamentals", "Microelectronic Devices and Circuits", "Calculate carrier populations and sketch equilibrium band diagrams.", "Fundamentals set and annotated bands", 8, "problem-set"],
      ["Form the pn junction", "Depletion approximation, built-in voltage, charge, and field", "Part II · pn-junction electrostatics", "Microelectronic Devices and Circuits", "Derive junction width and peak field versus bias.", "Derivation and parameter plots", 8, "practice"],
      ["Drive the diode", "Injection, diode equation, capacitance, breakdown, and non-idealities", "Part II · diode I–V", "Microelectronic Devices and Circuits", "Fit simulated diode I–V data and identify ideality/resistance regions.", "I–V fit and region annotations", 8, "lab"],
      ["Use diode circuits", "Rectification, limiting, regulation, and switching", "Diode applications route", "Microelectronic Devices and Circuits", "Design and verify a limiter or rectifier against three specifications.", "Schematic and verification plots", 8, "project"],
      ["Understand the BJT", "Carrier action, operating regions, Ebers–Moll intuition, and bias", "Part III · bipolar transistor", "Microelectronic Devices and Circuits", "Map BJT regions on output curves and solve three bias points.", "Region map and bias worksheet", 8, "quiz"],
      ["Checkpoint I · junction devices", "Semiconductor transport, pn junction, diode, and BJT basics", "First examination route", "Microelectronic Devices and Circuits", "Sit a closed-notes exam and diagnose one device-model mismatch.", "Midterm I, diagnosis, and corrections", 8, "midterm"],
      ["Amplify with a BJT", "Small-signal parameters, gain, impedances, and limits", "BJT small-signal route", "Analog Electronic Circuits", "Bias and analyze a common-emitter stage; compare hand and SPICE gain.", "Operating point and gain comparison", 8, "lab"],
      ["Build the MOS capacitor", "Charge regimes, threshold, C–V behavior, and non-ideal oxide", "Part IV · MOS structure", "Microelectronic Devices and Circuits", "Sketch charge/band states and plot idealized C–V behavior.", "MOS-capacitor atlas and calculations", 8, "problem-set"],
      ["Operate the MOSFET", "I–V regions, channel formation, body effect, and channel modulation", "Part IV · MOSFET", "Microelectronic Devices and Circuits", "Extract MOS model parameters from curves and mark valid regions.", "Parameter extraction notebook", 8, "lab"],
      ["Amplify with a MOSFET", "Bias, transconductance, small-signal gain, and headroom", "MOS amplifier route", "Analog Electronic Circuits", "Design a common-source stage to gain and swing targets.", "Design calculations and SPICE sweeps", 8, "project"],
      ["Checkpoint II · transistor practical", "BJT/MOS operation, bias, small signal, and non-ideal behavior", "Second examination/design route", "Microelectronic Devices and Circuits", "Analyze and repair an unseen transistor stage under a time limit.", "Midterm II design, fault log, and corrections", 8, "midterm"],
      ["Compare device families", "Speed, power, area, noise, temperature, and reliability", "Device comparison synthesis", "Microelectronic Devices and Circuits", "Select a diode/BJT/MOS device route for three application constraints.", "Weighted trade-study matrix", 8, "practice"],
      ["Explore scaling", "Short-channel effects, leakage, variability, and technology limits", "Advanced MOS/scaling route", "Microelectronic Devices and Circuits", "Build a one-page evidence map of one scaling limit and circuit impact.", "Scaling evidence map", 8, "project"],
      ["Design the device-backed circuit", "Physical model, operating point, small signal, and corners", "Course project route", "LTspice", "Complete a transistor interface whose design choices trace to device physics.", "Release candidate and corner verification", 8, "project"],
      ["Demonstrate physics in the waveform", "Bias shifts, temperature/model effects, and explanation", "Project presentation route", "LTspice", "Change one physical/model parameter live and explain the circuit response.", "Demo recording and device-to-circuit poster", 8, "presentation"],
      ["Defend mastery", "Cumulative semiconductor devices", "Final examination route", "Microelectronic Devices and Circuits", "Sit the cumulative final and defend the project from charge picture to waveform.", "Final exam, archive, and defense notes", 8, "final"],
    ],
  }),
  EE206: defineCourse({
    courseCode: "EE206",
    primaryResource: "Embedded System Design with ARM",
    alternatives: ["Computation Structures", "Wokwi", "RISC-V ISA Specifications"],
    setup: [
      "Use Wokwi or install an ARM/RISC-V cross toolchain, debugger, serial terminal, and Git.",
      "Create firmware, hardware-description, timing-evidence, and test folders with a one-command build.",
    ],
    firstAction:
      "Run a minimal GPIO program in Wokwi, inspect its compiled instructions, and measure the pin timing.",
    safetyLabNote:
      "The browser simulator is sufficient. Keep optional actuators low-energy, add current limiting/flyback protection, and never drive motors directly from GPIO.",
    weeks: [
      ["Trace instruction to pin", "ISA, registers, memory, compilation, and GPIO", "Module 1 · processor and GPIO", "Embedded System Design with ARM", "Compile a GPIO program, disassemble it, and annotate its hardware effects.", "Code, disassembly, and execution trace", 10, "lab"],
      ["Use memory safely", "Address spaces, pointers, volatile, alignment, and memory-mapped I/O", "Memory and programming module", "Embedded System Design with ARM", "Write a register-level driver and test reserved-bit preservation.", "Driver, register map, and tests", 10, "problem-set"],
      ["Keep time", "Clocks, timers, counters, PWM, and measurement", "Timers and PWM module", "Embedded System Design with ARM", "Generate three timed waveforms and verify period/duty with a logic trace.", "Firmware and annotated timing captures", 10, "lab"],
      ["Respond to events", "Interrupts, priorities, latency, and shared-state hazards", "Interrupts module", "Embedded System Design with ARM", "Implement interrupt-driven input and measure worst-case response.", "Latency distribution and race audit", 10, "lab"],
      ["Talk to peripherals", "UART, SPI, I2C, framing, transactions, and error handling", "Serial interfaces module", "Embedded System Design with ARM", "Integrate one virtual peripheral and decode its bus trace.", "Driver, protocol trace, and fault tests", 10, "quiz"],
      ["Checkpoint I · bare-metal practical", "Registers, timers, interrupts, and serial buses", "First embedded practical", "Embedded System Design with ARM", "Implement an unseen timed peripheral behavior under a two-hour limit.", "Midterm I firmware, traces, and review", 10, "midterm"],
      ["Acquire analog data", "ADC/DAC, sampling, reference, quantization, and calibration", "ADC/DAC module", "Embedded System Design with ARM", "Sample a sensor waveform and characterize offset, scale, and quantization.", "Calibration code and error plots", 10, "lab"],
      ["Organize firmware", "Drivers, layers, finite-state machines, queues, and contracts", "Embedded software architecture route", "Embedded System Design with ARM", "Refactor blocking firmware into explicit states and test transitions.", "Architecture diagram and state tests", 10, "project"],
      ["Understand the datapath", "Pipeline basics, memory hierarchy, stalls, and performance counters", "Architecture route", "Computation Structures", "Measure cycles for memory/compute kernels and explain bottlenecks.", "Cycle benchmark and architecture note", 10, "problem-set"],
      ["Budget real time", "Deadlines, scheduling, WCET intuition, jitter, and overload", "Real-time design route", "Embedded System Design with ARM", "Create and test a cyclic schedule for three periodic tasks.", "Schedule table and jitter traces", 10, "project"],
      ["Checkpoint II · integration practical", "ADC, architecture, scheduling, interfaces, and debugging", "Second embedded practical", "Wokwi", "Repair a sensor-to-output system with timing and communication faults.", "Midterm II patch, traces, and fault log", 10, "midterm"],
      ["Design for faults", "Watchdogs, brownout, invalid data, timeouts, and safe state", "Reliability and safety route", "Embedded System Design with ARM", "Inject four faults and prove bounded detection/recovery behavior.", "Fault matrix and recovery traces", 10, "lab"],
      ["Manage energy", "Sleep modes, duty cycling, peripheral gating, and energy budgets", "Low-power route", "Embedded System Design with ARM", "Compare two firmware schedules by estimated energy per useful sample.", "Energy model and revised schedule", 10, "practice"],
      ["Build the embedded instrument", "Requirements, sensor, timing, protocol, storage/output, and faults", "Course project route", "Wokwi", "Integrate a timed measurement instrument with a documented command interface.", "Release candidate and traceable tests", 10, "project"],
      ["Demonstrate timing truth", "Instruction-to-pin trace, overload, fault injection, and usability", "Project presentation route", "Wokwi", "Run a live demo including one overload and one sensor fault.", "Demo recording, traces, and architecture poster", 10, "presentation"],
      ["Defend the system", "Cumulative architecture and embedded engineering", "Final review route", "Embedded System Design with ARM", "Complete the final concept check and defend timing, memory, interfaces, and faults.", "Final exam, firmware archive, and defense", 10, "final"],
    ],
  }),
  HUM201: defineCourse({
    courseCode: "HUM201",
    primaryResource: "Engineering Ethics",
    alternatives: ["IEEE Code of Ethics", "Writing Guide with Handbook"],
    setup: [
      "Create a decision ledger with requirements, stakeholders, costs, benefits, hazards, uncertainties, duties, and sign-offs.",
      "Choose one consequential engineering decision to carry through every method.",
    ],
    firstAction:
      "Read the Engineering Ethics framing material and write the decision, affected public, and non-negotiable duties for your case.",
    weeks: [
      ["Recognize an ethical decision", "Values in specifications, professional roles, and moral imagination", "Introduction · ethics and engineering practice", "Engineering Ethics", "Rewrite a supposedly neutral specification to expose embedded value choices.", "Annotated specification and reflection", 8, "study"],
      ["Use professional duties", "Safety, honesty, competence, conflicts, and public welfare", "Code and professional responsibility route", "IEEE Code of Ethics", "Apply each relevant code clause to a short engineering case.", "Duty matrix with evidence", 8, "problem-set"],
      ["Analyze a failure", "Causation, normalization of deviance, organizations, and accountability", "Failure-case route", "Engineering Ethics", "Build a causal timeline separating individual, technical, and institutional factors.", "Failure timeline and responsibility map", 8, "lab"],
      ["Estimate life-cycle cost", "Time value, NPV, uncertainty, maintenance, and total ownership", "Decision-analysis route", "Writing Guide with Handbook", "Compare two designs over their full life using a transparent cost model.", "Spreadsheet, assumptions, and recommendation", 8, "project"],
      ["Account for externalities", "Public costs, environment, distribution, and who pays", "Public-welfare case route", "Engineering Ethics", "Expand a narrow business case to include three externalized burdens.", "Extended cost ledger and source notes", 8, "quiz"],
      ["Checkpoint I · decision memo", "Duties, failure analysis, life-cycle economics, and externalities", "Case memo route", "Engineering Ethics", "Write a timed go/no-go memo from a supplied safety-and-cost evidence packet.", "Midterm I memo and correction note", 8, "midterm"],
      ["Engineer safety", "Hazards, risk matrices, ALARP reasoning, and hierarchy of controls", "Safety and risk route", "Engineering Ethics", "Create a hazard analysis and replace weak warnings with stronger controls.", "Hazard log and control hierarchy", 8, "lab"],
      ["Work with standards", "Codes, certification, compliance, and standard-setting legitimacy", "Professional standards route", "IEEE Code of Ethics", "Trace one product requirement to a standard and identify its limits.", "Traceability chain and gap analysis", 8, "practice"],
      ["Decide under uncertainty", "Expected value, sensitivity, robustness, and precaution", "Risk decision route", "Engineering Ethics", "Run sensitivity analysis on a safety-critical choice and identify decision reversals.", "Sensitivity plot and robust recommendation", 8, "project"],
      ["Handle conflicts", "Employer/client duty, whistleblowing, dissent, and documentation", "Professional conflict cases", "Engineering Ethics", "Draft an escalation record for a scenario where schedule conflicts with safety.", "Contemporaneous record and escalation plan", 8, "presentation"],
      ["Checkpoint II · ethics board", "Risk, standards, uncertainty, and professional conflict", "Cumulative board simulation", "Engineering Ethics", "Defend an assigned design before a hostile review board, then issue your own judgment.", "Midterm II hearing and reasoned decision", 8, "midterm"],
      ["Design for justice", "Distribution, accessibility, participation, and vulnerable groups", "Equity and public-interest route", "Engineering Ethics", "Audit the chosen decision for exclusion and propose measurable remedies.", "Justice audit and revised requirements", 8, "project"],
      ["Plan the whole life", "Manufacture, operation, maintenance, decommissioning, and stewardship", "Life-cycle responsibility route", "Engineering Ethics", "Assign owners and evidence gates across the system life cycle.", "RACI-style stewardship map", 8, "practice"],
      ["Assemble the decision case", "Technical evidence, economics, ethics, alternatives, and uncertainty", "Final decision dossier route", "Writing Guide with Handbook", "Draft a board-ready decision dossier with an explicit dissent section.", "Dossier draft and evidence appendix", 8, "project"],
      ["Face the review board", "Concise advocacy, questions, revision, and accountability", "Presentation route", "Engineering Ethics", "Give an eight-minute design decision defense and answer risk-owner questions.", "Review recording and revised decision", 8, "presentation"],
      ["Defend accountable judgment", "Cumulative engineering decision practice", "Final portfolio route", "Engineering Ethics", "Submit the complete ledger and survive a random evidence/duty audit.", "Final dossier, oral defense, and reflection", 8, "final"],
    ],
  }),
  EE301: defineCourse({
    courseCode: "EE301",
    primaryResource: "Electromagnetics and Applications",
    alternatives: ["Digital Communication Systems", "Microwave Engineering", "GNU Radio"],
    setup: [
      "Install GNU Octave/Python for field and link calculations and GNU Radio for the baseband experiments.",
      "Create a link notebook that carries units, reference planes, gains/losses, noise bandwidths, and assumptions.",
    ],
    firstAction:
      "Review Maxwell's equations and phasors, then calculate and visualize the field of one simple source.",
    safetyLabNote:
      "Use simulation or legally compliant receive-only SDR work. Do not transmit RF without appropriate authorization, shielding, power limits, and frequency allocation.",
    weeks: [
      ["Read Maxwell as a system", "Differential/integral laws, constitutive relations, and boundary conditions", "Part I · Maxwell equations and media", "Electromagnetics and Applications", "Build a units-and-meaning table and solve two symmetry-based field problems.", "Maxwell table and solutions", 7, "problem-set"],
      ["Launch a plane wave", "Wave equation, propagation constant, impedance, phase, and power", "Waves in uniform media", "Electromagnetics and Applications", "Calculate and animate a lossy-medium plane wave.", "Wave notebook and power-flow check", 7, "lab"],
      ["Meet an interface", "Reflection, transmission, polarization, and standing waves", "Reflection and transmission route", "Electromagnetics and Applications", "Predict and simulate normal-incidence reflection for three material pairs.", "Coefficient table and field plots", 7, "problem-set"],
      ["Use transmission lines", "Telegrapher equations, impedance, reflection coefficient, and VSWR", "Transmission-line unit", "Electromagnetics and Applications", "Analyze a mismatched line in time and frequency views.", "Line model, bounce diagram, and sweep", 7, "lab"],
      ["Match the load", "Smith chart, stubs, quarter-wave transformers, and bandwidth", "Matching route", "Microwave Engineering", "Design and verify a single-frequency matching network.", "Smith-chart work and verification", 7, "quiz"],
      ["Checkpoint I · propagation", "Maxwell laws, waves, interfaces, lines, and matching", "First examination route", "Electromagnetics and Applications", "Sit a closed-notes exam and complete one transmission-line practical.", "Midterm I, practical, and corrections", 7, "midterm"],
      ["Radiate deliberately", "Potentials, dipoles, far field, radiation pattern, and polarization", "Antenna and radiation unit", "Electromagnetics and Applications", "Calculate and plot a dipole pattern and identify near/far assumptions.", "Radiation notebook and pattern plot", 7, "problem-set"],
      ["Build an antenna budget", "Gain, aperture, Friis equation, path loss, and link margins", "Antennas and link applications", "Electromagnetics and Applications", "Create a traceable free-space link budget with a fade margin.", "Link-budget sheet and unit audit", 7, "project"],
      ["Put information on a carrier", "Baseband/passband models, AM/PM/FM and digital modulation", "Modulation route", "Digital Communication Systems", "Generate and inspect BPSK/QPSK waveforms in GNU Radio or code.", "Flowgraph/code and constellation captures", 7, "lab"],
      ["Include noise", "Thermal noise, noise figure, SNR, matched filtering, and BER", "Noise and detection route", "Digital Communication Systems", "Simulate BER versus Eb/N0 and compare with a theoretical curve.", "BER plot and discrepancy analysis", 7, "project"],
      ["Checkpoint II · complete link practical", "Antennas, link budgets, modulation, noise, and BER", "Cumulative link route", "Digital Communication Systems", "Diagnose an unseen link that misses its range/error target.", "Midterm II repaired budget and evidence", 7, "midterm"],
      ["Share spectrum", "Bandwidth, pulse shaping, intersymbol interference, and spectral masks", "Baseband signaling route", "Digital Communication Systems", "Compare pulse shapes in time, spectrum, and eye diagram.", "Three-view signal report", 7, "lab"],
      ["Confront real channels", "Multipath, fading, equalization intuition, and measurement limits", "Channel route", "GNU Radio", "Model a two-path channel and quantify its frequency-selective effect.", "Channel response and mitigation note", 7, "project"],
      ["Design the end-to-end link", "Frequency, antenna, power, modulation, coding margin, and verification", "Course project route", "Electromagnetics and Applications", "Design a legal, simulated wired/wireless link to a given range and data target.", "Release link budget and simulation suite", 7, "project"],
      ["Demonstrate margin", "Nominal operation, fading/noise fault, and evidence", "Project presentation route", "GNU Radio", "Run the link live, degrade one parameter, and explain the failure boundary.", "Demo recording and architecture poster", 7, "presentation"],
      ["Defend the link", "Cumulative fields-to-bits engineering", "Final examination/design route", "Electromagnetics and Applications", "Sit the final and defend every gain, loss, bandwidth, noise, and safety assumption.", "Final exam, project archive, and defense", 7, "final"],
    ],
  }),
  EE302: defineCourse({
    courseCode: "EE302",
    primaryResource: "Feedback Systems: An Introduction for Scientists and Engineers",
    alternatives: ["Electronic Feedback Systems", "Embedded System Design with ARM", "Wokwi"],
    setup: [
      "Install GNU Octave or Python control tools and use Wokwi/OpenModelica for hardware-in-the-loop-style simulation.",
      "Create model, controller, firmware, timing, fault, and verification folders.",
    ],
    firstAction:
      "Complete the feedback introduction, model a first-order plant, and compare open- and closed-loop step responses.",
    safetyLabNote:
      "Use simulation by default. Any physical actuator must have mechanical guards, current/velocity limits, an emergency stop, and a tested safe state.",
    weeks: [
      ["Close the loop", "Feedback architecture, disturbances, uncertainty, and performance", "Chapter 1 · feedback principles", "Feedback Systems: An Introduction for Scientists and Engineers", "Model one everyday controlled system and simulate open/closed disturbance response.", "Block diagram and response comparison", 7, "study"],
      ["Model dynamics", "ODEs, transfer functions, state space, equilibrium, and linearization", "Modeling chapters", "Feedback Systems: An Introduction for Scientists and Engineers", "Derive two plant models and validate dimensions/limiting cases.", "Model cards and simulation checks", 7, "problem-set"],
      ["Read time response", "Poles, modes, transient metrics, and steady-state error", "Dynamic behavior route", "Electronic Feedback Systems", "Extract response metrics across a parameter sweep.", "Pole/metric table and plots", 7, "lab"],
      ["Judge stability", "Characteristic equation, Routh intuition, and stability margins", "Stability chapters", "Feedback Systems: An Introduction for Scientists and Engineers", "Classify closed-loop stability and find one gain boundary.", "Stability calculation and root plot", 7, "problem-set"],
      ["Design PID", "P/I/D effects, anti-windup, derivative filtering, and tuning", "PID/control design route", "Feedback Systems: An Introduction for Scientists and Engineers", "Tune a controller to settling, overshoot, and effort requirements.", "Controller parameters and requirement table", 7, "quiz"],
      ["Checkpoint I · classical control", "Models, response, stability, and PID design", "First examination/design route", "Feedback Systems: An Introduction for Scientists and Engineers", "Complete a written exam and tune an unseen plant under time limit.", "Midterm I controller and corrections", 7, "midterm"],
      ["Shape frequency response", "Bode plots, loop transfer, bandwidth, gain/phase margin", "Frequency-domain design route", "Electronic Feedback Systems", "Measure robustness margins and redesign one compensator.", "Bode evidence and before/after metrics", 7, "lab"],
      ["Use state space", "Controllability, observability, state feedback, and references", "State-space chapters", "Feedback Systems: An Introduction for Scientists and Engineers", "Analyze and control a two-state model.", "Matrices, rank checks, and trajectories", 7, "problem-set"],
      ["Estimate hidden state", "Observers, sensor noise, complementary/Kalman intuition", "Estimation route", "Feedback Systems: An Introduction for Scientists and Engineers", "Build an observer and compare estimate error under noise.", "Observer code and error statistics", 7, "project"],
      ["Schedule in real time", "Sampling, discretization, latency, jitter, and task scheduling", "Real-time implementation route", "Embedded System Design with ARM", "Implement a fixed-rate control loop and measure timing jitter.", "Firmware/simulation and timing histogram", 7, "lab"],
      ["Checkpoint II · embedded-control practical", "Frequency/state design, estimation, sampling, and timing", "Cumulative practical route", "Wokwi", "Repair a controller with stability, sensor, and timing faults.", "Midterm II patch, traces, and fault log", 7, "midterm"],
      ["Design safe failure", "Saturation, watchdogs, sensor plausibility, fallback, and interlocks", "Safety and implementation route", "Embedded System Design with ARM", "Inject actuator/sensor faults and prove bounded safe behavior.", "Fault matrix and recovery evidence", 7, "lab"],
      ["Verify hardware-in-the-loop", "Plant emulation, interfaces, trace alignment, and acceptance tests", "Integrated verification route", "Wokwi", "Connect controller code to a simulated plant and automate acceptance tests.", "HIL harness and test report", 7, "project"],
      ["Build the controlled system", "Requirements, plant ID, controller, implementation, faults, and evidence", "Course project route", "Feedback Systems: An Introduction for Scientists and Engineers", "Complete a self-balancing, temperature, speed, or position control system in simulation.", "Release candidate and verification matrix", 7, "project"],
      ["Demonstrate robustness", "Nominal tracking, disturbance, parameter change, and fault response", "Project presentation route", "Wokwi", "Run a live demo across all four scenarios and explain performance limits.", "Demo recording and safety case", 7, "presentation"],
      ["Defend the controller", "Cumulative feedback and real-time control", "Final design review route", "Feedback Systems: An Introduction for Scientists and Engineers", "Sit the final and defend stability, timing, estimation, and fault claims.", "Final exam, project archive, and defense", 7, "final"],
    ],
  }),
  EE303: defineCourse({
    courseCode: "EE303",
    primaryResource: "Analog Electronic Circuits",
    alternatives: ["Microelectronic Devices and Circuits", "Circuits and Electronics", "LTspice"],
    setup: [
      "Install LTspice or ngspice with MOS/BJT and basic CMOS models.",
      "Keep hand analysis, operating points, AC/transient/noise sweeps, corners, and revisions together.",
    ],
    firstAction:
      "Review MOS/BJT small-signal models, then reproduce and explain one common-source operating point and gain.",
    safetyLabNote:
      "Simulation is sufficient. Optional hardware remains current-limited and low-voltage; observe device polarity, power, and temperature ratings.",
    weeks: [
      ["Bias a transistor", "MOS/BJT operating regions, load lines, headroom, and sensitivity", "Opening modules · transistor bias", "Analog Electronic Circuits", "Design and sweep a stable single-transistor bias point.", "Bias calculations and corner plot", 7, "lab"],
      ["Linearize the device", "Small-signal models, gm, ro, gain, and impedances", "Small-signal amplifier module", "Analog Electronic Circuits", "Derive and simulate gain/input/output resistance for two stages.", "Hand/SPICE comparison table", 7, "problem-set"],
      ["Build gain stages", "Common-source/emitter, source/emitter follower, and cascode", "Single-stage amplifiers", "Analog Electronic Circuits", "Compare three topologies against gain and headroom requirements.", "Trade-study and AC sweeps", 7, "lab"],
      ["Create current sources", "Mirrors, references, compliance, output resistance, and mismatch", "Current mirrors and bias circuits", "Analog Electronic Circuits", "Design a mirror and quantify line regulation and mismatch sensitivity.", "Schematic and sweep evidence", 7, "project"],
      ["Use differential pairs", "Differential/common-mode gain, CMRR, tail current, and range", "Differential amplifier module", "Analog Electronic Circuits", "Characterize a differential pair across common-mode and mismatch.", "CMRR/range plots and explanation", 7, "quiz"],
      ["Checkpoint I · analog stages", "Bias, small signal, stages, mirrors, and differential pairs", "First examination/design route", "Analog Electronic Circuits", "Sit a written exam and design an unseen gain stage to specification.", "Midterm I design, simulation, and corrections", 7, "midterm"],
      ["Shape frequency response", "Device capacitance, poles, zeros, Miller effect, and bandwidth", "Frequency response module", "Analog Electronic Circuits", "Identify dominant poles and reconcile analytic/SPICE bandwidth.", "Pole estimate and Bode overlay", 7, "problem-set"],
      ["Use feedback in amplifiers", "Loop gain, closed-loop accuracy, stability, and compensation", "Feedback and stability module", "Analog Electronic Circuits", "Close a loop around a two-stage amplifier and measure margins.", "Loop-gain plots and compensation choice", 7, "lab"],
      ["Design an op-amp core", "Input pair, gain stage, output stage, bias, and compensation", "Operational amplifier design route", "Analog Electronic Circuits", "Assemble a compact op-amp and verify DC gain, UGB, phase margin, and swing.", "Op-amp schematic and metric dashboard", 7, "project"],
      ["Switch to CMOS logic", "Inverter VTC, noise margins, delay, energy, and sizing", "CMOS digital route", "Microelectronic Devices and Circuits", "Size an inverter and sweep load, supply, and input slew.", "VTC, timing, and energy plots", 7, "lab"],
      ["Checkpoint II · mixed analog/CMOS practical", "Frequency, feedback, op-amp, inverter timing, and power", "Cumulative design route", "LTspice", "Repair a mixed-signal block that fails gain, stability, and timing limits.", "Midterm II patch and verification report", 7, "midterm"],
      ["Compose CMOS gates", "Static logic, logical effort intuition, fanout, and glitches", "CMOS logic module", "Microelectronic Devices and Circuits", "Design a multi-input gate and compare two transistor arrangements.", "Layout-level schematic and delay study", 7, "problem-set"],
      ["Think about layout", "Parasitics, matching, common centroid, DRC/LVS concepts, and extraction", "Layout and verification route", "Microelectronic Devices and Circuits", "Produce a floorplan/layout sketch and estimate dominant parasitics.", "Annotated layout plan and parasitic budget", 7, "project"],
      ["Build the mixed-signal subsystem", "Sensor front end, comparator/ADC interface, CMOS control, and corners", "Course project route", "LTspice", "Integrate an analog front end with a compact CMOS decision block.", "Release candidate and PVT verification matrix", 7, "project"],
      ["Demonstrate across corners", "Gain, bandwidth, stability, timing, energy, and failure boundary", "Project presentation route", "LTspice", "Run nominal and worst-corner demos and explain the first failed specification.", "Demo recording and design-review deck", 7, "presentation"],
      ["Defend the silicon story", "Cumulative analog and CMOS design", "Final examination/design route", "Analog Electronic Circuits", "Sit the final and defend the subsystem from device model through PVT evidence.", "Final exam, archive, and defense notes", 7, "final"],
    ],
  }),
  EE304: defineCourse({
    courseCode: "EE304",
    primaryResource: "Digital Signal Processing",
    alternatives: ["The Scientist and Engineer's Guide to Digital Signal Processing", "The Fourier Transform and Its Applications", "SciPy"],
    setup: [
      "Install Python/SciPy or GNU Octave and create reusable plotting, filter-test, and audio/sensor I/O functions.",
      "Use openly licensed or self-recorded data and preserve raw files separately from derived results.",
    ],
    firstAction:
      "Review discrete-time signals, then load, plot, normalize, and describe one real audio or sensor record.",
    safetyLabNote:
      "Keep audio playback at safe levels and obtain consent before recording people; prefer public or self-generated non-sensitive data.",
    weeks: [
      ["Represent sampled data", "Sequences, indexing, energy, power, and discrete LTI systems", "Opening lectures · discrete-time signals", "Digital Signal Processing", "Classify and manipulate ten sequences in code and by hand.", "Sequence notebook and checked set", 7, "problem-set"],
      ["Convolve in discrete time", "Impulse response, FIR systems, difference equations, and stability", "Discrete-time systems unit", "Digital Signal Processing", "Implement convolution two ways and test edge/alignment cases.", "Functions, tests, and waveform overlays", 7, "lab"],
      ["Use the DTFT", "Frequency response, periodic spectra, and filter interpretation", "DTFT unit", "Digital Signal Processing", "Derive and plot frequency responses for three short filters.", "Derivations and response atlas", 7, "problem-set"],
      ["Compute the DFT", "DFT bins, leakage, zero padding, windowing, and resolution", "DFT unit", "The Scientist and Engineer's Guide to Digital Signal Processing", "Measure a tone off-bin under three windows and explain each spectrum.", "Leakage experiment and interpretation", 7, "lab"],
      ["Make the FFT useful", "FFT structure, computational cost, scaling, and verification", "FFT lectures", "Digital Signal Processing", "Benchmark direct DFT versus FFT and audit amplitude normalization.", "Benchmark and scaling test", 7, "quiz"],
      ["Checkpoint I · spectral analysis", "Discrete LTI, DTFT, DFT, windows, and FFT", "First examination/practical route", "Digital Signal Processing", "Sit a written exam and analyze an unseen finite record under time limit.", "Midterm I notebook and corrections", 7, "midterm"],
      ["Design FIR filters", "Specifications, window/equiripple intuition, phase, and delay", "FIR design unit", "Digital Signal Processing", "Design an FIR filter to pass/stop/ripple requirements.", "Coefficient file and verification plots", 7, "project"],
      ["Design IIR filters", "Poles/zeros, analog prototypes, transforms, stability, and SOS form", "IIR design unit", "Digital Signal Processing", "Design an IIR alternative and compare cost, phase, and robustness.", "IIR/FIR trade study", 7, "problem-set"],
      ["Estimate spectra", "Periodogram, Welch method, bias/variance, and noise floor", "Spectral estimation route", "SciPy", "Estimate a noisy signal PSD with multiple segment/window choices.", "PSD study and parameter rationale", 7, "lab"],
      ["Respect finite precision", "Quantization, coefficient error, overflow, fixed point, and limit cycles", "Finite-word-length unit", "Digital Signal Processing", "Quantize a filter and locate the minimum word length meeting specs.", "Word-length sweep and failure cases", 7, "project"],
      ["Checkpoint II · filter implementation", "FIR/IIR, PSD, quantization, stability, and test design", "Second design practical", "Digital Signal Processing", "Repair an unfamiliar filter implementation that fails frequency and numeric tests.", "Midterm II patch and verification report", 7, "midterm"],
      ["Change sample rate", "Decimation, interpolation, anti-alias filters, and polyphase intuition", "Multirate unit", "Digital Signal Processing", "Build a resampler and prove its anti-alias behavior.", "Resampler code and spectral evidence", 7, "lab"],
      ["Process a stream", "Block processing, latency, buffers, real-time constraints, and profiling", "Implementation route", "SciPy", "Convert batch analysis to a bounded-latency streaming pipeline.", "Profiler output and latency budget", 7, "project"],
      ["Build the authentic filter", "Data, requirements, design, implementation, and evaluation", "Course project route", "Digital Signal Processing", "Filter or detect a meaningful feature in real audio/sensor data.", "Release candidate, data card, and tests", 7, "project"],
      ["Demonstrate before/after", "Audible/visible effect, objective metrics, artifacts, and limits", "Project presentation route", "The Scientist and Engineer's Guide to Digital Signal Processing", "Run the stream live and expose one artifact or adversarial input.", "Demo recording and metric dashboard", 7, "presentation"],
      ["Defend the DSP chain", "Cumulative transforms, filters, spectra, and implementation", "Final examination/project route", "Digital Signal Processing", "Sit the final and defend every DSP choice from specification to real-time evidence.", "Final exam, code/data archive, and defense", 7, "final"],
    ],
  }),
  CAP401: defineCourse({
    courseCode: "CAP401",
    primaryResource: "Engineering Ethics",
    alternatives: ["Science Writing and New Media", "KiCad", "IEEE Code of Ethics"],
    setup: [
      "Create a public project repository with decisions, research, requirements, hazards, experiments, design files, tests, and review records.",
      "Name at least three real stakeholders and one external reviewer; choose a project that can be made safe and testable with available tools.",
    ],
    firstAction:
      "Write a one-page problem framing based on observed evidence, then schedule the first two stakeholder conversations.",
    safetyLabNote:
      "A simulation-only capstone is valid. Before physical work, document hazards, energy sources, safe states, supervision needs, and stop criteria.",
    weeks: [
      ["Observe the need", "Problem framing, context, existing work, and avoidable solution bias", "Case-analysis and problem-framing route", "Engineering Ethics", "Collect direct evidence of a real need and distinguish symptoms from causes.", "Problem brief and evidence log", 10, "study"],
      ["Listen to stakeholders", "Interview design, consent, workflows, pain points, and success", "Research and interview route", "Science Writing and New Media", "Conduct at least two consented stakeholder conversations and synthesize themes.", "Interview notes and insight map", 10, "lab"],
      ["Map prior art", "Literature, products, patents, standards, and credible sources", "Research synthesis route", "Science Writing and New Media", "Review at least eight relevant sources and reproduce one baseline result.", "Prior-art matrix and baseline evidence", 10, "problem-set"],
      ["Write testable requirements", "Needs, constraints, metrics, acceptance thresholds, and traceability", "Technical writing and specification route", "Writing Guide with Handbook", "Turn stakeholder evidence into numbered, measurable requirements.", "Requirements specification and trace matrix", 10, "project"],
      ["Choose an architecture", "Functions, interfaces, alternatives, trade studies, and ownership", "Engineering decision route", "Engineering Ethics", "Generate three architectures and choose one using weighted evidence.", "Architecture diagrams and decision record", 10, "quiz"],
      ["Checkpoint I · concept review", "Need, prior art, requirements, architecture, and project feasibility", "Design review route", "Science Writing and New Media", "Hold a formal concept review and close every blocking action.", "Midterm I review recording and action log", 10, "midterm"],
      ["Build the hazard case", "Hazard analysis, misuse, privacy, accessibility, and safe state", "Safety and professional responsibility route", "Engineering Ethics", "Create a living hazard log with controls, owners, and verification methods.", "Hazard analysis and ethics checklist", 10, "lab"],
      ["Retire the hardest risk", "Critical assumption, proof experiment, fixture, and falsification", "Experimental evidence route", "Introductory Analog Electronics Laboratory", "Run the smallest experiment that can disprove the riskiest technical claim.", "Protocol, raw data, and go/pivot decision", 10, "project"],
      ["Prototype the interfaces", "Subsystem contracts, electrical/software/mechanical boundaries, and mocks", "Project implementation route", "KiCad", "Prototype every critical interface before full integration.", "Interface control document and test evidence", 10, "lab"],
      ["Plan verification", "Requirement-to-test mapping, acceptance criteria, fixtures, and coverage", "Laboratory reporting route", "Introductory Analog Electronics Laboratory", "Write executable test procedures for every must-pass requirement.", "Verification plan and coverage matrix", 10, "project"],
      ["Checkpoint II · preliminary design review", "Architecture, hazards, interfaces, experiments, and verification", "Design review route", "Engineering Ethics", "Defend the design to an external reviewer and resolve all major findings.", "Midterm II PDR package and closure log", 10, "midterm"],
      ["Build the alpha", "Integrated prototype, configuration, logging, and reproducibility", "Implementation workspace", "KiCad", "Integrate the minimum end-to-end system and record a clean-build procedure.", "Alpha prototype and build record", 10, "project"],
      ["Test and revise", "Failure triage, root cause, evidence-based iteration, and change control", "Laboratory project route", "Introductory Analog Electronics Laboratory", "Execute priority tests, isolate top failures, and issue a controlled revision.", "Test report, fault tree, and revision record", 10, "lab"],
      ["Prepare critical design review", "Detailed design, residual risk, schedule, cost, and Semester 6 plan", "Communication and review route", "Science Writing and New Media", "Assemble a review package that another team could continue.", "CDR draft, BOM/cost, and execution plan", 10, "project"],
      ["Pass critical design review", "Evidence-based readiness, open risks, commitments, and communication", "Final presentation route", "Science Writing and New Media", "Give a 15-minute review, demonstrate the alpha, and close required actions.", "CDR recording, decision, and action closures", 10, "presentation"],
      ["Freeze the defensible baseline", "Reproducible prototype, versioned evidence, reflection, and handoff", "Portfolio and ethics route", "Engineering Ethics", "Tag the approved baseline and defend the project need, feasibility, and residual risks.", "Final design dossier, tagged release, and defense", 10, "final"],
    ],
  }),
  EE306: defineCourse({
    courseCode: "EE306",
    primaryResource: "Power Electronics",
    alternatives: ["Introduction to Electric Power Systems", "OpenModelica", "LTspice"],
    setup: [
      "Install LTspice/ngspice and OpenModelica; create separate converter, machine, network, protection, and energy-model workspaces.",
      "Use per-unit/unit-consistent calculation sheets and an explicit loss/thermal/safety budget.",
    ],
    firstAction:
      "Review average power and switching, then simulate an ideal buck converter at two duty ratios.",
    safetyLabNote:
      "All required work is simulation-only. Do not construct mains-connected converters, battery packs, high-current drives, or exposed high-voltage circuits without a supervised power laboratory.",
    weeks: [
      ["Switch power efficiently", "Ideal switches, PWM, duty ratio, ripple, and loss mechanisms", "Opening unit · switched conversion", "Power Electronics", "Derive and simulate ideal buck waveforms and verify volt-second balance.", "Waveforms, derivation, and balance check", 7, "lab"],
      ["Design the buck", "CCM/DCM, inductor/capacitor selection, ripple, and ratings", "Buck-converter unit", "Power Electronics", "Design a buck stage to voltage, ripple, current, and efficiency targets.", "Design sheet and corner sweeps", 7, "project"],
      ["Use boost and buck-boost", "Conversion ratios, device stress, discontinuous modes, and tradeoffs", "Non-isolated converter unit", "Power Electronics", "Compare three topologies for a source/load specification.", "Topology trade study and simulations", 7, "problem-set"],
      ["Include real losses", "Conduction/switching loss, magnetics, thermal paths, and efficiency", "Loss and thermal route", "Power Electronics", "Build a loss model and identify the dominant thermal bottleneck.", "Loss breakdown and thermal estimate", 7, "lab"],
      ["Control a converter", "Averaged models, loop response, compensation, and transient tests", "Converter dynamics/control unit", "Power Electronics", "Tune and verify a voltage loop across line/load changes.", "Loop plots and transient requirement table", 7, "quiz"],
      ["Checkpoint I · converter design", "Topologies, modes, component sizing, loss, and control", "First examination/design route", "Power Electronics", "Sit a written exam and design an unseen low-voltage converter.", "Midterm I design and corrections", 7, "midterm"],
      ["Work in three phases", "RMS/phasors, balanced systems, real/reactive power, and power factor", "Polyphase systems unit", "Introduction to Electric Power Systems", "Analyze a balanced three-phase source/load and correct power factor.", "Phasor/power worksheet", 7, "problem-set"],
      ["Understand machines", "Magnetic circuits, transformers, induction/synchronous machine models", "Magnetic circuits and machines route", "Introduction to Electric Power Systems", "Model one transformer or motor across load and estimate losses.", "Equivalent circuit and efficiency curve", 7, "lab"],
      ["Normalize a power network", "One-line diagrams, per-unit quantities, and network matrices", "Power-system analysis route", "Introduction to Electric Power Systems", "Convert a small network to per unit and verify base changes.", "One-line diagram and per-unit audit", 7, "practice"],
      ["Solve load flow", "Bus types, power balance, voltage, loading, and convergence", "Load-flow unit", "Introduction to Electric Power Systems", "Run a small-network load flow and diagnose a voltage/loading violation.", "Network model and violation report", 7, "project"],
      ["Checkpoint II · grid practical", "Three phase, machines, per unit, and load flow", "Cumulative network route", "OpenModelica", "Repair an unseen converter-fed network that violates limits.", "Midterm II model and remediation evidence", 7, "midterm"],
      ["Protect the system", "Fault current, relays, selectivity, grounding, and safe isolation", "Protection and faults route", "Introduction to Electric Power Systems", "Create a protection coordination concept for the small network.", "Fault study and protection map", 7, "project"],
      ["Integrate storage and renewables", "PV/wind/storage models, inverter interfaces, dispatch, and variability", "Renewable applications route", "OpenModelica", "Simulate a day of load/generation/storage and compare two dispatch rules.", "Energy traces and dispatch comparison", 7, "lab"],
      ["Design the resilient energy system", "Converter, source, storage, loads, protection, efficiency, and constraints", "Course project route", "OpenModelica", "Build a converter or microgrid model with explicit safety and resilience cases.", "Release candidate and verification matrix", 7, "project"],
      ["Demonstrate a disturbance", "Load step, source loss, fault, recovery, and limits", "Project presentation route", "OpenModelica", "Run nominal and disturbance scenarios live and explain energy/power balance.", "Demo recording and resilience dashboard", 7, "presentation"],
      ["Defend the energy design", "Cumulative conversion and power systems", "Final examination/design route", "Power Electronics", "Sit the final and defend efficiency, loading, protection, and resilience claims.", "Final exam, project archive, and defense", 7, "final"],
    ],
  }),
  SYS401: defineCourse({
    courseCode: "SYS401",
    primaryResource: "Introductory Digital Systems Laboratory",
    alternatives: ["KiCad", "Introductory Analog Electronics Laboratory", "Verilator"],
    setup: [
      "Install KiCad, ngspice/LTspice, Verilator, and Git; choose either a manufacturable PCB route or a complete virtual-board/digital-twin route.",
      "Create configuration-controlled requirements, schematics, PCB, firmware/RTL, fixtures, tests, logs, and issue folders.",
    ],
    firstAction:
      "Import or select a small mixed-signal subsystem, inventory every interface, and write its clean bring-up checklist.",
    safetyLabNote:
      "A virtual-board route is fully accepted. Physical boards must stay low-voltage/current-limited; inspect for shorts before power, use ESD controls, and never probe mains-referenced hardware.",
    weeks: [
      ["Define system boundaries", "Requirements, interfaces, configurations, and verification levels", "Project organization route", "Introductory Digital Systems Laboratory", "Create a system context and interface inventory for the chosen subsystem.", "Context diagram and interface control table", 7, "study"],
      ["Capture the schematic", "Power trees, analog/digital partitioning, decoupling, connectors, and test points", "Schematic capture route", "KiCad", "Create and electrically check a complete schematic.", "Reviewed schematic and ERC disposition", 7, "project"],
      ["Design for layout", "Placement, return paths, grounding, differential/current loops, and constraints", "PCB design route", "KiCad", "Place critical components and annotate every high-current/high-speed loop.", "Placement review and constraint sheet", 7, "lab"],
      ["Route and manufacture", "Stackup, widths/clearances, vias, DRC, BOM, and fabrication outputs", "PCB layout/fabrication route", "KiCad", "Complete routing or a virtual layout and generate clean outputs.", "DRC-clean board and fabrication package", 7, "project"],
      ["Design the fixture", "Power limiting, connectors, observability, automation, and golden references", "Laboratory fixture route", "Introductory Analog Electronics Laboratory", "Build or simulate a fixture that isolates each major interface.", "Fixture design and validation test", 7, "quiz"],
      ["Checkpoint I · design release", "Interfaces, schematic, layout, manufacturing, and fixture readiness", "Formal release review", "KiCad", "Hold a design-for-test/manufacture review and close all release blockers.", "Midterm I release package and closure log", 7, "midterm"],
      ["Plan first power", "Inspection, resistance checks, current limits, rails, clocks, and reset", "Bring-up route", "Introductory Digital Systems Laboratory", "Execute a staged virtual or physical bring-up without skipping gates.", "Signed bring-up checklist and traces", 7, "lab"],
      ["Verify digital interfaces", "Logic levels, timing, protocols, assertions, and stress cases", "Digital verification route", "Verilator", "Test a digital interface across normal, boundary, and malformed transactions.", "Waveforms, assertions, and coverage table", 7, "lab"],
      ["Verify analog performance", "Gain, offset, noise, bandwidth, loading, and calibration", "Analog verification route", "Introductory Analog Electronics Laboratory", "Characterize the analog path and compare results with its budget.", "Measured/simulated report and residuals", 7, "project"],
      ["Integrate firmware and hardware", "Drivers, configuration, logs, version compatibility, and recovery", "Systems integration route", "Introductory Digital Systems Laboratory", "Run an end-to-end transaction and capture synchronized hardware/software evidence.", "Integrated trace and configuration manifest", 7, "project"],
      ["Checkpoint II · bring-up practical", "Power, clock/reset, analog/digital interfaces, and fault localization", "Integrated laboratory practical", "Introductory Digital Systems Laboratory", "Diagnose a seeded system fault from symptoms to verified root cause.", "Midterm II fault tree, fix, and regression", 7, "midterm"],
      ["Inject faults", "Open/short/stuck/noisy/timing faults, detection, isolation, and safe recovery", "Reliability test route", "Introductory Digital Systems Laboratory", "Inject at least six faults and measure coverage and recovery time.", "Fault-injection matrix and traces", 7, "lab"],
      ["Test reliability", "Corners, stress, thermal intuition, repeated cycles, and failure criteria", "Reliability route", "KiCad", "Run a bounded stress/corner campaign and identify the weakest margin.", "Margin dashboard and revision recommendation", 7, "project"],
      ["Close verification", "Requirement traceability, regressions, anomalies, waivers, and revision control", "Final verification route", "Introductory Digital Systems Laboratory", "Run the complete regression and resolve or formally disposition every failure.", "Verification report and issue closure ledger", 7, "project"],
      ["Demonstrate under fault", "Nominal mission, injected fault, recovery, and evidence integrity", "Project presentation route", "Introductory Digital Systems Laboratory", "Give a live system demo including one fault and clean recovery.", "Demo recording and verification poster", 7, "presentation"],
      ["Defend the release", "Cumulative board/system verification and revision plan", "Final design review route", "KiCad", "Submit the reproducible release and defend every requirement, anomaly, and residual risk.", "Final release archive and defense record", 7, "final"],
    ],
  }),
  ENT401: defineCourse({
    courseCode: "ENT401",
    primaryResource: "Writing Guide with Handbook",
    alternatives: ["Engineering Ethics", "IEEE Code of Ethics"],
    setup: [
      "Create a deployment dossier with team, scope, unit economics, supply chain, manufacturing, IP, operations, accessibility, and end-of-life sections.",
      "Use your capstone or a credible open hardware/software system as the standing case.",
    ],
    firstAction:
      "Write a deployment premise: user, problem, promised outcome, payer, operator, and evidence still missing.",
    weeks: [
      ["Define value in use", "User outcome, adopter, payer, operator, and alternatives", "Argument and audience route", "Writing Guide with Handbook", "Interview or research three roles and map why each would adopt or resist.", "Role/value map and evidence log", 4, "study"],
      ["Build team operating rules", "Roles, decision rights, conflict, meetings, and documentation", "Collaborative writing route", "Writing Guide with Handbook", "Write a working agreement with escalation and decision-log rules.", "Signed team charter and decision template", 4, "practice"],
      ["Estimate unit economics", "BOM, labor, overhead, margin, service, and scenario ranges", "Research and quantitative evidence route", "Writing Guide with Handbook", "Build a transparent per-unit and annual cost model.", "Cost model and sensitivity table", 4, "problem-set"],
      ["Plan manufacturing", "Make/buy, DFM, yield, quality gates, suppliers, and traceability", "Process explanation route", "Writing Guide with Handbook", "Map the build/test flow and identify the top yield risk.", "Manufacturing flow and control plan", 4, "project"],
      ["Choose ownership", "IP types, licenses, open source, data rights, and freedom to operate", "Source and attribution route", "Writing Guide with Handbook", "Create an ownership/license inventory for every project input/output.", "IP/license ledger and unresolved issues", 4, "quiz"],
      ["Checkpoint I · viability review", "Value, team, cost, manufacturing, and ownership", "Recommendation memo route", "Writing Guide with Handbook", "Defend a deploy/pivot/stop recommendation using a supplied evidence threshold.", "Midterm I viability memo and review notes", 4, "midterm"],
      ["Design operations", "Installation, training, monitoring, support, spares, and escalation", "Instructions and process route", "Writing Guide with Handbook", "Map the first 90 days of operation and response to three incidents.", "Operations playbook and incident tree", 4, "project"],
      ["Plan reliability and maintenance", "Service intervals, diagnostics, repairability, and total ownership", "Engineering responsibility route", "Engineering Ethics", "Convert likely failures into maintenance tasks, owners, and evidence.", "Maintenance plan and ownership cost", 4, "practice"],
      ["Make deployment accessible", "Disability, language, connectivity, affordability, and support channels", "Audience/accessibility route", "Writing Guide with Handbook", "Run an accessibility and exclusion audit of the deployment journey.", "Audit findings and revised requirements", 4, "lab"],
      ["Govern data and security", "Data minimization, access, retention, incidents, and accountability", "Professional duty route", "IEEE Code of Ethics", "Create a data inventory and incident-notification decision tree.", "Data governance sheet and response plan", 4, "project"],
      ["Checkpoint II · launch incident", "Operations, maintenance, access, data, and leadership under pressure", "Cumulative scenario route", "Engineering Ethics", "Lead a simulated launch incident, document decisions, and issue a public update.", "Midterm II incident log and postmortem", 4, "midterm"],
      ["Design the pilot", "Cohort, metrics, guardrails, consent, rollback, and learning", "Research-design route", "Writing Guide with Handbook", "Write a limited pilot protocol with explicit stop criteria.", "Pilot protocol and dashboard specification", 4, "project"],
      ["Plan end of life", "Decommissioning, migration, recycling, data deletion, and stranded users", "Stewardship route", "Engineering Ethics", "Create an end-of-life plan and fund its unresolved obligations.", "End-of-life plan and cost provision", 4, "practice"],
      ["Assemble the deployment case", "Narrative, economics, operations, governance, and residual risk", "Final proposal route", "Writing Guide with Handbook", "Draft a concise deployment dossier for a skeptical decision board.", "Dossier draft and evidence appendix", 4, "project"],
      ["Pitch and negotiate", "Concise presentation, objections, commitments, and revision", "Presentation route", "Science Writing and New Media", "Give an eight-minute deployment pitch and answer operator/public-interest questions.", "Pitch recording and revised commitments", 4, "presentation"],
      ["Defend responsible launch", "Cumulative leadership and deployment judgment", "Portfolio route", "Engineering Ethics", "Submit the dossier and defend who owns cost, harm, maintenance, and shutdown.", "Final dossier, oral defense, and reflection", 4, "final"],
    ],
  }),
  CAP402: defineCourse({
    courseCode: "CAP402",
    primaryResource: "Introductory Digital Systems Laboratory",
    alternatives: ["KiCad", "Science Writing and New Media", "Engineering Ethics"],
    setup: [
      "Fork the approved CAP401 baseline and preserve immutable requirements, hazards, and review history.",
      "Create a release plan with integration gates, verification ownership, field-evaluation consent, documentation, and public-demo constraints.",
    ],
    firstAction:
      "Re-open every CAP401 review action, confirm owners and acceptance evidence, then run the clean baseline build.",
    safetyLabNote:
      "A simulation/digital-twin system can satisfy the capstone. Physical testing follows the approved hazard log, supervision, energy limits, consent, emergency stop, and stop criteria.",
    weeks: [
      ["Rebaseline the mission", "Approved need, requirements, open risks, scope, and configuration", "Project baseline route", "Engineering Ethics", "Audit the CAP401 baseline and negotiate only evidence-backed scope changes.", "Signed baseline and change log", 19, "study"],
      ["Close detailed design", "Schematics/models, interfaces, algorithms, tolerances, and review findings", "System design route", "KiCad", "Complete detailed subsystem designs and close every design-review blocker.", "Detailed design package and closure evidence", 19, "project"],
      ["Build subsystem releases", "Implementation, unit tests, fixtures, configuration, and documentation", "Implementation route", "Introductory Digital Systems Laboratory", "Produce reproducible releases for each subsystem with owner sign-off.", "Subsystem tags and unit-test reports", 19, "lab"],
      ["Integrate by contract", "Interface checks, staged power-up, data contracts, and rollback", "Integration route", "Introductory Digital Systems Laboratory", "Integrate the first end-to-end path one interface at a time.", "Integration log and first mission trace", 19, "project"],
      ["Attack the riskiest margin", "Stress cases, uncertainty, reliability, and redesign threshold", "Verification route", "Introductory Digital Systems Laboratory", "Run the test most likely to fail and complete a root-cause/revision cycle.", "Stress-test data and revision record", 19, "quiz"],
      ["Checkpoint I · integration review", "Detailed design, subsystem evidence, integration, and risk retirement", "Formal integration review", "Science Writing and New Media", "Demonstrate the integrated alpha and close all safety/mission blockers.", "Midterm I review recording and closure log", 19, "midterm"],
      ["Verify requirements", "Acceptance procedures, traceability, repeatability, and anomalies", "Verification campaign route", "Introductory Digital Systems Laboratory", "Execute all must-pass requirements with immutable raw evidence.", "Verification matrix and raw-data archive", 19, "lab"],
      ["Engineer fault response", "Fault injection, degraded modes, detection, isolation, and safe state", "Reliability route", "Introductory Digital Systems Laboratory", "Inject the priority faults and quantify detection/recovery behavior.", "Fault campaign and safety-case update", 19, "lab"],
      ["Prepare field evaluation", "Protocol, consent, training, support, privacy, and stop criteria", "Ethics and public-facing research route", "Engineering Ethics", "Write and dry-run a bounded field-evaluation protocol.", "Approved protocol and rehearsal findings", 19, "project"],
      ["Evaluate with users", "Observed performance, usability, accessibility, and unexpected effects", "Field evidence route", "Science Writing and New Media", "Run a consented evaluation or high-fidelity simulation with target users.", "De-identified evidence and findings", 19, "project"],
      ["Checkpoint II · validation review", "Requirements, faults, field evidence, ethics, and residual risk", "Formal validation review", "Engineering Ethics", "Defend release readiness and receive a release, revise, or stop decision.", "Midterm II review package and decision", 19, "midterm"],
      ["Close the product", "Final fixes, regressions, BOM/configuration, manufacturability, and quality", "Release-engineering route", "KiCad", "Resolve approved findings and run the complete clean-build regression.", "Release candidate and regression report", 19, "project"],
      ["Write for continuation", "User, service, developer, safety, data, and limitations documentation", "Documentation route", "Science Writing and New Media", "Have a new reader install/use/inspect the system solely from the docs.", "Documentation suite and usability audit", 19, "practice"],
      ["Rehearse the defense", "Claim-to-evidence chain, demo reliability, questions, and honest limits", "Presentation route", "Science Writing and New Media", "Run a hostile review rehearsal and repair unsupported claims.", "Defense draft, claim ledger, and fixes", 19, "project"],
      ["Demonstrate publicly", "Working system, measured outcome, fault behavior, and social value", "Public presentation route", "Science Writing and New Media", "Deliver a live public demo with a backup evidence path and answer questions.", "Demo recording, poster, and audience feedback", 19, "presentation"],
      ["Defend and release", "Performance, limitations, safety, consequences, ownership, and handoff", "Final capstone defense", "Engineering Ethics", "Defend the complete system, publish the reproducible archive, and assign post-course stewardship.", "Final release, thesis report, defense, and handoff", 19, "final"],
    ],
  }),
};

export const trackCoursePlans: Record<
  "TRK401" | "TRK402",
  Record<TrackId, TrackCoursePlan>
> = {
  TRK401: {
    chips: defineTrackCourse({
      courseCode: "TRK401",
      trackId: "chips",
      trackName: "Chips & Embedded",
      primaryResource: "Introductory Digital Systems Laboratory",
      alternatives: ["Computation Structures", "Verilator", "RISC-V ISA Specifications"],
      setup: [
        "Install Verilator, a waveform viewer, a synthesis-capable open FPGA flow if available, make, and Git.",
        "Choose a small FPGA target or complete the entire studio with simulated RTL and reproducible synthesis reports.",
      ],
      firstAction:
        "Run the smallest Verilator example, inspect its waveform, and reproduce one combinational and one sequential lab.",
      safetyLabNote:
        "Simulation is sufficient. For hardware, use vendor-safe USB power, current-limited I/O, ESD precautions, and never connect unknown voltage levels.",
      weeks: [
        ["Re-enter synchronous RTL", "Combinational/sequential coding, clocks, reset, and synthesizable subsets", "Labs · HDL foundations", "Introductory Digital Systems Laboratory", "Implement and lint an ALU plus register bank.", "RTL, lint output, and waveforms", 7, "lab"],
        ["Verify interfaces", "Self-checking testbenches, assertions, coverage, and regressions", "Verification guide", "Verilator", "Build a regression that catches five seeded RTL bugs.", "Tests, assertions, and bug evidence", 7, "lab"],
        ["Cross a clock boundary", "Metastability, synchronizers, handshakes, and async FIFOs", "Digital timing route", "Computation Structures", "Design and verify a safe pulse/data transfer.", "CDC diagram and stress-test traces", 7, "problem-set"],
        ["Create streaming datapaths", "Pipelines, throughput, latency, valid/ready, and backpressure", "Project architecture route", "Introductory Digital Systems Laboratory", "Pipeline a multiply-accumulate stream and measure bubbles.", "RTL and throughput/latency report", 7, "project"],
        ["Use on-chip memory", "RAM inference, banking, buffering, and access conflicts", "Memory structures route", "Computation Structures", "Add a double buffer and test simultaneous producer/consumer behavior.", "Memory map and contention tests", 7, "quiz"],
        ["Checkpoint I · FPGA block review", "RTL, verification, CDC, streaming, and memory", "First design review", "Introductory Digital Systems Laboratory", "Deliver a verified streaming block to an external interface contract.", "Midterm I release and review record", 7, "midterm"],
        ["Understand an ISA interface", "RISC-V instructions, registers, traps, and memory semantics", "Unprivileged ISA · base integer route", "RISC-V ISA Specifications", "Decode and trace a small RISC-V program.", "Instruction trace and compliance notes", 7, "problem-set"],
        ["Attach an accelerator", "Memory-mapped/stream interfaces, control/status, and software contract", "Hardware acceleration route", "Computation Structures", "Specify accelerator registers and a reference software model.", "Interface spec and golden model", 7, "project"],
        ["Schedule arithmetic", "Resource sharing, unrolling, pipelining, and numeric formats", "Datapath optimization route", "Introductory Digital Systems Laboratory", "Implement two architectures and compare cost/throughput.", "RTL variants and trade-study", 7, "lab"],
        ["Measure implementation", "Critical path, frequency, area proxies, power proxies, and constraints", "Synthesis/performance route", "Verilator", "Produce reproducible performance/resource estimates and explain bottlenecks.", "Build script and metric dashboard", 7, "project"],
        ["Checkpoint II · accelerator practical", "ISA contract, accelerator interface, arithmetic, and performance", "Timed integration review", "Computation Structures", "Integrate an unfamiliar compute kernel and meet a throughput target.", "Midterm II RTL, driver model, and evidence", 7, "midterm"],
        ["Design fault containment", "Timeouts, illegal states, parity/checks, reset, and observability", "Reliable digital systems route", "Introductory Digital Systems Laboratory", "Inject control/data faults and prove bounded recovery.", "Fault matrix and recovery waveforms", 7, "lab"],
        ["Automate the flow", "Lint, build, regress, synthesize, package, and configuration control", "Tooling route", "Verilator", "Create a one-command clean pipeline with archived artifacts.", "CI-style script and clean-run log", 7, "practice"],
        ["Build the foundation accelerator", "Streaming kernel, memory, control, verification, and metrics", "Final project route", "Introductory Digital Systems Laboratory", "Complete a FIR, matrix, image, or cryptographic accelerator.", "Release candidate and verification report", 7, "project"],
        ["Demonstrate cycle truth", "Waveform-to-requirement evidence, performance, and fault response", "Project presentation", "Verilator", "Run a live regression and explain one transaction cycle by cycle.", "Demo recording and architecture poster", 7, "presentation"],
        ["Defend the RTL release", "Correctness, timing, resources, interfaces, and reproducibility", "Final design review", "Introductory Digital Systems Laboratory", "Defend the accelerator and publish a clean, reproducible release.", "Final archive, oral defense, and revision list", 7, "final"],
      ],
    }),
    signals: defineTrackCourse({
      courseCode: "TRK401",
      trackId: "signals",
      trackName: "Signals, AI & Communications",
      primaryResource: "Probabilistic Systems Analysis and Applied Probability",
      alternatives: ["Digital Signal Processing", "SciPy", "The Scientist and Engineer's Guide to Digital Signal Processing"],
      setup: [
        "Install Python with NumPy, SciPy, and plotting; create immutable train/validation/test data splits.",
        "Use a public or self-collected consented signal data set with a data card.",
      ],
      firstAction:
        "Choose a noisy signal task, define its target metric, and reproduce a simple mean/threshold baseline.",
      safetyLabNote:
        "Do not collect sensitive audio/biometric data without consent; document provenance, privacy limits, and known representation gaps.",
      weeks: [
        ["Frame the inference task", "Signals, labels/targets, metrics, baselines, and leakage", "Estimation overview", "Probabilistic Systems Analysis and Applied Probability", "Write the task/data/metric contract and run a naive baseline.", "Task card and baseline result", 7, "study"],
        ["Model multivariate data", "Means, covariance, whitening, correlation, and geometry", "Multiple random variables", "Probabilistic Systems Analysis and Applied Probability", "Compute and interpret a covariance/whitening pipeline.", "Notebook and covariance diagnostics", 7, "lab"],
        ["Estimate parameters", "MLE, MAP intuition, bias, variance, and regularization", "Estimation route", "Probabilistic Systems Analysis and Applied Probability", "Fit and compare two parametric signal models.", "Estimator comparison and residuals", 7, "problem-set"],
        ["Detect a signal", "Hypothesis tests, likelihood ratios, ROC, false alarm, and miss", "Detection route", "Probabilistic Systems Analysis and Applied Probability", "Build a detector and select an operating threshold.", "ROC curve and threshold decision", 7, "project"],
        ["Extract spectral features", "Windows, PSD, filterbanks, and stable feature pipelines", "Spectral analysis route", "Digital Signal Processing", "Create leakage-aware features from raw records.", "Feature code and audit plots", 7, "quiz"],
        ["Checkpoint I · statistical detector", "Covariance, estimation, detection, and spectral features", "First model review", "Probabilistic Systems Analysis and Applied Probability", "Deliver a held-out detector with a defensible error analysis.", "Midterm I model card and review", 7, "midterm"],
        ["Reduce dimension", "Eigenvectors, PCA, retained variance, and reconstruction", "Numerical linear algebra route", "SciPy", "Implement PCA and test the performance/information tradeoff.", "PCA plots and ablation table", 7, "lab"],
        ["Learn a linear boundary", "Regression, logistic classification, loss, and validation", "Optimization/statistics route", "SciPy", "Train a linear predictor without contaminating the test set.", "Training code and validation curves", 7, "project"],
        ["Model time dependence", "Autocorrelation, AR models, prediction, and residual whiteness", "Random processes route", "Probabilistic Systems Analysis and Applied Probability", "Fit an autoregressive predictor and diagnose residuals.", "AR model and whiteness report", 7, "problem-set"],
        ["Evaluate honestly", "Cross-validation, imbalance, calibration, uncertainty, and subgroup checks", "Statistical validation route", "SciPy", "Run an evaluation that includes confidence and failure slices.", "Evaluation dashboard and error gallery", 7, "project"],
        ["Checkpoint II · unseen-data practical", "Features, dimension, linear learning, time models, and evaluation", "Timed modeling practical", "SciPy", "Build and audit a model on an unseen signal data set.", "Midterm II notebook and model card", 7, "midterm"],
        ["Make the pipeline robust", "Noise shift, missing data, adversarial conditions, and abstention", "Robust inference route", "The Scientist and Engineer's Guide to Digital Signal Processing", "Stress the model under at least four realistic corruptions.", "Robustness matrix and abstention rule", 7, "lab"],
        ["Budget computation", "Streaming features, latency, memory, numeric precision, and profiling", "Implementation route", "SciPy", "Turn the model into a bounded streaming pipeline.", "Profiler output and resource budget", 7, "practice"],
        ["Build the statistical signal system", "Data, features, model, validation, streaming, and limits", "Final project route", "SciPy", "Complete a detector/estimator on authentic signal data.", "Release candidate, data card, and tests", 7, "project"],
        ["Demonstrate failure and success", "Live inference, confidence, corruption, and responsible claims", "Project presentation", "Digital Signal Processing", "Run nominal and shifted-data demos and explain errors.", "Demo recording and result poster", 7, "presentation"],
        ["Defend the model", "Statistical assumptions, evidence, robustness, privacy, and reproducibility", "Final model review", "Probabilistic Systems Analysis and Applied Probability", "Defend every claim against held-out evidence and publish the reproducible pipeline.", "Final archive, model card, and oral defense", 7, "final"],
      ],
    }),
    robotics: defineTrackCourse({
      courseCode: "TRK401",
      trackId: "robotics",
      trackName: "Robotics & Control",
      primaryResource: "Feedback Systems: An Introduction for Scientists and Engineers",
      alternatives: ["ROS 2 Documentation", "Webots User Guide", "SciPy"],
      setup: [
        "Install Webots and a compatible ROS 2 release, or use Webots alone with Python controllers.",
        "Create recorded sensor bags/logs, calibration, estimator, tests, and safety-case folders.",
      ],
      firstAction:
        "Launch a Webots mobile robot, record noisy odometry/sensor data, and quantify one sensor's bias and variance.",
      safetyLabNote:
        "Simulation is sufficient. Physical robots require a clear test zone, speed/force limits, emergency stop, supervision, and no operation near stairs or traffic.",
      weeks: [
        ["Describe uncertain robot state", "Frames, state, sensors, noise, and probability", "Modeling and estimation foundations", "Feedback Systems: An Introduction for Scientists and Engineers", "Define a robot state and measurement model with units and frames.", "State/measurement model card", 7, "study"],
        ["Calibrate sensors", "Bias, scale, alignment, covariance, and repeatability", "Sensors and devices tutorial", "Webots User Guide", "Collect calibration data for two virtual sensors.", "Calibration notebook and covariance estimates", 7, "lab"],
        ["Transform frames", "Rigid 2D/3D transforms, homogeneous matrices, and frame trees", "ROS concepts · transforms route", "ROS 2 Documentation", "Implement and test a three-frame transform chain.", "Frame diagram, code, and tests", 7, "problem-set"],
        ["Estimate with least squares", "Overdetermined geometry, weighting, outliers, and residuals", "Numerical estimation route", "SciPy", "Estimate pose/parameters from noisy measurements.", "Estimator notebook and residual analysis", 7, "project"],
        ["Use recursive Bayes", "Prediction, update, Gaussian models, and Kalman filter", "State estimation route", "Feedback Systems: An Introduction for Scientists and Engineers", "Implement a 1D/2D Kalman filter and inspect innovation.", "Filter code and innovation plots", 7, "quiz"],
        ["Checkpoint I · sensor-fusion review", "Frames, calibration, covariance, least squares, and Kalman filtering", "First estimation review", "Webots User Guide", "Deliver a validated pose/velocity estimate on hidden trajectories.", "Midterm I estimator and report", 7, "midterm"],
        ["Fuse asynchronous sensors", "Rates, timestamps, interpolation, delay, and out-of-sequence data", "ROS timing route", "ROS 2 Documentation", "Fuse two sensors at different rates and inject timestamp error.", "Fusion code and timing-sensitivity plot", 7, "lab"],
        ["Model robot motion", "Kinematic motion models, controls, process noise, and discretization", "Robot/controller route", "Webots User Guide", "Derive and simulate a differential-drive motion model.", "Model derivation and trajectory tests", 7, "problem-set"],
        ["Use an extended filter", "Linearization, Jacobians, EKF consistency, and divergence", "Nonlinear estimation route", "SciPy", "Implement an EKF and construct one divergence case.", "EKF notebook and consistency evidence", 7, "project"],
        ["Build ROS data flow", "Nodes, topics, messages, parameters, bags, and launch", "ROS 2 tutorials", "ROS 2 Documentation", "Package the estimator as a reproducible node/launch system.", "ROS package and replay test", 7, "lab"],
        ["Checkpoint II · localization practical", "Asynchronous fusion, motion models, EKF, and ROS integration", "Timed localization challenge", "Webots User Guide", "Localize an unseen simulated run with missing/noisy sensor segments.", "Midterm II package and error report", 7, "midterm"],
        ["Detect estimator failure", "Innovation gates, plausibility, covariance inflation, and fallback", "Robust estimation route", "Feedback Systems: An Introduction for Scientists and Engineers", "Inject bias/dropout and implement detection plus degraded output.", "Fault matrix and fallback traces", 7, "lab"],
        ["Evaluate trajectories", "Ground truth, RMSE, drift, alignment, and scenario coverage", "Simulation evaluation route", "Webots User Guide", "Create a repeatable multi-world estimator benchmark.", "Benchmark harness and scorecard", 7, "practice"],
        ["Build the fusion system", "Calibration, frames, model, filter, ROS, faults, and metrics", "Final project route", "ROS 2 Documentation", "Complete localization for a simulated mobile robot.", "Release candidate and benchmark report", 7, "project"],
        ["Demonstrate lost and found", "Nominal localization, sensor loss, recovery, and uncertainty", "Project presentation", "Webots User Guide", "Run the robot live, remove a sensor, and explain confidence/recovery.", "Demo recording and estimation poster", 7, "presentation"],
        ["Defend the estimate", "Models, assumptions, timing, consistency, faults, and reproducibility", "Final estimation review", "Feedback Systems: An Introduction for Scientists and Engineers", "Defend the localization stack against hidden-test evidence.", "Final archive, safety note, and oral defense", 7, "final"],
      ],
    }),
    energy: defineTrackCourse({
      courseCode: "TRK401",
      trackId: "energy",
      trackName: "Energy & Power",
      primaryResource: "Power Electronics",
      alternatives: ["Introduction to Electric Power Systems", "OpenModelica", "LTspice"],
      setup: [
        "Install LTspice/ngspice and OpenModelica; use supplied/public component models rather than constructing power hardware.",
        "Create switching, loss, thermal, control, drive/load, and safety verification workspaces.",
      ],
      firstAction:
        "Reproduce an ideal buck-converter example, then add a realistic switch loss and explain the efficiency change.",
      safetyLabNote:
        "This studio is simulation-only unless supervised in a power laboratory. Never connect to mains, build packs, or spin unguarded machinery.",
      weeks: [
        ["Set converter requirements", "Source/load envelopes, isolation, ripple, efficiency, and safety", "Converter introduction", "Power Electronics", "Translate one supply/drive need into traceable electrical requirements.", "Requirement sheet and architecture options", 7, "study"],
        ["Model switching cells", "PWM, volt-second/charge balance, CCM/DCM, and waveforms", "Fundamental converter analysis", "Power Electronics", "Derive and simulate buck/boost steady-state behavior.", "Derivations and waveform checks", 7, "problem-set"],
        ["Choose passive components", "Inductor/capacitor ripple, current, voltage, ESR, and saturation", "Converter design route", "Power Electronics", "Select components across the full operating envelope.", "Component sheet and corner simulation", 7, "lab"],
        ["Select switches", "MOSFET/diode stress, conduction/switching loss, dead time", "Semiconductor loss route", "Power Electronics", "Compare two switch choices and build a loss breakdown.", "Device trade-study and efficiency plot", 7, "project"],
        ["Design magnetics", "Flux, turns, core loss, copper loss, and thermal limits", "Magnetics route", "Power Electronics", "Size a simulated inductor/transformer and check saturation.", "Magnetics worksheet and margin table", 7, "quiz"],
        ["Checkpoint I · converter hardware review", "Requirements, modes, passives, semiconductors, magnetics, and loss", "First design review", "Power Electronics", "Deliver a converter power-stage design meeting the full envelope.", "Midterm I design package and review", 7, "midterm"],
        ["Average the converter", "Small-signal averaged model, control-to-output, and line/load effects", "Dynamics and modeling route", "Power Electronics", "Derive/identify an averaged plant and validate against switching simulation.", "Model comparison and validity limits", 7, "problem-set"],
        ["Compensate the loop", "Loop shaping, crossover, margins, and transient tradeoffs", "Control design route", "Power Electronics", "Design a compensator and verify line/load transients.", "Bode evidence and transient table", 7, "lab"],
        ["Drive a machine", "Machine equivalent model, inverter, torque-speed, and modulation", "Machines/applications route", "Introduction to Electric Power Systems", "Simulate a converter-fed motor/load operating point.", "Drive model and torque-speed plot", 7, "project"],
        ["Model thermal behavior", "Loss maps, thermal networks, cycling, derating, and lifetime", "Thermal/reliability route", "OpenModelica", "Build a thermal model and derive a safe operating envelope.", "Temperature traces and derating curve", 7, "lab"],
        ["Checkpoint II · drive practical", "Averaged model, compensation, machine/load, and thermal limits", "Timed drive design", "OpenModelica", "Repair a converter-drive model that fails stability and temperature limits.", "Midterm II model and remediation report", 7, "midterm"],
        ["Handle abnormal states", "Inrush, overcurrent, shoot-through, sensor failure, and shutdown", "Protection route", "Power Electronics", "Inject six faults and specify detection/isolation sequences.", "Protection state machine and fault traces", 7, "lab"],
        ["Estimate real efficiency", "Operating profile, weighted efficiency, standby, and energy yield", "Applications route", "Power Electronics", "Evaluate efficiency over a realistic duty/load cycle.", "Weighted-efficiency report", 7, "practice"],
        ["Build the converter/drive", "Power stage, control, thermal model, protection, and envelope", "Final project route", "OpenModelica", "Complete a simulated converter or motor drive to specification.", "Release candidate and verification matrix", 7, "project"],
        ["Demonstrate the envelope", "Nominal, transient, thermal, and fault behavior", "Project presentation", "OpenModelica", "Run four live scenarios and expose the first hard limit.", "Demo recording and design dashboard", 7, "presentation"],
        ["Defend the power design", "Efficiency, control, thermal safety, faults, and reproducibility", "Final power review", "Power Electronics", "Defend every rating and publish the complete simulation release.", "Final archive, safety case, and oral defense", 7, "final"],
      ],
    }),
  },
  TRK402: {
    chips: defineTrackCourse({
      courseCode: "TRK402",
      trackId: "chips",
      trackName: "Chips & Embedded",
      primaryResource: "Computation Structures",
      alternatives: ["RISC-V ISA Specifications", "Verilator", "Build a Modern Computer from First Principles"],
      setup: [
        "Reuse the TRK401 RTL flow; add instruction/reference-model tests, performance workloads, and reproducible synthesis.",
        "Choose a small RISC-V core extension or accelerator architecture that can be fully verified in simulation.",
      ],
      firstAction:
        "Run a baseline processor test, record CPI/runtime/resource proxies, and identify one workload bottleneck.",
      safetyLabNote:
        "Simulation is sufficient. Hardware deployment must use supported FPGA boards, safe I/O voltage, ESD handling, and vendor power limits.",
      weeks: [
        ["Profile the workload", "Instruction mix, data movement, latency, throughput, and baseline", "Processor performance route", "Computation Structures", "Measure a representative kernel and state the limiting resource.", "Baseline report and traces", 8, "lab"],
        ["Specify the microarchitecture", "Pipeline stages, hazards, bypassing, stalls, and exceptions", "Pipelining unit", "Computation Structures", "Draw a cycle-accurate pipeline contract and hazard table.", "Pipeline spec and timing examples", 8, "problem-set"],
        ["Implement pipeline control", "Data/control hazards, forwarding, bubbles, flush, and correctness", "Processor implementation route", "Verilator", "Implement and regression-test hazard handling.", "RTL, directed tests, and waveforms", 8, "lab"],
        ["Design the memory system", "Caches, associativity, replacement, write policy, and AMAT", "Memory hierarchy unit", "Computation Structures", "Simulate two cache designs on the workload.", "Cache simulator and AMAT trade-study", 8, "project"],
        ["Define the extension", "ISA custom operation, encoding, semantics, traps, and software intrinsic", "ISA reference · extension conventions", "RISC-V ISA Specifications", "Write an unambiguous extension and reference model.", "ISA mini-spec and golden tests", 8, "quiz"],
        ["Checkpoint I · architecture review", "Pipeline, hazards, memory, workload, and ISA extension", "Microarchitecture review", "Computation Structures", "Defend a cycle-accurate design against correctness/performance questions.", "Midterm I spec, model, and review record", 8, "midterm"],
        ["Build the accelerator datapath", "Parallelism, pipelining, buffers, numeric format, and control", "Hardware acceleration route", "Verilator", "Implement the compute core and compare against the golden model.", "Datapath RTL and bit-exact regression", 8, "lab"],
        ["Connect processor and accelerator", "Register interface, DMA/streaming, ordering, and interrupts", "System integration route", "Computation Structures", "Integrate control/data interfaces and run an end-to-end program.", "Integration RTL and software trace", 8, "project"],
        ["Verify the architecture", "Random instructions, assertions, scoreboards, and coverage closure", "Verification route", "Verilator", "Create a reference-driven regression and close priority coverage gaps.", "Regression suite and coverage report", 8, "lab"],
        ["Optimize with evidence", "CPI, frequency proxy, area proxy, memory traffic, and energy proxy", "Performance engineering route", "Computation Structures", "Apply two optimizations and measure workload-level impact.", "Before/after dashboard and decision log", 8, "project"],
        ["Checkpoint II · hidden-workload practical", "Core/accelerator integration, verification, and optimization", "Timed architecture challenge", "Verilator", "Run an unseen workload, locate the bottleneck, and make one safe improvement.", "Midterm II patch and measured result", 8, "midterm"],
        ["Handle faults and privilege boundaries", "Illegal operations, timeouts, reset, isolation, and secure defaults", "Robust architecture route", "RISC-V ISA Specifications", "Inject interface/control faults and prove containment.", "Fault matrix and assertion evidence", 8, "lab"],
        ["Reproduce a published idea", "Paper reading, baseline, claimed metric, and faithful reproduction", "Course literature route", "Computation Structures", "Reproduce one small architecture result with documented deviations.", "Reproduction report and artifact scripts", 8, "practice"],
        ["Extend the result", "Hypothesis, architectural change, fair experiment, and ablation", "Final research project", "Verilator", "Implement and evaluate one justified extension.", "Release candidate and ablation table", 8, "project"],
        ["Demonstrate workload speedup", "Correct output, cycles, bottlenecks, faults, and comparison", "Project presentation", "Verilator", "Run baseline and extension live on the same workload.", "Demo recording and architecture poster", 8, "presentation"],
        ["Defend the architecture", "ISA correctness, microarchitecture, memory, acceleration, and evidence", "Final architecture review", "Computation Structures", "Defend the extension and publish a reproducible artifact.", "Final archive, paper-style report, and oral defense", 8, "final"],
      ],
    }),
    signals: defineTrackCourse({
      courseCode: "TRK402",
      trackId: "signals",
      trackName: "Signals, AI & Communications",
      primaryResource: "Digital Communication Systems",
      alternatives: ["An Introduction to Information Theory", "GNU Radio", "The Fourier Transform and Its Applications"],
      setup: [
        "Install GNU Radio plus Python/SciPy; use simulation or lawful receive-only SDR data.",
        "Create source, channel, receiver, coding, experiments, and link-evidence modules.",
      ],
      firstAction:
        "Run a baseband BPSK simulation, estimate BER across SNR, and compare it with the reference curve.",
      safetyLabNote:
        "Do not transmit RF without authorization. Use simulation, shielded test setups, or legal receive-only recordings and protect any captured personal communications.",
      weeks: [
        ["Measure information", "Entropy, joint/conditional entropy, mutual information, and units", "Opening lectures · entropy", "An Introduction to Information Theory", "Compute information quantities for three source models.", "Calculation set and simulation checks", 8, "problem-set"],
        ["Compress a source", "Typicality intuition, prefix codes, source coding, and redundancy", "Source coding route", "An Introduction to Information Theory", "Build and evaluate a Huffman-style code.", "Codec and compression report", 8, "lab"],
        ["Model the channel", "Discrete channels, transition matrices, mutual information, and capacity", "Channel capacity route", "An Introduction to Information Theory", "Calculate capacity for symmetric/asymmetric example channels.", "Capacity notebook and interpretation", 8, "problem-set"],
        ["Detect symbols", "Signal space, matched filters, MAP/ML decisions, and error probability", "Receiver/detection unit", "Digital Communication Systems", "Implement a matched-filter BPSK receiver.", "Receiver code and BER curve", 8, "project"],
        ["Shape pulses", "Nyquist criterion, raised cosine, bandwidth, timing, and eye diagrams", "Baseband signaling unit", "Digital Communication Systems", "Compare three pulse shapes and measure ISI.", "Eye diagrams and bandwidth table", 8, "quiz"],
        ["Checkpoint I · coded-link review", "Entropy, source/channel models, detection, and pulse shaping", "First link review", "Digital Communication Systems", "Deliver a validated baseband link with a traceable error budget.", "Midterm I link and review notes", 8, "midterm"],
        ["Use bandpass modulation", "QPSK/QAM, constellation geometry, Gray mapping, and Eb/N0", "Modulation unit", "Digital Communication Systems", "Build and compare QPSK and QAM links.", "Constellation/BER comparison", 8, "lab"],
        ["Synchronize the receiver", "Carrier/timing offset, acquisition, tracking, and residual error", "Synchronization route", "GNU Radio", "Inject offsets and implement a recovery loop.", "Flowgraph and lock/error traces", 8, "project"],
        ["Code against errors", "Block/convolutional coding, soft decisions, interleaving, and gain", "Channel coding route", "Digital Communication Systems", "Add a code and quantify net coding gain including overhead.", "Coded/uncoded BER and rate table", 8, "lab"],
        ["Survive fading", "Multipath, fading statistics, channel estimation, equalization", "Channel/equalization route", "Digital Communication Systems", "Implement a multipath channel and a simple equalizer.", "Channel estimate and before/after error", 8, "project"],
        ["Checkpoint II · impaired-link practical", "Modulation, synchronization, coding, fading, and equalization", "Timed receiver challenge", "GNU Radio", "Recover data through an unseen impaired channel.", "Midterm II flowgraph and impairment report", 8, "midterm"],
        ["Share time and frequency", "OFDM intuition, cyclic prefix, subcarriers, PAPR, and allocation", "Multicarrier route", "GNU Radio", "Build a small OFDM simulation and vary delay spread.", "OFDM flowgraph and robustness plots", 8, "lab"],
        ["Budget the whole link", "Rate, bandwidth, power, capacity gap, complexity, and latency", "System design route", "Digital Communication Systems", "Create a consistent end-to-end design budget.", "Link budget and capacity-gap analysis", 8, "practice"],
        ["Build the wireless system", "Source, modulation, synchronization, coding, channel, and receiver", "Final project route", "GNU Radio", "Complete a simulated/loopback link for a defined message/rate target.", "Release candidate and automated experiments", 8, "project"],
        ["Demonstrate graceful degradation", "Nominal data, worsening channel, adaptation, and failure boundary", "Project presentation", "GNU Radio", "Run the link live across increasing impairment.", "Demo recording and link dashboard", 8, "presentation"],
        ["Defend the link", "Information limits, waveform choices, receiver evidence, and legality", "Final communications review", "Digital Communication Systems", "Defend the system against hidden channel tests and publish its artifact.", "Final archive, report, and oral defense", 8, "final"],
      ],
    }),
    robotics: defineTrackCourse({
      courseCode: "TRK402",
      trackId: "robotics",
      trackName: "Robotics & Control",
      primaryResource: "Webots User Guide",
      alternatives: ["ROS 2 Documentation", "Feedback Systems: An Introduction for Scientists and Engineers", "SciPy"],
      setup: [
        "Reuse the TRK401 Webots/ROS 2 workspace; add maps, planners, controllers, scenario tests, and safety monitors.",
        "Choose a mobile or manipulator robot whose complete mission can be evaluated in simulation.",
      ],
      firstAction:
        "Run the baseline robot in a simple world, record task completion, path length, clearance, and control effort.",
      safetyLabNote:
        "Simulation is sufficient. Physical trials require guarded space, speed/force limits, emergency stop, remote observer, and tested collision/fault response.",
      weeks: [
        ["Model robot geometry", "Configuration, degrees of freedom, constraints, and task space", "Robot/world modeling route", "Webots User Guide", "Define the robot configuration and collision geometry.", "Model, frame diagram, and checks", 8, "study"],
        ["Solve forward kinematics", "Transforms, chains, Jacobian intuition, and differential motion", "Controller and device route", "Webots User Guide", "Compute and validate forward kinematics for the chosen robot.", "Kinematics code and pose tests", 8, "problem-set"],
        ["Solve inverse motion", "Inverse kinematics, singularity, redundancy, and constraints", "Numerical solver route", "SciPy", "Implement an IK or inverse motion solver with failure reporting.", "Solver and reachable/singular test set", 8, "lab"],
        ["Represent the world", "Maps, occupancy, configuration space, inflation, and uncertainty", "World/map route", "Webots User Guide", "Build a map and collision checker for two robot footprints.", "Map pipeline and collision tests", 8, "project"],
        ["Search for a path", "Graph search, heuristics, optimality, and resolution", "Planning route", "SciPy", "Implement A* and compare two heuristics/maps.", "Planner, tests, and performance table", 8, "quiz"],
        ["Checkpoint I · planning review", "Kinematics, maps, collision, and search", "First autonomy review", "Webots User Guide", "Plan valid missions through hidden worlds and explain failures.", "Midterm I planner and review record", 8, "midterm"],
        ["Plan continuous motion", "Sampling-based planning, smoothing, dynamics, and feasibility", "Simulation/planning route", "Webots User Guide", "Add smoothing or sampling and validate collision-free execution.", "Trajectory set and feasibility report", 8, "lab"],
        ["Track a trajectory", "Feedforward, feedback, error coordinates, saturation, and stability", "Tracking-control route", "Feedback Systems: An Introduction for Scientists and Engineers", "Design and tune a trajectory controller.", "Tracking plots and stability rationale", 8, "project"],
        ["Build a ROS mission", "Actions, services, lifecycle, launch, parameters, and bags", "ROS 2 intermediate tutorials", "ROS 2 Documentation", "Package planning/control as a repeatable mission launch.", "ROS package and replay evidence", 8, "lab"],
        ["React online", "Local planning, obstacle updates, replanning, latency, and deadlock", "Robot supervisor route", "Webots User Guide", "Add dynamic obstacles and measure replanning behavior.", "Scenario traces and latency table", 8, "project"],
        ["Checkpoint II · autonomy practical", "Motion planning, tracking, ROS mission, and replanning", "Timed mission challenge", "Webots User Guide", "Complete an unseen mission with dynamic obstacles and bounded errors.", "Midterm II package and scorecard", 8, "midterm"],
        ["Engineer safety behavior", "Safety envelopes, monitors, stop distance, watchdogs, and human override", "Safety/control route", "Feedback Systems: An Introduction for Scientists and Engineers", "Implement independent speed/clearance/fault monitors.", "Safety monitor tests and stop evidence", 8, "lab"],
        ["Evaluate fairly", "Scenario coverage, seeds, success, efficiency, near misses, and regressions", "Simulation experiment route", "Webots User Guide", "Build a multi-scenario benchmark with fixed seeds.", "Benchmark harness and confidence summary", 8, "practice"],
        ["Build the autonomous mission", "Perception/state input, planning, control, recovery, and safety", "Final project route", "ROS 2 Documentation", "Complete an assistive, inspection, or delivery mission in simulation.", "Release candidate and scenario report", 8, "project"],
        ["Demonstrate recovery", "Nominal mission, blocked path, sensor fault, and safe stop", "Project presentation", "Webots User Guide", "Run all four cases live and narrate state transitions.", "Demo recording and autonomy dashboard", 8, "presentation"],
        ["Defend the robot", "Geometry, planning, control, software, safety, and evidence", "Final autonomy review", "ROS 2 Documentation", "Defend the system against hidden scenarios and publish the reproducible world.", "Final archive, safety case, and oral defense", 8, "final"],
      ],
    }),
    energy: defineTrackCourse({
      courseCode: "TRK402",
      trackId: "energy",
      trackName: "Energy & Power",
      primaryResource: "Introduction to Electric Power Systems",
      alternatives: ["Power Electronics", "OpenModelica", "Engineering Ethics"],
      setup: [
        "Install OpenModelica and create a versioned one-line/network data set with base quantities and scenario definitions.",
        "Use only simulation/public data; document load, generation, protection, and outage assumptions.",
      ],
      firstAction:
        "Build and solve a three-bus per-unit network, then reconcile every bus power balance.",
      safetyLabNote:
        "The studio is simulation-only. Never interact with live panels, utility equipment, relays, or distributed-generation wiring without authorized supervision.",
      weeks: [
        ["Build the network model", "One-lines, buses/branches, per unit, admittance, and power balance", "Network modeling route", "Introduction to Electric Power Systems", "Create and unit-audit a small network model.", "One-line, data file, and balance check", 8, "lab"],
        ["Solve power flow", "Bus types, nonlinear equations, convergence, and violations", "Load-flow route", "Introduction to Electric Power Systems", "Run base-case load flow and explain voltage/loading results.", "Solved case and violation report", 8, "problem-set"],
        ["Test contingencies", "N-1 thinking, outage redistribution, overload, and voltage collapse intuition", "System operation route", "Introduction to Electric Power Systems", "Automate branch/generator outage screening.", "Contingency ranking and worst-case trace", 8, "project"],
        ["Model faults", "Symmetrical components intuition, short-circuit levels, and fault types", "Fault analysis route", "Introduction to Electric Power Systems", "Calculate and simulate selected bus fault current.", "Fault study and assumptions", 8, "problem-set"],
        ["Coordinate protection", "Relay zones, time-current curves, selectivity, breakers, and backup", "Protection design route", "Introduction to Electric Power Systems", "Create a selective protection scheme for the model.", "Protection map and coordination plots", 8, "quiz"],
        ["Checkpoint I · grid security review", "Power flow, contingencies, faults, and protection coordination", "First system review", "Introduction to Electric Power Systems", "Defend the network under its worst credible contingency.", "Midterm I model and review record", 8, "midterm"],
        ["Add inverter resources", "Grid-following interfaces, reactive support, limits, and ride-through", "Converter/grid route", "Power Electronics", "Add PV/storage inverter behavior and test voltage support.", "Inverter model and support plots", 8, "lab"],
        ["Schedule energy", "Load/generation forecasts, storage state, dispatch, and constraints", "Energy-management route", "OpenModelica", "Optimize or compare dispatch rules over a day.", "Dispatch traces, cost, and constraint audit", 8, "project"],
        ["Protect a microgrid", "Islanding, detection, resynchronization, grounding, and modes", "Microgrid route", "OpenModelica", "Design transitions among grid-connected, islanded, and shutdown states.", "State diagram and transition simulations", 8, "lab"],
        ["Measure resilience", "Critical loads, outage duration, restoration, black start, and uncertainty", "Resilience route", "Introduction to Electric Power Systems", "Run outage/restoration scenarios and calculate service metrics.", "Resilience scorecard and restoration plan", 8, "project"],
        ["Checkpoint II · disturbance practical", "Inverters, dispatch, islanding, and restoration", "Timed microgrid challenge", "OpenModelica", "Stabilize an unseen source/load outage while respecting protection.", "Midterm II model and operator log", 8, "midterm"],
        ["Secure the control surface", "Telemetry, bad data, communications loss, manual fallback, and accountability", "Operational responsibility route", "Engineering Ethics", "Inject data/control failures and define safe operator actions.", "Cyber-physical fault matrix", 8, "lab"],
        ["Evaluate public consequences", "Reliability allocation, critical services, tariffs, access, and community voice", "Public-welfare route", "Engineering Ethics", "Compare two investment plans across technical and equity metrics.", "Decision memo and distribution table", 8, "practice"],
        ["Build the resilient microgrid", "Network, DER, storage, dispatch, protection, restoration, and governance", "Final project route", "OpenModelica", "Complete a simulated community or campus microgrid.", "Release candidate and scenario regression", 8, "project"],
        ["Demonstrate loss and recovery", "Normal operation, contingency, island, fault, and restoration", "Project presentation", "OpenModelica", "Run a live disturbance sequence and narrate protection/dispatch decisions.", "Demo recording and operator dashboard", 8, "presentation"],
        ["Defend the grid", "Power flow, protection, DER, resilience, equity, and reproducibility", "Final system review", "Introduction to Electric Power Systems", "Defend the design against hidden contingencies and publish the full model.", "Final archive, system report, and oral defense", 8, "final"],
      ],
    }),
  },
};

export function getCoursePlan(
  courseCode: string,
  trackId?: TrackId,
): CoursePlan | undefined {
  if (courseCode === "TRK401" || courseCode === "TRK402") {
    return trackCoursePlans[courseCode][trackId ?? "chips"];
  }

  return coursePlans[courseCode];
}
