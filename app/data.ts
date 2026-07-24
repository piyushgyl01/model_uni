export type Course = {
  code: string;
  title: string;
  semester: number;
  credits: number;
  hours: number;
  kind: "theory" | "lab" | "studio" | "humanities" | "capstone";
  summary: string;
  prerequisites: string[];
  outcome: string;
  track?: TrackId;
};

export type Semester = {
  number: number;
  year: number;
  theme: string;
  credits: number;
  hours: number;
  courseCodes: string[];
};

export type TrackId = "chips" | "signals" | "robotics" | "energy";

export type Track = {
  id: TrackId;
  name: string;
  kicker: string;
  description: string;
  color: string;
  courseNames: string[];
  capstoneIdeas: string[];
};

export type Resource = {
  title: string;
  provider: string;
  area: string;
  url: string;
  access:
    | "Open course"
    | "Free course"
    | "Open textbook"
    | "Free-to-read"
    | "Free tool"
    | "Reference";
  note: string;
};

export type Cadence = {
  week: number;
  label: string;
  focus: string;
  checkpoint: string;
  tone?: "teal" | "amber" | "coral";
};

export type Assessment = {
  name: string;
  audience: string;
  parts: { label: string; weight: number }[];
};

export type LabRoute = {
  name: string;
  label: string;
  description: string;
  tools: string[];
};

export type ProvenanceSource = {
  name: string;
  note: string;
  url: string;
};

export type School = {
  id: string;
  name: string;
  kicker: string;
  description: string;
  disciplineIds: string[];
};

export type Discipline = {
  id: string;
  schoolId: string;
  name: string;
  description: string;
  programIds: string[];
};

export type Program = {
  id: string;
  disciplineId: string;
  name: string;
  credential: string;
  description: string;
  duration: string;
  totalCredits: number;
  semesterNumbers: number[];
  courseCodes: string[];
  trackIds: TrackId[];
};

export type LearningModule = {
  id: string;
  courseCode: string;
  order: number;
  title: string;
  weeks: [number, number];
  summary: string;
  resourceTitles: string[];
};

export const courses: Course[] = [
  {
    code: "MATH101",
    title: "Calculus I: Models and Change",
    semester: 1,
    credits: 4,
    hours: 10,
    kind: "theory",
    summary:
      "Limits, derivatives, integrals, approximation, and engineering models taught through physical examples.",
    prerequisites: [],
    outcome:
      "Model rates and accumulated quantities, justify a solution, and use calculus confidently in mechanics and circuits.",
  },
  {
    code: "PHYS101",
    title: "Physics I: Mechanics and Waves",
    semester: 1,
    credits: 4,
    hours: 10,
    kind: "theory",
    summary:
      "Newtonian mechanics, energy, momentum, rotation, oscillation, and wave behavior with computational experiments.",
    prerequisites: [],
    outcome:
      "Translate a physical system into equations, test predictions, and explain the limits of an idealized model.",
  },
  {
    code: "CS101",
    title: "Programming for Engineers",
    semester: 1,
    credits: 3,
    hours: 8,
    kind: "studio",
    summary:
      "Python, numerical thinking, data structures, testing, version control, and small engineering simulations.",
    prerequisites: [],
    outcome:
      "Write tested programs that acquire, transform, visualize, and explain engineering data.",
  },
  {
    code: "EE101",
    title: "Electrical Engineering Studio I",
    semester: 1,
    credits: 3,
    hours: 10,
    kind: "studio",
    summary:
      "A first tour of sensing, circuits, digital logic, communications, control, energy, and ethical design.",
    prerequisites: [],
    outcome:
      "Build and demonstrate a small sensing system while documenting measurements and design decisions.",
  },
  {
    code: "HUM101",
    title: "Writing and Argument for Engineers",
    semester: 1,
    credits: 2,
    hours: 7,
    kind: "humanities",
    summary:
      "Evidence, argument, visual explanation, source evaluation, and clear technical prose for mixed audiences.",
    prerequisites: [],
    outcome:
      "Produce a concise, source-aware technical memo whose claims can be independently checked.",
  },
  {
    code: "MATH102",
    title: "Calculus II: Multivariable Systems",
    semester: 2,
    credits: 4,
    hours: 10,
    kind: "theory",
    summary:
      "Integration techniques, sequences, vector calculus, partial derivatives, and multivariable optimization.",
    prerequisites: ["MATH101"],
    outcome:
      "Analyze multivariable models and use gradients, integrals, and series in field and system problems.",
  },
  {
    code: "PHYS102",
    title: "Physics II: Electricity and Magnetism",
    semester: 2,
    credits: 4,
    hours: 10,
    kind: "theory",
    summary:
      "Electric and magnetic fields, potential, capacitance, induction, and the physical origins of circuit models.",
    prerequisites: ["PHYS101", "MATH101"],
    outcome:
      "Predict field and energy behavior and connect Maxwell-era physics to practical electrical components.",
  },
  {
    code: "CS102",
    title: "Data Structures and Systems Programming",
    semester: 2,
    credits: 3,
    hours: 8,
    kind: "studio",
    summary:
      "C programming, memory, data structures, asymptotic reasoning, interfaces, and low-level debugging.",
    prerequisites: ["CS101"],
    outcome:
      "Implement resource-aware software and reason about its correctness, memory use, and runtime.",
  },
  {
    code: "EE102",
    title: "Circuit Analysis I",
    semester: 2,
    credits: 3,
    hours: 10,
    kind: "lab",
    summary:
      "KCL, KVL, Thévenin and Norton models, transient response, op-amps, and measurement uncertainty.",
    prerequisites: ["MATH101", "EE101"],
    outcome:
      "Analyze, simulate, assemble, and diagnose first-order analog circuits from specifications.",
  },
  {
    code: "HUM102",
    title: "Technology, Society, and Public Reason",
    semester: 2,
    credits: 2,
    hours: 7,
    kind: "humanities",
    summary:
      "Historical and social analysis of infrastructure, automation, access, labor, privacy, and technological risk.",
    prerequisites: ["HUM101"],
    outcome:
      "Evaluate a technical intervention through stakeholder, equity, policy, and long-term consequence lenses.",
  },
  {
    code: "MATH201",
    title: "Linear Algebra and Differential Equations",
    semester: 3,
    credits: 4,
    hours: 10,
    kind: "theory",
    summary:
      "Vector spaces, eigenstructure, least squares, ordinary differential equations, and state-space models.",
    prerequisites: ["MATH102"],
    outcome:
      "Solve coupled linear systems and interpret modes, stability, and approximation geometrically.",
  },
  {
    code: "EE201",
    title: "Circuit Analysis II",
    semester: 3,
    credits: 3,
    hours: 8,
    kind: "theory",
    summary:
      "Sinusoidal steady state, impedance, frequency response, resonance, two-port models, and network power.",
    prerequisites: ["EE102", "MATH102"],
    outcome:
      "Design and verify second-order networks and explain their time- and frequency-domain behavior.",
  },
  {
    code: "EE202",
    title: "Digital Logic and Hardware Description",
    semester: 3,
    credits: 3,
    hours: 8,
    kind: "studio",
    summary:
      "Boolean logic, combinational and sequential systems, timing, finite-state machines, and introductory HDL.",
    prerequisites: ["CS102"],
    outcome:
      "Specify, simulate, test, and synthesize a clocked digital system with a clear timing contract.",
  },
  {
    code: "EE203",
    title: "Electronics and Instrumentation Lab I",
    semester: 3,
    credits: 3,
    hours: 10,
    kind: "lab",
    summary:
      "Oscilloscopes, meters, sources, solderless prototyping, filters, op-amps, calibration, and error analysis.",
    prerequisites: ["EE102"],
    outcome:
      "Capture trustworthy measurements, distinguish circuit faults from instrument artifacts, and keep a reproducible lab notebook.",
  },
  {
    code: "SCI201",
    title: "Materials and Chemistry for Electronics",
    semester: 3,
    credits: 3,
    hours: 9,
    kind: "theory",
    summary:
      "Bonding, crystal structure, carriers, dielectrics, batteries, fabrication materials, and degradation.",
    prerequisites: ["PHYS101"],
    outcome:
      "Relate material structure to electrical behavior and select materials using performance and sustainability constraints.",
  },
  {
    code: "MATH202",
    title: "Probability and Random Processes",
    semester: 4,
    credits: 3,
    hours: 8,
    kind: "theory",
    summary:
      "Probability models, estimation, common distributions, conditioning, random processes, noise, and simulation.",
    prerequisites: ["MATH102", "MATH201"],
    outcome:
      "Quantify uncertainty, design a defensible estimator, and characterize noise in measured signals.",
  },
  {
    code: "EE204",
    title: "Signals and Systems",
    semester: 4,
    credits: 4,
    hours: 11,
    kind: "theory",
    summary:
      "Continuous and discrete signals, convolution, LTI systems, Fourier analysis, Laplace and z transforms, and sampling.",
    prerequisites: ["MATH201", "EE201"],
    outcome:
      "Move fluently between time, frequency, and transform views to analyze an interconnected system.",
  },
  {
    code: "EE205",
    title: "Semiconductor Devices",
    semester: 4,
    credits: 3,
    hours: 8,
    kind: "theory",
    summary:
      "Carrier transport, pn junctions, diodes, BJTs, MOS capacitors, MOSFETs, and non-ideal device behavior.",
    prerequisites: ["EE201", "SCI201"],
    outcome:
      "Explain device I–V behavior from physical principles and choose useful operating regions for design.",
    track: "chips",
  },
  {
    code: "EE206",
    title: "Computer Architecture and Embedded Systems",
    semester: 4,
    credits: 3,
    hours: 10,
    kind: "lab",
    summary:
      "Instruction sets, datapaths, memory hierarchy, peripherals, interrupts, buses, and bare-metal firmware.",
    prerequisites: ["EE202", "CS102"],
    outcome:
      "Integrate firmware and peripherals on a microcontroller and explain timing from instruction to pin.",
    track: "chips",
  },
  {
    code: "HUM201",
    title: "Economics, Ethics, and Engineering Decisions",
    semester: 4,
    credits: 3,
    hours: 8,
    kind: "humanities",
    summary:
      "Engineering ethics, life-cycle cost, externalities, standards, safety, professional duty, and public accountability.",
    prerequisites: ["HUM102"],
    outcome:
      "Defend a design decision using technical evidence, economic tradeoffs, and a stated ethical framework.",
  },
  {
    code: "EE301",
    title: "Electromagnetic Fields and Waves",
    semester: 5,
    credits: 4,
    hours: 10,
    kind: "theory",
    summary:
      "Maxwell's equations, boundary conditions, wave propagation, transmission lines, reflection, radiation, and antennas.",
    prerequisites: ["PHYS102", "MATH201"],
    outcome:
      "Analyze a guided or radiating electromagnetic structure and connect equations to measurable behavior.",
  },
  {
    code: "EE302",
    title: "Feedback and Control Systems",
    semester: 5,
    credits: 3,
    hours: 8,
    kind: "theory",
    summary:
      "Dynamic models, feedback, stability, root locus, frequency response, state space, and PID design.",
    prerequisites: ["EE204", "MATH201"],
    outcome:
      "Model, stabilize, tune, and validate a feedback-controlled physical system.",
    track: "robotics",
  },
  {
    code: "EE303",
    title: "Analog Electronics",
    semester: 5,
    credits: 3,
    hours: 8,
    kind: "theory",
    summary:
      "Diode, BJT, and MOSFET circuits; biasing; small-signal models; feedback amplifiers; and noise.",
    prerequisites: ["EE201", "EE203", "EE205"],
    outcome:
      "Design a multistage analog signal chain that meets gain, bandwidth, noise, and power targets.",
    track: "chips",
  },
  {
    code: "EE304",
    title: "Digital Signal Processing",
    semester: 5,
    credits: 3,
    hours: 8,
    kind: "studio",
    summary:
      "Discrete-time transforms, FIR and IIR filters, FFTs, spectral estimation, quantization, and real-time implementation.",
    prerequisites: ["EE204", "MATH202"],
    outcome:
      "Design, implement, and evaluate a digital filter on authentic sensor or audio data.",
    track: "signals",
  },
  {
    code: "LAB301",
    title: "Instrumentation and PCB Design Lab",
    semester: 5,
    credits: 3,
    hours: 11,
    kind: "lab",
    summary:
      "Requirements, mixed-signal measurement, schematic capture, PCB layout, design rules, bring-up, and test fixtures.",
    prerequisites: ["EE202", "EE203"],
    outcome:
      "Take a small instrument from requirement through board files, bring-up evidence, and a revision plan.",
  },
  {
    code: "EE305",
    title: "Communication Systems",
    semester: 6,
    credits: 3,
    hours: 8,
    kind: "theory",
    summary:
      "Analog and digital modulation, baseband and passband models, detection, noise, link budgets, and coding.",
    prerequisites: ["EE204", "EE304", "MATH202"],
    outcome:
      "Build a link budget and compare modulation choices using bandwidth, power, and error probability.",
    track: "signals",
  },
  {
    code: "EE306",
    title: "Electric Energy and Power Systems",
    semester: 6,
    credits: 3,
    hours: 8,
    kind: "theory",
    summary:
      "Three-phase power, transformers, rotating machines, per-unit analysis, power flow, protection, and grids.",
    prerequisites: ["EE201", "EE301"],
    outcome:
      "Model a small power network and assess voltage, loading, loss, safety, and resilience.",
    track: "energy",
  },
  {
    code: "EE307",
    title: "Microelectronics and VLSI",
    semester: 6,
    credits: 3,
    hours: 8,
    kind: "studio",
    summary:
      "CMOS logic, delay, power, layout, verification, memory, datapaths, and the digital design flow.",
    prerequisites: ["EE205", "EE303"],
    outcome:
      "Implement and verify a compact CMOS subsystem while reasoning about area, timing, and energy.",
    track: "chips",
  },
  {
    code: "EE308",
    title: "Real-Time Embedded Computing",
    semester: 6,
    credits: 3,
    hours: 8,
    kind: "lab",
    summary:
      "Scheduling, concurrency, real-time constraints, communication protocols, sensor fusion, and hardware-in-the-loop tests.",
    prerequisites: ["EE206", "LAB301"],
    outcome:
      "Deliver a responsive embedded controller with measured timing, robust fault handling, and automated tests.",
    track: "robotics",
  },
  {
    code: "LAB302",
    title: "Integrated Systems Lab",
    semester: 6,
    credits: 4,
    hours: 13,
    kind: "lab",
    summary:
      "A team build joining sensing, analog front ends, embedded control, signal processing, communication, and power.",
    prerequisites: ["EE302", "EE304", "LAB301"],
    outcome:
      "Integrate and validate a complete electrical system against requirements, hazards, and a test matrix.",
  },
  {
    code: "TRK401",
    title: "Specialization Studio I: Foundations",
    semester: 7,
    credits: 3,
    hours: 8,
    kind: "studio",
    summary:
      "The first of three choices from Chips, Signals, Robotics, or Energy, centered on a rigorous track foundation.",
    prerequisites: ["LAB302"],
    outcome:
      "Apply the foundational models and workflows of one specialization to a substantial design exercise.",
  },
  {
    code: "TRK402",
    title: "Specialization Studio II: Systems",
    semester: 7,
    credits: 3,
    hours: 8,
    kind: "studio",
    summary:
      "A second track choice emphasizing system architecture, contemporary practice, and experimental validation.",
    prerequisites: ["LAB302"],
    outcome:
      "Compare architectures, justify a system design, and validate its most important technical claim.",
  },
  {
    code: "ETH401",
    title: "Safety, Standards, and Responsible Innovation",
    semester: 7,
    credits: 2,
    hours: 6,
    kind: "humanities",
    summary:
      "Hazard analysis, reliability, privacy, accessibility, standards, environmental impact, and responsible research.",
    prerequisites: ["HUM201"],
    outcome:
      "Create a practical assurance case connecting hazards, mitigations, evidence, and unresolved risk.",
  },
  {
    code: "COM401",
    title: "Technical Communication and Research Practice",
    semester: 7,
    credits: 2,
    hours: 6,
    kind: "humanities",
    summary:
      "Literature search, experiment design, reproducibility, data presentation, peer review, and oral explanation.",
    prerequisites: ["HUM101"],
    outcome:
      "Write and present a reproducible project proposal grounded in primary evidence.",
  },
  {
    code: "CAP401",
    title: "Senior Design I: Discover and Prove",
    semester: 7,
    credits: 6,
    hours: 17,
    kind: "capstone",
    summary:
      "Team formation, stakeholder discovery, requirements, architecture, risk retirement, prototyping, and design review.",
    prerequisites: ["LAB302"],
    outcome:
      "Pass a critical design review with a validated need, testable requirements, and evidence on the highest risks.",
  },
  {
    code: "TRK403",
    title: "Specialization Studio III: Depth",
    semester: 8,
    credits: 3,
    hours: 8,
    kind: "studio",
    summary:
      "An advanced choice from the same track, connecting current literature to an open-ended implementation.",
    prerequisites: ["TRK401", "TRK402"],
    outcome:
      "Reproduce, critique, and extend a contemporary result in the chosen specialization.",
  },
  {
    code: "EE498",
    title: "Open Technical Elective",
    semester: 8,
    credits: 3,
    hours: 8,
    kind: "theory",
    summary:
      "A learner-selected advanced subject in photonics, biomedical electronics, computing, networks, devices, or applied mathematics.",
    prerequisites: ["EE301", "EE302"],
    outcome:
      "Demonstrate upper-level depth beyond the core through a proctored exam or independently reviewed artifact.",
  },
  {
    code: "ENT401",
    title: "Engineering Leadership and Deployment",
    semester: 8,
    credits: 2,
    hours: 6,
    kind: "humanities",
    summary:
      "Teams, project economics, intellectual property, manufacturing, maintenance, deployment, and post-launch learning.",
    prerequisites: ["HUM201"],
    outcome:
      "Produce a credible deployment plan covering people, cost, operations, ownership, and end-of-life.",
  },
  {
    code: "CAP402",
    title: "Senior Design II: Build and Defend",
    semester: 8,
    credits: 8,
    hours: 23,
    kind: "capstone",
    summary:
      "Detailed engineering, integration, verification, field evaluation, documentation, public demonstration, and defense.",
    prerequisites: ["CAP401"],
    outcome:
      "Deliver a working, documented system and defend its performance, limitations, safety, and social consequences.",
  },
];

export const semesters: Semester[] = [
  {
    number: 1,
    year: 1,
    theme: "See the whole field",
    credits: 16,
    hours: 45,
    courseCodes: ["MATH101", "PHYS101", "CS101", "EE101", "HUM101"],
  },
  {
    number: 2,
    year: 1,
    theme: "Measure, model, and program",
    credits: 16,
    hours: 45,
    courseCodes: ["MATH102", "PHYS102", "CS102", "EE102", "HUM102"],
  },
  {
    number: 3,
    year: 2,
    theme: "Build the analog and digital base",
    credits: 16,
    hours: 45,
    courseCodes: ["MATH201", "EE201", "EE202", "EE203", "SCI201"],
  },
  {
    number: 4,
    year: 2,
    theme: "Think in systems and uncertainty",
    credits: 16,
    hours: 45,
    courseCodes: ["MATH202", "EE204", "EE205", "EE206", "HUM201"],
  },
  {
    number: 5,
    year: 3,
    theme: "Shape signals, fields, and feedback",
    credits: 16,
    hours: 45,
    courseCodes: ["EE301", "EE302", "EE303", "EE304", "LAB301"],
  },
  {
    number: 6,
    year: 3,
    theme: "Integrate complete electrical systems",
    credits: 16,
    hours: 45,
    courseCodes: ["EE305", "EE306", "EE307", "EE308", "LAB302"],
  },
  {
    number: 7,
    year: 4,
    theme: "Choose depth and retire risk",
    credits: 16,
    hours: 45,
    courseCodes: ["TRK401", "TRK402", "ETH401", "COM401", "CAP401"],
  },
  {
    number: 8,
    year: 4,
    theme: "Deliver work that survives scrutiny",
    credits: 16,
    hours: 45,
    courseCodes: ["TRK403", "EE498", "ENT401", "CAP402"],
  },
];

export const schools: School[] = [
  {
    id: "engineering",
    name: "School of Engineering",
    kicker: "Build systems that improve the world",
    description:
      "A home for rigorous, project-led programs spanning physical infrastructure, computation, design, and technology.",
    disciplineIds: ["electrical-engineering"],
  },
];

export const disciplines: Discipline[] = [
  {
    id: "electrical-engineering",
    schoolId: "engineering",
    name: "Electrical Engineering",
    description:
      "The study and design of circuits, electronics, signals, computation, control, communications, electromagnetics, and energy.",
    programIds: ["ee-beng"],
  },
];

export const programs: Program[] = [
  {
    id: "ee-beng",
    disciplineId: "electrical-engineering",
    name: "Electrical Engineering",
    credential: "Bachelor-level independent study program",
    description:
      "A four-year, laboratory-rich path from mathematical foundations to specialization and a defended senior design project.",
    duration: "4 years · 8 semesters",
    totalCredits: 128,
    semesterNumbers: semesters.map((semester) => semester.number),
    courseCodes: semesters.flatMap((semester) => semester.courseCodes),
    trackIds: ["chips", "signals", "robotics", "energy"],
  },
];

export const tracks: Track[] = [
  {
    id: "chips",
    name: "Chips & Embedded",
    kicker: "From transistor to trusted machine",
    description:
      "Design the devices, integrated circuits, processors, and real-time platforms underneath modern computing.",
    color: "#F06F46",
    courseNames: [
      "Semiconductor Devices & Fabrication",
      "CMOS Analog IC Design",
      "Digital VLSI & ASIC Design",
      "FPGA Systems & Hardware Acceleration",
      "Computer Architecture",
      "Embedded Systems & Real-Time Computing",
    ],
    capstoneIdeas: [
      "A low-power edge-AI sensor with a custom accelerator",
      "An open-source RISC-V safety monitor",
      "A mixed-signal environmental data logger",
    ],
  },
  {
    id: "signals",
    name: "Signals, AI & Communications",
    kicker: "Find structure in noise",
    description:
      "Turn measurements into information through signal processing, statistical learning, coding, and wireless systems.",
    color: "#0F9D8A",
    courseNames: [
      "Digital Signal Processing",
      "Statistical Signal Processing & Machine Learning",
      "Digital Communications",
      "Wireless & RF Systems",
      "Computer Vision & Computational Imaging",
      "Information Theory & Coding",
    ],
    capstoneIdeas: [
      "A privacy-preserving acoustic event detector",
      "A software-defined radio link for disaster response",
      "A low-cost computational imaging instrument",
    ],
  },
  {
    id: "robotics",
    name: "Robotics & Control",
    kicker: "Make physical systems behave",
    description:
      "Combine dynamics, estimation, optimization, embedded intelligence, and feedback in machines that act safely.",
    color: "#8A6FD1",
    courseNames: [
      "Feedback Control Systems",
      "State Estimation & Sensor Fusion",
      "Robot Kinematics, Planning & Control",
      "Autonomous Systems",
      "Embedded Control & Mechatronics",
      "Convex Optimization for Control",
    ],
    capstoneIdeas: [
      "An assistive mobile robot with a documented safety case",
      "A self-balancing platform with fault-tolerant control",
      "A vision-guided precision agriculture rover",
    ],
  },
  {
    id: "energy",
    name: "Energy & Power",
    kicker: "Engineer the electrified world",
    description:
      "Work across conversion, machines, grids, protection, storage, and renewable generation at consequential scale.",
    color: "#D99A25",
    courseNames: [
      "Electric Machines & Drives",
      "Power Electronics",
      "Power System Analysis",
      "Renewable Energy Systems",
      "Smart Grids & Protection",
      "High-Voltage Engineering",
    ],
    capstoneIdeas: [
      "A bidirectional solar-and-storage microgrid controller",
      "A motor drive with efficiency and thermal telemetry",
      "An open distribution-grid fault localization tool",
    ],
  },
];

export const resources: Resource[] = [
  {
    title: "Introduction to Computer Science and Programming in Python",
    provider: "MIT OpenCourseWare",
    area: "Programming",
    url: "https://ocw.mit.edu/courses/6-100l-introduction-to-cs-and-programming-using-python-fall-2022/",
    access: "Open course",
    note: "A current Python 3 sequence with videos, notes, exercises, recitations, and problem sets.",
  },
  {
    title: "Introduction to C and C++",
    provider: "MIT OpenCourseWare",
    area: "Programming",
    url: "https://ocw.mit.edu/courses/6-s096-introduction-to-c-and-c-january-iap-2013/",
    access: "Open course",
    note: "A compact bridge into pointers, memory, debugging, data structures, and low-level programming.",
  },
  {
    title: "Mathematics for Computer Science",
    provider: "MIT OpenCourseWare",
    area: "Computing",
    url: "https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/",
    access: "Open course",
    note: "Proof, graphs, induction, counting, recurrences, and discrete probability with full problem material.",
  },
  {
    title: "Introduction to Algorithms",
    provider: "MIT OpenCourseWare",
    area: "Computing",
    url: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/",
    access: "Open course",
    note: "A useful bridge from programming to efficient systems reasoning.",
  },
  {
    title: "Single Variable Calculus",
    provider: "MIT OpenCourseWare",
    area: "Mathematics",
    url: "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/",
    access: "Open course",
    note: "A complete independent-study course with videos, notes, worked examples, and exams.",
  },
  {
    title: "Multivariable Calculus",
    provider: "MIT OpenCourseWare",
    area: "Mathematics",
    url: "https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/",
    access: "Open course",
    note: "Vector calculus and multivariable models with extensive practice material.",
  },
  {
    title: "Linear Algebra",
    provider: "MIT OpenCourseWare",
    area: "Mathematics",
    url: "https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/",
    access: "Open course",
    note: "Gilbert Strang's full course, especially valuable for systems, estimation, and control.",
  },
  {
    title: "Differential Equations",
    provider: "MIT OpenCourseWare",
    area: "Mathematics",
    url: "https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/",
    access: "Open course",
    note: "Lectures and problem sets connecting differential equations to physical systems.",
  },
  {
    title: "Probabilistic Systems Analysis and Applied Probability",
    provider: "MIT OpenCourseWare",
    area: "Probability",
    url: "https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/",
    access: "Open course",
    note: "A demanding, engineering-oriented probability sequence with problem-solving videos.",
  },
  {
    title: "Classical Mechanics",
    provider: "MIT OpenCourseWare",
    area: "Physics",
    url: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/",
    access: "Open course",
    note: "Mechanics lectures, problem sets, and exams for the first physics semester.",
  },
  {
    title: "Physics II: Electricity and Magnetism",
    provider: "MIT OpenCourseWare",
    area: "Physics",
    url: "https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2019/",
    access: "Open course",
    note: "Field-first treatment of electricity, magnetism, and their applications.",
  },
  {
    title: "The Feynman Lectures on Physics",
    provider: "Caltech",
    area: "Physics",
    url: "https://www.feynmanlectures.caltech.edu/",
    access: "Reference",
    note: "A free-to-read conceptual companion for mechanics, electromagnetism, waves, and quantum ideas; not licensed for bulk redistribution.",
  },
  {
    title: "Circuits and Electronics",
    provider: "MIT OpenCourseWare",
    area: "Circuits",
    url: "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/",
    access: "Open course",
    note: "Canonical circuit models, electronics, problem sets, labs, and exams.",
  },
  {
    title: "Lessons in Electric Circuits",
    provider: "All About Circuits",
    area: "Circuits",
    url: "https://www.allaboutcircuits.com/textbook/",
    access: "Reference",
    note: "A free, searchable six-volume web reference spanning DC, AC, semiconductors, digital logic, and projects.",
  },
  {
    title: "Analog Electronic Circuits",
    provider: "IIT Madras · NPTEL",
    area: "Circuits",
    url: "https://www.nptel.ac.in/courses/108106188",
    access: "Free course",
    note: "A twelve-week video sequence on MOS/BJT amplifiers, mirrors, differential pairs, feedback, and compensation; certification is separate.",
  },
  {
    title: "Signals and Systems",
    provider: "MIT OpenCourseWare",
    area: "Signals",
    url: "https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/",
    access: "Open course",
    note: "A full transform-based signals course with assignments and exams.",
  },
  {
    title: "The Scientist and Engineer's Guide to Digital Signal Processing",
    provider: "Steven W. Smith",
    area: "Signal processing",
    url: "https://www.dspguide.com/",
    access: "Free-to-read",
    note: "A practical DSP text available for personal reading and download; it is copyrighted rather than openly licensed.",
  },
  {
    title: "The Fourier Transform and Its Applications",
    provider: "Stanford Engineering Everywhere",
    area: "Signals",
    url: "https://see.stanford.edu/Course/EE261",
    access: "Free course",
    note: "Full lectures, reader, homework, solutions, and software files for Fourier analysis, sampling, and imaging.",
  },
  {
    title: "Digital Signal Processing",
    provider: "IIT Kharagpur · NPTEL",
    area: "Signal processing",
    url: "https://www.nptel.ac.in/courses/108105055",
    access: "Free course",
    note: "A complete video sequence covering discrete-time systems, FFTs, filter design, quantization, and multirate DSP.",
  },
  {
    title: "Computation Structures",
    provider: "MIT OpenCourseWare",
    area: "Digital systems",
    url: "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/",
    access: "Open course",
    note: "Digital logic, processors, assembly, memory, and system organization in one sequence.",
  },
  {
    title: "Build a Modern Computer from First Principles",
    provider: "Nand2Tetris",
    area: "Computer architecture",
    url: "https://www.nand2tetris.org/course",
    access: "Open course",
    note: "Projects that build a computer stack from logic gates through an operating system.",
  },
  {
    title: "Microelectronic Devices and Circuits",
    provider: "MIT OpenCourseWare",
    area: "Semiconductors",
    url: "https://ocw.mit.edu/courses/6-012-microelectronic-devices-and-circuits-spring-2009/",
    access: "Open course",
    note: "Device physics and circuit applications with problem sets, labs, and design material.",
  },
  {
    title: "Feedback Systems: An Introduction for Scientists and Engineers",
    provider: "Karl J. Åström and Richard M. Murray",
    area: "Control",
    url: "https://fbsbook.org/",
    access: "Free-to-read",
    note: "The authors' complete text for personal web use, with exercises and supplements; copyright is retained.",
  },
  {
    title: "Electronic Feedback Systems",
    provider: "MIT OpenCourseWare",
    area: "Control",
    url: "https://ocw.mit.edu/courses/res-6-010-electronic-feedback-systems-spring-2013/",
    access: "Open course",
    note: "An open textbook, course manual, videos, and solved problems for classical feedback analysis and compensation.",
  },
  {
    title: "Electromagnetics and Applications",
    provider: "MIT OpenCourseWare",
    area: "Electromagnetics",
    url: "https://www.ocw.mit.edu/courses/6-013-electromagnetics-and-applications-spring-2009/",
    access: "Open course",
    note: "Fields, waves, transmission lines, antennas, and optical applications.",
  },
  {
    title: "Digital Communication Systems",
    provider: "MIT OpenCourseWare",
    area: "Communications",
    url: "https://ocw.mit.edu/courses/6-02-introduction-to-eecs-ii-digital-communication-systems-fall-2012/",
    access: "Open course",
    note: "An undergraduate bits-to-signals-to-packets course with notes, videos, programming assignments, experiments, and exams.",
  },
  {
    title: "An Introduction to Information Theory",
    provider: "IIT Kanpur · NPTEL",
    area: "Communications",
    url: "https://nptel.ac.in/courses/117104129",
    access: "Free course",
    note: "Free lectures on entropy, source and channel coding, mutual information, and capacity; certification is separate.",
  },
  {
    title: "Microwave Engineering",
    provider: "IIT Guwahati · NPTEL",
    area: "Electromagnetics",
    url: "https://nptel.ac.in/courses/108103141",
    access: "Free course",
    note: "Transmission lines, Smith charts, S-parameters, matching, resonators, amplifiers, oscillators, and radar.",
  },
  {
    title: "Introduction to Electric Power Systems",
    provider: "MIT OpenCourseWare",
    area: "Energy",
    url: "https://ocw.mit.edu/courses/6-061-introduction-to-electric-power-systems-spring-2011/",
    access: "Open course",
    note: "Polyphase power, load flow, magnetic circuits, machines, and renewable-energy applications with solved work.",
  },
  {
    title: "Power Electronics",
    provider: "MIT OpenCourseWare",
    area: "Energy",
    url: "https://ocw.mit.edu/courses/6-622-power-electronics-spring-2023/",
    access: "Open course",
    note: "A modern design-oriented sequence on converters, magnetics, modeling, and control with videos and assignments.",
  },
  {
    title: "Embedded System Design with ARM",
    provider: "IIT Kharagpur · NPTEL",
    area: "Embedded systems",
    url: "https://nptel.ac.in/courses/106105193",
    access: "Free course",
    note: "Practical ARM/STM32 lectures and demonstrations covering interrupts, PWM, ADC/DAC, sensors, and actuators.",
  },
  {
    title: "PhET Circuit Construction Kit: DC",
    provider: "University of Colorado Boulder",
    area: "Circuit simulation",
    url: "https://phet.colorado.edu/en/simulations/circuit-construction-kit-dc-virtual-lab",
    access: "Free tool",
    note: "A zero-cost browser lab for conceptual DC-circuit experiments and measurement practice.",
  },
  {
    title: "CircuitJS1",
    provider: "Paul Falstad",
    area: "Circuit simulation",
    url: "https://www.falstad.com/circuit/",
    access: "Free tool",
    note: "An immediate browser-based circuit simulator suited to first experiments and visual intuition.",
  },
  {
    title: "LTspice",
    provider: "Analog Devices",
    area: "Circuit simulation",
    url: "https://www.analog.com/en/resources/design-tools-and-calculators/ltspice-simulator.html",
    access: "Free tool",
    note: "A free professional SPICE simulator with switching-regulator and analog device models.",
  },
  {
    title: "ngspice",
    provider: "ngspice project",
    area: "Circuit simulation",
    url: "https://ngspice.sourceforge.io/docs.html",
    access: "Free tool",
    note: "Open-source SPICE simulation with manuals and scripting support.",
  },
  {
    title: "KiCad",
    provider: "KiCad project",
    area: "PCB design",
    url: "https://www.kicad.org/",
    access: "Free tool",
    note: "Open-source schematic capture, circuit simulation, PCB layout, and manufacturing outputs.",
  },
  {
    title: "GNU Octave",
    provider: "GNU Project",
    area: "Numerical computing",
    url: "https://octave.org/",
    access: "Free tool",
    note: "An open numerical environment for linear algebra, signal processing, and control exercises.",
  },
  {
    title: "SciPy",
    provider: "SciPy community",
    area: "Numerical computing",
    url: "https://scipy.org/",
    access: "Free tool",
    note: "Open Python tools for optimization, integration, signal processing, statistics, and sparse systems.",
  },
  {
    title: "Wokwi",
    provider: "Wokwi",
    area: "Embedded systems",
    url: "https://docs.wokwi.com/",
    access: "Free tool",
    note: "Browser simulation for Arduino, ESP32, STM32, RP2040, sensors, and logic analyzers.",
  },
  {
    title: "Verilator",
    provider: "CHIPS Alliance",
    area: "Digital design",
    url: "https://verilator.org/guide/latest/",
    access: "Free tool",
    note: "Fast open-source SystemVerilog simulation and linting for hardware-design projects.",
  },
  {
    title: "GNU Radio",
    provider: "GNU Radio project",
    area: "Communications",
    url: "https://wiki.gnuradio.org/index.php/Tutorials",
    access: "Free tool",
    note: "Tutorials for building and testing software-defined radio signal chains.",
  },
  {
    title: "ROS 2 Documentation",
    provider: "Open Robotics",
    area: "Robotics",
    url: "https://docs.ros.org/",
    access: "Reference",
    note: "Official documentation for the open robotics middleware used in track projects.",
  },
  {
    title: "Webots User Guide",
    provider: "Cyberbotics",
    area: "Robotics simulation",
    url: "https://cyberbotics.com/doc/guide/index",
    access: "Free tool",
    note: "A freely available robot simulator with sensors, controllers, worlds, and ROS integration.",
  },
  {
    title: "OpenModelica",
    provider: "Open Source Modelica Consortium",
    area: "Energy and control",
    url: "https://openmodelica.org/",
    access: "Free tool",
    note: "Open modeling and simulation for multi-domain physical and energy systems.",
  },
  {
    title: "RISC-V ISA Specifications",
    provider: "RISC-V International",
    area: "Computer architecture",
    url: "https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html",
    access: "Reference",
    note: "The official unprivileged instruction-set reference for processor projects.",
  },
  {
    title: "IEEE Code of Ethics",
    provider: "IEEE",
    area: "Professional practice",
    url: "https://www.ieee.org/about/corporate/governance/p7-8.html",
    access: "Reference",
    note: "A primary reference for safety, honesty, conflicts, competence, and professional responsibility.",
  },
  {
    title: "Engineering Ethics",
    provider: "MIT OpenCourseWare",
    area: "Professional practice",
    url: "https://ocw.mit.edu/courses/esd-932-engineering-ethics-spring-2006/",
    access: "Open course",
    note: "Cases, lectures, and assignments for analyzing risk, responsibility, professional duty, and competing values.",
  },
  {
    title: "Science Writing and New Media",
    provider: "MIT OpenCourseWare",
    area: "Communication",
    url: "https://ocw.mit.edu/courses/21w-031-science-writing-and-new-media-explorations-in-communicating-about-science-technology-spring-2017/",
    access: "Open course",
    note: "A full assignment sequence with student examples for research, revision, explanation, and presentation.",
  },
  {
    title: "Writing Guide with Handbook",
    provider: "OpenStax",
    area: "Communication",
    url: "https://openstax.org/books/writing-guide/pages/1-unit-introduction",
    access: "Open textbook",
    note: "A reusable open handbook for argument, research, clarity, editing, and documentation.",
  },
  {
    title: "Introductory Analog Electronics Laboratory",
    provider: "MIT OpenCourseWare",
    area: "Laboratory",
    url: "https://ocw.mit.edu/courses/6-101-introductory-analog-electronics-laboratory-spring-2007/",
    access: "Open course",
    note: "Six hardware labs plus a seven-week design project, reports, presentations, problems, and exams.",
  },
  {
    title: "Introductory Digital Systems Laboratory",
    provider: "MIT OpenCourseWare",
    area: "Laboratory",
    url: "https://ocw.mit.edu/courses/6-111-introductory-digital-systems-laboratory-spring-2006/",
    access: "Open course",
    note: "Verilog/FPGA labs, notes, exams, and complex team-project examples; port legacy hardware to modern tools.",
  },
];

const courseResourceMap: Partial<Record<string, string[]>> = {
  MATH101: ["Single Variable Calculus"],
  MATH102: ["Multivariable Calculus"],
  MATH201: ["Linear Algebra", "Differential Equations", "GNU Octave"],
  MATH202: ["Probabilistic Systems Analysis and Applied Probability", "SciPy"],
  PHYS101: ["Classical Mechanics", "The Feynman Lectures on Physics"],
  PHYS102: ["Physics II: Electricity and Magnetism", "The Feynman Lectures on Physics"],
  CS101: ["Introduction to Computer Science and Programming in Python"],
  CS102: ["Introduction to C and C++", "Mathematics for Computer Science", "Introduction to Algorithms"],
  EE101: ["CircuitJS1", "Wokwi"],
  EE102: ["Circuits and Electronics", "Lessons in Electric Circuits", "CircuitJS1"],
  HUM101: ["Science Writing and New Media", "Writing Guide with Handbook"],
  EE201: ["Circuits and Electronics", "LTspice"],
  EE202: ["Computation Structures", "Build a Modern Computer from First Principles", "Verilator"],
  EE203: ["Lessons in Electric Circuits", "LTspice", "ngspice"],
  SCI201: ["Microelectronic Devices and Circuits"],
  EE204: ["Signals and Systems", "GNU Octave"],
  EE205: ["Microelectronic Devices and Circuits"],
  EE206: ["Computation Structures", "RISC-V ISA Specifications", "Wokwi"],
  EE301: ["Electromagnetics and Applications", "Microwave Engineering"],
  EE302: [
    "Feedback Systems: An Introduction for Scientists and Engineers",
    "Electronic Feedback Systems",
    "GNU Octave",
  ],
  EE303: ["Analog Electronic Circuits", "Circuits and Electronics", "LTspice", "ngspice"],
  EE304: [
    "Signals and Systems",
    "The Scientist and Engineer's Guide to Digital Signal Processing",
    "The Fourier Transform and Its Applications",
    "Digital Signal Processing",
    "SciPy",
  ],
  LAB301: ["PhET Circuit Construction Kit: DC", "Introductory Analog Electronics Laboratory", "KiCad", "LTspice", "ngspice"],
  EE305: ["Digital Communication Systems", "An Introduction to Information Theory", "GNU Radio"],
  EE306: ["Introduction to Electric Power Systems", "Power Electronics", "OpenModelica"],
  EE307: ["Microelectronic Devices and Circuits", "Verilator"],
  EE308: ["Embedded System Design with ARM", "Wokwi", "RISC-V ISA Specifications"],
  LAB302: ["Introductory Digital Systems Laboratory", "KiCad", "Wokwi", "GNU Octave"],
  TRK401: ["GNU Radio", "Webots User Guide", "OpenModelica", "Verilator"],
  TRK402: ["GNU Radio", "ROS 2 Documentation", "OpenModelica", "KiCad"],
  TRK403: ["SciPy", "ROS 2 Documentation", "OpenModelica", "RISC-V ISA Specifications"],
  ETH401: ["IEEE Code of Ethics", "Engineering Ethics"],
  COM401: ["Science Writing and New Media", "Writing Guide with Handbook"],
  CAP401: ["KiCad", "ROS 2 Documentation", "IEEE Code of Ethics"],
  CAP402: ["KiCad", "SciPy", "IEEE Code of Ethics"],
};

const modulePhases: {
  title: string;
  weeks: [number, number];
  summary: string;
}[] = [
  {
    title: "Foundations",
    weeks: [1, 4],
    summary: "Learn the governing ideas, notation, vocabulary, and first-principles models.",
  },
  {
    title: "Methods and midterm",
    weeks: [5, 8],
    summary: "Practice the central methods, complete a guided investigation, and demonstrate individual mastery.",
  },
  {
    title: "Systems and evidence",
    weeks: [9, 12],
    summary: "Handle non-ideal cases, connect subsystems, and collect reproducible evidence.",
  },
  {
    title: "Integration and defense",
    weeks: [13, 16],
    summary: "Synthesize the course in a cumulative exam, practical, project, or public technical defense.",
  },
];

export const modules: LearningModule[] = courses.flatMap((course) =>
  modulePhases.map((phase, index) => ({
    id: `${course.code.toLowerCase()}-module-${index + 1}`,
    courseCode: course.code,
    order: index + 1,
    title: phase.title,
    weeks: phase.weeks,
    summary: `${phase.summary} Applied to ${course.title}.`,
    resourceTitles: courseResourceMap[course.code] ?? [],
  })),
);

export const cadence: Cadence[] = [
  {
    week: 1,
    label: "Launch",
    focus: "Map the semester, run a prerequisite diagnostic, form study and lab teams, and set a sustainable rhythm.",
    checkpoint: "Diagnostic + learning contract",
    tone: "teal",
  },
  {
    week: 2,
    label: "Foundations",
    focus: "Establish notation, physical intuition, safe practice, and first-principles models.",
    checkpoint: "Safety certification + problem set 1",
  },
  {
    week: 3,
    label: "First methods",
    focus: "Move from worked examples to scaffolded analysis and a first measured or computed result.",
    checkpoint: "Lab / notebook 1",
  },
  {
    week: 4,
    label: "Model & test",
    focus: "Work with uncertainty, solve unfamiliar problems, and explain assumptions without a template.",
    checkpoint: "Quiz 1 + concept critique",
  },
  {
    week: 5,
    label: "Module I review",
    focus: "Integrate the first module through retrieval, mixed problems, design checks, and targeted support.",
    checkpoint: "Lab 2 + midterm review",
    tone: "amber",
  },
  {
    week: 6,
    label: "Midterm I",
    focus: "Demonstrate individual mastery of Weeks 1–5; studios hold a concept or preliminary design review.",
    checkpoint: "Midterm I / concept review",
    tone: "coral",
  },
  {
    week: 7,
    label: "Debrief & repair",
    focus: "Correct the assessment, revisit weak prerequisites, and turn feedback into a specific recovery plan.",
    checkpoint: "Corrections memo",
    tone: "amber",
  },
  {
    week: 8,
    label: "Module II",
    focus: "Begin the second body of ideas while project teams establish an architecture baseline.",
    checkpoint: "Proposal / architecture baseline",
    tone: "teal",
  },
  {
    week: 9,
    label: "Nonideal systems",
    focus: "Extend core methods to noisy, coupled, constrained, or computationally larger systems.",
    checkpoint: "Lab 3 / subsystem test",
  },
  {
    week: 10,
    label: "Tradeoffs",
    focus: "Compare designs by performance, uncertainty, cost, safety, and implementation constraints.",
    checkpoint: "Quiz / lab practical",
    tone: "amber",
  },
  {
    week: 11,
    label: "Midterm II",
    focus: "Complete a second midterm, cumulative practical, or critical design review matched to course format.",
    checkpoint: "Midterm II / practical / design review",
    tone: "coral",
  },
  {
    week: 12,
    label: "Applications",
    focus: "Apply the third module to contemporary systems and collect reproducible evidence.",
    checkpoint: "Interim test report",
  },
  {
    week: 13,
    label: "Robustness",
    focus: "Investigate failure modes, ethics, safety, and behavior beyond nominal conditions.",
    checkpoint: "Verification / fault review",
  },
  {
    week: 14,
    label: "System integration",
    focus: "Combine subsystems, freeze the prototype, close evidence gaps, and rehearse the technical argument.",
    checkpoint: "Traceability audit + prototype freeze",
    tone: "amber",
  },
  {
    week: 15,
    label: "Demo & expo",
    focus: "Publicly demonstrate projects, answer questions, and review without introducing new examinable theory.",
    checkpoint: "Project demo / public expo",
    tone: "coral",
  },
  {
    week: 16,
    label: "Cumulative final",
    focus: "Complete one written final or individual practical defense per day, then archive the semester evidence.",
    checkpoint: "Final / jury + portfolio release",
    tone: "coral",
  },
];

export const assessments: Assessment[] = [
  {
    name: "Theory course",
    audience: "Mathematics, physics, circuits, fields, signals, communications, control, and power",
    parts: [
      { label: "Problem sets", weight: 20 },
      { label: "Quizzes and retrieval", weight: 10 },
      { label: "Midterm I", weight: 15 },
      { label: "Midterm II", weight: 15 },
      { label: "Cumulative final", weight: 30 },
      { label: "Explanations and participation", weight: 10 },
    ],
  },
  {
    name: "Laboratory course",
    audience: "Measurement, electronics, embedded, PCB, and integrated-systems labs",
    parts: [
      { label: "Preparation and safety", weight: 10 },
      { label: "Reproducible notebook", weight: 20 },
      { label: "Build and checkoffs", weight: 25 },
      { label: "Analysis and reports", weight: 25 },
      { label: "Individual practical", weight: 20 },
    ],
  },
  {
    name: "Design studio",
    audience: "Programming, digital logic, DSP, VLSI, and specialization studios",
    parts: [
      { label: "Design sprints", weight: 25 },
      { label: "Critiques and reviews", weight: 20 },
      { label: "Working artifact", weight: 25 },
      { label: "Demo and defense", weight: 20 },
      { label: "Reflection", weight: 10 },
    ],
  },
  {
    name: "Humanities course",
    audience: "Writing, technology and society, ethics, leadership, and research practice",
    parts: [
      { label: "Reading notes", weight: 15 },
      { label: "Analytical writing", weight: 35 },
      { label: "Seminar contribution", weight: 20 },
      { label: "Final inquiry project", weight: 30 },
    ],
  },
  {
    name: "Senior design",
    audience: "Year-long capstone teams with an individual oral defense",
    parts: [
      { label: "Proposal and requirements", weight: 10 },
      { label: "Design reviews", weight: 20 },
      { label: "Process and evidence", weight: 20 },
      { label: "Verified prototype and demo", weight: 30 },
      { label: "Report and individual defense", weight: 20 },
    ],
  },
];

export const labRoutes: LabRoute[] = [
  {
    name: "Simulation route",
    label: "Start anywhere",
    description:
      "Complete model-first versions in the browser or on a modest computer. Ideal for the early core and for learners waiting on hardware.",
    tools: ["CircuitJS1", "ngspice or LTspice", "GNU Octave or SciPy", "Wokwi", "Webots"],
  },
  {
    name: "Home bench route",
    label: "Build at your desk",
    description:
      "Add low-voltage physical builds, real measurement, soldering, microcontrollers, and PCB bring-up with a reusable personal kit.",
    tools: ["Digital multimeter", "USB oscilloscope / logic analyzer", "Breadboard and components", "RP2040 or STM32 board", "Soldering tools"],
  },
  {
    name: "Remote & partner route",
    label: "Use shared infrastructure",
    description:
      "Operate remote instruments, analyze supplied raw datasets, or use a supervised university, library, makerspace, or industry bench for work that needs specialized infrastructure.",
    tools: ["Remote oscilloscope or spectrum analyzer", "Supplied raw-data experiment", "PCB assembly and rework", "Motor or power-system bench", "Qualified local supervision"],
  },
];

export const provenanceSources: ProvenanceSource[] = [
  {
    name: "MIT — Electrical Engineering with Computing (Course 6-5)",
    note: "Informed the computing-integrated fundamentals, system centers, laboratory requirement, and breadth-plus-depth structure.",
    url: "https://catalog.mit.edu/degree-charts/electrical-engineering-computing-course-6-5/",
  },
  {
    name: "Stanford — BS in Electrical Engineering",
    note: "Informed the flexible disciplinary areas, design requirement, technology-in-society work, and broad engineering fundamentals.",
    url: "https://bulletin.stanford.edu/programs/EE-BS",
  },
  {
    name: "UC Berkeley — BS in Electrical Engineering and Computer Sciences",
    note: "Informed the strong early integration of computing, circuits, linear systems, humanities, and upper-division breadth.",
    url: "https://engineering.berkeley.edu/students/undergraduate-guide/degree-requirements/major-programs/electrical-engineering-computer-sciences/",
  },
  {
    name: "Caltech — Electrical Engineering Option",
    note: "Informed the intensive math-and-physics core, laboratory emphasis, advanced electives, and senior project pathway.",
    url: "https://www.catalog.caltech.edu/current/information-for-undergraduate-students/graduation-requirements-all-options/electrical-engineering-option-ee/",
  },
  {
    name: "Georgia Tech — BS in Electrical Engineering",
    note: "Informed the eight-semester sequencing, core ECE coverage, paired specialization threads, and staged design experience.",
    url: "https://ece.gatech.edu/electrical-engineering-degree",
  },
];

export const disclaimer =
  "This is an independent, non-accredited learning blueprint—not a degree-granting university and not a replica of any one institution. The Electrical Engineering sequence is a synthesis inspired by publicly described programs at MIT, Stanford, UC Berkeley, Caltech, and Georgia Tech. Course availability, requirements, links, licensing, and institutional curricula can change; verify each source and resource before relying on it. Physical electrical work can involve shock, fire, stored-energy, RF, chemical, and mechanical hazards: use appropriately rated equipment and qualified local supervision, and never attempt hazardous-energy work through a remote-only lab route.";
