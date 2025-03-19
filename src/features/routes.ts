import express from "express";

import { router as authRouter } from "./auth/auth.controller";
import { router as healthRouter } from "./health/health.controller";

export function createRootApiRouter() {
  const router = express.Router();

  router.use(healthRouter);
  router.use(authRouter);

  return router;
}
