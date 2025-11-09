/**
 * Environment Variables Validation
 *
 * Validates all required environment variables at application startup
 * using Zod schemas to ensure type safety and prevent runtime errors.
 *
 * @see https://github.com/colinhacks/zod - Zod documentation
 */

import { z } from "zod";
import { logger } from "./logger";

/**
 * Client-side environment variables schema
 * These are exposed to the browser and must be prefixed with NEXT_PUBLIC_
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL")
    .min(1, "NEXT_PUBLIC_SUPABASE_URL is required"),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20, "NEXT_PUBLIC_SUPABASE_ANON_KEY must be at least 20 characters")
    .regex(
      /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY must be a valid JWT"
    ),
});

/**
 * Server-side environment variables schema
 * These are only available on the server and should NOT be prefixed with NEXT_PUBLIC_
 */
const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/**
 * Combined environment variables schema
 */
const envSchema = clientEnvSchema.merge(serverEnvSchema);

/**
 * Validated environment variables type
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 *
 * @throws {ZodError} If validation fails in non-test environments
 * @returns {Env} Validated environment variables
 */
function validateEnv(): Env {
  // In test environment, use defaults if env vars not set
  const isTestEnv =
    process.env.NODE_ENV === "test" || process.env.VITEST === "true";

  if (
    isTestEnv &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  ) {
    return {
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature",
      NODE_ENV: "test",
    };
  }

  try {
    // In browser, only validate client env vars
    if (typeof window !== "undefined") {
      const clientEnv = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY:
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      };

      return {
        ...clientEnvSchema.parse(clientEnv),
        NODE_ENV:
          (process.env.NODE_ENV as "development" | "production" | "test") ||
          "development",
      };
    }

    // On server, validate all env vars
    return envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NODE_ENV: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    logger.error("Environment validation failed", { error });
    throw error;
  }
}

/**
 * Validated environment variables singleton
 *
 * @example
 * ```typescript
 * import { env } from "@/lib/env";
 *
 * const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
 * ```
 */
export const env = validateEnv();

/**
 * Type guard to check if running in production
 */
export function isProduction(): boolean {
  return env.NODE_ENV === "production";
}

/**
 * Type guard to check if running in development
 */
export function isDevelopment(): boolean {
  return env.NODE_ENV === "development";
}

/**
 * Type guard to check if running in test environment
 */
export function isTest(): boolean {
  return env.NODE_ENV === "test";
}
