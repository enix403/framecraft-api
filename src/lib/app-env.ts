import dotenv from "dotenv";
import { appLogger } from "./logger";
import {
  bgCyanBright,
  blueBright,
  bold,
  cyan,
  cyanBright,
  green,
  magentaBright,
  red,
  redBright,
  white,
  yellow
} from "colorette";

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
  let result = process.env[key] ?? null;

  // Check if the environment variable is missing or empty
  if (result === null || result === undefined || result === "") {
    // Return the fallback value if provided
    return fallback !== undefined ? fallback : null;
  }

  return result;
}

let hasMissing = false;

function requireEnv(key: string, isNumber: boolean = false): string {
  let val: any = getEnv(key);

  if (typeof val === "string") val = val.trim();

  if (isNumber && val) {
    val = +val;
  }

  if (!val) {
    appLogger.error(red(`Required env ${bold("`" + key + "`")} not provided.`));
    hasMissing = true;
    return "";
  }

  return val;
}

// Application environment variables
export const appEnv = {
  NODE_ENV: getEnv("NODE_ENV", "production"),
  PORT: getEnv("PORT"),
  // Jwt
  JWT_SIGNING_KEY: getEnv("JWT_SIGNING_KEY"),
  // Application
  CLIENT_URL: requireEnv("CLIENT_URL"),
  // Database
  MONGO_URL: requireEnv("MONGO_URL"),
  // Mail
  MAIL_HOST: requireEnv("MAIL_HOST"),
  MAIL_PORT: +requireEnv("MAIL_PORT"),
  MAIL_USER: requireEnv("MAIL_USER"),
  MAIL_PASS: requireEnv("MAIL_PASS")
};

if (hasMissing) {
  appLogger.error(red(`Invalid configuration. Quitting.`));
  process.exit(1);
}

// Environment checks
export const isDev = appEnv.NODE_ENV === "development";
export const isProd = !isDev;
