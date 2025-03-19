import ApiRouter from "@/lib/ApiRouter";

// import { router as authRouter } from "./auth/auth.controller";
import { router as healthRouter } from "./health/health.controller";

export function createRootApiRouter() {
  const router = new ApiRouter();

  router.addRouter(healthRouter);
  // router.addRouter(authRouter);

  return router;
}
