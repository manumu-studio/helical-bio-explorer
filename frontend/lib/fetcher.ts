// Typed fetch + Zod parse at the HTTP boundary; captures X-Served-From for provenance UI.

import { z } from "zod";

export class FetchError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "FetchError";
  }
}

export type FetchSource = "s3" | "local" | "unknown";

export interface FetchResult<T> {
  data: T;
  source: FetchSource;
}

function parseServedFromHeader(raw: string | null): FetchSource {
  if (raw === null) {
    return "unknown";
  }
  const normalized = raw.trim().toLowerCase();
  if (normalized === "s3") {
    return "s3";
  }
  if (normalized === "local") {
    return "local";
  }
  return "unknown";
}

export async function fetcher<TSchema extends z.ZodTypeAny>(
  url: string,
  schema: TSchema,
): Promise<FetchResult<z.infer<TSchema>>> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch (error: unknown) {
    throw new FetchError("Network request failed", { cause: error });
  }

  const source = parseServedFromHeader(response.headers.get("X-Served-From"));

  if (!response.ok) {
    throw new FetchError(`HTTP ${String(response.status)}`);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (error: unknown) {
    throw new FetchError("Response body is not valid JSON", { cause: error });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new FetchError("Response failed schema validation", { cause: parsed.error });
  }

  return { data: parsed.data, source };
}
