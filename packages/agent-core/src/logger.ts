/**
 * Application Logging & Error Tracking Standard
 * Adheres to application-logging-guidelines:
 * - Levels: TRACE, DEBUG, INFO, WARN, ERROR
 * - Secret Redaction: Automatically redacts API keys, tokens, and credentials
 * - Structured Correlation: Supports runId, threadId, provider, and durationMs context
 * - Stack Trace Discipline: Full traces on ERROR, concise messages on WARN
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

function appendToFile(line: string): void {
  try {
    const logFilePath =
      process.env.LOG_FILE_PATH ||
      path.resolve(process.cwd(), '.data', 'logs', 'creative.log');
    fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
    fs.appendFileSync(logFilePath, line + '\n', 'utf8');
  } catch {
    // Ignore logging disk errors to preserve process liveness
  }
}

const LEVEL_WEIGHTS: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
};

export type LogContext = Record<string, unknown>;

// Regex patterns to detect and redact sensitive credentials
const SECRET_PATTERNS = [
  /sk-proj-[a-zA-Z0-9_-]{10,}/g,
  /sk-[a-zA-Z0-9_-]{20,}/g,
  /xox[baprs]-[a-zA-Z0-9-]+/g,
  /cpk-[a-zA-Z0-9_-]{10,}/g,
  /cpk_[a-zA-Z0-9_-]{10,}/g,
  /(Bearer\s+)[a-zA-Z0-9_.-]{16,}/gi,
  /(Key\s+)[a-zA-Z0-9_-]{16,}/gi,
  /(apiKey["'\s:]+)[a-zA-Z0-9_-]{16,}/gi,
];

export function redactSensitiveData(value: unknown): unknown {
  if (typeof value === 'string') {
    let sanitized = value;
    for (const pattern of SECRET_PATTERNS) {
      sanitized = sanitized.replace(pattern, (match, prefix) => {
        return prefix ? `${prefix}[REDACTED]` : '[REDACTED]';
      });
    }
    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveData(item));
  }

  if (value !== null && typeof value === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('key') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('authorization') ||
        lowerKey.includes('password')
      ) {
        sanitizedObj[key] = '[REDACTED]';
      } else {
        sanitizedObj[key] = redactSensitiveData(val);
      }
    }
    return sanitizedObj;
  }

  return value;
}

export interface LoggerOptions {
  component?: string;
  defaultContext?: LogContext;
}

export class Logger {
  private component: string;
  private defaultContext: LogContext;

  constructor(options: LoggerOptions = {}) {
    this.component = options.component || 'core';
    this.defaultContext = options.defaultContext || {};
  }

  private getCurrentLogLevel(): LogLevel {
    const envLevel = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
    return LEVEL_WEIGHTS[envLevel] !== undefined ? envLevel : 'info';
  }

  private isLevelEnabled(level: LogLevel): boolean {
    const currentLevel = this.getCurrentLogLevel();
    return LEVEL_WEIGHTS[level] >= LEVEL_WEIGHTS[currentLevel];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: unknown
  ): string {
    const timestamp = new Date().toISOString();
    const mergedContext = {
      ...this.defaultContext,
      ...(context || {}),
    };

    const isJsonFormat = process.env.LOG_FORMAT === 'json' || process.env.NODE_ENV === 'production';

    const cleanContext = redactSensitiveData(mergedContext) as Record<string, unknown>;
    const cleanMessage = redactSensitiveData(message) as string;

    if (isJsonFormat) {
      const record: Record<string, unknown> = {
        timestamp,
        level: level.toUpperCase(),
        component: this.component,
        message: cleanMessage,
        context: cleanContext,
      };

      if (error) {
        if (error instanceof Error) {
          record.error = {
            name: error.name,
            message: error.message,
            stack: level === 'error' ? error.stack : undefined,
            cause: error.cause,
          };
        } else {
          record.error = String(error);
        }
      }

      return JSON.stringify(record);
    }

    // Pretty console format for local terminal / development
    const levelBadge = `[${level.toUpperCase().padEnd(5)}]`;
    const compBadge = `[${this.component}]`;
    const ctxString =
      Object.keys(cleanContext).length > 0 ? ` ${JSON.stringify(cleanContext)}` : '';

    let out = `${timestamp} ${levelBadge} ${compBadge} ${cleanMessage}${ctxString}`;

    if (error) {
      if (level === 'error' && error instanceof Error && error.stack) {
        out += `\n${error.stack}`;
      } else if (error instanceof Error) {
        out += ` (Error: ${error.message})`;
      } else {
        out += ` (Error: ${String(error)})`;
      }
    }

    return out;
  }

  public trace(message: string, context?: LogContext): void {
    if (!this.isLevelEnabled('trace')) return;
    const formatted = this.formatMessage('trace', message, context);
    console.debug(formatted);
    appendToFile(formatted);
  }

  public debug(message: string, context?: LogContext): void {
    if (!this.isLevelEnabled('debug')) return;
    const formatted = this.formatMessage('debug', message, context);
    console.debug(formatted);
    appendToFile(formatted);
  }

  public info(message: string, context?: LogContext): void {
    if (!this.isLevelEnabled('info')) return;
    const formatted = this.formatMessage('info', message, context);
    console.info(formatted);
    appendToFile(formatted);
  }

  public warn(message: string, context?: LogContext, error?: unknown): void {
    if (!this.isLevelEnabled('warn')) return;
    const formatted = this.formatMessage('warn', message, context, error);
    console.warn(formatted);
    appendToFile(formatted);
  }

  public error(message: string, error?: unknown, context?: LogContext): void {
    if (!this.isLevelEnabled('error')) return;
    const formatted = this.formatMessage('error', message, context, error);
    console.error(formatted);
    appendToFile(formatted);
  }

  /**
   * Spawns a child logger with bound contextual metadata (e.g. runId, threadId).
   */
  public child(context: LogContext, component?: string): Logger {
    return new Logger({
      component: component || this.component,
      defaultContext: {
        ...this.defaultContext,
        ...context,
      },
    });
  }
}

export const logger = new Logger({ component: 'app' });
