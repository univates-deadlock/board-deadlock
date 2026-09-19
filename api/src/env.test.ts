import { describe, expect, it } from "vitest";

import { parseEnv } from "./env.js";

const databaseUrl = "postgresql://techpro:techpro@localhost:5432/techpro";

describe("parseEnv", () => {
  it("accepts a PostgreSQL URL and numeric port", () => {
    expect(parseEnv({ DATABASE_URL: databaseUrl, PORT: "4100" })).toEqual({
      DATABASE_URL: databaseUrl,
      PORT: 4100,
    });
  });

  it("rejects a missing database URL", () => {
    expect(() => parseEnv({ PORT: "4000" })).toThrow(/DATABASE_URL/);
  });

  it("rejects a malformed database URL", () => {
    expect(() => parseEnv({ DATABASE_URL: "not-a-url" })).toThrow(/DATABASE_URL/);
  });

  it("rejects a nonnumeric port", () => {
    expect(() => parseEnv({ DATABASE_URL: databaseUrl, PORT: "api" })).toThrow(/PORT/);
  });
});
