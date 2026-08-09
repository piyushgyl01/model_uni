import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
  type ChatGPTUser,
} from "./chatgpt-auth";
import { getRuntimeLearnerProgressRepository } from "./catalog/cloudflare-catalog";
import {
  LearnerProgressMutationConflictError,
  LearnerProgressRevisionConflictError,
  LearnerProgressValidationError,
  ProgressImportConflictError,
  type D1LearnerProgressRepository,
  type ProgressImportReceipt as StoredProgressImportReceipt,
  type ResolvedLearner,
} from "./catalog/learner-progress-repository";
import type {
  AuthenticatedProgressResponse,
  ProgressImportReceipt,
} from "./learner-progress-contract";
import type { ProgramVersionId } from "./domain/catalog";

const MAX_JSON_BYTES = 256_000;
const CLIENT_IMPORT_ID = /^[A-Za-z0-9._-]{8,128}$/;
const PREFIXED_ID = /^[a-z][a-z0-9]*_[A-Za-z0-9_-]+$/;

export class ProgressRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ProgressRequestError";
  }
}

export function badProgressRequest(message: string): never {
  throw new ProgressRequestError(400, message);
}

export interface AuthenticatedLearnerContext {
  readonly user: ChatGPTUser;
  readonly learner: ResolvedLearner;
  readonly repository: D1LearnerProgressRepository;
}

export function noStoreJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { ...init, headers });
}

export function rejectCrossOriginMutation(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    throw new ProgressRequestError(403, "Cross-origin progress writes are not allowed.");
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    throw new ProgressRequestError(403, "Cross-site progress writes are not allowed.");
  }
}

export async function readBoundedJson(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_JSON_BYTES) {
    throw new ProgressRequestError(413, "Progress payload is too large.");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_JSON_BYTES) {
    throw new ProgressRequestError(413, "Progress payload is too large.");
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ProgressRequestError(400, "Progress payload must be valid JSON.");
  }
}

export function requireObject(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ProgressRequestError(400, `${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

export function rejectUnknownKeys(
  object: Readonly<Record<string, unknown>>,
  allowedKeys: readonly string[],
  label: string,
) {
  const allowed = new Set(allowedKeys);
  const unknown = Object.keys(object).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    throw new ProgressRequestError(
      400,
      `${label} contains unsupported field(s): ${unknown.join(", ")}.`,
    );
  }
}

export function requireBoolean(value: unknown, label: string) {
  if (typeof value !== "boolean") {
    throw new ProgressRequestError(400, `${label} must be a boolean.`);
  }
  return value;
}

export function requireFiniteNumber(
  value: unknown,
  label: string,
  options: {
    readonly minimum?: number;
    readonly maximum?: number;
    readonly integer?: boolean;
  } = {},
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ProgressRequestError(400, `${label} must be a finite number.`);
  }
  if (options.integer && !Number.isInteger(value)) {
    throw new ProgressRequestError(400, `${label} must be an integer.`);
  }
  if (options.minimum !== undefined && value < options.minimum) {
    throw new ProgressRequestError(
      400,
      `${label} must be at least ${options.minimum}.`,
    );
  }
  if (options.maximum !== undefined && value > options.maximum) {
    throw new ProgressRequestError(
      400,
      `${label} must be at most ${options.maximum}.`,
    );
  }
  return value;
}

export function requireString(
  value: unknown,
  label: string,
  options: { readonly maxLength?: number; readonly pattern?: RegExp } = {},
) {
  if (typeof value !== "string" || value.length === 0) {
    throw new ProgressRequestError(400, `${label} must be a non-empty string.`);
  }
  if (value.length > (options.maxLength ?? 180)) {
    throw new ProgressRequestError(400, `${label} is too long.`);
  }
  if (options.pattern && !options.pattern.test(value)) {
    throw new ProgressRequestError(400, `${label} has an invalid format.`);
  }
  return value;
}

export function requireIsoDate(value: unknown, label: string) {
  const date = requireString(value, label, {
    maxLength: 10,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
  });
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.valueOf()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new ProgressRequestError(400, `${label} must be a valid ISO date.`);
  }
  return date;
}

export function requireIsoDateTime(value: unknown, label: string) {
  const dateTime = requireString(value, label, { maxLength: 80 });
  const parsed = new Date(dateTime);
  if (Number.isNaN(parsed.valueOf())) {
    throw new ProgressRequestError(
      400,
      `${label} must be a valid ISO date-time.`,
    );
  }
  return dateTime;
}

export function requirePrefixedId(value: unknown, label: string) {
  return requireString(value, label, {
    maxLength: 180,
    pattern: PREFIXED_ID,
  });
}

export function requireClientImportId(value: unknown) {
  return requireString(value, "clientImportId", {
    maxLength: 128,
    pattern: CLIENT_IMPORT_ID,
  });
}

export async function getAuthenticatedLearner(): Promise<
  AuthenticatedLearnerContext | undefined
> {
  const user = await getChatGPTUser();
  if (!user) return undefined;

  const repository = await getRuntimeLearnerProgressRepository();
  if (!repository) {
    throw new ProgressRequestError(
      503,
      "Cloud progress storage is not available.",
    );
  }
  const normalizedEmail = user.email.trim().toLowerCase();
  const learner = await repository.resolveLearner({
    provider: "openai-sites",
    subject: user.id,
    email: normalizedEmail,
    displayName: user.displayName,
  });
  return { user, learner, repository };
}

export function anonymousProgressResponse(returnTo: string) {
  return noStoreJson(
    {
      authenticated: false,
      signInPath: chatGPTSignInPath(returnTo),
    },
    { status: 401 },
  );
}

function publicReceipt(
  receipt: StoredProgressImportReceipt,
): ProgressImportReceipt {
  return {
    clientImportId: receipt.clientImportId,
    disposition: receipt.disposition,
    importedUnitCount: receipt.importedUnitCount,
    confirmedAt: receipt.confirmedAt,
  };
}

export async function authenticatedProgressPayload(
  context: AuthenticatedLearnerContext,
  programVersionId: ProgramVersionId,
  clientImportId: string,
  returnTo: string,
  acknowledgedMutationId?: string,
): Promise<AuthenticatedProgressResponse> {
  const [progress, receipt] = await Promise.all([
    context.repository.loadProgress(
      context.learner.learnerId,
      programVersionId,
    ),
    context.repository.getProgressImport(
      context.learner.learnerId,
      clientImportId,
    ),
  ]);
  return {
    authenticated: true,
    ownerKey: context.learner.accountId,
    user: { displayName: context.user.displayName },
    signOutPath: chatGPTSignOutPath(returnTo),
    progress: {
      programVersionId: progress.programVersionId,
      revision: progress.revision,
      enrollment: progress.enrollment,
      selectedConcentrationId: progress.selectedConcentrationId,
      requirementSelections: progress.requirementSelections,
      courses: progress.courses,
      unitEvidences: progress.unitEvidences,
      assessmentAttempts: progress.assessmentAttempts,
      scheduleEntries: progress.scheduleEntries,
      prerequisiteWaivers: progress.prerequisiteWaivers,
      history: progress.history,
      updatedAt: progress.updatedAt,
    },
    importReceipt: receipt ? publicReceipt(receipt) : null,
    ...(acknowledgedMutationId ? { acknowledgedMutationId } : {}),
  };
}

export function progressErrorResponse(error: unknown) {
  if (error instanceof ProgressRequestError) {
    return noStoreJson({ error: error.message }, { status: error.status });
  }
  if (error instanceof LearnerProgressValidationError) {
    return noStoreJson(
      { error: "The requested progress does not match this publication." },
      { status: 400 },
    );
  }
  if (error instanceof ProgressImportConflictError) {
    return noStoreJson(
      {
        error:
          "This device import was already confirmed with different data. Refresh before trying again.",
      },
      { status: 409 },
    );
  }
  if (error instanceof LearnerProgressMutationConflictError) {
    return noStoreJson(
      {
        error:
          "This mutation ID was already used for different learner data. Refresh before trying again.",
      },
      { status: 409 },
    );
  }
  if (error instanceof LearnerProgressRevisionConflictError) {
    return noStoreJson(
      {
        error: "Learner progress changed on another device. Refresh and retry.",
      },
      { status: 409 },
    );
  }
  console.error("Learner progress request failed", error);
  return noStoreJson(
    { error: "Cloud progress is temporarily unavailable." },
    { status: 503 },
  );
}
