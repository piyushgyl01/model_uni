function unsupported(path: string, reason: string): never {
  throw new TypeError(`Cannot canonicalize ${path}: ${reason}.`);
}

function canonicalizeValue(value: unknown, path: string): unknown {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) unsupported(path, "number is not finite");
    return Object.is(value, -0) ? 0 : value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      canonicalizeValue(item, `${path}[${index}]`),
    );
  }

  if (typeof value === "object") {
    if (Object.getPrototypeOf(value) !== Object.prototype) {
      unsupported(path, "value is not a plain JSON object");
    }
    const record = value as Record<string, unknown>;
    const canonical: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      // Optional TypeScript properties sometimes exist with an explicit
      // undefined value. JSON's canonical representation is omission.
      if (record[key] === undefined) {
        continue;
      }
      canonical[key] = canonicalizeValue(record[key], `${path}.${key}`);
    }
    return canonical;
  }

  return unsupported(path, `${typeof value} is not valid JSON`);
}

/**
 * Stable JSON for immutable publications, hashing, and shadow comparisons.
 * Object keys are sorted; array order remains semantically significant.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalizeValue(value, "$"));
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
