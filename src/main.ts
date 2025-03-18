import http from "http";

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import {
  cyan,
  green,
  red,
  yellow,
  bold,
  yellowBright,
  magenta,
  blackBright,
  blue,
  white,
} from "colorette";
import PrettyError from "pretty-error";

import { appEnv } from "lib/app-env";
import { ApplicationError, NotFound } from "lib/errors";
import { appLogger } from "lib/logger";
import { createRootApiRouter } from "features/routes";
import morgan from "morgan";

export type ServerBind =
  | { type: "port"; port: number }
  | { type: "pipe"; pipe: string };

export function getBind(): ServerBind {
  const val = appEnv.PORT;

  if (!val) {
    const DEF_PORT = 3001;
    appLogger.warn(
      yellowBright(
        `Env ${bold("PORT")} not defined. Defaulting to ${bold(DEF_PORT)}`,
      ),
    );
    return { type: "port", port: DEF_PORT };
  }

  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return { type: "pipe", pipe: val };
  }

  if (port >= 0) {
    // port number
    return { type: "port", port };
  }

  throw new Error(`Invalid value for env variable \`PORT\`: ${val}`);
}

async function connectMongoDB() {
  try {
    appLogger.verbose("Connecting to MongoDB ...");
    await mongoose.connect(appEnv.MONGO_URL ?? "");
    appLogger.verbose(green("Connected successfully to MongoDB instance"));
  } catch (error) {
    appLogger.error(red("Connection to MongoDB instance failed"));
    throw error;
  }
}

function methodColors(method: string) {
  method = method.toUpperCase();
  switch (method) {
    case "GET":
      return blue;
    case "POST":
    case "PATCH":
      return magenta;
    case "DELETE":
      return red;
    default:
      return white;
  }
}

morgan.token("method", function (req, res) {
  const method = req.method || "";
  return methodColors(method)(method);
});

function createApp() {
  const app = express();

  app.disable("etag");
  app.get("/*", function (req, res, next) {
    res.setHeader("Last-Modified", new Date().toUTCString());
    next();
  });

  app.use(cors());
  app.use(express.json());

  app.use(
    morgan(
      `:method :url -> ${cyan(":status")} ${blackBright("(:remote-addr)")}`,
      {
        stream: {
          write: (message) => appLogger.http(message.trim()),
        },
      },
    ),
  );

  app.use(createRootApiRouter());
  app.all("*", () => {
    throw new NotFound();
  });

  const pe = new PrettyError();

  // Global error handling middleware
  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (err instanceof ApplicationError) {
        return err.sendResponse(res);
      }

      if (err) {
        res.status(500).json({ message: "An internal server error occurred" });
        appLogger.error(pe.render(err));
      } else {
        next();
      }
    },
  );

  return app;
}

async function bootstrap() {
  // await connectMongoDB();

  const app = createApp();
  const server = http.createServer(app);

  const bind = getBind();

  const listenAt = bind.type === "port" ? bind.port : bind.pipe;
  server.listen(listenAt);

  server.on("error", (error: { syscall: string; code: string }) => {
    if (error.syscall !== "listen") {
      throw new Error();
    }

    let bindStr =
      bind.type === "pipe" ? `Pipe ${listenAt}` : `Port ${listenAt}`;

    bindStr = yellow(bindStr);

    switch (error.code) {
      case "EACCES":
        appLogger.error(red(`${bindStr} requires elevated privileges`));
        process.exit(1);
        break;
      case "EADDRINUSE":
        appLogger.error(red(`${bindStr} is already in use`));
        process.exit(1);
        break;
      default:
        throw new Error("An error occured " + JSON.stringify(error));
    }
  });

  server.on("listening", () => {
    const listeningOn =
      bind.type === "port"
        ? green(`http://localhost:${listenAt}`)
        : `named pipe ${green(listenAt)}`;

    appLogger.verbose(cyan(`Listening on ${listeningOn}`));

    const nodeEnv = magenta(appEnv.NODE_ENV);
    appLogger.verbose(`env: ${nodeEnv} 🚀`);
  });
}

bootstrap();
