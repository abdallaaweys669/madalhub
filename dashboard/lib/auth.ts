import { TOKEN_KEY } from "./auth-constants";

export { TOKEN_KEY };

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function readCookieToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${TOKEN_KEY}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(TOKEN_KEY.length + 1));
}

export function getToken(): string | null {
  const stored = localStorage.getItem(TOKEN_KEY);
  if (stored) return stored;

  const cookieToken = readCookieToken();
  if (cookieToken) {
    localStorage.setItem(TOKEN_KEY, cookieToken);
    return cookieToken;
  }

  return null;
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}
