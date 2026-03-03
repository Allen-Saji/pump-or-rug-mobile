import { Hono } from "hono";
import { leaderboardService } from "../services/leaderboard.service";
import type { LeaderboardPeriod } from "@pump-or-rug/shared";

const app = new Hono();

const validPeriods = new Set(["daily", "weekly", "season", "all-time"]);

app.get("/", (c) => {
  const period = (c.req.query("period") || "weekly") as LeaderboardPeriod;
  const limit = Number(c.req.query("limit")) || 20;

  if (!validPeriods.has(period)) {
    return c.json(
      { error: "Invalid period", code: "VALIDATION_ERROR" },
      400
    );
  }

  const entries = leaderboardService.getLeaderboard(period, limit);
  return c.json(entries);
});

export const leaderboardRoute = app;
