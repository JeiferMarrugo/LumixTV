"use client";

import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export type AuthAlertType = "success" | "error" | "info";

interface AuthAlertProps {
  type: AuthAlertType;
  message: string;
}

const styles: Record<AuthAlertType, string> = {
  success:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  error: "border-red-500/30 bg-red-500/10 text-red-300",
  info: "border-gold-500/30 bg-gold-500/10 text-gold-300",
};

const icons: Record<AuthAlertType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function AuthAlert({ type, message }: AuthAlertProps) {
  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.25 }}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${styles[type]}`}
      role="alert"
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p className="leading-relaxed">{message}</p>
    </motion.div>
  );
}

export function AuthAlertContainer({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      {children}
    </AnimatePresence>
  );
}
