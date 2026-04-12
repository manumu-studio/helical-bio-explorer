// Server component: /datasets — fetches from FastAPI and renders the registry as a static table.

import { fetcher, FetchError } from "@/lib/fetcher";
import { DatasetsResponseSchema } from "@/lib/schemas/datasets";
import type { DatasetsResponse } from "@/lib/schemas/datasets";

export const dynamic = "force-dynamic";

export default async function DatasetsPage() {
  const url = `${process.env.BACKEND_URL ?? "http://localhost:8000"}/api/datasets`;

  let data: DatasetsResponse;
  try {
    data = await fetcher(url, DatasetsResponseSchema);
  } catch (error) {
    const message = error instanceof FetchError ? error.message : "Unknown error";
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
        <h1>Datasets</h1>
        <p style={{ color: "#b91c1c" }}>
          Failed to load datasets: {message}. Is the backend running?
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Datasets</h1>
      <p>{data.total} dataset(s) in the registry.</p>
      <table style={{ borderCollapse: "collapse", width: "100%", marginTop: "1rem" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
              Slug
            </th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
              Display name
            </th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
              Cells
            </th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
              Genes
            </th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
              License
            </th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((d) => (
            <tr key={d.id}>
              <td style={{ padding: "0.5rem" }}>{d.slug}</td>
              <td style={{ padding: "0.5rem" }}>{d.display_name}</td>
              <td style={{ textAlign: "right", padding: "0.5rem" }}>
                {d.cell_count.toLocaleString()}
              </td>
              <td style={{ textAlign: "right", padding: "0.5rem" }}>
                {d.gene_count.toLocaleString()}
              </td>
              <td style={{ padding: "0.5rem" }}>{d.license}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
