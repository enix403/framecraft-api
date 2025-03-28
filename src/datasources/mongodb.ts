import { green, red } from "colorette";
import mongoose from "mongoose";

import { appEnv } from "@/lib/app-env";
import { appLogger } from "@/lib/logger";

export async function connectMongoDB() {
  try {
    appLogger.verbose("Connecting to MongoDB ...");
    await mongoose.connect(appEnv.MONGO_URL ?? "");
    appLogger.verbose(green("Connected successfully to MongoDB instance"));
  } catch (error) {
    appLogger.error(red("Connection to MongoDB instance failed"));
    throw error;
  }
}
