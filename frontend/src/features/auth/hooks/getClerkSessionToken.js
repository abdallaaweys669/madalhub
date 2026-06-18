const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Clerk session can take a short moment to become readable after setActive/verification.
 * Retry briefly to avoid flaky "missing token" failures.
 */
export default async function getClerkSessionToken(getToken, attempts = 3, delayMs = 250) {
  for (let i = 0; i < attempts; i += 1) {
    const token = await getToken();
    if (token) return token;
    if (i < attempts - 1) {
      await sleep(delayMs);
    }
  }
  return null;
}
