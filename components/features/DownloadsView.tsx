"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { retryDownloadFromRecord } from "@/lib/download-client";
import { contentHref } from "@/lib/content-id";
import { formatRelativeDate } from "@/lib/temporal/dates";
import { PageHeader } from "@/components/ui/PageHeader";
import { StreamingLoader } from "@/components/ui/StreamingLoader";
import { FadeIn } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

interface DownloadItem {
  id: string;
  contentId: string;
  contentType: string;
  title: string;
  image?: string | null;
  filename?: string | null;
  season?: number | null;
  episode?: number | null;
  episodeLabel?: string;
  status: "preparing" | "ready" | "failed";
  fileUrl?: string | null;
  error?: string | null;
  createdAt: string;
}

const STATUS_CONFIG = {
  preparing: {
    label: "Preparando",
    icon: Loader2,
    className: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
    spin: true,
  },
  ready: {
    label: "Listo",
    icon: CheckCircle2,
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    spin: false,
  },
  failed: {
    label: "Error",
    icon: AlertCircle,
    className: "border-red-500/30 bg-red-500/10 text-red-300",
    spin: false,
  },
} as const;

export function DownloadsView() {
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadDownloads = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/downloads");
      const data = (await res.json()) as { items?: DownloadItem[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "No se pudieron cargar las descargas");
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las descargas.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDownloads();
  }, [loadDownloads]);

  async function handleDelete(id: string) {
    setActionId(id);
    try {
      const res = await fetch(`/api/downloads/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("No se pudo eliminar");
      setItems((current) => current.filter((item) => item.id !== id));
    } catch {
      window.alert("No se pudo eliminar la descarga.");
    } finally {
      setActionId(null);
    }
  }

  async function handleRetry(item: DownloadItem) {
    setActionId(item.id);
    try {
      const res = await fetch("/api/downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: item.contentId,
          season: item.season ?? 1,
          episode: item.episode ?? 1,
          type: item.contentType,
        }),
      });

      const data = (await res.json()) as {
        available?: boolean;
        fileUrl?: string;
        filename?: string;
        item?: DownloadItem;
        error?: string;
      };

      if (!res.ok || !data.available || !data.item) {
        throw new Error(data.error ?? "No se pudo reintentar");
      }

      if (data.fileUrl && data.filename) {
        retryDownloadFromRecord(data.fileUrl, data.filename);
      }

      await loadDownloads();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo reintentar la descarga.");
    } finally {
      setActionId(null);
    }
  }

  function handleDownload(item: DownloadItem) {
    if (!item.fileUrl || !item.filename) return;
    retryDownloadFromRecord(item.fileUrl, item.filename);
  }

  return (
    <FadeIn className="px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader
        title="Mis descargas"
        subtitle="Descargas iniciadas desde LumixTV en este dispositivo"
        count={loading ? undefined : items.length}
      />

      {loading && <StreamingLoader className="py-16" label="" size="sm" />}

      {error && !loading && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-16 text-center">
          <Download size={40} className="mx-auto mb-4 text-zinc-600" strokeWidth={1.5} />
          <p className="text-sm text-zinc-400">Aún no tienes descargas registradas.</p>
          <p className="mt-2 text-xs text-zinc-600">
            Usa el botón Descargar en una película o episodio para verla aquí.
          </p>
          <Link
            href="/peliculas"
            className="mt-6 inline-flex rounded-xl bg-gold-500/15 px-4 py-2 text-sm font-semibold text-gold-400 transition-colors hover:bg-gold-500/25"
          >
            Explorar catálogo
          </Link>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => {
            const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.preparing;
            const StatusIcon = status.icon;
            const busy = actionId === item.id;
            const poster =
              item.image ??
              "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80";

            return (
              <article
                key={item.id}
                className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.02] dark:shadow-none sm:p-4"
              >
                <Link
                  href={contentHref(item.contentId)}
                  className="relative h-20 w-14 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-white/[0.06] dark:bg-surface-overlay sm:h-24 sm:w-16"
                >
                  <Image
                    src={poster}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized={poster.startsWith("http")}
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={contentHref(item.contentId)}
                        className="truncate text-sm font-semibold text-zinc-900 transition-colors hover:text-gold-700 dark:text-white dark:hover:text-gold-400 sm:text-base"
                      >
                        {item.title}
                      </Link>
                      {item.episodeLabel && (
                        <p className="mt-0.5 text-xs text-zinc-500">{item.episodeLabel}</p>
                      )}
                      {item.filename && (
                        <p className="mt-1 truncate text-xs text-zinc-600">{item.filename}</p>
                      )}
                      <p className="mt-1 text-[11px] text-zinc-600">
                        {formatRelativeDate(item.createdAt)}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
                        status.className,
                      )}
                    >
                      <StatusIcon
                        size={12}
                        className={status.spin ? "animate-spin" : undefined}
                      />
                      {status.label}
                    </span>
                  </div>

                  {item.status === "failed" && item.error && (
                    <p className="mt-2 text-xs text-red-300/90">{item.error}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.status === "ready" && item.fileUrl && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDownload(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-gold-500 to-amber-400 px-3 py-1.5 text-xs font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        <Download size={14} />
                        Descargar archivo
                      </button>
                    )}

                    {item.status === "failed" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleRetry(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-1.5 text-xs font-semibold text-gold-400 transition-colors hover:bg-gold-500/15 disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <RefreshCw size={14} />
                        )}
                        Reintentar
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleDelete(item.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-red-500/30 hover:text-red-300 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      Quitar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && items.length > 0 && (
        <p className="mt-6 text-center text-xs text-zinc-600">
          Los archivos se guardan en la carpeta de descargas de tu navegador o dispositivo.
        </p>
      )}
    </FadeIn>
  );
}
