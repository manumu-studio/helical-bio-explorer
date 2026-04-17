// JSON fetch helpers: 404 is a distinct outcome for “artifact not computed yet” vs real errors.

import { z } from "zod";

import { FetchError, parseServedFromHeader, type FetchSource } from "@/lib/fetcher";

export type FetchJsonResult<T> =
  | { status: "ok"; data: T; source: FetchSource }
  | { status: "not_found" };

export async function fetchJsonOrNotFound<TSchema extends z.ZodTypeAny>(
  url: string,
  schema: TSchema,
): Promise<FetchJsonResult<z.infer<TSchema>>> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch (error: unknown) {
    throw new FetchError("Network request failed", { cause: error });
  }

  const source = parseServedFromHeader(response.headers.get("X-Served-From"));

  if (response.status === 404) {
    return { status: "not_found" };
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

  return { status: "ok", data: parsed.data, source };
}
