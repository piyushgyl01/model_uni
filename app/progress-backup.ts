"use client";

import { PROGRESS_STORAGE_NAMESPACE } from "./learner-progress-contract";
import { PROGRESS_EVENT } from "./progress-storage";

const BACKUP_FORMAT = "course-atlas-progress-backup" as const;
const BACKUP_VERSION = 1 as const;

export interface ProgressBackup {
  readonly format: typeof BACKUP_FORMAT;
  readonly version: typeof BACKUP_VERSION;
  readonly exportedAt: string;
  /** Raw storage entries, keyed exactly as they are stored. */
  readonly entries: Readonly<Record<string, string>>;
}

export interface ProgressBackupSummary {
  readonly entries: number;
  readonly programs: number;
  readonly completedUnits: number;
}

/**
 * Every storage key this app owns. Progress is not one value: the envelope
 * holds the record, and queued mutations and their acknowledgements live in
 * sibling keys. A backup that took only the envelope would silently drop work
 * that had not yet been acknowledged.
 */
function progressStorageKeys(): string[] {
  const keys: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && key.startsWith(PROGRESS_STORAGE_NAMESPACE)) keys.push(key);
  }
  return keys.sort();
}

function summarise(entries: Readonly<Record<string, string>>): ProgressBackupSummary {
  let programs = 0;
  let completedUnits = 0;
  const envelope = entries[PROGRESS_STORAGE_NAMESPACE];
  if (envelope) {
    try {
      const parsed = JSON.parse(envelope) as {
        guest?: { programs?: Record<string, unknown> };
        owners?: Record<string, { programs?: Record<string, unknown> }>;
      };
      const stores = [parsed.guest, ...Object.values(parsed.owners ?? {})];
      for (const store of stores) {
        const storePrograms = store?.programs ?? {};
        programs += Object.keys(storePrograms).length;
        for (const program of Object.values(storePrograms)) {
          const courses =
            (program as { courses?: Record<string, { completedUnitIds?: unknown[] }> })
              .courses ?? {};
          for (const course of Object.values(courses)) {
            completedUnits += course.completedUnitIds?.length ?? 0;
          }
        }
      }
    } catch {
      // A summary is a convenience; an unreadable envelope still backs up.
    }
  }
  return { entries: Object.keys(entries).length, programs, completedUnits };
}

export function createProgressBackup(): ProgressBackup {
  const entries: Record<string, string> = {};
  for (const key of progressStorageKeys()) {
    const value = window.localStorage.getItem(key);
    if (typeof value === "string") entries[key] = value;
  }
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    entries,
  };
}

export function summariseBackup(backup: ProgressBackup) {
  return summarise(backup.entries);
}

export class ProgressBackupError extends Error {}

export function parseProgressBackup(text: string): ProgressBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ProgressBackupError("That file is not a Course Atlas backup.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new ProgressBackupError("That file is not a Course Atlas backup.");
  }
  const candidate = parsed as Partial<ProgressBackup>;
  if (candidate.format !== BACKUP_FORMAT) {
    throw new ProgressBackupError("That file is not a Course Atlas backup.");
  }
  if (candidate.version !== BACKUP_VERSION) {
    throw new ProgressBackupError(
      `This backup is version ${String(candidate.version)}, which this site cannot read.`,
    );
  }
  const entries = candidate.entries;
  if (!entries || typeof entries !== "object") {
    throw new ProgressBackupError("That backup contains no progress.");
  }
  for (const [key, value] of Object.entries(entries)) {
    // A backup file may only write this app's own keys. Restoring whatever a
    // file asks for would let a hand-edited backup reach unrelated storage.
    if (!key.startsWith(PROGRESS_STORAGE_NAMESPACE)) {
      throw new ProgressBackupError(
        "That backup contains entries that do not belong to Course Atlas.",
      );
    }
    if (typeof value !== "string") {
      throw new ProgressBackupError("That backup is damaged.");
    }
  }
  return candidate as ProgressBackup;
}

/** Replaces stored progress with the backup. The caller confirms first. */
export function restoreProgressBackup(backup: ProgressBackup): ProgressBackupSummary {
  for (const key of progressStorageKeys()) {
    window.localStorage.removeItem(key);
  }
  for (const [key, value] of Object.entries(backup.entries)) {
    window.localStorage.setItem(key, value);
  }
  window.dispatchEvent(new Event(PROGRESS_EVENT));
  return summarise(backup.entries);
}

export function backupFileName(exportedAt = new Date().toISOString()) {
  return `course-atlas-progress-${exportedAt.slice(0, 10)}.json`;
}
