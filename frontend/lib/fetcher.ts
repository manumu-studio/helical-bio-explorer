// Typed fetch + Zod parse at the HTTP boundary; failures become FetchError.

import { z } from "zod";

export class FetchError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "FetchError";
  }
}

export async function fetcher<TSchema extends z.ZodTypeAny>(
  url: string,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch (error: unknown) {
    throw new FetchError("Network request failed", { cause: error });
  }

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

  return parsed.data;
}
