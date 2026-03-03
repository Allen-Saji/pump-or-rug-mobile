import { createMiddleware } from "hono/factory";
import * as jose from "jose";
import { config } from "../lib/config";
import { UnauthorizedError } from "../lib/errors";
import { userRepo } from "../repositories/user.repo";

export type AuthContext = {
  Variables: {
    userId: string;
    privyUserId: string;
  };
};

// Cache JWKS keyset — jose handles key rotation/refresh internally
let cachedJwks: ReturnType<typeof jose.createRemoteJWKSet> | null = null;

function getJwks() {
  if (!cachedJwks) {
    cachedJwks = jose.createRemoteJWKSet(
      new URL(`https://auth.privy.io/api/v1/apps/${config.privyAppId}/jwks.json`)
    );
  }
  return cachedJwks;
}

export const authMiddleware = createMiddleware<AuthContext>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing Authorization header");
  }

  const token = authHeader.slice(7);

  try {
    const jwks = getJwks();

    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: "privy.io",
      audience: config.privyAppId,
    });

    const privyUserId = payload.sub;
    if (!privyUserId) {
      throw new UnauthorizedError("Invalid token: no subject");
    }

    // Look up internal user
    const user = userRepo.getByPrivyUserId(privyUserId);
    if (!user) {
      throw new UnauthorizedError("User not registered");
    }

    c.set("userId", user.id);
    c.set("privyUserId", privyUserId);
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    console.error("[auth] JWT verification failed:", err);
    throw new UnauthorizedError("Invalid or expired token");
  }

  await next();
});
