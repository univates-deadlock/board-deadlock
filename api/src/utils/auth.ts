import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../lib/prisma.js";
import { APIError } from "better-auth/api";
import { env } from "../config/env.js";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.FE_BASE_URL],
  // All profile changes go through the validated, ADMIN-only CRUD.
  disabledPaths: ["/update-user", "/delete-user", "/change-email"],
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  user: {
    additionalFields: {
      role: { type: ["ADMIN", "PLANNING", "TECHNICIAN"], defaultValue: "TECHNICIAN", input: false },
      isActive: { type: "boolean", defaultValue: true, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: false },
  },
  rateLimit: { enabled: true, window: 60, max: 30, storage: "memory" },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { isActive: true },
          });
          if (!user?.isActive) {
            throw new APIError("FORBIDDEN", { message: "Usuário inativo" });
          }
        },
        after: async (session) => {
          // Login may have read isActive before a concurrent deactivation.
          // Lock the same user row modified by deactivation, then recheck.
          const valid = await prisma.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT "id" FROM "user" WHERE "id" = ${session.userId} FOR UPDATE`;
            const user = await tx.user.findUnique({
              where: { id: session.userId }, select: { isActive: true },
            });
            if (!user?.isActive) {
              await tx.session.deleteMany({ where: { id: session.id } });
              return false;
            }
            return Boolean(await tx.session.findUnique({
              where: { id: session.id }, select: { id: true },
            }));
          });
          if (!valid) throw new APIError("FORBIDDEN", { message: "Sessão invalidada; faça login novamente" });
        },
      },
    },
  },
  logger: { disabled: true },
});

export default auth;
