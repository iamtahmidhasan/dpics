import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter,
  });
}

// In development, hot-reloading can keep an older PrismaClient instance in memory
// from before a migration or prisma generate ran.
// Ensure the cached instance has newly added models (e.g. `setting`).
const isClientValid = (client?: PrismaClient): client is PrismaClient => {
  return Boolean(client && "setting" in client);
};

if (!globalForPrisma.prisma || !isClientValid(globalForPrisma.prisma)) {
  globalForPrisma.prisma = createPrismaClient();
}

const prisma = new Proxy(globalForPrisma.prisma, {
  get(target, prop, receiver) {
    if (!isClientValid(globalForPrisma.prisma)) {
      globalForPrisma.prisma = createPrismaClient();
    }
    const current = globalForPrisma.prisma || target;
    return Reflect.get(current, prop, receiver);
  },
});

export default prisma;

