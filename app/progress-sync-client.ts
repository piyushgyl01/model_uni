"use client";

import type {
  AnonymousProgressResponse,
  AuthenticatedProgressResponse,
  ProgressImportRequest,
  ProgressImportResponse,
  ProgressPatchRequest,
  ProgressResponse,
} from "./learner-progress-contract";
import type { ProgramVersionId } from "./domain/catalog";

export type ProgressConnection =
  | { readonly kind: "checking" }
  | {
      readonly kind: "anonymous";
      readonly signInPath: string;
    }
  | {
      readonly kind: "signed-in";
      readonly displayName: string;
      readonly signOutPath: string;
      readonly importResolved: boolean;
    }
  | { readonly kind: "offline" };

export type ProgressSaveState =
  | "idle"
  | "saving"
  | "saved"
  | "device-only"
  | "error";

function currentReturnTo() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

async function parseResponse<ResponseBody>(response: Response) {
  const body = (await response.json().catch(() => null)) as ResponseBody | null;
  if (!body) throw new Error("The progress service returned an invalid response.");
  return body;
}

export async function loadCloudProgress(
  programVersionId: ProgramVersionId,
  clientImportId: string,
): Promise<ProgressResponse> {
  const query = new URLSearchParams({
    programVersionId,
    clientImportId,
    returnTo: currentReturnTo(),
  });
  const response = await fetch(`/api/learner-progress?${query}`, {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 401) {
    return parseResponse<AnonymousProgressResponse>(response);
  }
  if (!response.ok) {
    throw new Error(`Progress load failed with status ${response.status}.`);
  }
  return parseResponse<AuthenticatedProgressResponse>(response);
}

export async function patchCloudProgress(
  request: ProgressPatchRequest,
): Promise<AuthenticatedProgressResponse> {
  const response = await fetch("/api/learner-progress", {
    method: "PATCH",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`Progress save failed with status ${response.status}.`);
  }
  return parseResponse<AuthenticatedProgressResponse>(response);
}

export async function importLocalProgress(
  request: ProgressImportRequest,
): Promise<ProgressImportResponse> {
  const response = await fetch("/api/learner-progress/import", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`Progress import failed with status ${response.status}.`);
  }
  return parseResponse<ProgressImportResponse>(response);
}

export function connectionFromResponse(
  response: ProgressResponse,
): ProgressConnection {
  if (!response.authenticated) {
    return { kind: "anonymous", signInPath: response.signInPath };
  }
  return {
    kind: "signed-in",
    displayName: response.user.displayName,
    signOutPath: response.signOutPath,
    importResolved: Boolean(response.importReceipt),
  };
}

