import type { CatalogProgramSupersession } from "../app/catalog/catalog-supersessions";
import { catalogPublicationLock } from "./manifests/catalog-publication-lock";

/**
 * Compact identity for the checked-in release. Production reads compare one
 * indexed D1 row with this value; they never import curriculum payloads merely
 * to discover that the database is already current.
 *
 * The publication-lock test recomputes this digest, so adding or changing a
 * release record requires updating this value intentionally.
 */
export const CATALOG_RELEASE_KEY = "checked-in-publications";
export const CATALOG_RELEASE_MANIFEST_SHA256 =
  "0d7a589f88d307c8a72b0465725fe4612bfc56cad778527cca659b31abdad525";
export const CATALOG_READ_MODEL_VERSION = 1;
export const CATALOG_RELEASE_BUNDLE_COUNT = catalogPublicationLock.length;

export const catalogProgramSupersessions: readonly CatalogProgramSupersession[] = [
  {
    retiredProgramId: "prg_computer_science",
    successorProgramId: "prg_019fab2b-c401-7277-90e3-350c6848e164",
    reason:
      "Replaced the pre-release derived identity with its reviewed UUIDv7 manifest.",
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
    school: "School of Humanities & Society",
    discipline: "Economics",
    title: "Economics",
    description:
      "An evidence-based economics pathway with computational focus.",
    status: "research",
    note: "Evidence and assessment design for micro, macro, econometrics, and policy analysis.",
  },
] as const;
