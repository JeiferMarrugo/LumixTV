import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  align?: "left" | "center";
  /** Sin subrayado decorativo — ideal para la notch bar */
  compact?: boolean;
}

const configs = {
  sm: {
    lumix: "text-[1.15rem]",
    tv: "text-[0.5rem] tracking-[0.38em]",
    gap: "gap-2",
    line: "mt-1.5",
    separator: "h-3.5",
  },
  md: {
    lumix: "text-[1.75rem]",
    tv: "text-[0.6rem] tracking-[0.5em]",
    gap: "gap-2.5",
    line: "mt-2",
    separator: "h-3.5",
  },
  lg: {
    lumix: "text-[2.25rem]",
    tv: "text-[0.65rem] tracking-[0.55em]",
    gap: "gap-3",
    line: "mt-2.5",
    separator: "h-4",
  },
};

export function Logo({ size = "md", align = "center", compact = false }: LogoProps) {
  const cfg = configs[size];
  const alignClass = align === "center" ? "items-center" : "items-start";

  return (
    <Link
      href="/"
      className={`group inline-flex flex-col ${alignClass} transition-opacity hover:opacity-90`}
    >
      <div className={`flex items-center ${cfg.gap}`}>
        <span
          className={`font-display font-bold leading-none tracking-[0.22em] text-gold-500 transition-colors group-hover:text-gold-400 ${cfg.lumix}`}
        >
          LUMIX
        </span>

        <span
          className={`w-px shrink-0 bg-gradient-to-b from-transparent via-gold-500/60 to-transparent ${cfg.separator}`}
          aria-hidden
        />

        <span
          className={`font-brand font-semibold leading-none text-zinc-400 transition-colors group-hover:text-gold-500/80 ${cfg.tv}`}
        >
          TV
        </span>
      </div>

      {!compact && (
        <div
          className={`h-px w-full bg-gradient-to-r from-transparent via-gold-500/80 to-transparent transition-all group-hover:via-gold-400 ${cfg.line}`}
          aria-hidden
        />
      )}
    </Link>
  );
}
