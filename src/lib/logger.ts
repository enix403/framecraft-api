import { createLogger, format, transports, config } from "winston";
import {
  bgBlue,
  bgMagenta,
  bgWhite,
  blackBright,
  gray,
  italic,
  yellow,
} from "colorette";
const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(({ level, message, timestamp }) => {
  return (
    blackBright(`[${timestamp}]`) + //
    ` (${level}): ${message}`
  );
});

export const appLogger = createLogger({
  levels: config.npm.levels,
  format: combine(
    timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    logFormat,
  ),
  transports: [
    new transports.Console({
      level: 'verbose',
      format: combine(colorize(), logFormat),
    }),
  ],
  exitOnError: false,
});
