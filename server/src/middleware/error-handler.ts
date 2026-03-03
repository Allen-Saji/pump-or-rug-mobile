import type { ErrorHandler } from "hono";
import { AppError } from "../lib/errors";
import type { ApiError } from "@pump-or-rug/shared";

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    const body: ApiError = {
      error: err.message,
      code: err.code,
      details: err.details,
    };
    return c.json(body, err.statusCode as any);
  }

  console.error("[server] Unhandled error:", err);

  const body: ApiError = {
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  };
  return c.json(body, 500);
};
