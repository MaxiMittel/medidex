import { PrismaClient } from "@prisma/client";

/**
 * PrismaClient singleton instance
 * This pattern prevents multiple instances of PrismaClient during development hot reloads
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

/**
 * Global Prisma Client instance
 * In development: Attached to global object to survive hot reloads
 * In production: Creates a new instance
 */
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
