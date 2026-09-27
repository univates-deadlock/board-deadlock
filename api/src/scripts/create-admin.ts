import { createUserSchema } from "../schemas/user.schema.js";
import { createInitialAdmin } from "../services/user.service.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { Prisma } from "../../generated/prisma/client.js";

try {
  const parsed = createUserSchema.safeParse({
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: "ADMIN",
  });
  if (!parsed.success) {
    console.error("Informe ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD (8 a 128 caracteres). Consulte api/README.md.");
    process.exitCode = 1;
  } else {
    await createInitialAdmin(parsed.data);
    console.info("Administrador inicial criado. Faça login com as credenciais informadas.");
  }
} catch (error) {
  if (error instanceof AppError) console.error(error.message);
  else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    console.error("Email já cadastrado. Nenhum usuário foi alterado.");
  } else {
    console.error("Não foi possível criar o administrador. Verifique o banco e as migrations.");
  }
  process.exitCode = 1;
} finally {
  delete process.env.ADMIN_PASSWORD;
  await prisma.$disconnect();
}
