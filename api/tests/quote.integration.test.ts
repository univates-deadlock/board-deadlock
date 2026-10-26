import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { createUser } from "../src/services/user.service.js";
import type { CreateQuoteItemInput } from "../src/schemas/quote.schema.js";

const item: CreateQuoteItemInput = {
  type: "SERVICE", description: "Fictitious installation", quantity: 1, unitPrice: 10,
};
const roles = ["ADMIN", "PLANNING", "TECHNICIAN"] as const;
type Role = typeof roles[number];
const cookies: Record<Role, string> = { ADMIN: "", PLANNING: "", TECHNICIAN: "" };
let adminId: string;
let clientId: string;

type CreatedQuote = { id: string; items: { id: string }[] };

const api = (role: Role = "ADMIN") => request.agent(app).set("Cookie", cookies[role]);

const createQuote = async (items: CreateQuoteItemInput[] = [], discount = 0): Promise<CreatedQuote> => {
  const response = await api().post("/api/quotes").send({ clientId, items, discount }).expect(201);
  return response.body;
};

const snapshot = (id: string) => prisma.quote.findUniqueOrThrow({
  where: { id }, include: { items: { orderBy: { id: "asc" } } },
});

beforeAll(async () => {
  for (const role of roles) {
    const email = `${role.toLowerCase()}@quotes.example`;
    const user = await createUser({ name: `Fictitious ${role}`, email, role, password: "Fictitious-password-123" });
    if (role === "ADMIN") adminId = user.id;
    const response = await request(app).post("/api/auth/sign-in/email")
      .set("Origin", "http://localhost:3000")
      .send({ email, password: "Fictitious-password-123" }).expect(200);
    const setCookie = response.headers["set-cookie"] as unknown as string[];
    cookies[role] = setCookie.map(value => value.split(";")[0]).join("; ");
  }
});

beforeEach(async () => {
  const client = await prisma.client.create({
    data: { type: "INDIVIDUAL", name: "Fictitious client", whatsapp: "5551999999999", location: "Fictitious location" },
  });
  clientId = client.id;
});

afterEach(async () => {
  // The setup provides only a newly created disposable database.
  await prisma.quote.deleteMany();
  await prisma.client.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("quote HTTP contract", () => {
  it("creates a draft with server-derived totals and authenticated authorship", async () => {
    const response = await api().post("/api/quotes").send({
      clientId, discount: 50,
      items: [{ ...item, quantity: 4, unitPrice: 250.5, discount: 20 }, { ...item, unitPrice: 400 }],
    }).expect(201);
    expect(response.body).toMatchObject({
      clientId, createdBy: adminId, status: "DRAFT", subtotal: "1382", discount: "50", total: "1332",
      client: { id: clientId, name: "Fictitious client" },
    });
    expect(response.body.items).toHaveLength(2);
    const stored = await snapshot(response.body.id);
    expect(stored.items).toHaveLength(2);
    expect(stored.total.toString()).toBe("1332");
  });

  it("creates an empty draft with zero totals", async () => {
    const quote = await createQuote();
    const response = await api().get(`/api/quotes/${quote.id}`).expect(200);
    expect(response.body).toMatchObject({ status: "DRAFT", subtotal: "0", discount: "0", total: "0", items: [] });
  });

  it("filters lists by client and status and returns item counts", async () => {
    const draft = await createQuote([item]);
    const sent = await createQuote();
    await prisma.quote.update({ where: { id: sent.id }, data: { status: "SENT" } });
    const response = await api().get("/api/quotes").query({ clientId, status: "DRAFT" }).expect(200);
    expect(response.body).toEqual([expect.objectContaining({ id: draft.id, _count: { items: 1 } })]);
    const otherClient = await api().get("/api/quotes").query({ clientId: randomUUID() }).expect(200);
    expect(otherClient.body).toEqual([]);
  });

  it.each(["ADMIN", "PLANNING"] as const)("allows %s to create quotes", async role => {
    await api(role).post("/api/quotes").send({ clientId, items: [item] }).expect(201);
    expect(await prisma.quote.count()).toBe(1);
  });

  it.each(["anonymous", "TECHNICIAN"] as const)("denies every quote route to %s without mutations", async role => {
    const quote = await createQuote([item]);
    const before = await snapshot(quote.id);
    const caller = () => role === "anonymous" ? request(app) : api(role);
    const expected = role === "anonymous" ? 401 : 403;
    await caller().get("/api/quotes").expect(expected);
    await caller().get(`/api/quotes/${quote.id}`).expect(expected);
    await caller().post("/api/quotes").send({ clientId }).expect(expected);
    await caller().patch(`/api/quotes/${quote.id}`).send({ notes: "Forbidden" }).expect(expected);
    await caller().delete(`/api/quotes/${quote.id}`).expect(expected);
    await caller().post(`/api/quotes/${quote.id}/items`).send(item).expect(expected);
    await caller().patch(`/api/quotes/${quote.id}/items/${quote.items[0].id}`).send({ quantity: 2 }).expect(expected);
    await caller().delete(`/api/quotes/${quote.id}/items/${quote.items[0].id}`).expect(expected);
    expect(await prisma.quote.count()).toBe(1);
    expect(await snapshot(quote.id)).toEqual(before);
  });

  it.each([
    { quantity: 0 }, { quantity: -1 }, { quantity: 1.234 }, { unitPrice: -1 },
    { unitPrice: 1.234 }, { description: " " }, { type: "INVALID" }, { discount: -1 },
  ])("rejects invalid item input %j with field errors", async invalid => {
    const response = await api().post("/api/quotes").send({ clientId, items: [{ ...item, ...invalid }] }).expect(400);
    expect(response.body.fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: expect.stringMatching(/^items\.0\./), message: expect.any(String) }),
    ]));
    expect(await prisma.quote.count()).toBe(0);
  });

  it("rejects client-provided totals, status, and authorship", async () => {
    await api().post("/api/quotes").send({ clientId, total: 1, status: "APPROVED", createdBy: randomUUID() }).expect(400);
    expect(await prisma.quote.count()).toBe(0);
  });

  it("rejects invalid IDs, filters, and empty patches", async () => {
    const quote = await createQuote([item]);
    await api().get("/api/quotes/invalid-id").expect(400);
    await api().get("/api/quotes").query({ status: "INVALID" }).expect(400);
    await api().get("/api/quotes").query({ clientId: "invalid-id" }).expect(400);
    await api().patch(`/api/quotes/${quote.id}`).send({}).expect(400);
    await api().patch(`/api/quotes/${quote.id}/items/${quote.items[0].id}`).send({}).expect(400);
  });

  it("rejects missing or inactive clients", async () => {
    await api().post("/api/quotes").send({ clientId: randomUUID() }).expect(404);
    await prisma.client.update({ where: { id: clientId }, data: { active: false } });
    await api().post("/api/quotes").send({ clientId }).expect(409);
    expect(await prisma.quote.count()).toBe(0);
  });

  it("returns 404 for missing quotes and items belonging to another quote", async () => {
    const missing = randomUUID();
    await api().get(`/api/quotes/${missing}`).expect(404);
    await api().patch(`/api/quotes/${missing}`).send({ notes: "Missing" }).expect(404);
    await api().post(`/api/quotes/${missing}/items`).send(item).expect(404);
    await api().delete(`/api/quotes/${missing}`).expect(404);
    const first = await createQuote([item]);
    const second = await createQuote([item]);
    const before = await snapshot(second.id);
    await api().patch(`/api/quotes/${first.id}/items/${second.items[0].id}`).send({ quantity: 2 }).expect(404);
    await api().delete(`/api/quotes/${first.id}/items/${second.items[0].id}`).expect(404);
    expect(await snapshot(second.id)).toEqual(before);
  });

  it("recalculates after adding, editing, discounting, and deleting items", async () => {
    const quote = await createQuote([item]);
    await api().post(`/api/quotes/${quote.id}/items`).send({ ...item, quantity: 2, unitPrice: 20 }).expect(201);
    const edited = await api().patch(`/api/quotes/${quote.id}/items/${quote.items[0].id}`).send({ quantity: 3 }).expect(200);
    expect(edited.body).toMatchObject({ subtotal: "70", total: "70" });
    const discounted = await api().patch(`/api/quotes/${quote.id}`).send({ discount: 5, notes: "Updated" }).expect(200);
    expect(discounted.body).toMatchObject({ subtotal: "70", discount: "5", total: "65", notes: "Updated" });
    const deleted = await api().delete(`/api/quotes/${quote.id}/items/${quote.items[0].id}`).expect(200);
    expect(deleted.body).toMatchObject({ subtotal: "40", total: "35" });
    expect((await snapshot(quote.id)).total.toString()).toBe("35");
  });

  it.each(["APPROVED", "REJECTED", "EXPIRED"] as const)("protects all content of a %s quote", async status => {
    const quote = await createQuote([item]);
    await prisma.quote.update({ where: { id: quote.id }, data: { status } });
    const before = await snapshot(quote.id);
    await api().patch(`/api/quotes/${quote.id}`).send({ notes: "Forbidden", discount: 1 }).expect(409);
    await api().post(`/api/quotes/${quote.id}/items`).send(item).expect(409);
    await api().patch(`/api/quotes/${quote.id}/items/${quote.items[0].id}`).send({ quantity: 2 }).expect(409);
    await api().delete(`/api/quotes/${quote.id}/items/${quote.items[0].id}`).expect(409);
    await api().delete(`/api/quotes/${quote.id}`).expect(409);
    expect(await snapshot(quote.id)).toEqual(before);
  });

  it("deletes drafts and their items but refuses sent quotes", async () => {
    const quote = await createQuote([item]);
    await prisma.quote.update({ where: { id: quote.id }, data: { status: "SENT" } });
    await api().delete(`/api/quotes/${quote.id}`).expect(409);
    await prisma.quote.update({ where: { id: quote.id }, data: { status: "DRAFT" } });
    await api().delete(`/api/quotes/${quote.id}`).expect(204);
    expect(await prisma.quote.findUnique({ where: { id: quote.id } })).toBeNull();
    expect(await prisma.quoteItem.count({ where: { quoteId: quote.id } })).toBe(0);
  });
});

describe("quote integrity regressions", () => {
  it.each([
    [{ ...item, quantity: 2, unitPrice: 6_000_000_000 }],
    [{ ...item, unitPrice: 6_000_000_000 }, { ...item, unitPrice: 6_000_000_000 }],
  ])("rejects overflow during creation without persisting a partial quote (%j)", async (...items) => {
    const response = await api().post("/api/quotes").send({ clientId, items }).expect(422);
    expect(response.body.error).toEqual(expect.stringContaining("subtotal"));
    expect(await prisma.quote.count()).toBe(0);
    expect(await prisma.quoteItem.count()).toBe(0);
  });

  it("rolls back additions and edits that overflow an item or the quote", async () => {
    const quote = await createQuote([{ ...item, unitPrice: 6_000_000_000 }]);
    const before = await snapshot(quote.id);
    await api().post(`/api/quotes/${quote.id}/items`).send({ ...item, quantity: 2, unitPrice: 6_000_000_000 }).expect(422);
    await api().post(`/api/quotes/${quote.id}/items`).send({ ...item, unitPrice: 6_000_000_000 }).expect(422);
    await api().patch(`/api/quotes/${quote.id}/items/${quote.items[0].id}`).send({ quantity: 2 }).expect(422);
    expect(await snapshot(quote.id)).toEqual(before);
    const other = await createQuote([{ ...item, unitPrice: 3_000_000_000 }, { ...item, unitPrice: 3_000_000_000 }]);
    const otherBefore = await snapshot(other.id);
    await api().patch(`/api/quotes/${other.id}/items/${other.items[0].id}`).send({ unitPrice: 8_000_000_000 }).expect(422);
    expect(await snapshot(other.id)).toEqual(otherBefore);
  });

  it("rolls back an item deletion that would invalidate the overall discount", async () => {
    const quote = await createQuote([item, item], 15);
    const before = await snapshot(quote.id);
    await api().delete(`/api/quotes/${quote.id}/items/${quote.items[0].id}`).expect(422);
    expect(await snapshot(quote.id)).toEqual(before);
  });

  it("rejects creation with 101 items", async () => {
    await api().post("/api/quotes").send({ clientId, items: Array.from({ length: 101 }, () => item) }).expect(400);
    expect(await prisma.quote.count()).toBe(0);
  });

  it("enforces the item limit when additions race at 99 items", async () => {
    const quote = await createQuote(Array.from({ length: 99 }, () => item));
    const responses = await Promise.all([
      api().post(`/api/quotes/${quote.id}/items`).send(item),
      api().post(`/api/quotes/${quote.id}/items`).send(item),
    ]);
    expect(responses.map(response => response.status).sort()).toEqual([201, 409]);
    const stored = await snapshot(quote.id);
    expect(stored.items).toHaveLength(100);
    expect(stored.subtotal.toString()).toBe("1000");
    expect(stored.total.toString()).toBe("1000");
    await api().post(`/api/quotes/${quote.id}/items`).send(item).expect(409);
    expect(await snapshot(quote.id)).toEqual(stored);
  });

  it("preserves totals when two items are added concurrently", async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const quote = await createQuote();
      const responses = await Promise.all([
        api().post(`/api/quotes/${quote.id}/items`).send(item),
        api().post(`/api/quotes/${quote.id}/items`).send({ ...item, unitPrice: 20 }),
      ]);
      expect(responses.map(response => response.status)).toEqual([201, 201]);
      const stored = await snapshot(quote.id);
      expect(stored.items).toHaveLength(2);
      expect(stored.subtotal.toString()).toBe("30");
      expect(stored.total.toString()).toBe("30");
    }
  });

  it("preserves both partial changes when the same item is edited concurrently", async () => {
    const quote = await createQuote([item]);
    const responses = await Promise.all([
      api().patch(`/api/quotes/${quote.id}/items/${quote.items[0].id}`).send({ quantity: 2 }),
      api().patch(`/api/quotes/${quote.id}/items/${quote.items[0].id}`).send({ unitPrice: 20 }),
    ]);
    expect(responses.map(response => response.status)).toEqual([200, 200]);
    const stored = await snapshot(quote.id);
    expect(stored.items[0].quantity.toString()).toBe("2");
    expect(stored.items[0].unitPrice.toString()).toBe("20");
    expect(stored.total.toString()).toBe("40");
  });

  it("preserves totals across concurrent item deletion, edit, and discount changes", async () => {
    const quote = await createQuote([item, item]);
    const responses = await Promise.all([
      api().delete(`/api/quotes/${quote.id}/items/${quote.items[0].id}`),
      api().patch(`/api/quotes/${quote.id}/items/${quote.items[1].id}`).send({ quantity: 3 }),
      api().patch(`/api/quotes/${quote.id}`).send({ discount: 5 }),
    ]);
    expect(responses.map(response => response.status)).toEqual([200, 200, 200]);
    const stored = await snapshot(quote.id);
    expect(stored.items).toHaveLength(1);
    expect(stored.subtotal.toString()).toBe("30");
    expect(stored.discount.toString()).toBe("5");
    expect(stored.total.toString()).toBe("25");
  });

  it("retains at least one item when deletions race on a sent quote", async () => {
    const quote = await createQuote([item, item]);
    await prisma.quote.update({ where: { id: quote.id }, data: { status: "SENT" } });
    const responses = await Promise.all(quote.items.map(quoteItem =>
      api().delete(`/api/quotes/${quote.id}/items/${quoteItem.id}`)));
    expect(responses.map(response => response.status).sort()).toEqual([200, 409]);
    const stored = await snapshot(quote.id);
    expect(stored.items).toHaveLength(1);
    expect(stored.total.toString()).toBe("10");
  });
});
