// Catch-all 404: redirect any unknown path back to the landing page.

import { redirect } from "next/navigation";

export default function NotFound() {
  redirect("/");
}
