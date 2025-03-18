import express from 'express';

import { router as healthRouter } from './health/health.controller';

export function createRootApiRouter() {
  const router = express.Router();

  router.use(healthRouter);

  return router;
}
