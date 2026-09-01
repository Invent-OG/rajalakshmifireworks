/**
 * Structured logging for critical operations.
 * In production, this would be replaced with a proper logging service (e.g., Pino, Winston).
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  operation: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

function createLogEntry(level: LogLevel, operation: string, message: string, data?: Record<string, unknown>): LogEntry {
  return {
    level,
    operation,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

export const logger = {
  info(operation: string, message: string, data?: Record<string, unknown>) {
    const entry = createLogEntry('info', operation, message, data);
    console.log(JSON.stringify(entry));
  },

  warn(operation: string, message: string, data?: Record<string, unknown>) {
    const entry = createLogEntry('warn', operation, message, data);
    console.warn(JSON.stringify(entry));
  },

  error(operation: string, message: string, data?: Record<string, unknown>) {
    const entry = createLogEntry('error', operation, message, data);
    console.error(JSON.stringify(entry));
  },

  debug(operation: string, message: string, data?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development') {
      const entry = createLogEntry('debug', operation, message, data);
      console.debug(JSON.stringify(entry));
    }
  },
};
