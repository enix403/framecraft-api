import dotenv from "dotenv";

dotenv.config();

/**
 * Validates if a value is a boolean or a string representation of a boolean.
 * @param x - The value to validate.
 * @returns `true` if the value is a boolean or a string representation of `true`, otherwise `false`.
 */
function validateBoolean(x: unknown): boolean {
  if (typeof x === "string" && x.toLowerCase() === "true") {
    return true;
  }
  return false;
}

/**
 * Retrieves an environment variable.
 * @param key - The environment variable key.
 * @returns The environment variable value as a string or `null` if not found.
 */
function getEnv(key: string): string | null;

/**
 * Retrieves an environment variable with a fallback value.
 * @param key - The environment variable key.
 * @param fallback - The fallback value to return if the environment variable is not found.
 * @returns The environment variable value as a string or the fallback value.
 */
function getEnv<T>(key: string, fallback: T): string | T;

/**
 * Implementation of the `getEnv` function.
 * @param key - The environment variable key.
 * @param fallback - The fallback value to return if the environment variable is not found.
 * @returns The environment variable value, fallback value, or `null`.
 */
function getEnv<T>(key: string, fallback?: T): string | T | null {
  const result = process.env[key] ?? null;

  // Check if the environment variable is missing or empty
  if (result === null || result === undefined || result === "") {
    // Return the fallback value if provided
    return fallback !== undefined ? fallback : null;
  }

  return result;
}

// Application environment variables
export const appEnv = {
  NODE_ENV: getEnv("NODE_ENV", "production"), // Default to 'production' if not set
  PORT: getEnv("PORT"), // Default to '3000' if not set
  MONGO_URL: getEnv("MONGO_URL"), // No default, will return `null` if not set
  JWT_SIGNING_KEY: getEnv("JWT_SIGNING_KEY") // No default, will return `null` if not set
};

// Environment checks
export const isDev = appEnv.NODE_ENV === "development";
export const isProd = !isDev;
