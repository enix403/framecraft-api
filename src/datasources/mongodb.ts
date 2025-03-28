import { green, red } from "colorette";
import mongoose, { type ConnectOptions } from "mongoose";

import { appEnv } from "@/lib/app-env";
import { appLogger } from "@/lib/logger";

export async function connectMongoDB(options?: ConnectOptions) {
  try {
    appLogger.verbose("Connecting to MongoDB ...");
    await mongoose.connect(appEnv.MONGO_URL ?? "", options);
    appLogger.verbose(green("Connected successfully to MongoDB instance"));
  } catch (error) {
    appLogger.error(red("Connection to MongoDB instance failed"));
    throw error;
  }
}
