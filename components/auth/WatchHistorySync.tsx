"use client";

import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { useAppStore } from "@/lib/store/use-app-store";
import { fetchServerContinueWatching } from "@/lib/watch-history-client";

/**
 * Mantiene "Continuar viendo" y la watchlist alineados con la sesión activa.
 * Sin esto, el persist de Zustand en localStorage se comparte entre cuentas
 * en el mismo navegador.
 */
export function WatchHistorySync() {
  const { data: session, isPending } = authClient.useSession();
  const resetForUser = useAppStore((s) => s.resetForUser);
  const hydrateContinueWatching = useAppStore((s) => s.hydrateContinueWatching);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (isPending) return;

    const userId = session?.user?.id ?? null;

    if (userId !== lastUserId.current) {
      resetForUser(userId);
      lastUserId.current = userId;
    }

    if (!userId) return;

    void fetchServerContinueWatching().then((items) => {
      hydrateContinueWatching(items);
    });
  }, [session?.user?.id, isPending, resetForUser, hydrateContinueWatching]);

  return null;
}
