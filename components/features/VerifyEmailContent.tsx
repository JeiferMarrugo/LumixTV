"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/ui/Logo";
import { AuthAlert, AuthAlertContainer } from "@/components/ui/AuthAlert";
import { FadeIn } from "@/components/ui/motion";

interface VerifyEmailPageProps {
  email?: string;
}

function isAlreadyVerifiedError(message?: string) {
  if (!message) return false;
  const lower = message.toLowerCase();
  return lower.includes("already verified") || lower.includes("ya verificado");
}

export function VerifyEmailContent({ email: initialEmail }: VerifyEmailPageProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
    else if (session?.user.email) setEmail(session.user.email);
  }, [initialEmail, session?.user.email]);

  useEffect(() => {
    if (isPending) return;
    if (session?.user.emailVerified) {
      router.replace("/login?alert=verified");
    }
  }, [isPending, session?.user.emailVerified, router]);

  async function handleResend() {
    if (!email) {
      setMessage({ type: "error", text: "Ingresa tu correo electrónico." });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await authClient.sendVerificationEmail({ email });

    setLoading(false);

    if (error) {
      if (isAlreadyVerifiedError(error.message)) {
        router.replace("/login?alert=verified");
        return;
      }
      setMessage({ type: "error", text: error.message ?? "No se pudo reenviar el correo." });
      return;
    }

    setMessage({
      type: "success",
      text: "Correo reenviado. Revisa tu bandeja de entrada y spam.",
    });
  }

  if (isPending || session?.user.emailVerified) {
    return (
      <FadeIn className="relative z-10 w-full max-w-[420px]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface/80 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="flex items-center justify-center px-8 py-16">
            <Loader2 size={28} className="animate-spin text-gold-500" />
          </div>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn className="relative z-10 w-full max-w-[420px]">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface/80 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="border-b border-white/5 px-8 pb-6 pt-8">
          <div className="mb-6 flex justify-center">
            <Logo size="lg" align="center" />
          </div>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/10 ring-1 ring-gold-500/20">
            <Mail size={30} className="text-gold-500" />
          </div>
          <h1 className="text-center text-xl font-bold text-white">Verifica tu correo</h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-zinc-500">
            Te enviamos un enlace de confirmación. Haz clic en el botón del correo para activar tu
            cuenta.
          </p>
        </div>

        <div className="px-8 pb-8 pt-6">
          <AuthAlertContainer>
            {message && (
              <div className="mb-5">
                <AuthAlert type={message.type} message={message.text} />
              </div>
            )}
          </AuthAlertContainer>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full rounded-xl border border-border-subtle bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20"
              />
            </div>

            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold-500/30 py-3.5 text-sm font-semibold text-gold-500 transition-colors hover:border-gold-500/50 hover:bg-gold-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Enviando...
                </>
              ) : (
                "Reenviar correo de verificación"
              )}
            </button>
          </div>

          <div className="mt-8 border-t border-white/5 pt-5 text-center">
            <Link
              href="/login"
              className="text-xs text-zinc-500 transition-colors hover:text-gold-500"
            >
              ← Volver al login
            </Link>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
