"use client";

import { useRef, useState } from "react";
import {
  backupFileName,
  createProgressBackup,
  parseProgressBackup,
  ProgressBackupError,
  restoreProgressBackup,
  summariseBackup,
} from "./progress-backup";

type Status =
  | { readonly kind: "idle" }
  | { readonly kind: "saved"; readonly message: string }
  | { readonly kind: "restored"; readonly message: string }
  | { readonly kind: "error"; readonly message: string };

/**
 * Progress lives only in this browser, so clearing site data or moving to
 * another device loses it. A file the learner keeps is the smallest thing that
 * fixes both without introducing accounts or a server.
 */
export function ProgressBackupControls() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const fileInput = useRef<HTMLInputElement>(null);

  const save = () => {
    try {
      const backup = createProgressBackup();
      const summary = summariseBackup(backup);
      if (summary.entries === 0) {
        setStatus({
          kind: "error",
          message: "There is no saved progress in this browser yet.",
        });
        return;
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = backupFileName(backup.exportedAt);
      link.click();
      URL.revokeObjectURL(url);
      setStatus({
        kind: "saved",
        message: `Saved ${summary.completedUnits} completed units across ${summary.programs} programme${summary.programs === 1 ? "" : "s"}.`,
      });
    } catch {
      setStatus({
        kind: "error",
        message: "This browser would not let the file be created.",
      });
    }
  };

  const restore = async (file: File) => {
    try {
      const backup = parseProgressBackup(await file.text());
      const incoming = summariseBackup(backup);
      const current = summariseBackup(createProgressBackup());
      const confirmed = window.confirm(
        `Restore ${incoming.completedUnits} completed units from this file?\n\n` +
          `This replaces the ${current.completedUnits} currently in this browser and cannot be undone.`,
      );
      if (!confirmed) return;
      const restored = restoreProgressBackup(backup);
      setStatus({
        kind: "restored",
        message: `Restored ${restored.completedUnits} completed units across ${restored.programs} programme${restored.programs === 1 ? "" : "s"}.`,
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof ProgressBackupError
            ? error.message
            : "That file could not be read.",
      });
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <div className="panel" style={{ marginTop: "1rem" }}>
      <strong>Keep a copy of your progress</strong>
      <p style={{ margin: "0.35rem 0 0.7rem", fontSize: "0.9rem", color: "#555" }}>
        Your ticks are saved in this browser only. Clearing site data erases
        them, and they do not follow you to another device. Save a file and you
        can restore it here whenever you need to.
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button className="btn" type="button" onClick={save}>
          Save progress to a file
        </button>
        <button
          className="btn"
          type="button"
          onClick={() => fileInput.current?.click()}
        >
          Restore from a file
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void restore(file);
          }}
        />
      </div>
      {status.kind !== "idle" ? (
        <p
          role="status"
          style={{
            margin: "0.6rem 0 0",
            fontSize: "0.85rem",
            color: status.kind === "error" ? "#aa0000" : "#14622f",
          }}
        >
          {status.message}
        </p>
      ) : null}
    </div>
  );
}
