import { StaticCatalogRepository } from "../app/catalog/static-repository";
import { electricalEngineeringProgram } from "./programs/electrical-engineering";
import { practicalSpreadsheetsProgram } from "./programs/practical-spreadsheets";

/**
 * Checked-in publications use the same repository boundary as a future D1
 * implementation. Routes and renderers never import an individual program.
 */
export const catalogRepository = new StaticCatalogRepository([
  electricalEngineeringProgram,
  practicalSpreadsheetsProgram,
]);

export const plannedDirections = [
  {
    school: "School of Computing",
    title: "Computer Science",
    note: "Curriculum research and resource review",
  },
  {
    school: "School of Natural Sciences",
    title: "Mathematics",
    note: "Requirement and competency normalization",
  },
  {
    school: "School of Humanities & Society",
    title: "Economics",
    note: "Evidence and assessment design",
  },
] as const;
