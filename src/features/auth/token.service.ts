import crypto from "node:crypto";

import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import { appEnv } from "@/lib/app-env";
import { createDateAddDaysFromNow } from "@/lib/dates";

import { AccessTokenClaims } from "@/contracts/AccessTokenClaims";

import {
  DisposableToken,
  DisposableTokenKind
} from "@/models/disposable-token";
import { IUser } from "@/models/user";

export const tokenService = {
  // Generate an access token
  genAccess: (user: IUser) => {
    return new Promise<string>((resolve, reject) =>
      jwt.sign(
        {
          uid: user.id.toString()
        } satisfies AccessTokenClaims,
        appEnv.JWT_SIGNING_KEY || "",
        (err: any, token: string) => {
          if (err) reject(err);
          else resolve(token);
        }
      )
    );
  },

  genDisposable({ length = 16 }: { length?: number } = {}) {
    return crypto.randomBytes(length).toString("hex");
  },

  createDisposable: ({
    userId,
    email,
    kind,
    expiryDays = 2
  }: {
    userId: Types.ObjectId;
    email: string;
    kind: DisposableTokenKind;
    expiryDays?: number;
  }) => {
    const token = tokenService.genDisposable();
    const expiresAt = createDateAddDaysFromNow(expiryDays);

    return new DisposableToken({
      userId,
      email,
      kind,
      token,
      expiresAt
    }).save();
  },

  findDisposable: (
    {
      userId,
      token
    }: {
      userId: Types.ObjectId;
      token: string;
    },
    kind: DisposableTokenKind
  ) => {
    return DisposableToken.findOne({
      userId,
      token,
      kind,
      used: false,
      expiresAt: { $gte: new Date() }
    });
  },

  consumeDisposable: (
    {
      userId,
      token
    }: {
      userId: Types.ObjectId;
      token: string;
    },
    kind: DisposableTokenKind
  ) => {
    return DisposableToken.findOneAndUpdate(
      {
        userId,
        token,
        kind,
        used: false,
        expiresAt: { $gte: new Date() }
      },
      {
        used: true,
        usedAt: new Date()
      }
    );
  },

  createPasswordResetLink: (userId: string, token: string) => {
    return `${appEnv.CLIENT_URL}/auth/reset-password/${userId}/${token}`;
  }
};
