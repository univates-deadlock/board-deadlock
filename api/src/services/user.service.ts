import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { CreateUserInput, UpdateUserInput } from "../schemas/user.schema.js";
import { AppError } from "../utils/AppError.js";

export const userSelect = {
  id: true, name: true, email: true, role: true, isActive: true,
  createdAt: true, updatedAt: true,
} satisfies Prisma.UserSelect;

export const getAllUsers = async () => prisma.user.findMany({
  select: userSelect,
  orderBy: [{ createdAt: "desc" }, { id: "asc" }],
});

export const getUserById = async (id: string) => prisma.user.findUnique({
  where: { id }, select: userSelect,
});

// One nested write is atomic: a user and its credential either both exist or neither does.
const createCredentialUser = (tx: Prisma.TransactionClient, data: CreateUserInput, passwordHash: string) => {
  const { password, ...userData } = data;
  void password;
  const id = randomUUID();
  const now = new Date();
  return tx.user.create({
    data: {
      ...userData, id,
      accounts: { create: {
        id: randomUUID(), accountId: id, providerId: "credential",
        password: passwordHash, createdAt: now, updatedAt: now,
      } },
    },
    select: userSelect,
  });
};

export const createUser = async (data: CreateUserInput) => {
  const passwordHash = await hashPassword(data.password);
  return prisma.$transaction((tx) => createCredentialUser(tx, data, passwordHash));
};

// Local provisioning only. It never promotes or overwrites an existing user.
export const createInitialAdmin = async (data: CreateUserInput) => {
  const passwordHash = await hashPassword(data.password);
  return prisma.$transaction(async (tx) => {
    if (await tx.user.count({ where: { role: "ADMIN", isActive: true } }) > 0) {
      throw new AppError("Já existe um administrador ativo; use o CRUD de usuários", 409);
    }
    return createCredentialUser(tx, { ...data, role: "ADMIN" }, passwordHash);
  }, { isolationLevel: "Serializable" });
};

const preserveLastAdmin = async (tx: Prisma.TransactionClient, id: string) => {
  const user = await tx.user.findUniqueOrThrow({ where: { id }, select: userSelect });
  if (user.role === "ADMIN" && user.isActive &&
      await tx.user.count({ where: { role: "ADMIN", isActive: true } }) <= 1) {
    throw new AppError("Não é possível remover o último administrador ativo", 409);
  }
};

export const updateUser = async (id: string, data: UpdateUserInput, actorId: string) => {
  if (id === actorId && data.role && data.role !== "ADMIN") {
    throw new AppError("Você não pode remover seu próprio perfil de administrador", 409);
  }
  return prisma.$transaction(async (tx) => {
    const current = await tx.user.findUniqueOrThrow({ where: { id }, select: userSelect });
    if (data.role && data.role !== "ADMIN") await preserveLastAdmin(tx, id);
    const emailChanged = data.email !== undefined && data.email !== current.email;
    const roleChanged = data.role !== undefined && data.role !== current.role;
    const user = await tx.user.update({
      where: { id },
      data: { ...data, ...(emailChanged ? { emailVerified: false } : {}) },
      select: userSelect,
    });
    if (emailChanged || roleChanged) await tx.session.deleteMany({ where: { userId: id } });
    return user;
  }, { isolationLevel: "Serializable" });
};

export const activateUser = async (id: string) => prisma.user.update({
  where: { id }, data: { isActive: true }, select: { id: true },
});

export const deactivateUser = async (id: string, actorId: string) => {
  if (id === actorId) throw new AppError("Você não pode desativar seu próprio usuário", 409);
  return prisma.$transaction(async (tx) => {
    await preserveLastAdmin(tx, id);
    const user = await tx.user.update({
      where: { id }, data: { isActive: false }, select: { id: true },
    });
    await tx.session.deleteMany({ where: { userId: id } });
    return user;
  }, { isolationLevel: "Serializable" });
};
