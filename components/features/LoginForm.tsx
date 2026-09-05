"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { motion } from "motion/react";
import { authClient } from "@/lib/auth-client";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { Logo } from "@/components/ui/Logo";
import { AuthAlert, AuthAlertContainer, type AuthAlertType } from "@/components/ui/AuthAlert";
import { FadeIn } from "@/components/ui/motion";

type AuthMode = "login" | "register";

interface StatusMessage {
  type: AuthAlertType;
  message: string;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-400">{message}</p>;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  useEffect(() => {
    const alert = searchParams.get("alert");
    if (alert === "auth_required") {
      setStatus({
        type: "info",
        message: "Debes iniciar sesión o registrarte para acceder a LumixTV.",
      });
    }
    if (alert === "verified") {
      setStatus({
        type: "success",
        message: "¡Tu correo ya está verificado! Inicia sesión para continuar.",
      });
    }
  }, [searchParams]);

  function switchMode(next: AuthMode) {
    setMode(next);
    setErrors({});
    setStatus(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setStatus(null);

    const payload =
      mode === "login"
        ? { email, password }
        : { email, password, name };

    const schema = mode === "login" ? loginSchema : registerSchema;
    const result = schema.safeParse(payload);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0]?.toString() ?? "form";
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      setStatus({
        type: "error",
        message: "Revisa los campos marcados antes de continuar.",
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await authClient.signIn.email({ email, password });

        if (error) {
          setStatus({
            type: "error",
            message: translateAuthError(error.message ?? "No se pudo iniciar sesión"),
          });
          return;
        }

        setStatus({
          type: "success",
          message: "¡Sesión iniciada correctamente! Redirigiendo...",
        });
        const callbackUrl = searchParams.get("callbackUrl");
        const destination =
          callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
            ? callbackUrl
            : "/";
        setTimeout(() => router.push(destination), 1400);
      } else {
        const { error } = await authClient.signUp.email({ email, password, name });

        if (error) {
          setStatus({
            type: "error",
            message: translateAuthError(error.message ?? "No se pudo crear la cuenta"),
          });
          return;
        }

        setStatus({
          type: "success",
          message:
            process.env.NEXT_PUBLIC_AUTH_REQUIRE_EMAIL_VERIFICATION === "false"
              ? "¡Cuenta creada! Redirigiendo..."
              : "¡Cuenta creada! Te enviamos un correo con un botón para confirmar tu cuenta.",
        });

        if (process.env.NEXT_PUBLIC_AUTH_REQUIRE_EMAIL_VERIFICATION === "false") {
          setTimeout(() => router.push("/"), 1400);
        } else {
          setTimeout(
            () => router.push(`/verificar-correo?email=${encodeURIComponent(email)}`),
            2000,
          );
        }
      }
    } catch {
      setStatus({
        type: "error",
        message: "Error de conexión. Verifica tu internet e inténtalo de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <FadeIn className="relative z-10 w-full max-w-[420px]">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface/80 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="border-b border-white/5 px-8 pb-6 pt-8">
          <div className="mb-6 flex justify-center">
            <Logo size="lg" align="center" />
          </div>
          <p className="text-center text-sm text-zinc-500">
            {mode === "login"
              ? "Accede a tu cuenta para continuar viendo"
              : "Crea tu cuenta y empieza a disfrutar"}
          </p>
        </div>

        <div className="px-8 pb-8 pt-6">
          <div className="relative mb-6 flex rounded-xl bg-black/40 p-1">
            {(["login", "register"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => switchMode(tab)}
                className={`relative z-10 flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                  mode === tab ? "text-gold-500" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab === "login" ? "Iniciar sesión" : "Registrarse"}
                {mode === tab && (
                  <motion.div
                    layoutId="auth-tab"
                    className="absolute inset-0 -z-10 rounded-lg bg-gold-500/15 ring-1 ring-gold-500/20"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          <AuthAlertContainer>
            {status && (
              <div className="mb-5">
                <AuthAlert type={status.type} message={status.message} />
              </div>
            )}
          </AuthAlertContainer>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <FieldLabel>Nombre</FieldLabel>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
                  />
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className={`w-full rounded-xl border bg-black/30 py-3 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 ${
                      errors.name ? "border-red-500/50" : "border-border-subtle"
                    }`}
                  />
                </div>
                <FieldError message={errors.name} />
              </div>
            )}

            <div>
              <FieldLabel>Correo electrónico</FieldLabel>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
                />
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className={`w-full rounded-xl border bg-black/30 py-3 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 ${
                    errors.email ? "border-red-500/50" : "border-border-subtle"
                  }`}
                />
              </div>
              <FieldError message={errors.email} />
            </div>

            <div>
              <FieldLabel>Contraseña</FieldLabel>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className={`w-full rounded-xl border bg-black/30 py-3 pl-10 pr-11 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 ${
                    errors.password ? "border-red-500/50" : "border-border-subtle"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors hover:text-zinc-400"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldError message={errors.password} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gold-500 py-3.5 text-sm font-bold text-black transition-all hover:bg-gold-400 hover:shadow-lg hover:shadow-gold-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {mode === "login" ? "Iniciando sesión..." : "Creando cuenta..."}
                </>
              ) : mode === "login" ? (
                "Entrar"
              ) : (
                "Crear cuenta"
              )}
            </button>
          </form>
        </div>
      </div>
    </FadeIn>
  );
}

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("verify") || lower.includes("verification") || lower.includes("verified")) {
    return "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.";
  }
  if (lower.includes("invalid") && (lower.includes("password") || lower.includes("email"))) {
    return "Correo o contraseña incorrectos.";
  }
  if (lower.includes("already") || lower.includes("exists")) {
    return "Este correo ya está registrado. Inicia sesión en su lugar.";
  }
  if (lower.includes("user not found")) {
    return "No existe una cuenta con ese correo.";
  }

  return message;
}
