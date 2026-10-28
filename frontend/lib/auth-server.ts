import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

export const userRoleSchema = z.enum(["ADMIN", "PLANNING", "TECHNICIAN"]);
export type UserRole = z.infer<typeof userRoleSchema>;

const activeSessionSchema = z.object({
  session: z.object({ id: z.string().min(1) }),
  user: z.object({
    id: z.string().min(1),
    name: z.string(),
    email: z.string(),
    role: userRoleSchema,
    isActive: z.literal(true),
  }),
});

export type ActiveSession = z.infer<typeof activeSessionSchema>;
export type SessionUser = ActiveSession["user"];

/** Verify the incoming cookie with the API once per SSR request. */
export const requireActiveSession = cache(async (): Promise<ActiveSession> => {
  const cookieHeader = (await headers()).get("cookie");

  if (!cookieHeader) redirect("/login");

  const apiBaseUrl =
    process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  let response: Response;
  try {
    response = await fetch(new URL("/api/auth/get-session", apiBaseUrl), {
      headers: { cookie: cookieHeader },
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    throw new Error("Unable to verify the session with the API.");
  }

  if (response.status === 401 || response.status === 403) redirect("/login");
  if (!response.ok) throw new Error("Unable to verify the session with the API.");

  const session = activeSessionSchema.safeParse(await response.json());
  if (!session.success) redirect("/login");

  return session.data;
});

/** Verify session and redirect to "/" when the user's role is not allowed on the page. */
export async function requireRoleSession(
  allowedRoles: readonly UserRole[],
): Promise<ActiveSession> {
  const session = await requireActiveSession();
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/");
  }
  return session;
}
