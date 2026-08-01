import assert from "node:assert/strict";
import test from "node:test";
import {
  d1Batch,
  MAX_D1_BATCH_STATEMENTS,
  type D1DatabaseLike,
  type D1PreparedStatementLike,
} from "../app/catalog/d1-contract";

test("D1 operations split unbounded statement lists into ordered batches", async () => {
  const batchSizes: number[] = [];
  const statement = {} as D1PreparedStatementLike;
  const database: D1DatabaseLike = {
    prepare() {
      return statement;
    },
    async batch(statements) {
      batchSizes.push(statements.length);
      return statements.map(() => ({ success: true }));
    },
  };
  const statementCount = MAX_D1_BATCH_STATEMENTS * 2 + 7;
  const results = await d1Batch(
    database,
    Array.from({ length: statementCount }, () => statement),
    "bounded batch test",
  );

  assert.deepEqual(batchSizes, [
    MAX_D1_BATCH_STATEMENTS,
    MAX_D1_BATCH_STATEMENTS,
    7,
  ]);
  assert.equal(results.length, statementCount);
});
