"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { Logo } from "@/components/ui/Logo";
import { AuthAlert, AuthAlertContainer, type AuthAlertType } from "@/components/ui/AuthAlert";
import { LoginCinemaPanel } from "@/components/features/LoginCinemaPanel";
import { PixelCursorTrail } from "@/components/ui/pixel-trail";
import { FadeIn } from "@/components/ui/motion";
import type { LoginCinemaMovie } from "@/lib/tmdb/types";

type AuthMode = "login" | "register";

interface StatusMessage {
  type: AuthAlertType;
  message: string;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-sm font-medium text-zinc-300">{children}</label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-400">{message}</p>;
}

function resolvePostAuthDestination(callbackUrl: string | null) {
  if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
    return callbackUrl;
  }
  return "/";
}

function redirectAfterAuth(callbackUrl: string | null) {
  window.location.replace(resolvePostAuthDestination(callbackUrl));
}

export function LoginForm({ cinemaMovies = [] }: { cinemaMovies?: LoginCinemaMovie[] }) {
  const searchParams = useSearchParams();
  const redirectingRef = useRef(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("lumixtv-remember-email");
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (redirectingRef.current) return;

    void authClient.getSession().then(({ data }) => {
      if (data?.session && !redirectingRef.current) {
        redirectingRef.current = true;
        redirectAfterAuth(searchParams.get("callbackUrl"));
      }
    });
  }, [searchParams]);

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
    if (alert === "session_expired") {
      setStatus({
        type: "info",
        message: "Tu sesión se cerró por inactividad (15 minutos). Vuelve a iniciar sesión.",
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
    if (loading || redirectingRef.current) return;

    setErrors({});
    setStatus(null);

    const payload =
      mode === "login" ? { email, password } : { email, password, name };

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

    if (rememberMe) {
      localStorage.setItem("lumixtv-remember-email", email);
    } else {
      localStorage.removeItem("lumixtv-remember-email");
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

        redirectingRef.current = true;
        setStatus({
          type: "success",
          message: "¡Sesión iniciada correctamente! Redirigiendo...",
        });

        // Confirmar que la cookie de sesión quedó persistida antes de navegar.
        await authClient.getSession();
        redirectAfterAuth(searchParams.get("callbackUrl"));
        return;
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
          redirectingRef.current = true;
          await authClient.getSession();
          redirectAfterAuth(null);
          return;
        }

        redirectingRef.current = true;
        window.location.replace(
          `/verificar-correo?email=${encodeURIComponent(email)}`,
        );
        return;
      }
    } catch {
      setStatus({
        type: "error",
        message: "Error de conexión. Verifica tu internet e inténtalo de nuevo.",
      });
    } finally {
      if (!redirectingRef.current) {
        setLoading(false);
      }
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <LoginCinemaPanel movies={cinemaMovies} />

      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] px-6 py-10 sm:px-10 lg:px-16">
        <PixelCursorTrail maxOpacity={0.35} pixelSize={8} zIndex={0} />

        <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-gold-600/5 blur-3xl" />

        <FadeIn className="relative z-10 w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo size="md" align="left" />
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold tracking-wide text-white">
              {mode === "login" ? "Bienvenido de nuevo" : "Crea tu cuenta"}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(mode === "login" ? "register" : "login")}
                className="font-medium text-gold-400 transition-colors hover:text-gold-300"
              >
                {mode === "login" ? "Regístrate" : "Inicia sesión"}
              </button>
            </p>
          </div>

          <AuthAlertContainer>
            {status && (
              <div className="mb-6">
                <AuthAlert type={status.type} message={status.message} />
              </div>
            )}
          </AuthAlertContainer>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                    className={`w-full rounded-lg border bg-black/40 py-3 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 ${
                      errors.name ? "border-red-500/50" : "border-border-subtle"
                    }`}
                  />
                </div>
                <FieldError message={errors.name} />
              </div>
            )}

            <div>
              <FieldLabel>Correo electrónico</FieldLabel>
              <input
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className={`w-full rounded-lg border bg-black/40 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 ${
                  errors.email ? "border-red-500/50" : "border-border-subtle"
                }`}
              />
              <FieldError message={errors.email} />
            </div>

            <div>
              <FieldLabel>Contraseña</FieldLabel>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className={`w-full rounded-lg border bg-black/40 px-4 py-3 pr-11 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 ${
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

            {mode === "login" && (
              <div className="flex items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-border-subtle bg-black/40 accent-gold-500"
                  />
                  Recordarme
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 py-3.5 text-sm font-bold text-black transition-all hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {mode === "login" ? "Iniciando sesión..." : "Creando cuenta..."}
                </>
              ) : mode === "login" ? (
                "Iniciar sesión"
              ) : (
                "Crear cuenta"
              )}
            </button>
          </form>
        </FadeIn>
      </div>
    </div>
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
