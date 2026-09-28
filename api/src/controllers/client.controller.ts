import type { Request, Response } from "express";
import {
  clientIdSchema,
  createClientSchema,
  updateClientSchema,
} from "../schemas/client.schema.js";
import * as clientService from "../services/client.service.js";

// 1) list All
export const getAllClients = async (req: Request, res: Response) => {
  const clients = await clientService.getAllClients();
  return res.json(clients);
};

// 2) search by id
export const getClientById = async (req: Request, res: Response) => {
  const id = clientIdSchema.parse(req.params.id);
  const client = await clientService.getClientById(id);
  return res.json(client);
};

// 3) create new
export const createClient = async (req: Request, res: Response) => {
  const validatedData = createClientSchema.parse(req.body);
  const client = await clientService.createClient(validatedData);
  return res.status(201).json(client);
};

// 4) update
export const updateClient = async (req: Request, res: Response) => {
  const id = clientIdSchema.parse(req.params.id);
  const validatedData = updateClientSchema.parse(req.body);
  const client = await clientService.updateClient(id, validatedData);
  return res.json(client);
};

// 5) activate
export const activateClient = async (req: Request, res: Response) => {
  const id = clientIdSchema.parse(req.params.id);
  const client = await clientService.activateClient(id);
  return res.json(client);
};

// 6) soft delete
export const deactivateClient = async (req: Request, res: Response) => {
  const id = clientIdSchema.parse(req.params.id);
  const client = await clientService.deactivateClient(id);
  return res.json(client);
};