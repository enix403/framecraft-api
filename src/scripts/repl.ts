/* ========================== */
import { appEnv } from "@/lib/app-env";
import { appLogger } from "@/lib/logger";

import { validateJoiSchema } from "@/middleware/validation";

import { connectMongoDB } from "@/datasources/mongodb";

import { DisposableToken } from "@/models/disposable-token";
import { Plan } from "@/models/plan";
import { User } from "@/models/user";

import { mailPresets } from "@/mailer/mailer";

import { comparePassword, hashPassword } from "@/features/auth/hashing";
import { tokenService } from "@/features/auth/token.service";

/* ========================== */

const timeout = 100;
connectMongoDB({
  timeoutMS: timeout,
  socketTimeoutMS: timeout,
  connectTimeoutMS: timeout,
  waitQueueTimeoutMS: timeout,
  serverSelectionTimeoutMS: timeout
}).finally(console.clear);

globalThis.appEnv = appEnv;
globalThis.appLogger = appLogger;
globalThis.validateJoiSchema = validateJoiSchema;
globalThis.connectMongoDB = connectMongoDB;
globalThis.DisposableToken = DisposableToken;
globalThis.Plan = Plan;
globalThis.User = User;
globalThis.mailPresets = mailPresets;
globalThis.comparePassword = comparePassword;
globalThis.hashPassword = hashPassword;
globalThis.tokenService = tokenService;
