"use client";

import type {
  ProgressConnection,
  ProgressSaveState,
} from "./progress-sync-client";
import styles from "./progress-sync-status.module.css";

export interface ProgressSyncStatusProps {
  readonly connection: ProgressConnection;
  readonly saveState: ProgressSaveState;
  readonly needsImportDecision: boolean;
  readonly importBusy: boolean;
  readonly onImport: () => void;
  readonly onUseCloud: () => void;
}

function saveStateLabel(saveState: ProgressSaveState) {
  switch (saveState) {
    case "saving":
      return "Saving to your cloud account…";
    case "saved":
      return "Cloud progress saved.";
    case "device-only":
      return "Saved on this device; cloud sync will retry when you reconnect.";
    case "error":
      return "Cloud sync could not finish. Your latest change remains on this device.";
    default:
      return "Cloud progress is up to date.";
  }
}

export default function ProgressSyncStatus({
  connection,
  saveState,
  needsImportDecision,
  importBusy,
  onImport,
  onUseCloud,
}: ProgressSyncStatusProps) {
  if (connection.kind === "checking") {
    return (
      <div
        className={`progress-sync-state ${styles.state}`}
        role="status"
        aria-live="polite"
      >
        <strong>Checking cloud progress…</strong>
      </div>
    );
  }

  if (connection.kind === "anonymous") {
    return (
      <div
        className={`progress-sync-state is-local ${styles.state} ${styles.local}`}
        role="status"
      >
        <div>
          <strong>
            {saveState === "error"
              ? "Browser storage is unavailable"
              : "Progress is saved on this device"}
          </strong>
          <span>
            {saveState === "error"
              ? "This change may be lost when you leave the page."
              : "Sign in to continue on other devices."}
          </span>
        </div>
        <a className="button button-quiet" href={connection.signInPath}>
          Sign in with ChatGPT
        </a>
      </div>
    );
  }

  if (connection.kind === "offline") {
    return (
      <div
        className={`progress-sync-state is-offline ${styles.state} ${styles.offline}`}
        role="status"
        aria-live="polite"
      >
        <strong>
          {saveState === "error"
            ? "Offline · progress could not be cached"
            : "Offline · using this device&apos;s saved progress"}
        </strong>
        <span>
          {saveState === "error"
            ? "Keep this page open and reconnect before continuing."
            : "Cloud sync will be available when the connection returns."}
        </span>
      </div>
    );
  }

  if (needsImportDecision) {
    return (
      <div
        className={`progress-import-consent ${styles.consent}`}
        role="alert"
      >
        <div>
          <strong>Bring this device&apos;s progress into your account?</strong>
          <p>
            We found earlier Course Atlas progress in this browser. Nothing is
            uploaded until you choose. Import merges completions without removing
            cloud progress.
          </p>
        </div>
        <div className={`progress-import-actions ${styles.actions}`}>
          <button
            className="button button-primary"
            type="button"
            onClick={onImport}
            disabled={importBusy}
          >
            {importBusy ? "Confirming…" : "Import and merge"}
          </button>
          <button
            className="button button-quiet"
            type="button"
            onClick={onUseCloud}
            disabled={importBusy}
          >
            Use cloud progress
          </button>
        </div>
        <small>
          Local data stays untouched until the server confirms your choice.
        </small>
      </div>
    );
  }

  return (
    <div
      className={`progress-sync-state is-cloud save-${saveState} ${styles.state} ${styles.cloud} ${
        saveState === "device-only" ? styles.deviceOnly : ""
      } ${saveState === "error" ? styles.error : ""}`}
      role="status"
      aria-live="polite"
    >
      <div>
        <strong>Cloud sync on · {connection.displayName}</strong>
        <span>{saveStateLabel(saveState)}</span>
      </div>
      <a className={styles.link} href={connection.signOutPath}>
        Sign out
      </a>
    </div>
  );
}
