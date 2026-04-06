// src/core/common/Logger.ts
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: Date;
  error?: Error;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, error?: Error, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date(),
      error
    };

    this.logs.push(entry);
    
    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output for development
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__DEV__) {
      const timestamp = entry.timestamp.toISOString();
      const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
      const errorStr = error ? ` | Error: ${error.message}` : '';
      
      switch (level) {
        case LogLevel.ERROR:
          console.error(`[${timestamp}] ERROR: ${message}${contextStr}${errorStr}`);
          break;
        case LogLevel.WARN:
          console.warn(`[${timestamp}] WARN: ${message}${contextStr}`);
          break;
        case LogLevel.INFO:
          console.info(`[${timestamp}] INFO: ${message}${contextStr}`);
          break;
        case LogLevel.DEBUG:
          console.debug(`[${timestamp}] DEBUG: ${message}${contextStr}`);
          break;
      }
    }
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log(LogLevel.ERROR, message, error, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.WARN, message, undefined, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.INFO, message, undefined, context);
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.DEBUG, message, undefined, context);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
  }
}

export const logger = Logger.getInstance();
