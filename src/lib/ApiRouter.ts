import {
  Router as ExpressRouter,
  NextFunction,
  Request,
  Response
} from "express";
import { ObjectSchema } from "joi";
import catchAsync from 'express-async-handler';

import { bodySchema, paramSchema, querySchema } from "@/middleware/validation";

type RouteInputSchema = ObjectSchema;

export type RouteInfo = {
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  summary?: string;
  desc?: string;
  tags?: string[];
  schema?: {
    params?: RouteInputSchema;
    query?: RouteInputSchema;
    body?: RouteInputSchema;
  };
  middlewares?: ((req: Request, res: Response, next: NextFunction) => void)[];
};

// Wrapper class for Express Router
export class ApiRouter {
  private readonly expressRouter: ExpressRouter;
  private readonly routes: RouteInfo[] = [];
  private readonly childRouters: { path?: string; router: ApiRouter }[] = [];

  private readonly pathPrefix?: string;
  private readonly defaultTags?: string[];

  constructor({
    pathPrefix,
    defaultTags
  }: {
    pathPrefix?: string;
    defaultTags?: string[];
  } = {}) {
    this.expressRouter = ExpressRouter();
    this.pathPrefix = pathPrefix;
    this.defaultTags = defaultTags;
  }

  public add<T extends RouteInfo>(
    route: T,
    handler: (req: Request, res: Response) => void | Promise<void>
  ) {
    const { path, method, schema, middlewares = [] } = route;

    const valMiddlewares: any[] = [];
    if (schema?.params) {
      valMiddlewares.push(paramSchema(schema.params));
    }
    if (schema?.query) {
      valMiddlewares.push(querySchema(schema.query));
    }
    if (schema?.body) {
      valMiddlewares.push(bodySchema(schema.body));
    }

    // Compute full path by prepending pathPrefix if present
    const fullPath = this.pathPrefix ? `${this.pathPrefix}${path}` : path;

    // Register route
    (this.expressRouter as any)[method.toLowerCase()](
      fullPath,
      [...middlewares, ...valMiddlewares],
      catchAsync(handler)
    );

    if (!route.tags) {
      route.tags = this.defaultTags;
    }

    // Store route info with updated path for Swagger
    this.routes.push({ ...route, path: fullPath });
  }

  public use(pathOrRouter: string | ApiRouter, routerInstance?: ApiRouter) {
    let path: string | undefined;
    let router: ApiRouter;

    if (typeof pathOrRouter === "string") {
      path = pathOrRouter;
      router = routerInstance!;
    } else {
      path = undefined;
      router = pathOrRouter;
    }

    this.expressRouter.use(path || "/", router.getExpressRouter());
    this.childRouters.push({ path, router });
  }

  public getExpressRouter() {
    return this.expressRouter;
  }

  public getRoutesInfo(): RouteInfo[] {
    return [
      ...this.routes,
      ...this.childRouters.flatMap(({ path, router }) =>
        router.getRoutesInfo().map(route => ({
          ...route,
          path: path ? `${path}${route.path}` : route.path
        }))
      )
    ];
  }
}
