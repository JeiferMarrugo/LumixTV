"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Clapperboard, Film, Popcorn, Sparkles, TvMinimalPlay } from "lucide-react";

interface StreamingLoaderProps {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const POPCORN_IMAGE =
  "https://images.unsplash.com/photo-1574269900165-440282e5c8a?w=520&q=85&auto=format&fit=crop";
const CINEMA_IMAGE =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=520&q=85&auto=format&fit=crop";

const config = {
  sm: {
    stage: "h-36 w-36",
    image: "h-24 w-24",
    icon: 20,
    badge: 28,
    imageSizes: "96px",
  },
  md: {
    stage: "h-52 w-52",
    image: "h-36 w-36",
    icon: 24,
    badge: 34,
    imageSizes: "144px",
  },
  lg: {
    stage: "h-64 w-64",
    image: "h-44 w-44",
    icon: 28,
    badge: 40,
    imageSizes: "176px",
  },
} as const;

const floaters = [
  { Icon: Popcorn, x: -34, y: -28, delay: 0, rotate: -12 },
  { Icon: Popcorn, x: 38, y: -22, delay: 0.15, rotate: 10 },
  { Icon: Film, x: -40, y: 18, delay: 0.3, rotate: -8 },
  { Icon: Sparkles, x: 42, y: 24, delay: 0.45, rotate: 6 },
  { Icon: Popcorn, x: 0, y: -44, delay: 0.6, rotate: 0 },
];

export function StreamingLoader({
  label = "Preparando palomitas...",
  className = "",
  size = "md",
}: StreamingLoaderProps) {
  const s = config[size];
  const heroImage = size === "lg" ? CINEMA_IMAGE : POPCORN_IMAGE;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-6 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className={`relative ${s.stage}`}>
        <motion.div
          className="absolute inset-2 rounded-full bg-gold-500/15 blur-2xl"
          animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.4, 0.75, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute inset-0 rounded-full border border-gold-500/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-gold-400 shadow-[0_0_12px_rgba(212,160,23,0.8)]" />
        </motion.div>

        {floaters.map(({ Icon, x, y, delay, rotate }, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 text-gold-400"
            style={{ marginLeft: x, marginTop: y }}
            animate={{
              y: [y, y - 10, y],
              rotate: [rotate, rotate + 8, rotate],
              opacity: [0.55, 1, 0.55],
              scale: [0.9, 1.08, 0.9],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay,
              ease: "easeInOut",
            }}
          >
            <Icon
              size={s.icon}
              strokeWidth={1.75}
              className="drop-shadow-[0_0_8px_rgba(212,160,23,0.45)]"
            />
          </motion.div>
        ))}

        <motion.div
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2 border-gold-500/35 bg-black shadow-[0_0_40px_rgba(212,160,23,0.18)] ${s.image}`}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src={heroImage}
            alt=""
            fill
            className="object-cover"
            sizes={s.imageSizes}
            priority={size === "lg"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
        </motion.div>

        <motion.div
          className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center justify-center rounded-xl border border-gold-500/30 bg-black/80 text-gold-400 shadow-lg backdrop-blur-sm"
          style={{ width: s.badge, height: s.badge }}
          animate={{ rotate: [-10, 10, -10], y: [0, -2, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Clapperboard size={s.icon - 2} strokeWidth={1.75} />
        </motion.div>

        <motion.div
          className="absolute -right-1 top-2 rounded-full border border-gold-500/25 bg-black/70 p-1.5 text-gold-500 backdrop-blur-sm"
          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        >
          <TvMinimalPlay size={s.icon - 4} strokeWidth={1.75} />
        </motion.div>
      </div>

      {label && (
        <motion.div
          className="flex flex-col items-center gap-1.5"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <p className="text-sm font-semibold tracking-wide text-zinc-200">{label}</p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-gold-500"
                animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1.15, 0.85] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.18,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
