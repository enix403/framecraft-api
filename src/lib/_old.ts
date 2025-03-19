import {
  Router as ExpressRouter,
  NextFunction,
  Request,
  Response
} from "express";
import { ObjectSchema } from "joi";

import { bodySchema, paramSchema, querySchema } from "@/middleware/validation";

type RouteInputSchema = ObjectSchema;

// Route metadata
type RouteInfo = {
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

// Type-safe request based on provided schemas
type TypedRequest<T extends RouteInfo> = Request;

class ApiRouter {
  private readonly baseRouter: ExpressRouter;
  private readonly routes: RouteInfo[] = [];

  constructor() {
    this.baseRouter = ExpressRouter();
  }

  public add<T extends RouteInfo>(
    route: T,
    handler: (req: TypedRequest<T>, res: Response) => void | Promise<void>
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

    // Register route
    (this.baseRouter as any)[method.toLowerCase()](
      path,
      [...middlewares, valMiddlewares],
      handler
    );

    // Store route info for Swagger
    this.routes.push(route);
  }

  public getRouter() {
    return this.baseRouter;
  }

  public getRoutes() {
    return this.routes;
  }
}
