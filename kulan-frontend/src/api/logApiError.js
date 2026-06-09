/**
 * Compact Metro logs for failed API calls.
 * Expected 4xx (validation, duplicate email, etc.) → one line; UI already shows the message.
 * Server/network issues → warn, still one line (no full axios dump).
 */
export function logApiError(error) {
  const method = (error?.config?.method || 'get').toUpperCase();
  const url = error?.config?.url || 'unknown';
  const status = error?.response?.status;
  const data = error?.response?.data;
  const ngrokErrorCode = error?.response?.headers?.['ngrok-error-code'];

  let message = error?.message || 'Request failed';
  if (typeof data === 'string' && data.trim()) {
    message = data.trim();
  } else if (data?.message) {
    message = data.message;
  } else if (data?.error) {
    message = data.error;
  }

  const baseURL = error?.config?.baseURL;
  const fullUrl =
    baseURL && url
      ? `${String(baseURL).replace(/\/$/, '')}${String(url).startsWith('/') ? url : `/${url}`}`
      : null;
  const line = status
    ? `[API] ${method} ${url} → ${status}: ${message}`
    : fullUrl
      ? `[API] ${method} ${url}: ${message} (${fullUrl})`
      : `[API] ${method} ${url}: ${message}`;

  const isExpectedClientError =
    typeof status === 'number' && status >= 400 && status < 500;

  if (isExpectedClientError) {
    console.log(line);
  } else {
    console.warn(line);
    if (ngrokErrorCode) {
      console.warn(`[API] ngrok: ${ngrokErrorCode}`);
    }
  }
}
