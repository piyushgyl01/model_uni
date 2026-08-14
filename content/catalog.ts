import { StaticCatalogRepository } from "../app/catalog/static-repository";
import { computerScienceBundle } from "./programs/computer-science-v1-1";
import { computerScienceBundleV1 } from "./programs/computer-science";
import { electricalEngineeringProgram } from "./programs/electrical-engineering";
import { mechanicalEngineeringBundle } from "./programs/mechanical-engineering";
import { mathematicsBundle } from "./programs/mathematics";
import { physicsBundle } from "./programs/physics";
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
  mechanicalEngineeringBundle,
  physicsBundle,
  mathematicsBundle,
]);

export {
  catalogProgramSupersessions,
  futureDirections,
  type FutureProgramDirection,
} from "./catalog-release";
