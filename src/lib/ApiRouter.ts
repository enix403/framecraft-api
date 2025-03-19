import {
  Router as ExpressRouter,
  NextFunction,
  Request,
  Response
} from "express";
import { StatusCodes } from "http-status-codes";
import Joi, { ObjectSchema } from "joi";
import joiToSwagger from "joi-to-swagger";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

// Type for schema definitions
type RouteInputSchema = ObjectSchema;
type InferSchemaType<T extends RouteInputSchema> =
  T extends ObjectSchema<infer U> ? U : never;

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

// Wrapper class for Express Router
class ApiRouter {
  private readonly expressRouter: ExpressRouter;
  private readonly routes: RouteInfo[] = [];
  private readonly childRouters: { path?: string; router: ApiRouter }[] = [];
  private readonly parentPath?: string;

  constructor(parentPath?: string) {
    this.expressRouter = ExpressRouter();
    this.parentPath = parentPath;
  }

  public add<T extends RouteInfo>(
    route: T,
    handler: (req: Request, res: Response) => void | Promise<void>
  ) {
    const { path, method, middlewares = [] } = route;

    // Middleware for validation
    const validationMiddleware = (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        if (route.schema?.params)
          req.params = route.schema.params.validate(req.params).value;
        if (route.schema?.query)
          req.query = route.schema.query.validate(req.query).value;
        if (route.schema?.body)
          req.body = route.schema.body.validate(req.body).value;
        next();
      } catch (error) {
        return res
          .status(400)
          .json({ error: error.details.map((d: any) => d.message) });
      }
    };

    // Register route
    (this.expressRouter as any)[method.toLowerCase()](
      path,
      [...middlewares, validationMiddleware],
      handler
    );

    // Compute full path by prepending parentPath if present
    const fullPath = this.parentPath ? `${this.parentPath}${path}` : path;

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

  public getSwaggerSpec() {
    return swaggerJsdoc({
      definition: {
        openapi: "3.0.0",
        info: {
          title: "API Documentation",
          version: "1.0.0"
        },
        paths: this.getRoutesInfo().reduce(
          (acc, route) => {
            const swaggerPath = route.path.replace(/:([a-zA-Z]+)/g, "{$1}"); // Convert Express params to OpenAPI style

            const querySchema = route.schema?.query
              ? joiToSwagger(route.schema.query).swagger
              : null;
            const queryParameters = querySchema
              ? Object.entries(querySchema.properties || {}).map(
                  ([name, schema]) => ({
                    name,
                    in: "query",
                    schema,
                    required: querySchema.required?.includes(name) || false
                  })
                )
              : [];

            acc[swaggerPath] = {
              [route.method.toLowerCase()]: {
                summary: route.summary,
                description: route.desc,
                tags: route.tags,
                parameters: [
                  ...(route.schema?.params
                    ? [
                        {
                          in: "path",
                          schema: joiToSwagger(route.schema.params).swagger
                        }
                      ]
                    : []),
                  ...queryParameters
                ],
                requestBody: route.schema?.body
                  ? {
                      content: {
                        "application/json": {
                          schema: joiToSwagger(route.schema.body).swagger
                        }
                      }
                    }
                  : undefined,
                responses: {
                  [StatusCodes.OK]: {
                    description: "Success"
                  },
                  [StatusCodes.UNAUTHORIZED]: {
                    description: "Unauthorized"
                  },
                  [StatusCodes.BAD_REQUEST]: {
                    description: "Bad Request"
                  },
                  [StatusCodes.FORBIDDEN]: {
                    description: "Forbidden"
                  },
                }
              }
            };
            return acc;
          },
          {} as Record<string, any>
        )
      },
      apis: []
    });
  }

  public serveDocs(router: ExpressRouter) {
    router.use(
      "/docs",
      swaggerUi.serve,
      swaggerUi.setup(this.getSwaggerSpec())
    );
  }
}

export default ApiRouter;
