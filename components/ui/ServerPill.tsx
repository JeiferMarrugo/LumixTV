import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SourceStatus = "pending" | "loading" | "failed" | "connected";

interface ServerPillProps {
  index: number;
  status: SourceStatus;
  label?: string;
  interactive?: boolean;
  onSelect?: () => void;
}

export function ServerPill({
  index,
  status,
  label,
  interactive = false,
  onSelect,
}: ServerPillProps) {
  const displayLabel = label ?? `Server ${index + 1}`;
  const className = cn(
    "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-300",
    status === "pending" && "border-white/10 bg-white/[0.04] text-zinc-500",
    status === "loading" &&
      "border-gold-500/50 bg-gold-500/10 text-gold-400 shadow-[0_0_20px_rgba(212,160,23,0.15)]",
    status === "failed" && "border-red-500/20 bg-red-500/5 text-red-400/70 line-through",
    status === "connected" &&
      "border-gold-500/40 bg-gold-500/15 text-gold-300 shadow-[0_0_16px_rgba(212,160,23,0.2)]",
    interactive &&
      status !== "loading" &&
      "cursor-pointer hover:border-gold-500/40 hover:bg-gold-500/10 hover:text-gold-300",
  );

  const content = (
    <>
      {status === "loading" && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-500" />
        </span>
      )}
      {status === "connected" && <Check size={12} className="text-gold-400" strokeWidth={2.5} />}
      {status === "failed" && <X size={12} className="text-red-400/60" strokeWidth={2} />}
      {displayLabel}
    </>
  );

  if (interactive && onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        disabled={status === "loading"}
        className={className}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}
