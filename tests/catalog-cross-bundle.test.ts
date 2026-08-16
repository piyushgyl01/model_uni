import assert from "node:assert/strict";
import test from "node:test";
import type {
  PublishedProgramBundle,
  ResourceId,
} from "../app/domain/catalog";
import { validateCatalogBundles } from "../app/domain/validation";
import { electricalEngineeringProgram } from "../content/programs/electrical-engineering";
import { practicalSpreadsheetsProgram } from "./fixtures/practical-spreadsheets";

test("catalog validation rejects cross-program identity drift", () => {
  const changed = structuredClone(
    practicalSpreadsheetsProgram,
  ) as PublishedProgramBundle;
  const reusedId = electricalEngineeringProgram.resources[0].id;
  (changed.resources[0] as { id: ResourceId }).id = reusedId;
  (changed.resourceVersions[0] as { resourceId: ResourceId }).resourceId =
    reusedId;

  const result = validateCatalogBundles([
    electricalEngineeringProgram,
    changed,
  ]);
  assert.equal(result.valid, false);
  assert.ok(
    result.issues.some(
      (issue) =>
        issue.code === "duplicate_id" &&
        issue.path === "bundles[1].resources[0].id" &&
        issue.message.includes(reusedId),
    ),
  );
});
