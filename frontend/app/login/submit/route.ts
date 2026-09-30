import type { NextRequest } from "next/server";

import { loginSchema } from "@/lib/schemas";

/** Native POST fallback while the login page is still hydrating. */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const credentials = loginSchema.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });

  const failure = (status: number) =>
    new Response(null, { status: 303, headers: { location: `/login?error=${status}` } });

  if (!credentials.success) return failure(400);

  const apiBase = process.env.API_INTERNAL_URL ?? "http://localhost:4000";
  let response: Response;
  try {
    response = await fetch(new URL("/api/auth/sign-in/email", apiBase), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: new URL(request.url).origin,
        referer: request.url,
      },
      body: JSON.stringify(credentials.data),
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return failure(503);
  }

  if (!response.ok) {
    return failure([400, 401, 403, 429].includes(response.status) ? response.status : 503);
  }

  const cookies = response.headers.getSetCookie();
  if (cookies.length === 0) return failure(503);

  const redirect = new Response(null, { status: 303, headers: { location: "/" } });
  for (const cookie of cookies) redirect.headers.append("set-cookie", cookie);
  return redirect;
}
