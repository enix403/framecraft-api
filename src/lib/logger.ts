import { createLogger, format, transports, config } from "winston";
import { blackBright } from "colorette";

const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.printf(
    (info) =>
      blackBright(`[${info.timestamp}]`) + //
      ` (${info.level}): ${info.message}`,
  ),
);

export const appLogger = createLogger({
  levels: config.npm.levels,
  format: logFormat,
  transports: [
    new transports.Console({
      level: "verbose",
      format: format.combine(format.colorize(), logFormat),
    }),
    new transports.File({
      level: 'info',
      format: format.combine(logFormat, format.uncolorize()),
      filename: 'logs/combined.log'
    })
  ],
  exitOnError: false,
});
