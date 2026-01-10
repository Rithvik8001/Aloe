/**
 * Security event logging
 * Logs security-related events for monitoring and analysis
 * Can be integrated with Sentry, Datadog, or other logging services
 */

export type SecurityEventType =
  | "SSRF_ATTEMPT"
  | "PROTOCOL_VIOLATION"
  | "PRIVATE_IP_ACCESS"
  | "DNS_REBINDING"
  | "RATE_LIMIT_EXCEEDED"
  | "INVALID_URL"
  | "TIMEOUT"
  | "REDIRECT_LIMIT"
  | "CONTENT_TYPE_VIOLATION"
  | "SIZE_LIMIT_EXCEEDED";

export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ip?: string;
  url: string;
  reason: string;
  timestamp: string;
  userAgent?: string;
}

/**
 * Logs a security event
 */
export function logSecurityEvent(event: Omit<SecurityEvent, "timestamp">): void {
  const logEntry: SecurityEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // For MVP, use console.log with structured JSON
  console.warn("[SECURITY EVENT]", JSON.stringify(logEntry));

  // TODO: Integration points for production
  // - Send to Sentry: Sentry.captureMessage(...)
  // - Send to Datadog: datadog.log(...)
  // - Send to CloudWatch Logs
  // - Send to application monitoring service
}

/**
 * Logs a fetch attempt for debugging
 */
export function logFetchAttempt(
  url: string,
  userId?: string,
  success: boolean = true
): void {
  console.log(
    `[FETCH ${success ? "SUCCESS" : "FAILURE"}]`,
    JSON.stringify({
      url,
      userId,
      timestamp: new Date().toISOString(),
    })
  );
}
