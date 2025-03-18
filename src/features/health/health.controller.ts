import express from "express";
import ah from "express-async-handler";
import { reply } from "@/lib/app-reply";
import { mailPresets } from "@/mailer/mailer";

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
    mailPresets.welcome("hello@gmail.com");

    return reply(res, { ok: true });
  })
);
