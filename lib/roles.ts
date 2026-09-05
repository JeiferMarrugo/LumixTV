export const SUPER_ADMIN_ROLE = "super_admin";
export const DEFAULT_USER_ROLE = "user";

export function isSuperAdmin(role?: string | null) {
  return role === SUPER_ADMIN_ROLE;
}

export function parseUserRole(role?: string | null) {
  return role ?? DEFAULT_USER_ROLE;
}
