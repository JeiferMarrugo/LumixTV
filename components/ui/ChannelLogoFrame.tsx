import { Tv } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChannelLogoFrameProps {
  logo?: string;
  alt?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Placa neutra para logos IPTV: gradiente gris medio para marcas
 * oscuras y claras, con sombra en el logo para separarlo del fondo.
 */
export function ChannelLogoFrame({
  logo,
  alt = "",
  compact = false,
  className,
}: ChannelLogoFrameProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center",
        compact ? "p-2" : "p-3.5 sm:p-4",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center overflow-hidden rounded-[14px]",
          "bg-[linear-gradient(160deg,#f4f5f7_0%,#d1d6dc_45%,#9aa3ad_100%)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-8px_16px_rgba(0,0,0,0.06)]",
          "ring-1 ring-black/[0.08]",
          "transition-transform duration-500 ease-out group-hover:scale-[1.015]",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 3px)",
          }}
        />

        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt={alt}
            className={cn(
              "relative z-[1] object-contain",
              compact ? "max-h-[74%] max-w-[80%]" : "max-h-[78%] max-w-[84%]",
              "drop-shadow-[0_0_1px_rgba(0,0,0,0.9)] drop-shadow-[0_3px_8px_rgba(0,0,0,0.18)]",
              "transition-transform duration-500 ease-out group-hover:scale-[1.05]",
            )}
            loading="lazy"
          />
        ) : (
          <Tv size={compact ? 22 : 34} className="relative z-[1] text-zinc-500/90" strokeWidth={1.5} />
        )}
      </div>
    </div>
  );
}
