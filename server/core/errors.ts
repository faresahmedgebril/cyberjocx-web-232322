import { TRPCError } from "@trpc/server";

export class AppError extends Error {
  constructor(public readonly code: string, message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "AppError";
  }
}

export const validationError = (message: string) => new AppError("VALIDATION_ERROR", message);
export const authenticationError = (message = "Authentication required") => new AppError("UNAUTHORIZED", message);
export const authorizationError = (message = "You do not have permission") => new AppError("FORBIDDEN", message);
export const notFoundError = (message = "Resource not found") => new AppError("NOT_FOUND", message);
export const conflictError = (message = "Resource conflict") => new AppError("CONFLICT", message);
export const externalServiceError = (message = "External service unavailable", cause?: unknown) => new AppError("EXTERNAL_SERVICE_ERROR", message, cause);

export function toTRPCError(error: unknown): TRPCError {
  if (error instanceof AppError) {
    const code = error.code === "UNAUTHORIZED" ? "UNAUTHORIZED" : error.code === "FORBIDDEN" ? "FORBIDDEN" : error.code === "NOT_FOUND" ? "NOT_FOUND" : error.code === "CONFLICT" ? "CONFLICT" : error.code === "VALIDATION_ERROR" ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR";
    return new TRPCError({ code, message: error.message, cause: error.cause });
  }
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" });
}
