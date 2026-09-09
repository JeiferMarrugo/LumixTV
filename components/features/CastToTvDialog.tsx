"use client";

import { useEffect, useState } from "react";
import { Cast, Check, Copy, Smartphone, Tv, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CastToTvDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  playUrl: string;
}

export function CastToTvDialog({ open, onClose, title, playUrl }: CastToTvDialogProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(playUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(playUrl)}&bgcolor=141414&color=d4a017&margin=12`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gold-500/20 bg-surface-raised shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-gold-500/10 to-transparent" />

        <div className="relative border-b border-white/5 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/15 text-gold-400">
              <Cast size={20} />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white">Enviar al televisor</h3>
              <p className="text-xs text-zinc-500">{title}</p>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="rounded-2xl border border-gold-500/20 bg-black/40 p-3">
              <img src={qrUrl} alt="Código QR para abrir en el televisor" className="h-[220px] w-[220px] rounded-xl" />
            </div>

            <div className="flex-1 space-y-3 text-sm text-zinc-400">
              <div className="flex items-start gap-2.5">
                <Smartphone size={16} className="mt-0.5 shrink-0 text-gold-500" />
                <p>Escanea el código QR con la cámara de tu teléfono.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <Tv size={16} className="mt-0.5 shrink-0 text-gold-500" />
                <p>Abre el enlace en el navegador del televisor (Smart TV, Chromecast o consola).</p>
              </div>
              <p className="text-xs text-zinc-600">
                La reproducción continuará en pantalla grande con la misma cuenta.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-black/30 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Enlace directo
            </p>
            <p className="break-all text-xs text-zinc-400">{playUrl}</p>
          </div>

          <button
            type="button"
            onClick={() => void copyLink()}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
              copied
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-gold-500 text-black hover:bg-gold-400",
            )}
          >
            {copied ? (
              <>
                <Check size={16} />
                Enlace copiado
              </>
            ) : (
              <>
                <Copy size={16} />
                Copiar enlace
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
