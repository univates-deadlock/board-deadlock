import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { CreateClientInput, UpdateClientInput } from "../schemas/client.schema.js";
import { AppError } from "../utils/AppError.js";

// 1)  ============= Select all clients fields from prisma ============= 
export const clientSelect = {
    id: true,
    type: true,
    name: true,
    document: true,
    notes: true,
    active: true,
    contactName: true,
    phone: true,
    whatsapp: true,
    location: true,
    email: true,
    createdAt: true,
    updatedAt: true,
    } satisfies Prisma.ClientSelect;

// 2)  ============= List ALL clients: order by "created_at" DESC  ============= 
export const getAllClients = async () => prisma.client.findMany({
    select: clientSelect,
    orderBy: [{ createdAt: "desc"}, {id: "asc"}],
});

// 3) ============= Search client by ID =============
export const getClientById = async (id: string) => {
  const client = await prisma.client.findUnique({
    where: { id },
    select: clientSelect,
  });

  if (!client) {
    throw new AppError("Cliente não encontrado", 404);
  }

  return client;
};

// 4) ============= Create new client =============
export const createClient = async (data: CreateClientInput) => {
  // verifies if email already exists
  if (data.email) {
    const existingEmail = await prisma.client.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existingEmail) {
      throw new AppError("Já existe um cliente cadastrado com este e-mail", 409);
    }
  }

  return prisma.client.create({
    data: {
      ...data,
      active: true, 
    },
    select: clientSelect,
  });
};

// 5) ============= Update client =============
export const updateClient = async (id: string, data: UpdateClientInput) => {
  // Garante que o cliente existe antes de atualizar
  const currentClient = await prisma.client.findUnique({
    where: { id },
    select: { id: true, email: true },
  });

  if (!currentClient) {
    throw new AppError("Cliente não encontrado", 404);
  }

  // If the email changed, check if it already exists
  if (data.email && data.email !== currentClient.email) {
    const existingEmail = await prisma.client.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existingEmail) {
      throw new AppError("Este e-mail já está em uso por outro cliente", 409);
    }
  }

  return prisma.client.update({
    where: { id },
    data,
    select: clientSelect,
  });
};

// 6) ============= Active client -> "active = true" =============
export const activateClient = async (id: string) => {
  const clientExists = await prisma.client.findUnique({ where: { id }, select: { id: true } });
  
  if (!clientExists) {
    throw new AppError("Cliente não encontrado", 404);
  }

  return prisma.client.update({
    where: { id },
    data: { active: true },
    select: { id: true, active: true },
  });
};

// 7) ============= Inactive client -> soft delete =============
export const deactivateClient = async (id: string) => {
  const clientExists = await prisma.client.findUnique({ where: { id }, select: { id: true } });
  
  if (!clientExists) {
    throw new AppError("Cliente não encontrado", 404);
  }

  return prisma.client.update({
    where: { id },
    data: { active: false },
    select: { id: true, active: true },
  });
};