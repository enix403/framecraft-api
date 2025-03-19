import crypto from "node:crypto";

import express from "express";
import ah from "express-async-handler";
import { ApplicationError, NotFound } from "@/lib/errors";

import { AccessTokenClaims } from "@/contracts/AccessTokenClaims";
import jwt from "jsonwebtoken";
import { appEnv } from "@/lib/app-env";

import { comparePassword, hashPassword } from "./hashing";
import { reply } from "@/lib/app-reply";
import { bodySchema } from "@/middleware/validation";
import Joi from "joi";
import { StatusCodes } from "http-status-codes";

import { User } from "@/models/user";
import { mailPresets } from "@/mailer/mailer";

import {
  DisposableToken,
  DisposableTokenKind
} from "@/models/disposable-token";

export const router = express.Router();

function createAccessToken(user: any) {
  return new Promise<string>((resolve, reject) =>
    jwt.sign(
      { uid: user._id.toString() } satisfies AccessTokenClaims,
      appEnv.JWT_SIGNING_KEY || "",
      (err: any, token: string) => {
        if (err) reject(err);
        else resolve(token);
      }
    )
  );
}

router.post(
  "/auth/login",
  bodySchema(
    Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    })
  ),
  ah(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
      isVerified: true,
      isActive: true
    });

    if (
      user == null ||
      !(await comparePassword(password, user.passwordHash || ""))
    ) {
      throw new ApplicationError("Invalid email or password", 401);
    }

    let accessToken = await createAccessToken(user);

    return reply(res, {
      accessToken,
      user
    });
  })
);

function createRandomToken() {
  return crypto.randomBytes(16).toString("hex");
}

export const createDateAddDaysFromNow = (days: number) => {
  const date = new Date();

  date.setDate(date.getDate() + days);

  return date;
};

router.post(
  "/auth/sign-up",
  bodySchema(
    Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      fullName: Joi.string().required()
    })
  ),
  ah(async (req, res) => {
    const { email, password, ...restData } = req.body;

    const isUserExist = await User.exists({ email });

    if (isUserExist) {
      throw new ApplicationError(
        "Email already registered",
        StatusCodes.CONFLICT,
        "email_taken"
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await new User({
      ...restData,
      email,
      passwordHash,
      role: "user"
    }).save();

    const token = createRandomToken();
    const dateFromNow = createDateAddDaysFromNow(2); // expires in 2 days

    await new DisposableToken({
      userId: user.id,
      email,
      kind: DisposableTokenKind.Verify,
      token,
      expiresAt: dateFromNow
    }).save();

    mailPresets.verification(email, token, user.id);

    return reply(res);
  })
);

router.post(
  "/auth/verify",
  bodySchema(
    Joi.object({
      userId: Joi.string().required(),
      token: Joi.string().required()
    })
  ),
  ah(async (req, res) => {
    const { userId, token } = req.body;

    let record = await DisposableToken.findOneAndUpdate(
      {
        userId,
        token,
        used: false,
        kind: DisposableTokenKind.Verify,
        expiresAt: { $gte: new Date() }
      },
      {
        used: true,
        usedAt: new Date()
      }
    );

    if (!record) {
      throw new NotFound();
    }

    const user = await User.findOneAndUpdate(
      { _id: userId },
      { isVerified: true },
      { returnDocument: "after" }
    );

    if (!user) {
      throw new NotFound();
    }

    let accessToken = await createAccessToken(user);

    return reply(res, {
      accessToken,
      user
    });
  })
);

/* ====================== */

router.post(
  "/auth/forget-password/init",
  bodySchema(
    Joi.object({
      email: Joi.string().email().required()
    })
  ),
  ah(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (user) {
      const token = createRandomToken();
      const dateFromNow = createDateAddDaysFromNow(2); // expires in 2 days

      await new DisposableToken({
        userId: user.id,
        email,
        kind: DisposableTokenKind.ResetPassword,
        token,
        expiresAt: dateFromNow
      }).save();

      mailPresets.resetPassword(email, token, user.id);
    }

    return reply(res);
  })
);

router.post(
  "/auth/forget-password/set",
  bodySchema(
    Joi.object({
      userId: Joi.string().required(),
      token: Joi.string().required(),
      newPassword: Joi.string().required()
    })
  ),
  ah(async (req, res) => {
    const { userId, token, newPassword } = req.body;

    let record = await DisposableToken.findOneAndUpdate(
      {
        userId,
        token,
        used: false,
        kind: DisposableTokenKind.ResetPassword,
        expiresAt: { $gte: new Date() }
      },
      {
        used: true,
        usedAt: new Date()
      }
    );

    if (!record) {
      throw new NotFound();
    }

    const passwordHash = await hashPassword(newPassword);

    const user = await User.findOneAndUpdate(
      { _id: userId },
      { passwordHash },
      { returnDocument: "after" }
    );

    if (!user) {
      throw new NotFound();
    }

    return reply(res);
  })
);
