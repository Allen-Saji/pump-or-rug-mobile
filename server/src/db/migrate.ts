import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "./client";

export function runMigrations() {
  console.log("[db] Running migrations...");
  migrate(db, { migrationsFolder: "./src/db/migrations" });
  console.log("[db] Migrations complete");
}
