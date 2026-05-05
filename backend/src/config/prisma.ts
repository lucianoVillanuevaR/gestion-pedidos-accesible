import { PrismaClient } from "@prisma/client";

// Crear una instancia única de PrismaClient
const prisma = new PrismaClient();

// Manejar desconexión en desarrollo
if (process.env.NODE_ENV !== "production") {
  const globalForPrisma = global as unknown as { prisma: PrismaClient };
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prisma;
  }
}

export default prisma;
