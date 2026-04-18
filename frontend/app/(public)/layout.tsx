// Public layout: landing nav chrome wrapping the scroll page.

import type { ReactNode } from "react";

import { LandingNav } from "@/components/landing/LandingNav";

export default function PublicLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <>
      <LandingNav />
      {children}
    </>
  );
}
