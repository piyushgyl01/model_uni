import type { ProgramId } from "../domain/catalog";
import {
  d1All,
  d1Batch,
  type D1DatabaseLike,
} from "./d1-contract";
import { CatalogDataError } from "./d1-repository";

export interface CatalogProgramSupersession {
  readonly retiredProgramId: ProgramId;
  readonly successorProgramId: ProgramId;
  readonly reason: string;
}

interface SupersessionRow {
  readonly retired_program_id: string;
  readonly successor_program_id: string;
  readonly reason: string;
}

export async function registerCatalogProgramSupersessions(
  database: D1DatabaseLike,
  supersessions: readonly CatalogProgramSupersession[],
): Promise<void> {
  if (supersessions.length === 0) return;
  const duplicateRetiredIds = supersessions
    .map((item) => item.retiredProgramId)
    .filter((id, index, ids) => ids.indexOf(id) !== index);
  if (duplicateRetiredIds.length > 0) {
    throw new CatalogDataError("catalog program supersessions", [
      `Retired program IDs are duplicated: ${[
        ...new Set(duplicateRetiredIds),
      ].join(", ")}.`,
    ]);
  }
  for (const item of supersessions) {
    if (
      item.retiredProgramId === item.successorProgramId ||
      item.reason.trim().length === 0
    ) {
      throw new CatalogDataError("catalog program supersessions", [
        `Invalid supersession ${item.retiredProgramId} → ${item.successorProgramId}.`,
      ]);
    }
  }

  await d1Batch(
    database,
    supersessions.map((item) =>
      database
        .prepare(
          `INSERT INTO catalog_program_supersessions (
             retired_program_id,
             successor_program_id,
             reason
           )
           VALUES (?, ?, ?)
           ON CONFLICT(retired_program_id) DO NOTHING`,
        )
        .bind(
          item.retiredProgramId,
          item.successorProgramId,
          item.reason.trim(),
        ),
    ),
    "register catalog program supersessions",
  );

  const placeholders = supersessions.map(() => "?").join(", ");
  const rows = await d1All<SupersessionRow>(
    database
      .prepare(
        `SELECT retired_program_id, successor_program_id, reason
         FROM catalog_program_supersessions
         WHERE retired_program_id IN (${placeholders})`,
      )
      .bind(...supersessions.map((item) => item.retiredProgramId)),
    "verify catalog program supersessions",
  );
  const byRetiredId = new Map(
    rows.map((row) => [row.retired_program_id, row]),
  );
  const problems = supersessions.flatMap((item) => {
    const row = byRetiredId.get(item.retiredProgramId);
    if (!row) return [`No supersession was stored for ${item.retiredProgramId}.`];
    return row.successor_program_id !== item.successorProgramId ||
      row.reason !== item.reason.trim()
      ? [
          `Supersession ${item.retiredProgramId} is already registered as ${row.successor_program_id} (${row.reason}).`,
        ]
      : [];
  });
  if (problems.length > 0) {
    throw new CatalogDataError("catalog program supersessions", problems);
  }
}
