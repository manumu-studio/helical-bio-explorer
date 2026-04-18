// Normalizes parquet/API disease_activity strings to severity buckets for filters and heatmaps.

export type SeverityBucket = "healthy" | "mild" | "severe";

export function normalizeSeverity(raw: string): SeverityBucket | null {
  const x = raw.toLowerCase();
  if (x === "healthy") {
    return "healthy";
  }
  if (x === "mild" || x === "low") {
    return "mild";
  }
  if (x === "severe" || x === "high") {
    return "severe";
  }
  return null;
}
