// Root route: send visitors straight to the reference-mapping dashboard.

import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/dashboard");
}
