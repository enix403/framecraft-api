import { Response } from "express";
import { StatusCodes } from "http-status-codes";

export function reply(res: Response, data?: any): void {
  data = data ?? "ok";

  if (typeof data === "string") {
    data = { message: data };
  }

  res.status(StatusCodes.OK).json(data).end();
}

function replyWithMessage(res: Response, message: string, data?: any) {
  return reply(res, {
    message,
    ...(data || {}),
  });
}

reply.msg = replyWithMessage;
