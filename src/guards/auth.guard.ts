import { type Request, type Response } from "express";
import handleAsync from "express-async-handler";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import { appEnv } from "@/lib/app-env";
import { appLogger } from "@/lib/logger";

import type { AccessTokenClaims } from "@/contracts/AccessTokenClaims";

import { IUser, User } from "@/models/user";

const applyAuthToken = async (
  req: Request,
  res: Response
): Promise<IUser | null> => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "No token provided." });
    appLogger.warn(`Unauthenticated access attempt: No token provided`);
    return null;
  }

  let claims: AccessTokenClaims | null = null;

  try {
    claims = await new Promise<AccessTokenClaims>((resolve, reject) =>
      jwt.verify(token, appEnv.JWT_SIGNING_KEY ?? "", (err, decoded) => {
        if (err !== null) reject(err);
        else resolve(decoded as AccessTokenClaims);
      })
    );
  } catch (err) {}

  const user =
    claims && Types.ObjectId.isValid(claims.uid)
      ? await User.findOne({
          _id: claims.uid,
          isActive: true,
          isVerified: true
        }).exec()
      : null;

  if (user === null) {
    appLogger.warn(
      `Unauthenticated access attempt: Invalid session token - ${token}`
    );

    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Invalid session token." });

    return null;
  }

  req.user = user;
  req.accessToken = token;

  return req.user ?? null;
};

export function authGuard(allowedRoles?: string[]) {
  return handleAsync(async (req, res, next) => {
    const loggedInUser = await applyAuthToken(req, res);

    if (!loggedInUser) {
      return;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = loggedInUser.role;

      if (!allowedRoles.includes(userRole)) {
        appLogger.warn(
          `Unauthorized access attempt: Invalid role - ${userRole} not allowed in [` +
            allowedRoles.join(", ") +
            "]"
        );

        res.status(StatusCodes.FORBIDDEN).json({ message: "Not allowed" });
        return;
      }
    }

    next();
  });
}
