import express from "express";
import ah from "express-async-handler";
import { StatusCodes } from "http-status-codes";
import Joi from "joi";

import { reply } from "@/lib/app-reply";
import { ApplicationError, NotFound } from "@/lib/errors";

import { bodySchema } from "@/middleware/validation";

import { DisposableTokenKind } from "@/models/disposable-token";
import { User } from "@/models/user";

import { mailPresets } from "@/mailer/mailer";

import { comparePassword, hashPassword } from "./hashing";
import { tokenService } from "./token.service";

export const router = express.Router();

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

    let accessToken = await tokenService.genAccess(user);

    return reply(res, {
      accessToken,
      user
    });
  })
);

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

    const tokenRecord = await tokenService.createDisposable({
      userId: user.id,
      email,
      kind: DisposableTokenKind.Verify
    });

    mailPresets.verification(email, tokenRecord.token, user.id);

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

    let record = await tokenService.consumeDisposable(
      { userId, token },
      DisposableTokenKind.Verify
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

    let accessToken = await tokenService.genAccess(user);

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
      const tokenRecord = await tokenService.createDisposable({
        userId: user.id,
        email,
        kind: DisposableTokenKind.ResetPassword
      });

      mailPresets.resetPassword(email, tokenRecord.token, user.id);
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

    let record = await tokenService.consumeDisposable(
      { userId, token },
      DisposableTokenKind.ResetPassword
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
