// Lazy singleton Prisma client — one instance per Node process, shared across requests.

import { PrismaClient } from "@prisma/client";

// Standard Next.js singleton pattern — the `as unknown as` assertion is an intentional
// exception to the project's "no `as`" rule because globalThis has no Prisma-aware type.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
