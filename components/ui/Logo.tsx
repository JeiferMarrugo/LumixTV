import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  align?: "left" | "center";
}

const configs = {
  sm: {
    lumix: "text-xl",
    tv: "text-[0.55rem] tracking-[0.45em]",
    gap: "gap-2",
    line: "mt-1.5",
    separator: "h-3",
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

export function Logo({ size = "md", align = "center" }: LogoProps) {
  const cfg = configs[size];
  const alignClass = align === "center" ? "items-center" : "items-start";

  return (
    <Link
      href="/"
      className={`group inline-flex flex-col ${alignClass} transition-opacity hover:opacity-90`}
    >
      <div className={`flex items-center ${cfg.gap}`}>
        <span
          className={`font-display font-semibold leading-none tracking-[0.2em] text-gold-500 transition-colors group-hover:text-gold-400 ${cfg.lumix}`}
        >
          LUMIX
        </span>

        <span
          className={`w-px shrink-0 bg-gradient-to-b from-transparent via-gold-500/50 to-transparent ${cfg.separator}`}
          aria-hidden
        />

        <span
          className={`font-brand font-medium leading-none text-zinc-500 transition-colors group-hover:text-gold-500/70 ${cfg.tv}`}
        >
          TV
        </span>
      </div>

      <div
        className={`h-px w-full bg-gradient-to-r from-transparent via-gold-500/80 to-transparent transition-all group-hover:via-gold-400 ${cfg.line}`}
        aria-hidden
      />
    </Link>
  );
}
