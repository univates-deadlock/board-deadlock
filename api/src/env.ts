import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url().refine((value) => {
    if (!URL.canParse(value)) return false;
    const protocol = new URL(value).protocol;
    return protocol === "postgresql:" || protocol === "postgres:";
  }, "Must be a PostgreSQL URL"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
});

export function parseEnv(input: NodeJS.ProcessEnv): z.infer<typeof envSchema> {
  const result = envSchema.safeParse(input);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid API environment: ${details}`);
  }

  return result.data;
}
