import pino, { type LoggerOptions } from "pino";

const isProduction = process.env["NODE_ENV"] === "production";

const logLevel = process.env["LOG_LEVEL"] ?? "info";

const loggerOptions: LoggerOptions = {
  level: logLevel,
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            singleLine: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname,time",
            messageFormat: "{msg}",
          },
        },
      }),
};

export const logger = pino(loggerOptions);
