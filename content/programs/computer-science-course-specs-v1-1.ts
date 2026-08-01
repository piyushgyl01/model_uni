import {
  computerScienceCourseSpecs,
  type ComputerScienceCourseSpec,
} from "./computer-science-course-specs";

type CourseSpecOverride = Omit<Partial<ComputerScienceCourseSpec>, "key">;

const courseSpecOverrides = {
  "computer-architecture": {
    summary:
      "Digital logic, instruction sets, datapath and control, pipelining, memory hierarchy, virtual memory, I/O, parallelism, and measured performance.",
    primaryOutcome:
      "Design, analyze, and defend a processor and memory hierarchy using functional tests, hazard analysis, and measured performance evidence.",
    topics: [
      {
        key: "gates-combinational-circuits-and-sequential-logic",
        title: "gates, combinational circuits, and sequential logic",
      },
      {
        key: "instruction-set-architecture-and-assembly-programming",
        title: "instruction-set architecture and assembly programming",
      },
      {
        key: "processor-datapath-control-and-instruction-execution",
        title: "processor datapath, control, and instruction execution",
      },
      {
        key: "pipelining-data-control-hazards-and-forwarding",
        title: "pipelining, data and control hazards, and forwarding",
        assessmentPosition: "applied",
      },
      {
        key: "caches-locality-and-the-memory-hierarchy",
        title: "caches, locality, and the memory hierarchy",
      },
      {
        key: "virtual-memory-exceptions-and-input-output",
        title: "virtual memory, exceptions, and input/output",
      },
      {
        key: "parallelism-performance-models-and-measurement",
        title: "parallelism, performance models, and measurement",
      },
      {
        key: "processor-memory-system-integration-and-defense",
        title: "processor and memory-system integration and defense",
        assessmentPosition: "final",
      },
    ],
    resource: {
      slug: "mit-6-004-computation-structures",
      title: "6.004: Computation Structures",
      provider: "MIT OpenCourseWare",
      url: "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/",
      kind: "course",
      authors: ["Chris Terman"],
    },
  },
  algorithms: {
    summary:
      "Algorithmic correctness and analysis, divide-and-conquer, greedy design, dynamic programming, network flow, reductions, NP-completeness, and approximation.",
    primaryOutcome:
      "Design, prove, implement, and defend algorithms while distinguishing efficient solutions, exact intractability, and justified approximation.",
    topics: [
      {
        key: "algorithmic-modeling-correctness-and-asymptotic-analysis",
        title: "algorithmic modeling, correctness, and asymptotic analysis",
      },
      {
        key: "recurrences-divide-and-conquer-and-sorting",
        title: "recurrences, divide-and-conquer, and sorting",
      },
      {
        key: "greedy-algorithms-minimum-spanning-trees-and-shortest-paths",
        title: "greedy algorithms, minimum spanning trees, and shortest paths",
      },
      {
        key: "dynamic-programming-design-and-correctness",
        title: "dynamic programming design and correctness",
        assessmentPosition: "applied",
      },
      {
        key: "maximum-flow-minimum-cuts-and-matching",
        title: "maximum flow, minimum cuts, and matching",
      },
      {
        key: "reductions-p-np-and-np-completeness",
        title: "reductions, P, NP, and NP-completeness",
      },
      {
        key: "approximation-algorithms-and-intractability-tradeoffs",
        title: "approximation algorithms and intractability tradeoffs",
      },
      {
        key: "cumulative-algorithm-design-proof-and-defense",
        title: "cumulative algorithm design, proof, and defense",
        assessmentPosition: "final",
      },
    ],
    resource: {
      slug: "mit-6-046j-design-and-analysis-of-algorithms",
      title: "6.046J: Design and Analysis of Algorithms",
      provider: "MIT OpenCourseWare",
      url: "https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/",
      kind: "course",
      authors: ["Erik Demaine", "Srini Devadas"],
    },
  },
  "software-engineering": {
    term: 4,
  },
  "programming-languages": {
    term: 3,
    summary:
      "Functional, imperative, and object-oriented programming through equational reasoning, algebraic data, recursion, higher-order functions, scope, modules, and types.",
    primaryOutcome:
      "Implement and defend an interpreter while using semantic evidence to compare functional, imperative, and object-oriented designs.",
    topics: [
      {
        key: "immutability-expressions-and-equational-reasoning",
        title: "immutability, expressions, and equational reasoning",
      },
      {
        key: "algebraic-data-types-and-pattern-matching",
        title: "algebraic data types and pattern matching",
      },
      {
        key: "structural-recursion-folds-and-inductive-data",
        title: "structural recursion, folds, and inductive data",
      },
      {
        key: "higher-order-functions-composition-and-abstraction",
        title: "higher-order functions, composition, and abstraction",
        assessmentPosition: "applied",
      },
      {
        key: "lexical-scope-environments-and-closures",
        title: "lexical scope, environments, and closures",
      },
      {
        key: "persistent-data-structures-modules-and-interfaces",
        title: "persistent data structures, modules, and interfaces",
      },
      {
        key: "polymorphic-types-type-checking-and-inference",
        title: "polymorphic types, type checking, and inference",
      },
      {
        key: "functional-imperative-and-object-oriented-comparison-with-interpreter-defense",
        title:
          "functional, imperative, and object-oriented comparison with interpreter defense",
        assessmentPosition: "final",
      },
    ],
  },
  "machine-learning": {
    summary:
      "Mathematical foundations of supervised learning, margin-based classification, generalization, neural networks, probabilistic models, reinforcement learning, and responsible comparison.",
    primaryOutcome:
      "Derive, implement, compare, and defend learning algorithms using reproducible experiments, error analysis, and explicit fairness and validity limits.",
    topics: [
      {
        key: "linear-regression-empirical-risk-and-gradient-optimization",
        title: "linear regression, empirical risk, and gradient optimization",
      },
      {
        key: "classification-logistic-models-and-decision-boundaries",
        title: "classification, logistic models, and decision boundaries",
      },
      {
        key: "margin-based-classification-kernels-and-features",
        title: "margin-based classification, kernels, and features",
      },
      {
        key: "generalization-regularization-and-model-selection",
        title: "generalization, regularization, and model selection",
        assessmentPosition: "applied",
      },
      {
        key: "neural-networks-backpropagation-and-optimization",
        title: "neural networks, backpropagation, and optimization",
      },
      {
        key: "probabilistic-models-latent-variables-and-inference",
        title: "probabilistic models, latent variables, and inference",
      },
      {
        key: "reinforcement-learning-and-sequential-decisions",
        title: "reinforcement learning and sequential decisions",
      },
      {
        key: "model-comparison-error-analysis-fairness-and-defense",
        title: "model comparison, error analysis, fairness, and defense",
        assessmentPosition: "final",
      },
    ],
    resource: {
      slug: "mit-6-036-introduction-to-machine-learning",
      title: "6.036: Introduction to Machine Learning",
      provider: "MIT OpenCourseWare",
      url: "https://ocw.mit.edu/courses/6-036-introduction-to-machine-learning-fall-2020/",
      kind: "course",
      authors: ["Leslie Pack Kaelbling", "MIT 6.036 course staff"],
    },
  },
  "parallel-computing": {
    summary:
      "DAG and work-span cost models, work-efficient parallel algorithms, scheduling, shared and distributed memory, locality, profiling, and scaling.",
    primaryOutcome:
      "Design, implement, analyze, and defend a work-efficient parallel program using theoretical bounds and reproducible performance evidence.",
    topics: [
      {
        key: "computation-dags-work-span-and-parallelism",
        title: "computation DAGs, work, span, and parallelism",
      },
      {
        key: "work-efficiency-scheduling-and-brent-s-theorem",
        title: "work efficiency, scheduling, and Brent's theorem",
      },
      {
        key: "parallel-divide-and-conquer-and-sequence-algorithms",
        title: "parallel divide-and-conquer and sequence algorithms",
      },
      {
        key: "scan-prefix-computation-and-parallel-data-structures",
        title: "scan, prefix computation, and parallel data structures",
        assessmentPosition: "applied",
      },
      {
        key: "shared-memory-synchronization-and-contention",
        title: "shared-memory synchronization and contention",
      },
      {
        key: "distributed-memory-message-passing-and-decomposition",
        title: "distributed-memory message passing and decomposition",
      },
      {
        key: "locality-caches-profiling-and-scaling-analysis",
        title: "locality, caches, profiling, and scaling analysis",
      },
      {
        key: "work-efficient-parallel-implementation-and-defense",
        title: "work-efficient parallel implementation and defense",
        assessmentPosition: "final",
      },
    ],
    resource: {
      slug: "cmu-15-210-parallel-and-sequential-algorithms",
      title: "15-210: Parallel and Sequential Data Structures and Algorithms",
      provider: "Carnegie Mellon University",
      url: "https://www.cs.cmu.edu/~15210/",
      kind: "course",
      authors: ["Guy Blelloch", "Carnegie Mellon 15-210 course staff"],
    },
  },
} as const satisfies Readonly<Record<string, CourseSpecOverride>>;

function applyCourseSpecOverride(
  spec: ComputerScienceCourseSpec,
): ComputerScienceCourseSpec {
  const override = courseSpecOverrides[
    spec.key as keyof typeof courseSpecOverrides
  ] as CourseSpecOverride | undefined;
  return override ? { ...spec, ...override } : spec;
}

/**
 * Computer Science 1.1 editorial specification.
 *
 * The 1.0 specification remains immutable. This overlay preserves every
 * unchanged course verbatim and revises only the explicitly reviewed courses.
 */
export const computerScienceCourseSpecsV1_1: readonly ComputerScienceCourseSpec[] =
  Object.freeze(computerScienceCourseSpecs.map(applyCourseSpecOverride));
