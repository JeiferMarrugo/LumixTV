"use client";

import { ExternalLink, X } from "lucide-react";
import type { LiveChannel } from "@/lib/iptv/types";
import { getUnavailableChannelMessage } from "@/lib/iptv/channel-availability";

interface UnavailableChannelDialogProps {
  channel: LiveChannel;
  onClose: () => void;
}

export function UnavailableChannelDialog({ channel, onClose }: UnavailableChannelDialogProps) {
  const message = getUnavailableChannelMessage(channel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">Sin señal</p>
            <h2 className="mt-1 text-lg font-semibold text-white">{channel.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 p-2 text-zinc-400 transition-colors hover:text-white"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm font-medium text-white">{message.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{message.body}</p>
        {"alternatives" in message && message.alternatives && (
          <p className="mt-3 text-sm text-gold-400/90">{message.alternatives}</p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {"actionUrl" in message && message.actionUrl && message.actionLabel && (
            <a
              href={message.actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gold-500 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold-400"
            >
              {message.actionLabel}
              <ExternalLink size={14} />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
