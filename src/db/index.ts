import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

declare global {
  var __pgClient: postgres.Sql | undefined;
}

// Reuse one pool across dev hot reloads instead of opening a new pool per reload.
const client =
  globalThis.__pgClient ??
  postgres(env.databaseUrl, {
    max: env.isProduction ? 10 : 5,
    prepare: false,
  });

if (!env.isProduction) globalThis.__pgClient = client;

export const db = drizzle(client, { schema, casing: "snake_case" });
export { schema };
