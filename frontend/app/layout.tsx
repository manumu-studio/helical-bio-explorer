// Root layout: metadata and global styles for the App Router shell.

import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "helical-bio-explorer",
  description:
    "Single-cell reference-mapping demo: Geneformer and GenePT embeddings on PBMC data via the Helical SDK.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
