import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Next.js recarrega modulos a cada mudanca de arquivo em desenvolvimento (hot
// reload). Sem esse cache no `globalThis`, cada reload criaria um novo
// PrismaClient — e cada um abre seu proprio pool de conexoes com o banco,
// até esgotar o limite de conexoes da Neon. Guardando a instancia no
// `globalThis` durante o dev, ela sobrevive aos reloads.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
