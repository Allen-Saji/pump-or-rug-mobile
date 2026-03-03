import { Hono } from "hono";
import { roundService } from "../services/round.service";

const app = new Hono();

app.get("/", (c) => {
  const limit = Number(c.req.query("limit")) || 10;
  const offset = Number(c.req.query("offset")) || 0;
  const rounds = roundService.getRecentRounds(limit, offset);
  return c.json(rounds);
});

app.get("/current", (c) => {
  const round = roundService.getCurrentRound();
  if (!round) {
    return c.json({ error: "No active round", code: "NO_ACTIVE_ROUND" }, 404);
  }
  return c.json(round);
});

app.get("/:id", (c) => {
  const round = roundService.getRound(c.req.param("id"));
  if (!round) {
    return c.json({ error: "Round not found", code: "NOT_FOUND" }, 404);
  }
  return c.json(round);
});

export const roundsRoute = app;
