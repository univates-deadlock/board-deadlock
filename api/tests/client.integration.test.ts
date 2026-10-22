import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { createUser } from "../src/services/user.service.js";
import type { CreateClientInput } from "../src/schemas/client.schema.js";

const clientData: CreateClientInput = {
  type: "INDIVIDUAL", name: "Fictitious client", whatsapp: "5551999999999", location: "Fictitious location",
};
const callers = ["ADMIN", "PLANNING", "TECHNICIAN"] as const;
type Caller = typeof callers[number] | "INACTIVE";
const cookies: Record<Caller, string> = { ADMIN: "", PLANNING: "", TECHNICIAN: "", INACTIVE: "" };
let adminId: string;
let planningId: string;

const api = (caller: Caller = "ADMIN") => request.agent(app).set("Cookie", cookies[caller]);
const createClient = async (data: Partial<CreateClientInput> = {}) => {
  const response = await api().post("/api/clients").send({ ...clientData, ...data }).expect(201);
  return response.body.id as string;
};
const snapshot = (id: string) => prisma.client.findUniqueOrThrow({ where: { id } });

beforeAll(async () => {
  for (const caller of callers) {
    const email = `${caller.toLowerCase()}@clients.example`;
    const user = await createUser({
      name: `Fictitious ${caller}`, email,
      role: caller,
      password: "Fictitious-password-123",
    });
    if (caller === "ADMIN") adminId = user.id;
    if (caller === "PLANNING") planningId = user.id;
    const response = await request(app).post("/api/auth/sign-in/email")
      .set("Origin", "http://localhost:3000")
      .send({ email, password: "Fictitious-password-123" }).expect(200);
    const setCookie = response.headers["set-cookie"] as unknown as string[];
    cookies[caller] = setCookie.map(value => value.split(";")[0]).join("; ");
  }
  cookies.INACTIVE = cookies.PLANNING;
});

afterEach(async () => {
  // Both integration suites use only the database created by global setup.
  await prisma.quote.deleteMany();
  await prisma.client.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("client HTTP contract", () => {
  it.each(["ADMIN", "PLANNING"] as const)("allows %s to complete the client lifecycle", async caller => {
    const created = await api(caller).post("/api/clients").send(clientData).expect(201);
    const id = created.body.id as string;
    expect(created.body).toMatchObject({ ...clientData, active: true });
    expect((await snapshot(id)).name).toBe("Fictitious client");

    const list = await api(caller).get("/api/clients").expect(200);
    expect(list.body).toEqual([expect.objectContaining({ id })]);
    const detail = await api(caller).get(`/api/clients/${id}`).expect(200);
    expect(detail.body).toMatchObject({ id, ...clientData });

    const updated = await api(caller).patch(`/api/clients/${id}`).send({ name: "Updated client" }).expect(200);
    expect(updated.body.name).toBe("Updated client");
    expect((await snapshot(id)).name).toBe("Updated client");
    await api(caller).patch(`/api/clients/${id}/deactivate`).expect(200, { id, active: false });
    expect((await snapshot(id)).active).toBe(false);
    await api(caller).patch(`/api/clients/${id}/activate`).expect(200, { id, active: true });
    expect((await snapshot(id)).active).toBe(true);
    await api(caller).delete(`/api/clients/${id}`).expect(200, { id, active: false });
    expect((await snapshot(id)).active).toBe(false);
  });

  it("stores company contact information and normalizes surrounding spaces and email case", async () => {
    const response = await api().post("/api/clients").send({
      type: "COMPANY", name: "  Fictitious Company  ", document: "  12345678000190  ",
      notes: "  Example notes  ", contactName: "  Fictitious Contact  ", phone: "  555133333333  ",
      whatsapp: "  5551999999999  ", location: "  Fictitious location  ", email: "  COMPANY@EXAMPLE.COM  ",
    }).expect(201);
    const normalized = {
      type: "COMPANY", name: "Fictitious Company", document: "12345678000190", notes: "Example notes",
      contactName: "Fictitious Contact", phone: "555133333333", whatsapp: "5551999999999",
      location: "Fictitious location", email: "company@example.com", active: true,
    };
    expect(response.body).toMatchObject(normalized);
    expect(await snapshot(response.body.id)).toMatchObject(normalized);
  });

  it("returns an empty list before clients are registered", async () => {
    const response = await api().get("/api/clients").expect(200);
    expect(response.body).toEqual([]);
  });

  it("lists active and inactive clients in descending creation order", async () => {
    const older = await createClient({ name: "Older" });
    const newer = await createClient({ name: "Newer" });
    await prisma.client.update({ where: { id: older }, data: { createdAt: new Date("2026-01-01T00:00:00Z") } });
    await prisma.client.update({ where: { id: newer }, data: { createdAt: new Date("2026-01-02T00:00:00Z"), active: false } });
    const response = await api().get("/api/clients").expect(200);
    expect(response.body).toEqual([
      expect.objectContaining({ id: newer, active: false }),
      expect.objectContaining({ id: older, active: true }),
    ]);
  });

  it("preserves omitted fields on partial updates", async () => {
    const id = await createClient({ email: "original@example.com", document: "12345678901" });
    const before = await snapshot(id);
    const response = await api().patch(`/api/clients/${id}`).send({ name: "  Updated  " }).expect(200);
    expect(response.body).toMatchObject({ name: "Updated", email: "original@example.com", document: "12345678901" });
    const stored = await snapshot(id);
    expect(stored).toEqual({ ...before, name: "Updated", updatedAt: stored.updatedAt });
  });

  it("allows optional fields to be cleared explicitly", async () => {
    const id = await createClient({
      email: "clear@example.com", document: "12345678901", notes: "Notes", contactName: "Contact", phone: "555133333333",
    });
    const cleared = { email: null, document: null, notes: null, contactName: null, phone: null };
    const response = await api().patch(`/api/clients/${id}`).send(cleared).expect(200);
    expect(response.body).toMatchObject(cleared);
    expect(await snapshot(id)).toMatchObject(cleared);
  });

  it("allows multiple clients without email and converts blank emails to null", async () => {
    const first = await createClient({ email: "  " });
    const second = await createClient({ email: null });
    expect((await snapshot(first)).email).toBeNull();
    expect((await snapshot(second)).email).toBeNull();
    const existing = await createClient({ email: "remove@example.com" });
    await api().patch(`/api/clients/${existing}`).send({ email: " " }).expect(200);
    expect((await snapshot(existing)).email).toBeNull();
  });

  it("keeps deactivated clients and their quote history available", async () => {
    const id = await createClient();
    const quote = await prisma.quote.create({
      data: { clientId: id, createdBy: adminId, subtotal: 0, discount: 0, total: 0 },
    });
    await api().delete(`/api/clients/${id}`).expect(200);
    expect((await snapshot(id)).active).toBe(false);
    expect(await prisma.quote.findUnique({ where: { id: quote.id } })).toMatchObject({ clientId: id });
    const detail = await api().get(`/api/clients/${id}`).expect(200);
    expect(detail.body.active).toBe(false);
    await api().patch(`/api/clients/${id}/activate`).expect(200);
    expect((await snapshot(id)).active).toBe(true);
  });
});

describe("client permissions and validation", () => {
  it.each(["anonymous", "TECHNICIAN", "INACTIVE"] as const)("denies all client routes to %s without mutations", async caller => {
    const id = await createClient();
    const before = await snapshot(id);
    const agent = () => caller === "anonymous" ? request(app) : api(caller);
    const expected = caller === "anonymous" ? 401 : 403;
    if (caller === "INACTIVE") {
      // Keep the session to verify that each request rechecks account activity.
      await prisma.user.update({ where: { id: planningId }, data: { isActive: false } });
    }
    try {
      await agent().get("/api/clients").expect(expected);
      await agent().get(`/api/clients/${id}`).expect(expected);
      await agent().post("/api/clients").send(clientData).expect(expected);
      await agent().patch(`/api/clients/${id}`).send({ name: "Forbidden" }).expect(expected);
      await agent().patch(`/api/clients/${id}/activate`).expect(expected);
      await agent().patch(`/api/clients/${id}/deactivate`).expect(expected);
      await agent().delete(`/api/clients/${id}`).expect(expected);
      expect(await prisma.client.count()).toBe(1);
      expect(await snapshot(id)).toEqual(before);
    } finally {
      if (caller === "INACTIVE") {
        await prisma.user.update({ where: { id: planningId }, data: { isActive: true } });
      }
    }
  });

  it.each([
    { field: "type", value: "INVALID" }, { field: "type", value: null },
    { field: "name", value: "  " }, { field: "name", value: "x".repeat(201) },
    { field: "whatsapp", value: "1234567" }, { field: "whatsapp", value: "1".repeat(21) },
    { field: "whatsapp", value: null }, { field: "location", value: " " },
    { field: "location", value: "x".repeat(101) }, { field: "email", value: "not-an-email" },
    { field: "email", value: `${"x".repeat(90)}@example.com` },
    { field: "document", value: "1".repeat(21) }, { field: "phone", value: "1".repeat(21) },
    { field: "contactName", value: "x".repeat(201) },
  ])("rejects invalid $field on create and update without persisting changes", async ({ field, value }) => {
    const response = await api().post("/api/clients").send({ ...clientData, [field]: value }).expect(400);
    expect(response.body.fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: field, message: expect.any(String) }),
    ]));
    expect(await prisma.client.count()).toBe(0);
    const id = await createClient();
    const before = await snapshot(id);
    await api().patch(`/api/clients/${id}`).send({ [field]: value }).expect(400);
    expect(await snapshot(id)).toEqual(before);
  });

  it.each(["type", "name", "whatsapp", "location"])("requires %s on creation", async field => {
    const response = await api().post("/api/clients").send({ ...clientData, [field]: undefined }).expect(400);
    expect(response.body.fields).toEqual(expect.arrayContaining([expect.objectContaining({ path: field })]));
    expect(await prisma.client.count()).toBe(0);
  });

  it("rejects unknown fields and empty patches", async () => {
    await api().post("/api/clients").send({ ...clientData, active: false }).expect(400);
    const id = await createClient();
    const before = await snapshot(id);
    await api().patch(`/api/clients/${id}`).send({}).expect(400);
    await api().patch(`/api/clients/${id}`).send({ active: false }).expect(400);
    expect(await snapshot(id)).toEqual(before);
  });

  it.each(["invalid-id", "00000000-0000-4000-8000-000000000001"])("validates or reports missing client %s on every ID route", async id => {
    const expected = id === "invalid-id" ? 400 : 404;
    await api().get(`/api/clients/${id}`).expect(expected);
    await api().patch(`/api/clients/${id}`).send({ name: "Missing" }).expect(expected);
    await api().patch(`/api/clients/${id}/activate`).expect(expected);
    await api().patch(`/api/clients/${id}/deactivate`).expect(expected);
    await api().delete(`/api/clients/${id}`).expect(expected);
    expect(await prisma.client.count()).toBe(0);
  });
});

describe("client email uniqueness", () => {
  it("rejects duplicate emails regardless of case without creating another client", async () => {
    const id = await createClient({ email: "duplicate@example.com" });
    const before = await snapshot(id);
    await api().post("/api/clients").send({ ...clientData, email: " DUPLICATE@EXAMPLE.COM " }).expect(409);
    expect(await prisma.client.count()).toBe(1);
    expect(await snapshot(id)).toEqual(before);
  });

  it("rejects duplicate emails on update and rolls back all supplied fields", async () => {
    await createClient({ email: "taken@example.com" });
    const target = await createClient({ email: "original@example.com" });
    const before = await snapshot(target);
    await api().patch(`/api/clients/${target}`).send({ name: "Must not persist", email: "TAKEN@EXAMPLE.COM" }).expect(409);
    expect(await snapshot(target)).toEqual(before);
  });

  it("accepts retaining the same normalized email on update", async () => {
    const id = await createClient({ email: "same@example.com" });
    await api().patch(`/api/clients/${id}`).send({ name: "Updated", email: " SAME@EXAMPLE.COM " }).expect(200);
    expect(await snapshot(id)).toMatchObject({ name: "Updated", email: "same@example.com" });
  });

  it("reserves an inactive client's email", async () => {
    const id = await createClient({ email: "inactive@example.com" });
    await api().delete(`/api/clients/${id}`).expect(200);
    await api().post("/api/clients").send({ ...clientData, email: "inactive@example.com" }).expect(409);
    expect(await prisma.client.count()).toBe(1);
  });

  it("allows only one concurrent creation with the same email", async () => {
    const responses = await Promise.all([
      api().post("/api/clients").send({ ...clientData, email: "race@example.com" }),
      api().post("/api/clients").send({ ...clientData, email: "RACE@EXAMPLE.COM" }),
    ]);
    expect(responses.map(response => response.status).sort()).toEqual([201, 409]);
    expect(await prisma.client.count({ where: { email: "race@example.com" } })).toBe(1);
  });

  it("allows only one concurrent update to claim the same email", async () => {
    const first = await createClient();
    const second = await createClient();
    const responses = await Promise.all([first, second].map(id =>
      api().patch(`/api/clients/${id}`).send({ email: "claimed@example.com" })));
    expect(responses.map(response => response.status).sort()).toEqual([200, 409]);
    expect(await prisma.client.count({ where: { email: "claimed@example.com" } })).toBe(1);
    expect(await prisma.client.count({ where: { email: null } })).toBe(1);
  });
});
