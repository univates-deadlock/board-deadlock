import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  interface ProvidedContext {
    testDatabaseUrl: string;
  }
}

export default async function setup(project: TestProject) {
  const containerName = `techpro-api-test-${randomUUID()}`;
  const password = randomUUID();
  const docker = (...args: string[]) =>
    execFileSync("docker", args, { encoding: "utf8", timeout: 120_000 });
  let started = false;

  const cleanup = () => {
    if (started) {
      docker("rm", "--force", containerName);
      started = false;
    }
  };

  try {
    docker("run", "--rm", "--detach", "--name", containerName,
      "--env", `POSTGRES_PASSWORD=${password}`, "--env", "POSTGRES_DB=api_test",
      "--publish", "127.0.0.1::5432", "postgres:17-alpine");
    started = true;

    const deadline = Date.now() + 30_000;
    while (true) {
      try {
        // TCP readiness avoids the temporary Unix-socket server used during initialization.
        docker("exec", containerName, "pg_isready", "--host=127.0.0.1", "--username=postgres", "--dbname=api_test");
        break;
      } catch {
        if (Date.now() >= deadline) throw new Error("Test PostgreSQL did not become ready within 30 seconds");
        await setTimeout(200);
      }
    }

    const binding = docker("port", containerName, "5432/tcp").trim();
    const port = binding.match(/^127\.0\.0\.1:(\d+)$/)?.[1];
    if (!port) throw new Error("Could not determine the disposable PostgreSQL port");
    const databaseUrl = `postgresql://postgres:${password}@127.0.0.1:${port}/api_test`;
    const apiDirectory = fileURLToPath(new URL("../", import.meta.url));

    execFileSync(process.execPath, [
      fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url)),
      "migrate", "deploy",
    ], {
      cwd: apiDirectory,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: "pipe",
      timeout: 60_000,
    });
    project.provide("testDatabaseUrl", databaseUrl);
    return cleanup;
  } catch (error) {
    cleanup();
    throw error;
  }
}
