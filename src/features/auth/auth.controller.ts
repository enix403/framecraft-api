import express from "express";
import ah from "express-async-handler";
import { ApplicationError } from "@/lib/errors";

import { AccessTokenClaims } from "./AccessTokenClaims";
import { User } from "@/models/user";

import jwt from "jsonwebtoken";
import { appEnv } from "@/lib/app-env";

import { comparePassword, hashPassword } from "./hashing";
import { reply } from "@/lib/app-reply";
import { bodySchema } from "@/middleware/validation";
import Joi from "joi";

export const router = express.Router();

function createToken(user: any) {
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

    const user = await User.findOne({ email });

    if (
      user == null ||
      !(await comparePassword(password, user.passwordHash || ""))
    ) {
      throw new ApplicationError("Invalid email or password", 401);
    }

    let token = await createToken(user);

    return reply(res, { token, user });
  })
);

router.post(
  "/auth/register",
  ah(async (req, res) => {
    const { email, password, ...restData } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new ApplicationError("Email already registered");

    const passwordHash = await hashPassword(password);

    let user = new User({
      ...restData,
      email,
      passwordHash,
      role: "user"
    });

    user = await user.save();
    const token = await createToken(user);

    return reply(res, { token, user });
  })
);
