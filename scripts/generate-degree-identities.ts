import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { parse, resolve } from "node:path";

type IdentityKey = string;

type CourseIdentityBlueprint = {
  readonly key: IdentityKey;
  readonly unitKeys: readonly IdentityKey[];
  readonly competencyKeys: readonly IdentityKey[];
  readonly resourceKeys: readonly IdentityKey[];
};

type ResourceIdentityBlueprint = {
  readonly key: IdentityKey;
};

type DegreeIdentityBlueprint = {
  readonly requirementGroupKeys: readonly IdentityKey[];
  readonly concentrationKeys: readonly IdentityKey[];
  readonly competencyKeys: readonly IdentityKey[];
  readonly periodKeys: readonly IdentityKey[];
  readonly milestoneKeys: readonly IdentityKey[];
  readonly resources: readonly ResourceIdentityBlueprint[];
  readonly courses: readonly CourseIdentityBlueprint[];
};

const KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EXPORT_NAME = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function usage(): never {
  throw new Error(
    "Usage: node --import tsx scripts/generate-degree-identities.ts " +
      "<blueprint.json> <new-output.ts> <exportName>",
  );
}

function assertUniqueKeys(keys: readonly string[], path: string) {
  const seen = new Set<string>();
  for (const key of keys) {
    if (!KEY.test(key)) {
      throw new Error(`${path} contains non-canonical key ${JSON.stringify(key)}.`);
    }
    if (seen.has(key)) {
      throw new Error(`${path} contains duplicate key ${JSON.stringify(key)}.`);
    }
    seen.add(key);
  }
}

function validateBlueprint(value: unknown): asserts value is DegreeIdentityBlueprint {
  if (!value || typeof value !== "object") {
    throw new Error("Identity blueprint must be a JSON object.");
  }

  const blueprint = value as Partial<DegreeIdentityBlueprint>;
  const keyedArrays = [
    ["requirementGroupKeys", blueprint.requirementGroupKeys],
    ["concentrationKeys", blueprint.concentrationKeys],
    ["competencyKeys", blueprint.competencyKeys],
    ["periodKeys", blueprint.periodKeys],
    ["milestoneKeys", blueprint.milestoneKeys],
  ] as const;

  for (const [path, keys] of keyedArrays) {
    if (!Array.isArray(keys) || keys.some((key) => typeof key !== "string")) {
      throw new Error(`${path} must be an array of strings.`);
    }
    assertUniqueKeys(keys, path);
  }

  if (!Array.isArray(blueprint.resources)) {
    throw new Error("resources must be an array.");
  }
  if (!Array.isArray(blueprint.courses)) {
    throw new Error("courses must be an array.");
  }

  const resources = blueprint.resources as readonly ResourceIdentityBlueprint[];
  const courses = blueprint.courses as readonly CourseIdentityBlueprint[];
  const competencyKeys = blueprint.competencyKeys as readonly string[];

  const resourceKeys = resources.map((resource, index) => {
    if (!resource || typeof resource.key !== "string") {
      throw new Error(`resources[${index}].key must be a string.`);
    }
    return resource.key;
  });
  assertUniqueKeys(resourceKeys, "resources[].key");

  const courseKeys = courses.map((course, index) => {
    if (!course || typeof course.key !== "string") {
      throw new Error(`courses[${index}].key must be a string.`);
    }
    if (
      !Array.isArray(course.unitKeys) ||
      course.unitKeys.some((key) => typeof key !== "string")
    ) {
      throw new Error(`courses[${index}].unitKeys must be an array of strings.`);
    }
    if (
      !Array.isArray(course.competencyKeys) ||
      course.competencyKeys.some((key) => typeof key !== "string")
    ) {
      throw new Error(
        `courses[${index}].competencyKeys must be an array of strings.`,
      );
    }
    if (
      !Array.isArray(course.resourceKeys) ||
      course.resourceKeys.some((key) => typeof key !== "string")
    ) {
      throw new Error(
        `courses[${index}].resourceKeys must be an array of strings.`,
      );
    }
    if (
      course.unitKeys.length === 0 ||
      course.competencyKeys.length === 0 ||
      course.resourceKeys.length === 0
    ) {
      throw new Error(
        `courses[${index}] needs at least one unit, competency, and resource.`,
      );
    }
    assertUniqueKeys(course.unitKeys, `courses[${index}].unitKeys`);
    assertUniqueKeys(
      course.competencyKeys,
      `courses[${index}].competencyKeys`,
    );
    assertUniqueKeys(course.resourceKeys, `courses[${index}].resourceKeys`);
    for (const competencyKey of course.competencyKeys) {
      if (!competencyKeys.includes(competencyKey)) {
        throw new Error(
          `courses[${index}] references unknown competency ${competencyKey}.`,
        );
      }
    }
    for (const resourceKey of course.resourceKeys) {
      if (!resourceKeys.includes(resourceKey)) {
        throw new Error(
          `courses[${index}] references unknown resource ${resourceKey}.`,
        );
      }
    }
    return course.key;
  });
  assertUniqueKeys(courseKeys, "courses[].key");
}

function recordFromKeys<Value>(
  keys: readonly string[],
  create: (key: string) => Value,
) {
  return Object.fromEntries(keys.map((key) => [key, create(key)]));
}

/**
 * RFC 9562 UUIDv7: 48-bit Unix-millisecond timestamp, version 7, RFC variant,
 * and cryptographically random remaining bits. The generator is authoring
 * tooling only; its output is checked in as literal publication identities.
 */
function uuidV7() {
  const bytes = randomBytes(16);
  let timestamp = Date.now();
  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = timestamp % 256;
    timestamp = Math.floor(timestamp / 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function createIdFactory() {
  const uuidBodies = new Set<string>();
  return (prefix: string) => {
    let body = uuidV7();
    while (uuidBodies.has(body)) body = uuidV7();
    uuidBodies.add(body);
    return `${prefix}_${body}`;
  };
}

function generateManifest(blueprint: DegreeIdentityBlueprint) {
  const id = createIdFactory();
  return {
    bundleId: id("bnd"),
    programId: id("prg"),
    programVersionId: id("prv"),
    programProvenanceEvidenceId: id("prvdc"),
    requirementGroupIds: recordFromKeys(
      blueprint.requirementGroupKeys,
      () => id("req"),
    ),
    concentrationIds: recordFromKeys(
      blueprint.concentrationKeys,
      () => id("con"),
    ),
    competencyIds: recordFromKeys(blueprint.competencyKeys, () => id("cmp")),
    programCompetencyMappingIds: recordFromKeys(
      blueprint.competencyKeys,
      () => id("cpm"),
    ),
    calendar: {
      id: id("cal"),
      scheduleId: id("sch"),
      periodIds: recordFromKeys(blueprint.periodKeys, () => id("per")),
      milestoneIds: recordFromKeys(blueprint.milestoneKeys, () => id("mil")),
    },
    resources: recordFromKeys(blueprint.resources.map(({ key }) => key), () => ({
      resourceId: id("res"),
      resourceVersionId: id("rsv"),
      accessOfferId: id("acc"),
      rightsRecordId: id("rgt"),
      freshnessRecordId: id("frs"),
      provenanceEvidenceId: id("prvdc"),
    })),
    courses: recordFromKeys(
      blueprint.courses.map(({ key }) => key),
      (courseKey) => {
        const course = blueprint.courses.find(({ key }) => key === courseKey);
        if (!course) throw new Error(`Missing course blueprint ${courseKey}.`);
        return {
          courseId: id("crs"),
          courseVersionId: id("crv"),
          learningUnitIds: recordFromKeys(course.unitKeys, () => id("unt")),
          assessmentIds: {
            applied: id("asm"),
            final: id("asm"),
          },
          assessmentVersionIds: {
            applied: id("asv"),
            final: id("asv"),
          },
          requirementOptionId: id("opt"),
          schedulePlacementId: id("plc"),
          competencyMappingIds: recordFromKeys(
            course.competencyKeys,
            () => id("cpm"),
          ),
          finalAssessmentMappingId: id("cpm"),
        };
      },
    ),
  };
}

function collectIdentityValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap(collectIdentityValues);
}

const [blueprintPath, outputPath, exportName] = process.argv.slice(2);
if (!blueprintPath || !outputPath || !exportName) usage();
if (!EXPORT_NAME.test(exportName)) {
  throw new Error(`${JSON.stringify(exportName)} is not a valid export name.`);
}

const resolvedOutput = resolve(outputPath);
if (resolvedOutput === parse(resolvedOutput).root || !resolvedOutput.endsWith(".ts")) {
  throw new Error("Output must be a new .ts file, not a filesystem root.");
}

const blueprint = JSON.parse(await readFile(resolve(blueprintPath), "utf8"));
validateBlueprint(blueprint);
const manifest = generateManifest(blueprint);
const source = `/**
 * Opaque public identities for an immutable degree-equivalent publication.
 *
 * Descriptive object keys are editorial lookup keys only. Every public ID is
 * a type-prefixed UUIDv7 literal assigned exactly once in this manifest.
 */
export const ${exportName} = ${JSON.stringify(manifest, null, 2)} as const;
`;

// Never overwrite a prior manifest: rerunning identity generation must require
// an explicit new destination and an editorial comparison.
await writeFile(resolvedOutput, source, { encoding: "utf8", flag: "wx" });

const identityValues = collectIdentityValues(manifest);
const counts = Object.fromEntries(
  [...new Set(identityValues.map((value) => value.slice(0, value.indexOf("_"))))]
    .sort()
    .map((prefix) => [
      prefix,
      identityValues.filter((value) => value.startsWith(`${prefix}_`)).length,
    ]),
);
console.log(
  `Wrote ${identityValues.length} immutable identities to ${resolvedOutput}`,
);
console.log(JSON.stringify(counts, null, 2));
