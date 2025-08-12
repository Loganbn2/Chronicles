import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma() {
  if (process.env.NODE_ENV !== "production") {
    return new PrismaClient({ log: ["query", "warn", "error"] });
  }
  return new PrismaClient({ log: ["warn", "error"] });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
