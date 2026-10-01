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
// from before a migration or prisma generate ran. A stale client resolves a
// model added afterwards to `undefined`, so the first query throws
// "Cannot read properties of undefined (reading 'findMany')".
//
// Add a model here whenever the schema gains one; extend `REQUIRED_FIELDS` when
// an existing model gains a column the app relies on.
const REQUIRED_MODELS = [
  "user",
  "member",
  "instructor",
  "committee",
  "committeeRole",
  "userCommitteeRole",
  "session",
  "account",
  "verification",
  "setting",
  "post",
  "category",
] as const;

const REQUIRED_FIELDS: Record<string, string> = {
  Setting: "isAutoStudentIdEnabled",
  Post: "categoryId",
};

type RuntimeDataModel = {
  _runtimeDataModel?: {
    models?: Record<string, { fields?: Array<{ name: string }> }>;
  };
};

const isClientValid = (client?: PrismaClient): client is PrismaClient => {
  if (!client) return false;

  for (const model of REQUIRED_MODELS) {
    if (!(model in client)) return false;
  }

  const models = (client as unknown as RuntimeDataModel)._runtimeDataModel?.models;

  if (!models) return false;

  for (const [model, field] of Object.entries(REQUIRED_FIELDS)) {
    const fields = models[model]?.fields;

    if (fields && !fields.some((entry) => entry.name === field)) return false;
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

