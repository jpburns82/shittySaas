/**
 * Structured Logging Utility
 *
 * Provides consistent, structured logging across the application.
 * Logs include timestamps, levels, and context for easier debugging.
 *
 * Usage:
 *   const log = createLogger('webhook')
 *   log.info('Processing payment', { purchaseId: '123' })
 *   log.error('Payment failed', { error: err.message })
 */

/* eslint-disable no-console */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// In production, skip debug logs
const MIN_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL]
}

function formatLog(
  level: LogLevel,
  context: string,
  message: string,
  meta?: Record<string, unknown>
): string {
  const timestamp = new Date().toISOString()
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
  return `${timestamp} [${level.toUpperCase()}] [${context}] ${message}${metaStr}`
}

export interface Logger {
  debug: (message: string, meta?: Record<string, unknown>) => void
  info: (message: string, meta?: Record<string, unknown>) => void
  warn: (message: string, meta?: Record<string, unknown>) => void
  error: (message: string, meta?: Record<string, unknown>) => void
}

/**
 * Create a logger instance with a specific context
 * @param context - The context/module name (e.g., 'webhook', 'escrow', 'virustotal')
 */
export function createLogger(context: string): Logger {
  return {
    debug: (message: string, meta?: Record<string, unknown>) => {
      if (shouldLog('debug')) {
        console.log(formatLog('debug', context, message, meta))
      }
    },
    info: (message: string, meta?: Record<string, unknown>) => {
      if (shouldLog('info')) {
        console.log(formatLog('info', context, message, meta))
      }
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      if (shouldLog('warn')) {
        console.warn(formatLog('warn', context, message, meta))
      }
    },
    error: (message: string, meta?: Record<string, unknown>) => {
      if (shouldLog('error')) {
        console.error(formatLog('error', context, message, meta))
      }
    },
  }
}

// Pre-configured loggers for common contexts
export const webhookLog = createLogger('webhook')
export const escrowLog = createLogger('escrow')
export const vtLog = createLogger('virustotal')
export const twilioLog = createLogger('twilio')
export const cronLog = createLogger('cron')
