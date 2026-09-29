import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

const activeSessionSchema = z.object({
  session: z.object({ id: z.string().min(1) }),
  user: z.object({
    id: z.string().min(1),
    isActive: z.literal(true),
  }),
});

/** Verify the incoming cookie with the API before rendering a protected page. */
export async function requireActiveSession(): Promise<void> {
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
}
