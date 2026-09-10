/** Prefijos que Better Auth usa según el contexto (HTTP vs HTTPS). */
const SESSION_COOKIE_BASES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
  "__Host-better-auth.session_token",
] as const;

export function isSessionCookieName(name: string) {
  return SESSION_COOKIE_BASES.some(
    (base) => name === base || name.startsWith(`${base}.`),
  );
}

export function requestHasSessionCookie(
  cookies: Array<{ name: string }>,
): boolean {
  return cookies.some((cookie) => isSessionCookieName(cookie.name));
}
