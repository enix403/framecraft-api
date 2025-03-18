import type { IUser } from "db/models/user";
import type { Request } from "express";

// These open interfaces may be extended in an application-specific manner via declaration merging.
// See for example method-override.d.ts (https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/method-override/index.d.ts)

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      accessToken?: string;
    }
  }
}
