export const PT_TIMEZONE = "America/Los_Angeles";

// Retries an async operation with exponential backoff.
// Retryable: network errors (no status) and 429/5xx. Non-retryable: 4xx client errors.
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 200,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = (err as { response?: { status?: number } }).response?.status;
      const retryable = !status || status === 429 || status >= 500;
      if (!retryable || attempt === maxAttempts - 1) throw err;
      await new Promise((res) => setTimeout(res, baseDelayMs * 2 ** attempt));
    }
  }
  throw lastError;
}

export function ptHour(): number {
  return parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: PT_TIMEZONE,
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
    10
  );
}
