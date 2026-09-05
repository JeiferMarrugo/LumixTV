export const AUTH_PUBLIC_PATHS = ["/login", "/verificar-correo"] as const;

export function isAuthPublicPath(pathname: string) {
  return AUTH_PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isAuthPublicApiPath(pathname: string) {
  return pathname.startsWith("/api/auth");
}

export function buildLoginUrl(pathname: string, origin: string) {
  const login = new URL("/login", origin);
  login.searchParams.set("alert", "auth_required");
  if (pathname !== "/") {
    login.searchParams.set("callbackUrl", pathname);
  }
  return login;
}
