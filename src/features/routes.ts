import express from "express";

import { router as healthRouter } from "./health/health.controller";
import { router as authRouter } from "./auth/auth.controller";

export function createRootApiRouter() {
  const router = express.Router();

  router.use(healthRouter);
  router.use(authRouter);

  return router;
}
