import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, type AuthContext } from "../middleware/auth";
import { betService } from "../services/bet.service";
import { ValidationError } from "../lib/errors";

const app = new Hono<AuthContext>();

const placeBetSchema = z.object({
  roundId: z.string().min(1),
  tokenId: z.string().min(1),
  side: z.enum(["pump", "rug"]),
  amount: z.number().min(0.01).max(1),
});

app.use("/*", authMiddleware);

app.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = placeBetSchema.safeParse(body);

  if (!parsed.success) {
    const details: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      details[issue.path.join(".")] = issue.message;
    }
    throw new ValidationError("Invalid bet data", details);
  }

  const userId = c.get("userId");
  const bet = await betService.placeBet(userId, parsed.data);
  return c.json(bet, 201);
});

const confirmBetSchema = z.object({
  txSignature: z.string().min(1),
});

app.post("/:id/confirm", async (c) => {
  const body = await c.req.json();
  const parsed = confirmBetSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError("Invalid confirmation data");
  }
  const betId = c.req.param("id");
  await betService.confirmBet(betId, parsed.data.txSignature);
  return c.json({ ok: true });
});

app.get("/mine", (c) => {
  const userId = c.get("userId");
  const roundId = c.req.query("roundId");
  const bets = betService.getUserBets(userId, roundId);
  return c.json(bets);
});

export const betsRoute = app;
