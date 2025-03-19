import express from "express";
import ah from "express-async-handler";

import { reply } from "@/lib/app-reply";

import { DisposableToken } from "@/models/disposable-token";
import { User } from "@/models/user";

export const router = express.Router();

router.get(
  "/health",
  ah(async (req, res) => {
    return reply(res, {
      live: true,
      query: req.query
    });
  })
);

router.get(
  "/temp",
  ah(async (req, res) => {
    await User.deleteMany({});
    await DisposableToken.deleteMany({});

    return reply(res, { ok: true });
  })
);
