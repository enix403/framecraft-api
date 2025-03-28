import "./repl-effects";

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

async function bootstrap() {
  try {
    const timeout = 100;
    await connectMongoDB({
      timeoutMS: timeout,
      socketTimeoutMS: timeout,
      connectTimeoutMS: timeout,
      waitQueueTimeoutMS: timeout,
      serverSelectionTimeoutMS: timeout
    });
  } catch (error) {
    // ignore if cannot connect
  }

  console.log("TypeScript REPL started\n");

  // Start the REPL
  const r = require("repl").start({
    prompt: "\x1b[34m>>\x1b[0m ",
    useGlobal: true
  });

  // Define custom REPL commands
  r.defineCommand("cls", {
    help: "Clears the screen",
    action() {
      console.clear();
      this.displayPrompt();
    }
  });

  r.on("exit", () => {
    process.exit();
  });
}
bootstrap();
