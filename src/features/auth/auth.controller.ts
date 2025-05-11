import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import Joi from "joi";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import { ApiRouter } from "@/lib/ApiRouter";
import { appEnv } from "@/lib/app-env";
import { reply } from "@/lib/app-reply";
import { ApplicationError, NotFound } from "@/lib/errors";

import { authGuard } from "@/guards/auth.guard";

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
      role: "user",
      ...(!appEnv.REQUIRE_SIGN_UP_VERIFICATION
        ? {
            isVerified: true
          }
        : {})
    }).save();

    const tokenRecord = await tokenService.createDisposable({
      userId: user.id,
      email,
      kind: DisposableTokenKind.Verify
    });

    const userName = user.fullName;
    const verifyLink = tokenService.createVerifyLink(
      user.id,
      tokenRecord.token
    );

    mailPresets.verification(email, userName, verifyLink);

    return reply(res, user);
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

      const userName = user.fullName;
      const resetLink = tokenService.createPasswordResetLink(
        user.id,
        tokenRecord.token
      );

      mailPresets.resetPassword(email, userName, resetLink);
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
      token
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

/* ========================= */

// Update the current user
router.add(
  {
    path: "/me",
    method: "PATCH",
    desc: "Updates a user with new details.",
    schema: {
      body: Joi.object({
        fullName: Joi.string().optional(),
        profilePictureUrl: Joi.string().allow(null).optional(), // <-- allows null for removing avatar
        bio: Joi.string().optional(),
        gender: Joi.string().valid("male", "female").optional(),
        dateOfBirth: Joi.date().optional(),
        phoneCountryCode: Joi.string().optional(),
        phoneNumber: Joi.string().optional(),
        addressCountry: Joi.string().optional(),
        addressCity: Joi.string().optional(),
        addressArea: Joi.string().optional(),
        addressZip: Joi.string().optional()
      }).unknown(false)
    },
    middlewares: [authGuard()]
  },
  async (req, res) => {
    const updates = req.body;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true
    });

    if (!user) throw new NotFound();
    return reply(res, user);
  }
);

router.add(
  {
    path: "/update-password",
    method: "PATCH",
    summary: "Update Password",
    desc: "Allows the currently authenticated user to update their password.",
    schema: {
      body: Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().required()
      })
    },
    middlewares: [authGuard()]
  },
  async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      throw new NotFound();
    }

    const isPasswordCorrect = await comparePassword(
      currentPassword,
      user.passwordHash || ""
    );

    if (!isPasswordCorrect) {
      throw new ApplicationError(
        "Current password is incorrect",
        StatusCodes.UNAUTHORIZED,
        "invalid_password"
      );
    }

    const newHash = await hashPassword(newPassword);

    user.passwordHash = newHash;
    await user.save();

    return reply(res);
  }
);

/* ==================== OAUTH ==================== */

async function handleOAuthUser(
  res: Response,
  provider: string,
  oauthEmail: string | undefined,
  profileId: string,
  userProfileData: any
) {
  if (!oauthEmail) {
    res.status(200).send("need email bad");
    return;
  }

  let user = await User.findOne({
    email: oauthEmail,
    creationMethod: provider
  });

  let needsCreation = !Boolean(user);

  if (needsCreation) {
    const emailInUse = await User.exists({ email: oauthEmail });

    if (emailInUse) {
      res
        .status(200)
        .send("A different non-google account with this email already exists");
      return;
    }

    const newUser = await new User({
      email: oauthEmail,
      passwordHash: "/",
      role: "user",
      isActive: true,
      isVerified: true,
      creationMethod: provider,
      oauthProfileId: profileId,
      // ....
      ...userProfileData
    }).save();

    user = newUser;
  }

  let accessToken = await tokenService.genAccess(user!);

  res.redirect(`${appEnv.CLIENT_URL}/auth/oauth-success/${accessToken}`);
}

passport.use(
  new GoogleStrategy(
    {
      clientID: appEnv.GOOGLE_CLIENT_ID,
      clientSecret: appEnv.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      done(null, profile);
    }
  )
);

// client redirects here, redirected to google screen
router.add(
  { path: "/google", method: "GET" },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// google redirects back here
router.add(
  {
    path: "/google/callback",
    method: "GET",
    middlewares: [passport.authenticate("google", { session: false })]
  },
  async (req: any, res) => {
    // from above done(null, profile)
    const profile = req.user;
    const oauthEmail = profile.emails?.[0].value;

    handleOAuthUser(res, "google", oauthEmail, profile.id, {
      fullName: profile.displayName
    });
  }
);
