import { StaticCatalogRepository } from "../app/catalog/static-repository";
import type { CatalogProgramSupersession } from "../app/catalog/catalog-supersessions";
import { computerScienceBundle } from "./programs/computer-science-v1-1";
import { computerScienceBundleV1 } from "./programs/computer-science";
import { electricalEngineeringProgram } from "./programs/electrical-engineering";
import { practicalSpreadsheetsProgram } from "./programs/practical-spreadsheets";

/**
 * Checked-in publications use the same repository boundary as a future D1
 * implementation. Routes and renderers never import an individual program.
 */
export const catalogRepository = new StaticCatalogRepository([
  electricalEngineeringProgram,
  practicalSpreadsheetsProgram,
  computerScienceBundleV1,
  computerScienceBundle,
]);

/**
 * The first local CS draft synthesized readable IDs before it had been released
 * externally. Keep that immutable snapshot readable if it reached a D1
 * environment, but retire its slug in favor of the reviewed UUIDv7 identity.
 */
export const catalogProgramSupersessions: readonly CatalogProgramSupersession[] = [
  {
    retiredProgramId: "prg_computer_science",
    successorProgramId: computerScienceBundle.program.id,
    reason: "Replaced the pre-release derived identity with its reviewed UUIDv7 manifest.",
  },
];

export interface FutureProgramDirection {
  readonly school: string;
  readonly discipline: string;
  readonly title: string;
  readonly description: string;
  readonly status: "research" | "design" | "authoring" | "validation";
  readonly note: string;
}

export const futureDirections: readonly FutureProgramDirection[] = [
  {
    school: "School of Natural Sciences",
    discipline: "Mathematics",
    title: "Mathematics",
    description: "A competency-normalized pure and applied mathematics pathway.",
    status: "research",
    note: "Requirement and competency normalization across calculus, linear algebra, analysis, probability, and discrete math.",
  },
  {
    school: "School of Humanities & Society",
    discipline: "Economics",
    title: "Economics",
    description: "An evidence-based economics pathway with computational focus.",
    status: "research",
    note: "Evidence and assessment design for micro, macro, econometrics, and policy analysis.",
  },
  {
    school: "School of Engineering",
    discipline: "Mechanical Engineering",
    title: "Mechanical Engineering",
    description: "Simulation-first mechanical engineering with lab alternatives.",
    status: "design",
    note: "Laboratory and simulation route research for mechanics, thermodynamics, and manufacturing.",
  },
] as const;
