import { ApiRouter } from "@/lib/ApiRouter";

import { router as healthRouter } from "./health/health.controller";
import { router as authRouter } from "./auth/auth.controller";

export function createRootApiRouter() {
  const router = new ApiRouter();

  router.use(healthRouter);
  router.use(authRouter);

  return router;
}
