import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { config } from "./lib/config";
import { runMigrations } from "./db/migrate";
import { errorHandler } from "./middleware/error-handler";
import { roundsRoute } from "./routes/rounds";
import { betsRoute } from "./routes/bets";
import { leaderboardRoute } from "./routes/leaderboard";
import { usersRoute } from "./routes/users";
import { startScheduler } from "./cron/scheduler";
import { tokenService } from "./services/token.service";
import { roundService } from "./services/round.service";

const app = new Hono();

// Global middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Error handler
app.onError(errorHandler);

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: Date.now() }));

// API routes
app.route("/api/rounds", roundsRoute);
app.route("/api/bets", betsRoute);
app.route("/api/leaderboard", leaderboardRoute);
app.route("/api/users", usersRoute);

// Bootstrap
async function bootstrap() {
  // 1. Run DB migrations
  runMigrations();

  // 2. Initial token cache seed
  console.log("[boot] Seeding token cache...");
  try {
    await tokenService.refreshCache("pump.fun");
  } catch (err) {
    console.error("[boot] pump.fun seed failed:", err);
  }
  try {
    await tokenService.refreshCache("bags.fm");
  } catch (err) {
    console.error("[boot] bags.fm seed failed (key missing?):", err);
  }

  // 3. Generate initial round if none exists
  const current = roundService.getCurrentRound();
  if (!current) {
    console.log("[boot] No active round, generating...");
    roundService.generateRound();
  }

  // 4. Start cron scheduler
  startScheduler();

  console.log(`[server] Pump or Rug API running on port ${config.port}`);
}

bootstrap().catch(console.error);

export default {
  port: config.port,
  fetch: app.fetch,
};
