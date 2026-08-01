/**
 * The small D1 surface used by the catalog repositories. Keeping this
 * structural avoids leaking Cloudflare ambient types into domain code and
 * makes the persistence layer testable with Miniflare.
 */
export interface D1ResultLike<Row = unknown> {
  readonly success?: boolean;
  readonly error?: string;
  readonly results?: readonly Row[];
  readonly meta?: Readonly<Record<string, unknown>>;
}

export interface D1PreparedStatementLike {
  bind(...values: readonly unknown[]): D1PreparedStatementLike;
  all<Row = Record<string, unknown>>(): Promise<D1ResultLike<Row>>;
  first<Row = Record<string, unknown>>(): Promise<Row | null>;
  run(): Promise<D1ResultLike>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
  batch(
    statements: readonly D1PreparedStatementLike[],
  ): Promise<readonly D1ResultLike[]>;
}

/**
 * Keep every Worker-to-D1 batch comfortably below provider statement limits.
 * Callers retain statement order across chunks; operations that require a
 * single transaction must submit no more than this many statements together.
 */
export const MAX_D1_BATCH_STATEMENTS = 50;

export class D1OperationError extends Error {
  constructor(
    readonly operation: string,
    readonly detail?: string,
  ) {
    super(
      `D1 ${operation} failed${detail && detail.length > 0 ? `: ${detail}` : "."}`,
    );
    this.name = "D1OperationError";
  }
}

export function assertD1Success(
  result: D1ResultLike,
  operation: string,
): void {
  if (result.success === false) {
    throw new D1OperationError(operation, result.error);
  }
}

export async function d1All<Row>(
  statement: D1PreparedStatementLike,
  operation: string,
): Promise<readonly Row[]> {
  const result = await statement.all<Row>();
  assertD1Success(result, operation);
  return result.results ?? [];
}

export async function d1Batch(
  database: D1DatabaseLike,
  statements: readonly D1PreparedStatementLike[],
  operation: string,
): Promise<readonly D1ResultLike[]> {
  if (statements.length === 0) return [];
  const complete: D1ResultLike[] = [];
  for (
    let offset = 0;
    offset < statements.length;
    offset += MAX_D1_BATCH_STATEMENTS
  ) {
    const results = await database.batch(
      statements.slice(offset, offset + MAX_D1_BATCH_STATEMENTS),
    );
    results.forEach((result, index) =>
      assertD1Success(
        result,
        `${operation} (statement ${offset + index + 1})`,
      ),
    );
    complete.push(...results);
  }
  return complete;
}
