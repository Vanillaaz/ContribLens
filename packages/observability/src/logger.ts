import { pino, type Logger } from "pino";

// A global default instance
export const logger: Logger = pino({
  level: process.env["LOG_LEVEL"] || "info",
  ...(process.env["NODE_ENV"] !== "production"
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        },
      }
    : {}),
});

/**
 * Creates a child logger with a specific context bound to it.
 * Useful for injecting request IDs or component names.
 */
export function createLogger(context: Record<string, unknown>): Logger {
  return logger.child(context);
}

export type { Logger };
