import { appEnv } from "@/lib/app-env";
import nodemailer from "nodemailer";
import Email from "email-templates";

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
    root: "/home/radium/ser/follows/allapi/src/mailer/templates",
    locals: {
      clientUrl: appEnv.CLIENT_URL
    },
    options: { extension: "ejs" }
  },
  preview: false,
  send: true,
  transport: transport
});

export const mailPresets = {
  welcome: (email: string) =>
    mailer.send({
      template: "welcome",
      message: {
        from: "<no-reply@example.com>",
        to: email
      }
    })
};
