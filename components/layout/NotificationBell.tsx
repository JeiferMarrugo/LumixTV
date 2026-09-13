"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  href: string | null;
  createdAt: string;
}

function formatRelative(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

export function NotificationBell({ compact = false }: { compact?: boolean }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [menuStyle, setMenuStyle] = useState<{ top: number; right: number } | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as { items: NotificationItem[]; unread: number };
      setItems(data.items);
      setUnread(data.unread);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    const interval = setInterval(() => void loadNotifications(), 60_000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      setMenuStyle({
        top: rect.bottom + 8,
        right: Math.max(16, window.innerWidth - rect.right),
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((count) => Math.max(0, count - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }

  const panel =
    open && menuStyle && typeof document !== "undefined"
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[300]"
              onClick={() => setOpen(false)}
              aria-label="Cerrar notificaciones"
            />
            <div
              className="fixed z-[310] w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border-subtle bg-surface-raised shadow-xl"
              style={{ top: menuStyle.top, right: menuStyle.right }}
            >
              <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">Notificaciones</p>
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={() => void markAllRead()}
                    className="flex items-center gap-1 text-xs text-gold-500 hover:text-gold-400"
                  >
                    <CheckCheck size={14} />
                    Marcar todas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 size={20} className="animate-spin text-gold-500" />
                  </div>
                ) : items.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-zinc-500">
                    No tienes notificaciones
                  </p>
                ) : (
                  items.map((item) => {
                    const content = (
                      <div
                        className={`border-l-2 px-4 py-3 transition-colors hover:bg-surface-overlay ${
                          item.read ? "border-transparent opacity-70" : "border-gold-500"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">{item.title}</p>
                          <span className="shrink-0 text-[10px] text-zinc-500">
                            {formatRelative(item.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{item.message}</p>
                      </div>
                    );

                    if (item.href) {
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => {
                            if (!item.read) void markRead(item.id);
                            setOpen(false);
                          }}
                          className="block"
                        >
                          {content}
                        </Link>
                      );
                    }

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => !item.read && void markRead(item.id)}
                        className="block w-full text-left"
                      >
                        {content}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void loadNotifications();
        }}
        className={`relative text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white ${
          compact
            ? "flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
            : "rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-surface-overlay"
        }`}
        aria-label="Notificaciones"
      >
        <Bell size={compact ? 18 : 20} />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-black">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {panel}
    </div>
  );
}
