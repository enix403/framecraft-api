import { Response } from 'express';

export class ApplicationError extends Error {
  public readonly userMessage: string;
  public readonly statusCode: number;
  public readonly errorCode: string;

  constructor(msg: string, statusCode?: number, errorCode?: string) {
    super(msg);
    this.userMessage = msg;
    this.statusCode = statusCode || 400;
    this.errorCode = errorCode || 'unset';
  }

  public sendResponse(res: Response) {
    res.status(this.statusCode).json({
      isApiReplyError: true,
      errorMessage: this.userMessage,
      errorCode: this.errorCode,
    });
  }
}

export class NotFound extends ApplicationError {
  constructor() {
    super('Resource not found', 404, 'not_found');
  }
}
