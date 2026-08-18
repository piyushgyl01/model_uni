import assert from "node:assert/strict";
import test from "node:test";
import { PROGRESS_STORAGE_NAMESPACE } from "../app/learner-progress-contract";

/** A minimal localStorage so the browser-only module can be exercised here. */
function installStorage(seed: Record<string, string> = {}) {
  const map = new Map(Object.entries(seed));
  const storage = {
    get length() {
      return map.size;
    },
    key: (index: number) => [...map.keys()][index] ?? null,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    clear: () => map.clear(),
  };
  const events: string[] = [];
  (globalThis as { window?: unknown }).window = {
    localStorage: storage,
    dispatchEvent: (event: Event) => {
      events.push(event.type);
      return true;
    },
  };
  return { map, events };
}

const envelope = (completedUnitIds: string[]) =>
  JSON.stringify({
    schemaVersion: 3,
    storageFormat: "owner-scoped-v1",
    guest: {
      programs: {
        prv_example: { courses: { crv_example: { completedUnitIds } } },
      },
    },
    owners: {},
  });

test("a backup captures queued mutations, not only the record", async () => {
  const { map } = installStorage({
    [PROGRESS_STORAGE_NAMESPACE]: envelope(["unit-1", "unit-2"]),
    [`${PROGRESS_STORAGE_NAMESPACE}:mutation:device:program:m1`]: "{}",
    "unrelated-app-key": "should not travel",
  });
  const { createProgressBackup, summariseBackup } = await import(
    "../app/progress-backup"
  );

  const backup = createProgressBackup();
  const keys = Object.keys(backup.entries);
  assert.equal(keys.length, 2, "Queued mutations must be backed up too.");
  assert.ok(keys.every((key) => key.startsWith(PROGRESS_STORAGE_NAMESPACE)));
  assert.equal(
    Object.hasOwn(backup.entries, "unrelated-app-key"),
    false,
    "A backup must not carry storage this app does not own.",
  );
  assert.deepEqual(summariseBackup(backup), {
    entries: 2,
    programs: 1,
    completedUnits: 2,
  });
  assert.equal(map.has("unrelated-app-key"), true);
});

test("restoring replaces progress and leaves other storage alone", async () => {
  const { map, events } = installStorage({
    [PROGRESS_STORAGE_NAMESPACE]: envelope(["stale-1"]),
    [`${PROGRESS_STORAGE_NAMESPACE}:mutation:old`]: "{}",
    "unrelated-app-key": "keep me",
  });
  const { parseProgressBackup, restoreProgressBackup } = await import(
    "../app/progress-backup"
  );

  const backup = parseProgressBackup(
    JSON.stringify({
      format: "course-atlas-progress-backup",
      version: 1,
      exportedAt: "2026-08-16T00:00:00.000Z",
      entries: { [PROGRESS_STORAGE_NAMESPACE]: envelope(["a", "b", "c"]) },
    }),
  );
  const summary = restoreProgressBackup(backup);

  assert.equal(summary.completedUnits, 3);
  assert.equal(
    map.has(`${PROGRESS_STORAGE_NAMESPACE}:mutation:old`),
    false,
    "Stale queued mutations must not survive a restore.",
  );
  assert.equal(map.get("unrelated-app-key"), "keep me");
  assert.ok(events.length > 0, "A restore must tell the app to re-read.");
});

test("a backup file can only write this app's own storage keys", async () => {
  installStorage();
  const { parseProgressBackup, ProgressBackupError } = await import(
    "../app/progress-backup"
  );

  for (const [entries, why] of [
    [{ "evil-token": "x" }, "a foreign key"],
    [{ [PROGRESS_STORAGE_NAMESPACE]: 42 }, "a non-string value"],
  ] as const) {
    assert.throws(
      () =>
        parseProgressBackup(
          JSON.stringify({
            format: "course-atlas-progress-backup",
            version: 1,
            exportedAt: "2026-08-16T00:00:00.000Z",
            entries,
          }),
        ),
      ProgressBackupError,
      `A backup carrying ${why} must be refused.`,
    );
  }

  assert.throws(
    () => parseProgressBackup("not json"),
    ProgressBackupError,
  );
  assert.throws(
    () =>
      parseProgressBackup(
        JSON.stringify({ format: "course-atlas-progress-backup", version: 99, entries: {} }),
      ),
    ProgressBackupError,
    "A future backup version must be refused rather than half-read.",
  );
});
