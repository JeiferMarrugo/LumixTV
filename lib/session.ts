import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/roles";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role?: string | null;
  banned?: boolean | null;
};

export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export function getSessionUserRole(user: SessionUser | undefined) {
  return user?.role ?? "user";
}

export async function requireAuthSession() {
  const session = await getServerSession();
  if (!session?.user) return null;
  return session;
}

export async function requireSuperAdminSession() {
  const session = await requireAuthSession();
  if (!session) return null;

  const role = getSessionUserRole(session.user as SessionUser);
  if (!isSuperAdmin(role)) return null;

  return session;
}
