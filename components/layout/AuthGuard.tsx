"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { buildLoginUrl, isAuthPublicPath } from "@/lib/auth-routes";
import { StreamingLoader } from "@/components/ui/StreamingLoader";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending || isAuthPublicPath(pathname)) return;

    if (!session?.user) {
      const login = buildLoginUrl(pathname, window.location.origin);
      router.replace(`${login.pathname}${login.search}`);
    }
  }, [isPending, session, pathname, router]);

  if (isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <StreamingLoader label="Verificando sesión..." />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return children;
}
