import type { PublishedProgramBundle } from "../domain/catalog";
import { canonicalJson } from "./canonical-json";
import type { CatalogRepository } from "./repository";
import {
  collectStaticCatalogBundles,
  type D1CatalogRepository,
} from "./d1-repository";

export type CatalogShadowMismatchKind =
  | "missing_in_d1"
  | "missing_in_static"
  | "value_mismatch"
  | "type_mismatch"
  | "missing_property";

export interface CatalogShadowMismatch {
  readonly kind: CatalogShadowMismatchKind;
  readonly publication: string;
  readonly path: string;
  readonly message: string;
  readonly staticValue?: string;
  readonly d1Value?: string;
}

export interface CatalogShadowReport {
  readonly matches: boolean;
  readonly comparedPublications: number;
  readonly mismatches: readonly CatalogShadowMismatch[];
  readonly truncated: boolean;
}

function publicationKey(bundle: PublishedProgramBundle) {
  return `${bundle.program.id}@${bundle.programVersion.version}`;
}

function preview(value: unknown): string {
  if (value === undefined) return "<missing>";
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    serialized = String(value);
  }
  return serialized.length > 180
    ? `${serialized.slice(0, 177)}...`
    : serialized;
}

function valueKind(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function childPath(parent: string, key: string | number) {
  return typeof key === "number"
    ? `${parent}[${key}]`
    : parent === "$"
      ? `$.${key}`
      : `${parent}.${key}`;
}

function compareValues(
  publication: string,
  staticValue: unknown,
  d1Value: unknown,
  path: string,
  mismatches: CatalogShadowMismatch[],
  maximum: number,
) {
  if (mismatches.length >= maximum || Object.is(staticValue, d1Value)) return;

  const staticKind = valueKind(staticValue);
  const d1Kind = valueKind(d1Value);
  if (staticKind !== d1Kind) {
    mismatches.push({
      kind: "type_mismatch",
      publication,
      path,
      message: `Type differs at ${path}: static is ${staticKind}, D1 is ${d1Kind}.`,
      staticValue: preview(staticValue),
      d1Value: preview(d1Value),
    });
    return;
  }

  if (Array.isArray(staticValue) && Array.isArray(d1Value)) {
    if (staticValue.length !== d1Value.length) {
      mismatches.push({
        kind: "value_mismatch",
        publication,
        path: `${path}.length`,
        message: `Array length differs at ${path}: static has ${staticValue.length}, D1 has ${d1Value.length}.`,
        staticValue: String(staticValue.length),
        d1Value: String(d1Value.length),
      });
    }
    const length = Math.max(staticValue.length, d1Value.length);
    for (let index = 0; index < length && mismatches.length < maximum; index += 1) {
      if (index >= staticValue.length || index >= d1Value.length) {
        mismatches.push({
          kind: "missing_property",
          publication,
          path: childPath(path, index),
          message:
            index >= staticValue.length
              ? `D1 has an extra array item at ${childPath(path, index)}.`
              : `D1 is missing the array item at ${childPath(path, index)}.`,
          staticValue: preview(staticValue[index]),
          d1Value: preview(d1Value[index]),
        });
      } else {
        compareValues(
          publication,
          staticValue[index],
          d1Value[index],
          childPath(path, index),
          mismatches,
          maximum,
        );
      }
    }
    return;
  }

  if (
    staticValue &&
    d1Value &&
    typeof staticValue === "object" &&
    typeof d1Value === "object"
  ) {
    const staticRecord = staticValue as Record<string, unknown>;
    const d1Record = d1Value as Record<string, unknown>;
    const keys = new Set([
      ...Object.keys(staticRecord),
      ...Object.keys(d1Record),
    ]);
    for (const key of [...keys].sort()) {
      if (mismatches.length >= maximum) return;
      const inStatic = Object.hasOwn(staticRecord, key);
      const inD1 = Object.hasOwn(d1Record, key);
      if (!inStatic || !inD1) {
        mismatches.push({
          kind: "missing_property",
          publication,
          path: childPath(path, key),
          message: !inD1
            ? `D1 is missing ${childPath(path, key)}.`
            : `D1 has an extra property at ${childPath(path, key)}.`,
          staticValue: preview(staticRecord[key]),
          d1Value: preview(d1Record[key]),
        });
        continue;
      }
      compareValues(
        publication,
        staticRecord[key],
        d1Record[key],
        childPath(path, key),
        mismatches,
        maximum,
      );
    }
    return;
  }

  mismatches.push({
    kind: "value_mismatch",
    publication,
    path,
    message: `Value differs at ${path}.`,
    staticValue: preview(staticValue),
    d1Value: preview(d1Value),
  });
}

/**
 * Compares canonical publication identities and then reports field-level
 * differences. Paths are ready to paste into a content issue or seed audit.
 */
export function compareCatalogBundleShadows(
  staticBundles: readonly PublishedProgramBundle[],
  d1Bundles: readonly PublishedProgramBundle[],
  maximumMismatches = 100,
): CatalogShadowReport {
  const staticByPublication = new Map(
    staticBundles.map((bundle) => [publicationKey(bundle), bundle]),
  );
  const d1ByPublication = new Map(
    d1Bundles.map((bundle) => [publicationKey(bundle), bundle]),
  );
  const publications = new Set([
    ...staticByPublication.keys(),
    ...d1ByPublication.keys(),
  ]);
  const mismatches: CatalogShadowMismatch[] = [];

  for (const publication of [...publications].sort()) {
    if (mismatches.length >= maximumMismatches) break;
    const staticBundle = staticByPublication.get(publication);
    const d1Bundle = d1ByPublication.get(publication);
    if (!staticBundle) {
      mismatches.push({
        kind: "missing_in_static",
        publication,
        path: "$",
        message: `${publication} exists in D1 but not in the checked-in catalog.`,
        d1Value: d1Bundle?.id,
      });
      continue;
    }
    if (!d1Bundle) {
      mismatches.push({
        kind: "missing_in_d1",
        publication,
        path: "$",
        message: `${publication} exists in the checked-in catalog but not in D1.`,
        staticValue: staticBundle.id,
      });
      continue;
    }
    const canonicalStatic = JSON.parse(canonicalJson(staticBundle)) as unknown;
    const canonicalD1 = JSON.parse(canonicalJson(d1Bundle)) as unknown;
    compareValues(
      publication,
      canonicalStatic,
      canonicalD1,
      "$",
      mismatches,
      maximumMismatches,
    );
  }

  return {
    matches: mismatches.length === 0,
    comparedPublications: publications.size,
    mismatches,
    truncated:
      mismatches.length >= maximumMismatches &&
      publications.size > 0,
  };
}

export async function compareStaticAndD1Catalog(
  staticRepository: CatalogRepository,
  d1Repository: D1CatalogRepository,
  maximumMismatches = 100,
): Promise<CatalogShadowReport> {
  return compareCatalogBundleShadows(
    collectStaticCatalogBundles(staticRepository),
    await d1Repository.loadAll(),
    maximumMismatches,
  );
}

export class CatalogShadowMismatchError extends Error {
  constructor(readonly report: CatalogShadowReport) {
    super(
      `Static and D1 catalogs differ:\n${report.mismatches
        .map(
          (mismatch) =>
            `- ${mismatch.publication} ${mismatch.path}: ${mismatch.message}`,
        )
        .join("\n")}`,
    );
    this.name = "CatalogShadowMismatchError";
  }
}
