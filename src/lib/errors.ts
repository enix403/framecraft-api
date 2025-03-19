import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ValidationErrorItem } from "joi";

export class ApplicationError extends Error {
  public readonly userMessage: string;
  public readonly statusCode: number;
  public readonly errorCode: string;

  constructor(msg: string, statusCode?: number, errorCode?: string) {
    super(msg);
    this.userMessage = msg;
    this.statusCode = statusCode || StatusCodes.BAD_REQUEST;
    this.errorCode = errorCode || "unset";
  }

  public sendResponse(res: Response) {
    res.status(this.statusCode).json({
      isApiReplyError: true,
      errorMessage: this.userMessage,
      errorCode: this.errorCode,
      ...this.getExtraData()
    });
  }

  protected getExtraData(): object {
    return {};
  }
}

export class NotFound extends ApplicationError {
  constructor() {
    super("Resource not found", StatusCodes.NOT_FOUND, "not_found");
  }
}

export class JoiValidationError extends ApplicationError {
  constructor(public readonly details: ValidationErrorItem[]) {
    super("Invalid input", StatusCodes.BAD_REQUEST, "val_err");
  }

  protected getExtraData(): object {
    return { details: this.details };
  }
}
