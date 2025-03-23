import { StatusCodes } from "http-status-codes";

import { ApplicationError } from "@/lib/errors";

import planJsonRaw from "./planA.json";

// TODO: take from .env
// Url of the http service hosting the model
const SERVICE_URL = "http://localhost:3002";

export async function generateCanvasData(layout: any): Promise<any> {
  const nodeTypes = layout.nodes.map(node => node.typeId);
  const edges = layout.edges;

  const requestData = {
    node_types: nodeTypes,
    edges: edges,
    scale: [3, 3]
  };

  try {
    const response = await fetch(SERVICE_URL + "/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestData),
      signal: AbortSignal.timeout(15 * 60 * 1000 /* 15 min. */)
    });

    if (!response.ok) {
      const errorStatusCode = response.status;
      const errorBody = await response.text();
      throw new ApplicationError(
        "Failed to generate plan",
        StatusCodes.INTERNAL_SERVER_ERROR,
        "no_gen",
        {
          log: true,
          meta: {
            errorStatusCode,
            errorBody
          }
        }
      );
    }

    const data = await response.json();
    console.log("Response from Flask:", data);
  } catch (error) {
    throw new ApplicationError(
      "Failed to generate plan [/]",
      StatusCodes.INTERNAL_SERVER_ERROR,
      "no_gen2",
      {
        log: true,
        meta: {
          error
        }
      }
    );
  }
}
