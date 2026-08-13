import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import prisma from "../config/prisma";
import { validateUsuarioCreate } from "../validations/usuarios.validation";

function getArgument(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

async function readAdminData() {
  const fromEnvironment = {
    username: getArgument("username") ?? process.env.ADMIN_USERNAME,
    email: getArgument("email") ?? process.env.ADMIN_EMAIL,
    label: getArgument("nombre") ?? process.env.ADMIN_NAME,
    password: getArgument("password") ?? process.env.ADMIN_PASSWORD
  };
  if (Object.values(fromEnvironment).every(Boolean)) return fromEnvironment;
  if (!process.stdin.isTTY) {
    throw new Error(
      "Faltan datos. Use ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_NAME y ADMIN_PASSWORD o argumentos --campo=valor."
    );
  }

  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    return {
      username: fromEnvironment.username ?? (await prompt.question("Usuario: ")),
      email: fromEnvironment.email ?? (await prompt.question("Email: ")),
      label: fromEnvironment.label ?? (await prompt.question("Nombre visible: ")),
      password: fromEnvironment.password ?? (await prompt.question("Contraseña: "))
    };
  } finally {
    prompt.close();
  }
}

async function main() {
  const input = await readAdminData();
  const validation = validateUsuarioCreate({
    ...input,
    activo: true,
    role: "admin"
  });
  if (!validation.data) throw new Error(validation.error);
  const { password, ...data } = validation.data;

  const duplicate = await prisma.usuario.findFirst({
    where: { OR: [{ username: data.username }, { email: data.email }] },
    select: { id: true }
  });
  if (duplicate) throw new Error("Ya existe un usuario con ese nombre o email.");

  await prisma.usuario.create({
    data: { ...data, passwordHash: await bcrypt.hash(password, 12) }
  });
  console.log(`Administrador ${data.username} creado correctamente.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "No se pudo crear el administrador.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
