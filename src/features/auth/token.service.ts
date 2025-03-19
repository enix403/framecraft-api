import { createDateAddDaysFromNow } from "@/lib/dates";
import {
  DisposableToken,
  DisposableTokenKind
} from "@/models/disposable-token";
import { Types } from "mongoose";
import crypto from "node:crypto";

export const tokenService = {
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
  }
};
