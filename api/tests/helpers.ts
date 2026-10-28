import request from "supertest";
import app from "../src/app.js";
import { createUser } from "../src/services/user.service.js";
import type { CreateUserInput } from "../src/schemas/user.schema.js";

export type Role = CreateUserInput["role"];

export type AuthContext = {
  id: string;
  email: string;
  role: Role;
  cookie: string;
};

/**
 * Creates a test user in the database and signs in via HTTP to obtain a session cookie.
 */
export async function createAuthenticatedUser(role: Role): Promise<AuthContext> {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 7);
  const email = `${role.toLowerCase()}-${timestamp}-${randomSuffix}@test.local`;
  const password = "Fictitious-password-123";

  const user = await createUser({
    name: `Test ${role}`,
    email,
    role,
    password,
  });

  const response = await request(app)
    .post("/api/auth/sign-in/email")
    .set("Origin", "http://localhost:3000")
    .send({ email, password })
    .expect(200);

  const setCookie = response.headers["set-cookie"] as unknown as string[];
  const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");

  return {
    id: user.id,
    email: user.email,
    role,
    cookie,
  };
}

/**
 * Returns a supertest agent with the provided session cookie attached.
 */
export function agentWithCookie(cookie: string) {
  return request.agent(app).set("Cookie", cookie);
}
