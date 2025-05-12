import { ApiRouter } from "@/lib/ApiRouter";

import { router as authRouter } from "./auth/auth.controller";
import { router as healthRouter } from "./health/health.controller";
import { router as planRouter } from "./plan/plan.controller";
import { router as uploadsRouter } from "./uploads/uploads.controller";

export function createRootApiRouter() {
  const router = new ApiRouter();

  router.use(healthRouter);
  router.use(authRouter);
  router.use(planRouter);
  router.use(uploadsRouter);

  return router;
}
