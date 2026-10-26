import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { agentWithCookie, createAuthenticatedUser, type AuthContext } from "./helpers.js";
import type { CreateClientInput } from "../src/schemas/client.schema.js";

describe("Client integration tests", () => {
  let admin: AuthContext;
  let planning: AuthContext;
  let technician: AuthContext;

  const validClient: CreateClientInput = {
    type: "INDIVIDUAL",
    name: "João da Silva",
    whatsapp: "5551999999999",
    location: "Porto Alegre",
    email: "joao.silva@example.com",
  };

  beforeAll(async () => {
    admin = await createAuthenticatedUser("ADMIN");
    planning = await createAuthenticatedUser("PLANNING");
    technician = await createAuthenticatedUser("TECHNICIAN");
  });

  afterEach(async () => {
    await prisma.quote.deleteMany();
    await prisma.client.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("CRUD & Lifecycle", () => {
    it("creates, reads, updates, and logically deletes a client", async () => {
      // 1. Create client
      const createResponse = await agentWithCookie(admin.cookie)
        .post("/api/clients")
        .send(validClient)
        .expect(201);

      const clientId = createResponse.body.id as string;
      expect(clientId).toBeDefined();
      expect(createResponse.body.name).toBe("João da Silva");
      expect(createResponse.body.active).toBe(true);

      // 2. Read client detail
      const getResponse = await agentWithCookie(admin.cookie)
        .get(`/api/clients/${clientId}`)
        .expect(200);

      expect(getResponse.body.id).toBe(clientId);
      expect(getResponse.body.email).toBe("joao.silva@example.com");

      // 3. Update client
      const updateResponse = await agentWithCookie(admin.cookie)
        .patch(`/api/clients/${clientId}`)
        .send({ name: "João Atualizado" })
        .expect(200);

      expect(updateResponse.body.name).toBe("João Atualizado");

      // 4. Logically delete client (deactivation)
      const deleteResponse = await agentWithCookie(admin.cookie)
        .delete(`/api/clients/${clientId}`)
        .expect(200);

      expect(deleteResponse.body.active).toBe(false);

      // Verify in DB that it was marked inactive, not physically removed
      const persisted = await prisma.client.findUnique({ where: { id: clientId } });
      expect(persisted?.active).toBe(false);
    });
  });

  describe("Permissions", () => {
    it("allows PLANNING to register a client", async () => {
      // Act
      const response = await agentWithCookie(planning.cookie)
        .post("/api/clients")
        .send({
          ...validClient,
          name: "Cliente Planejamento",
          email: "planejamento@example.com",
        })
        .expect(201);

      // Assert
      expect(response.body.name).toBe("Cliente Planejamento");
    });

    it("denies client access to TECHNICIAN with 403 Forbidden", async () => {
      // Act & Assert
      await agentWithCookie(technician.cookie)
        .get("/api/clients")
        .expect(403);

      await agentWithCookie(technician.cookie)
        .post("/api/clients")
        .send(validClient)
        .expect(403);
    });

    it("denies unauthenticated requests with 401 Unauthorized", async () => {
      // Act & Assert
      await request(app)
        .get("/api/clients")
        .expect(401);
    });
  });

  describe("Business rules and validation", () => {
    it("rejects duplicate email with 409 Conflict", async () => {
      // Arrange
      await agentWithCookie(admin.cookie)
        .post("/api/clients")
        .send(validClient)
        .expect(201);

      // Act: attempt to register duplicate email
      const response = await agentWithCookie(admin.cookie)
        .post("/api/clients")
        .send({
          ...validClient,
          name: "Outro Cliente",
        })
        .expect(409);

      // Assert
      expect(response.body.error).toBeDefined();
      expect(await prisma.client.count()).toBe(1);
    });

    it("rejects client with missing required fields with 400 Bad Request", async () => {
      // Act
      const response = await agentWithCookie(admin.cookie)
        .post("/api/clients")
        .send({
          type: "INDIVIDUAL",
          name: "Cliente Sem Telefone e Local",
        })
        .expect(400);

      // Assert
      expect(response.body.fields).toBeDefined();
      expect(await prisma.client.count()).toBe(0);
    });
  });
});
