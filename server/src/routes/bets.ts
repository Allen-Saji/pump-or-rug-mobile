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

// Step 1: Validate + build unsigned tx (no DB write)
app.post("/prepare", async (c) => {
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
  const prepared = await betService.prepareBet(userId, parsed.data);
  return c.json(prepared);
});

const commitBetSchema = placeBetSchema.extend({
  txSignature: z.string().min(1).optional(),
});

// Step 2: Commit bet to DB after on-chain tx succeeds
app.post("/commit", async (c) => {
  const body = await c.req.json();
  const parsed = commitBetSchema.safeParse(body);

  if (!parsed.success) {
    const details: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      details[issue.path.join(".")] = issue.message;
    }
    throw new ValidationError("Invalid bet data", details);
  }

  const userId = c.get("userId");
  const { txSignature, ...betInput } = parsed.data;
  const bet = await betService.commitBet(userId, betInput, txSignature);
  return c.json(bet, 201);
});

// Legacy: place bet directly (no on-chain signing)
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

app.get("/mine", (c) => {
  const userId = c.get("userId");
  const roundId = c.req.query("roundId");
  const bets = betService.getUserBets(userId, roundId);
  return c.json(bets);
});

export const betsRoute = app;
