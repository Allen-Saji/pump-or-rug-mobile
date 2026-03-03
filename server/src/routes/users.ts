import { Hono } from "hono";
import { z } from "zod";
import { ulid } from "ulid";
import * as jose from "jose";
import { authMiddleware, type AuthContext } from "../middleware/auth";
import { userRepo } from "../repositories/user.repo";
import { betService } from "../services/bet.service";
import { ValidationError, UnauthorizedError } from "../lib/errors";
import { config } from "../lib/config";

const app = new Hono<AuthContext>();

// Cache JWKS for register endpoint (same as auth middleware)
let cachedJwks: ReturnType<typeof jose.createRemoteJWKSet> | null = null;
function getJwks() {
  if (!cachedJwks) {
    cachedJwks = jose.createRemoteJWKSet(
      new URL(`https://auth.privy.io/api/v1/apps/${config.privyAppId}/jwks.json`)
    );
  }
  return cachedJwks;
}

const registerSchema = z.object({
  displayName: z.string().min(1).max(30),
  walletAddress: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

// Register endpoint — verifies JWT but doesn't require existing user
app.post("/", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing Authorization header");
  }

  const token = authHeader.slice(7);
  let privyUserId: string;

  try {
    const { payload } = await jose.jwtVerify(token, getJwks(), {
      issuer: "privy.io",
      audience: config.privyAppId,
    });
    privyUserId = payload.sub!;
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }

  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const details: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      details[issue.path.join(".")] = issue.message;
    }
    throw new ValidationError("Invalid user data", details);
  }

  const user = userRepo.upsert({
    id: ulid(),
    privyUserId,
    displayName: parsed.data.displayName,
    walletAddress: parsed.data.walletAddress ?? null,
    avatarUrl: parsed.data.avatarUrl ?? null,
    points: 0,
    winStreak: 0,
    dailyStreak: 0,
    totalBets: 0,
    totalWins: 0,
    createdAt: Date.now(),
  });

  const rank = userRepo.getRank(user.id);

  return c.json({
    id: user.id,
    walletAddress: user.walletAddress ?? "",
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    points: user.points,
    rank,
    winStreak: user.winStreak,
    dailyStreak: user.dailyStreak,
    totalBets: user.totalBets,
    totalWins: user.totalWins,
    bets: [],
    badges: [],
  }, 201);
});

// Protected routes below
app.use("/*", authMiddleware);

app.get("/me", (c) => {
  const userId = c.get("userId");
  const user = userRepo.getById(userId);
  if (!user) {
    return c.json({ error: "User not found", code: "NOT_FOUND" }, 404);
  }

  const bets = betService.getUserBets(userId);
  const rank = userRepo.getRank(userId);

  return c.json({
    id: user.id,
    walletAddress: user.walletAddress ?? "",
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    points: user.points,
    rank,
    winStreak: user.winStreak,
    dailyStreak: user.dailyStreak,
    totalBets: user.totalBets,
    totalWins: user.totalWins,
    bets,
    badges: [],
  });
});

export const usersRoute = app;
