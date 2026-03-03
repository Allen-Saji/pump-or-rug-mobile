import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";
import { config } from "../lib/config";

const sqlite = new Database(config.databaseUrl, { create: true });

// Enable WAL mode for better concurrent read/write performance
sqlite.exec("PRAGMA journal_mode = WAL");
sqlite.exec("PRAGMA busy_timeout = 5000");
sqlite.exec("PRAGMA foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
