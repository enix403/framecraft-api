import { StatusCodes } from "http-status-codes";
import Joi from "joi";

import { ApiRouter } from "@/lib/ApiRouter";
import { reply } from "@/lib/app-reply";
import { ApplicationError, NotFound } from "@/lib/errors";

import { customJoi } from "@/middleware/validation";

import { DisposableTokenKind } from "@/models/disposable-token";
import { User } from "@/models/user";

import { mailPresets } from "@/mailer/mailer";

import { comparePassword, hashPassword } from "./hashing";
import { tokenService } from "./token.service";

export const router = new ApiRouter({
  pathPrefix: "/auth",
  defaultTags: ["Authentication"]
});

router.add(
  {
    path: "/login",
    method: "POST",
    summary: "User Login",
    desc:
      "Allows users to log in using their email and password. " +
      "Returns an access token upon successful authentication.",
    schema: {
      body: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
      })
    }
  },
  async (req, res) => {
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
      throw new ApplicationError(
        "Invalid email or password",
        StatusCodes.UNAUTHORIZED,
        "invalid_creds"
      );
    }

    let accessToken = await tokenService.genAccess(user);

    return reply(res, {
      accessToken,
      user
    });
  }
);

router.add(
  {
    path: "/sign-up",
    method: "POST",
    summary: "User Registration",
    desc:
      "Registers a new user with an email, password, and full name. " +
      "Sends a verification email upon successful registration.",
    schema: {
      body: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        fullName: Joi.string().required()
      })
    }
  },
  async (req, res) => {
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
  }
);

router.add(
  {
    path: "/verify",
    method: "POST",
    summary: "Verify Email",
    desc:
      "Verifies a user's email using a one-time token. Marks the user " +
      "as verified and returns an access token upon success.",
    schema: {
      body: Joi.object({
        userId: customJoi.id().required(),
        token: Joi.string().required()
      })
    }
  },
  async (req, res) => {
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
  }
);

/* ====================== */

router.add(
  {
    path: "/forget-password/init",
    method: "POST",
    summary: "Initiate Password Reset",
    desc: "Sends a password reset link to the user's email if the email is registered in the system.",
    schema: {
      body: Joi.object({
        email: Joi.string().email().required()
      })
    }
  },
  async (req, res) => {
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
  }
);

router.add(
  {
    path: "/forget-password/check",
    method: "POST",
    summary: "Check reset password token",
    desc: "Check if the given reset password token in valid or not",
    schema: {
      body: Joi.object({
        userId: customJoi.id().required(),
        token: Joi.string().required()
      })
    }
  },
  async (req, res) => {
    const { userId, token } = req.body;

    let record = await tokenService
      .findDisposable({ userId, token }, DisposableTokenKind.ResetPassword)
      .populate<{ user: any }>("user");

    if (!record || !record.user) {
      throw new NotFound();
    }

    return reply(res, {
      userId: record.user.id,
      userEmail: record.user.email,
      token,
    });
  }
);

router.add(
  {
    path: "/forget-password/set",
    method: "POST",
    summary: "Set New Password",
    desc: "Allows users to set a new password using a one-time token sent via email.",
    schema: {
      body: Joi.object({
        userId: customJoi.id().required(),
        token: Joi.string().required(),
        newPassword: Joi.string().required()
      })
    }
  },
  async (req, res) => {
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
  }
);
