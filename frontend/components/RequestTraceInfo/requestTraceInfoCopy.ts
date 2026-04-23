// Editable copy for the Request Trace info modal.

export const REQUEST_TRACE_COPY = {
  what_it_is:
    "This visualization traces a single GET /api/v1/embeddings request through 23 spans — from the moment a tab is clicked to the final Plotly scatter plot render. Each span maps to real code in the repository.",
  how_to_navigate:
    "Use the progress bar or Prev / Next buttons to step through the journey. Outbound spans (1–16) follow the request from browser to database. Return spans (17–23) follow the response back to the screen.",
  span_interactions:
    "Click any inactive span to jump to it. Click the active span to open the corresponding source file on GitHub. Hover over a span for a tooltip showing its title and click action.",
  what_to_look_for:
    "Each span shows the environment it belongs to (Frontend, Network, Backend, Database), the code involved, and a data preview of what's traveling through the system at that point. The minimap sidebar gives a bird's-eye view of the full journey.",
} as const;

export const REQUEST_TRACE_HIGHLIGHTS = [
  { label: "Pydantic + Zod", detail: "dual-boundary validation — server and client both enforce the contract" },
  { label: "S3 → local fallback", detail: "parquet served from S3 with automatic local fallback on error" },
  { label: "PyArrow sampling", detail: "276k cells sampled to ~5,000 server-side before JSON serialization" },
  { label: "ADR references", detail: "every span links to the Architecture Decision Record that justifies the design" },
] as const;
