import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { agentWithCookie, createAuthenticatedUser, type AuthContext } from "./helpers.js";
import type { CreateQuoteItemInput } from "../src/schemas/quote.schema.js";

describe("Quote integration tests", () => {
  let admin: AuthContext;
  let planning: AuthContext;
  let technician: AuthContext;
  let clientId: string;

  const sampleItem: CreateQuoteItemInput = {
    type: "SERVICE",
    description: "Instalação de equipamento",
    quantity: 2,
    unitPrice: 150,
    discount: 0,
  };

  beforeAll(async () => {
    admin = await createAuthenticatedUser("ADMIN");
    planning = await createAuthenticatedUser("PLANNING");
    technician = await createAuthenticatedUser("TECHNICIAN");
  });

  beforeEach(async () => {
    const client = await prisma.client.create({
      data: {
        type: "INDIVIDUAL",
        name: "Cliente Orçamento",
        whatsapp: "5551999999999",
        location: "Porto Alegre",
      },
    });
    clientId = client.id;
  });

  afterEach(async () => {
    await prisma.quote.deleteMany();
    await prisma.client.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("CRUD workflow (Teste 3)", () => {
    it("completes full lifecycle: create, read, update, and delete draft quote", async () => {
      // 1. Criar um registro
      const createResponse = await agentWithCookie(admin.cookie)
        .post("/api/quotes")
        .send({
          clientId,
          notes: "Orçamento inicial",
          discount: 20,
          items: [sampleItem],
        })
        .expect(201);

      const quoteId = createResponse.body.id as string;
      expect(quoteId).toBeDefined();
      expect(createResponse.body.status).toBe("DRAFT");
      expect(createResponse.body.subtotal).toBe("300");
      expect(createResponse.body.discount).toBe("20");
      expect(createResponse.body.total).toBe("280");

      // 2. Consultar o registro persistido
      const getResponse = await agentWithCookie(admin.cookie)
        .get(`/api/quotes/${quoteId}`)
        .expect(200);

      expect(getResponse.body.id).toBe(quoteId);
      expect(getResponse.body.clientId).toBe(clientId);
      expect(getResponse.body.items).toHaveLength(1);
      expect(getResponse.body.items[0].description).toBe("Instalação de equipamento");

      // 3. Atualizar informações permitidas
      const updateResponse = await agentWithCookie(admin.cookie)
        .patch(`/api/quotes/${quoteId}`)
        .send({
          notes: "Orçamento revisado",
          discount: 50,
        })
        .expect(200);

      expect(updateResponse.body.notes).toBe("Orçamento revisado");
      expect(updateResponse.body.discount).toBe("50");
      expect(updateResponse.body.total).toBe("250");

      // 4. Verificar a persistência da atualização
      const verifyResponse = await agentWithCookie(admin.cookie)
        .get(`/api/quotes/${quoteId}`)
        .expect(200);

      expect(verifyResponse.body.notes).toBe("Orçamento revisado");
      expect(verifyResponse.body.discount).toBe("50");
      expect(verifyResponse.body.total).toBe("250");

      // 5. Excluir o registro conforme as regras de negócio
      await agentWithCookie(admin.cookie)
        .delete(`/api/quotes/${quoteId}`)
        .expect(204);

      // 6. Confirmar o resultado da exclusão
      await agentWithCookie(admin.cookie)
        .get(`/api/quotes/${quoteId}`)
        .expect(404);

      const quoteInDb = await prisma.quote.findUnique({ where: { id: quoteId } });
      expect(quoteInDb).toBeNull();
    });
  });

  describe("Permissions (Teste 1)", () => {
    it("allows PLANNING to create and manage quotes", async () => {
      // Act
      const response = await agentWithCookie(planning.cookie)
        .post("/api/quotes")
        .send({
          clientId,
          items: [sampleItem],
        })
        .expect(201);

      // Assert
      expect(response.body.createdBy).toBe(planning.id);
    });

    it("denies quote creation to TECHNICIAN with 403 Forbidden", async () => {
      // Act
      await agentWithCookie(technician.cookie)
        .post("/api/quotes")
        .send({
          clientId,
          items: [sampleItem],
        })
        .expect(403);

      // Assert
      expect(await prisma.quote.count()).toBe(0);
    });

    it("denies unauthenticated requests with 401 Unauthorized", async () => {
      // Act & Assert
      await request(app)
        .get("/api/quotes")
        .expect(401);
    });
  });

  describe("Business rules", () => {
    it("prevents deletion of non-draft quotes with 409 Conflict", async () => {
      // Arrange
      const quote = await prisma.quote.create({
        data: {
          clientId,
          createdBy: admin.id,
          status: "SENT",
          subtotal: 100,
          discount: 0,
          total: 100,
        },
      });

      // Act & Assert
      await agentWithCookie(admin.cookie)
        .delete(`/api/quotes/${quote.id}`)
        .expect(409);

      const persisted = await prisma.quote.findUnique({ where: { id: quote.id } });
      expect(persisted).not.toBeNull();
    });

    it("recalculates totals when an item is added to an open quote", async () => {
      // Arrange
      const createResponse = await agentWithCookie(admin.cookie)
        .post("/api/quotes")
        .send({
          clientId,
          items: [sampleItem],
        })
        .expect(201);

      const quoteId = createResponse.body.id;

      // Act: add a second item (1 * 100 = 100)
      const addItemResponse = await agentWithCookie(admin.cookie)
        .post(`/api/quotes/${quoteId}/items`)
        .send({
          type: "PRODUCT",
          description: "Peça de reposição",
          quantity: 1,
          unitPrice: 100,
        })
        .expect(201);

      // Assert: previous total 300 + new item 100 = 400
      expect(addItemResponse.body.subtotal).toBe("400");
      expect(addItemResponse.body.total).toBe("400");
      expect(addItemResponse.body.items).toHaveLength(2);
    });

    it("returns 404 when referencing a nonexistent client", async () => {
      // Act & Assert
      await agentWithCookie(admin.cookie)
        .post("/api/quotes")
        .send({
          clientId: randomUUID(),
          items: [sampleItem],
        })
        .expect(404);
    });
  });
});
