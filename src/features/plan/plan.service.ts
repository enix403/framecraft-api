import { StatusCodes } from "http-status-codes";

import { appEnv } from "@/lib/app-env";
import { ApplicationError } from "@/lib/errors";

// prettier-ignore
namespace ConvertTypeId {
  export const appToModel = {
    "living": 0,
    "bedroom": 2,
    "kitchen": 1,
    "bathroom": 3,
    "balcony": 4,
    "fdoor": 14
  };

  export const modelToApp: Record<number, string> = Object.entries(
    appToModel
  ).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
  }, {});
}

// Convert from model's number based value to our own format
function transform(canvasDataRaw, layout) {
  let walls = canvasDataRaw.walls.map((wall, index) => ({
    id: `wall-${index}`,
    row: wall[0] as number,
    col: wall[1] as number,
    length: wall[2] as number,
    direction: wall[3] as "h" | "v",
    width: 1
  }));

  let doors = canvasDataRaw.doors.map((door, index) => ({
    id: `door-${index}`,
    row: door[0] as number,
    col: door[1] as number,
    length: door[2] as number,
    direction: door[3] as "h" | "v"
  }));

  const [scaleRows, scaleCols] = canvasDataRaw.scale;

  let rooms: any[] = [];
  for (let i = 0; i < canvasDataRaw.rooms.length; ++i) {
    const room = canvasDataRaw.rooms[i];
    let [typeId, srcIndex, ...flatRects] = room;
    if (flatRects.length === 0) continue;

    let rects: any[] = [];

    for (let i = 0; i < flatRects.length; i += 4) {
      rects.push({
        row: scaleRows * flatRects[i],
        col: scaleCols * flatRects[i + 1],
        width: scaleCols * flatRects[i + 2],
        height: scaleRows * flatRects[i + 3]
      });
    }

    rooms.push({
      id: `room-${i}`,
      typeId: ConvertTypeId.modelToApp[typeId],
      label: layout.nodes[srcIndex].label,
      rects
    });
  }

  return {
    canvasSize: canvasDataRaw.shape,
    scale: canvasDataRaw.scale,
    walls,
    doors,
    rooms
  };
}

export async function generateCanvasData(layout: any): Promise<any> {
  const nodeTypes = layout.nodes.map(
    node => ConvertTypeId.appToModel[node.typeId]
  );
  const edges = layout.edges;

  const requestData = {
    node_types: nodeTypes,
    edges: edges,
    scale: [3, 3]
  };

  try {
    const response = await fetch(appEnv.BLUEPRINT_URL + "/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestData),
      signal: AbortSignal.timeout(20 * 60 * 1000 /* 20 min. */)
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

    const canvasDataRaw = await response.json();
    return transform(canvasDataRaw, layout);
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
