"use client";

import { useState } from "react";
import { Loader2, Lock, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { AuthAlert, AuthAlertContainer } from "@/components/ui/AuthAlert";
import { FadeIn } from "@/components/ui/motion";
import { changePasswordSchema, updateProfileSchema } from "@/lib/validations/profile";

interface ProfileFormProps {
  initialName: string;
  email: string;
}

export function ProfileForm({ initialName, email }: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileStatus(null);

    const parsed = updateProfileSchema.safeParse({ name });
    if (!parsed.success) {
      setProfileStatus({
        type: "error",
        message: parsed.error.issues[0]?.message ?? "Datos inválidos",
      });
      return;
    }

    setProfileLoading(true);
    const { error } = await authClient.updateUser({ name: parsed.data.name });
    setProfileLoading(false);

    if (error) {
      setProfileStatus({
        type: "error",
        message: error.message ?? "No se pudo actualizar el perfil",
      });
      return;
    }

    setProfileStatus({ type: "success", message: "Perfil actualizado correctamente." });
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordStatus(null);

    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!parsed.success) {
      setPasswordStatus({
        type: "error",
        message: parsed.error.issues[0]?.message ?? "Datos inválidos",
      });
      return;
    }

    setPasswordLoading(true);
    const { error } = await authClient.changePassword({
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
      revokeOtherSessions: true,
    });
    setPasswordLoading(false);

    if (error) {
      setPasswordStatus({
        type: "error",
        message: error.message ?? "No se pudo cambiar la contraseña",
      });
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordStatus({ type: "success", message: "Contraseña actualizada correctamente." });
  }

  return (
    <FadeIn className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mi perfil</h1>
        <p className="mt-1 text-sm text-zinc-500">Administra tu información personal y seguridad.</p>
      </div>

      <section className="rounded-2xl border border-border-subtle bg-surface-raised p-6">
        <div className="mb-5 flex items-center gap-2">
          <User size={18} className="text-gold-500" />
          <h2 className="text-lg font-semibold text-white">Información personal</h2>
        </div>

        <AuthAlertContainer>
          {profileStatus && (
            <div className="mb-4">
              <AuthAlert type={profileStatus.type} message={profileStatus.message} />
            </div>
          )}
        </AuthAlertContainer>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-gold-500/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-border-subtle bg-black/20 px-4 py-3 text-sm text-zinc-500"
            />
          </div>
          <button
            type="submit"
            disabled={profileLoading}
            className="rounded-xl bg-gold-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-gold-400 disabled:opacity-60"
          >
            {profileLoading ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-border-subtle bg-surface-raised p-6">
        <div className="mb-5 flex items-center gap-2">
          <Lock size={18} className="text-gold-500" />
          <h2 className="text-lg font-semibold text-white">Seguridad</h2>
        </div>

        <AuthAlertContainer>
          {passwordStatus && (
            <div className="mb-4">
              <AuthAlert type={passwordStatus.type} message={passwordStatus.message} />
            </div>
          )}
        </AuthAlertContainer>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Contraseña actual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-gold-500/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-gold-500/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-gold-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={passwordLoading}
            className="flex items-center gap-2 rounded-xl border border-gold-500/30 px-5 py-2.5 text-sm font-semibold text-gold-500 hover:bg-gold-500/10 disabled:opacity-60"
          >
            {passwordLoading && <Loader2 size={16} className="animate-spin" />}
            Cambiar contraseña
          </button>
        </form>
      </section>
    </FadeIn>
  );
}
