import bcrypt from "bcryptjs";
import prisma from "../config/prisma";
import { RequestError } from "../utils/httpErrors";
import { lockAdminOperations } from "./databaseLocks";

type UserUpdate = {
  activo?: boolean;
  email?: string;
  label?: string;
  password?: string;
  role?: "cajero" | "cocina" | "admin";
  username?: string;
};

export async function updateUserSafely(userId: number, input: UserUpdate) {
  const { password, ...data } = input;
  const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;
  return prisma.$transaction(async (tx) => {
    await lockAdminOperations(tx);
    const current = await tx.usuario.findUnique({ where: { id: userId } });
    if (!current) throw new RequestError(404, "Usuario no encontrado");
    const removesActiveAdmin =
      current.role === "admin" && current.activo && (data.activo === false || (data.role && data.role !== "admin"));
    if (removesActiveAdmin) {
      const activeAdmins = await tx.usuario.count({ where: { role: "admin", activo: true } });
      if (activeAdmins <= 1) throw new RequestError(409, "Debe existir al menos un administrador activo");
    }
    return tx.usuario.update({
      data: { ...data, ...(passwordHash ? { passwordHash } : {}) },
      where: { id: userId }
    });
  });
}
