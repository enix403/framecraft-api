import path from "node:path";

import Email from "email-templates";
import nodemailer from "nodemailer";

import { appEnv } from "@/lib/app-env";
import { appLogger } from "@/lib/logger";

const transport = nodemailer.createTransport({
  port: appEnv.MAIL_PORT,
  host: appEnv.MAIL_HOST,
  pool: true,
  secure: process.env.MAIL_PORT === "465", // Secure if using port 465 (SSL),
  auth: {
    user: appEnv.MAIL_USER,
    pass: appEnv.MAIL_PASS
  }
});

const mailer = new Email({
  views: {
    root: path.join(__dirname, "templates"),
    locals: {
      clientUrl: appEnv.CLIENT_URL
    },
    options: { extension: "ejs" }
  },
  preview: false,
  send: true,
  transport: transport,
  message: {
    from: "<no-reply@framecraft.com>"
  }
});

export const mailPresets = {
  verification: (email: string, userName: string, verifyLink: string) =>
    mailer
      .send({
        template: "verification",
        message: { to: email },
        locals: { userName, verifyLink }
      })
      .then(() => {
        appLogger.info(`Mail "verification" sent to "${email}"`);
      }),

  resetPassword: (email: string, userName: string, resetLink: string) =>
    mailer
      .send({
        template: "reset-password",
        message: { to: email },
        locals: { userName, resetLink }
      })
      .then(() => {
        appLogger.info(`Mail "reset-password" sent to "${email}"`);
      })
};
