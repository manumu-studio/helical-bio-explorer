// Root layout: metadata and global styles for the App Router shell.

import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "helical-bio-explorer",
  description: "Bio foundation model dashboard powered by the Helical SDK.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
