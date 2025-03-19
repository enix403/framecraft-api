import { blackBright } from "colorette";
import { config, createLogger, format, transports } from "winston";

const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(
    info =>
      blackBright(`[${info.timestamp}]`) + //
      ` (${info.level}): ${info.message}`
  )
);

export const appLogger = createLogger({
  levels: config.npm.levels,
  format: logFormat,
  transports: [
    new transports.Console({
      level: "verbose",
      format: format.combine(format.colorize(), logFormat)
    }),
    new transports.File({
      level: "info",
      format: format.combine(logFormat, format.uncolorize()),
      filename: "logs/combined.log"
    })
  ],
  exitOnError: false
});
