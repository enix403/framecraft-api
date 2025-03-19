import { StatusCodes } from "http-status-codes";
import joiToSwagger from "joi-to-swagger";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import type { ApiRouter } from "@/lib/ApiRouter";

import { appEnv } from "./lib/app-env";

export function buildSwaggerSpec(apiRouter: ApiRouter) {
  return swaggerJsdoc({
    definition: {
      openapi: "3.0.0",
      info: {
        title: appEnv.APP_NAME + " API",
        version: appEnv.APP_VERSION
      },
      paths: apiRouter.getRoutesInfo().reduce(
        (acc, route) => {
          // Convert Express params to OpenAPI style
          const swaggerPath = route.path.replace(/:([a-zA-Z]+)/g, "{$1}");

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
                }
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

export const swaggerDocs = (spec: object) => [
  swaggerUi.serve,
  swaggerUi.setup(spec)
];
