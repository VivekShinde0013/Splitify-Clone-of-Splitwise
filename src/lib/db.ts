import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";
const isPostgres = databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://");

if (process.env.NODE_ENV === "production") {
  if (isPostgres) {
    prisma = new PrismaClient();
  } else {
    // Dynamically load to prevent native build errors on serverless environments
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
    prisma = new PrismaClient({ adapter });
  }
} else {
  // In development, use a global variable so that the value
  // is preserved across hot reloads.
  const globalWithPrisma = global as typeof globalThis & {
    prisma?: PrismaClient;
  };
  if (!globalWithPrisma.prisma) {
    if (isPostgres) {
      globalWithPrisma.prisma = new PrismaClient();
    } else {
      const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
      const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
      globalWithPrisma.prisma = new PrismaClient({ adapter });
    }
  }
  prisma = globalWithPrisma.prisma;
}

export { prisma };
