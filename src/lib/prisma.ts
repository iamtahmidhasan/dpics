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
// Ensure the cached instance has newly added models and fields (e.g. `setting.isAutoStudentIdEnabled`).
const isClientValid = (client?: PrismaClient): client is PrismaClient => {
  if (!client || !("setting" in client)) return false;
  const fields = (
    client as unknown as {
      _runtimeDataModel?: {
        models?: {
          Setting?: {
            fields?: Array<{ name: string }>;
          };
        };
      };
    }
  )._runtimeDataModel?.models?.Setting?.fields;
  if (fields && !fields.some((f) => f.name === "isAutoStudentIdEnabled")) {
    return false;
  }
  return true;
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

