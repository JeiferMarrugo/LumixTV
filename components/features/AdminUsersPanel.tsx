"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, Loader2, ShieldCheck, UserCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { AuthAlert } from "@/components/ui/AuthAlert";
import { FadeIn } from "@/components/ui/motion";
import { SUPER_ADMIN_ROLE } from "@/lib/roles";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  emailVerified: boolean;
  createdAt: string | Date;
}

export function AdminUsersPanel({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await authClient.admin.listUsers({
      query: { limit: 100, sortBy: "createdAt", sortDirection: "desc" },
    });
    setLoading(false);

    if (error) {
      setMessage({ type: "error", text: error.message ?? "No se pudieron cargar los usuarios" });
      return;
    }

    setUsers((data?.users as AdminUser[]) ?? []);
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function handleBan(user: AdminUser) {
    if (user.id === currentUserId) {
      setMessage({ type: "error", text: "No puedes vetar tu propia cuenta." });
      return;
    }

    const reason = window.prompt("Motivo del veto (opcional):") ?? "Incumplimiento de normas";
    setActionId(user.id);
    setMessage(null);

    const { error } = await authClient.admin.banUser({
      userId: user.id,
      banReason: reason,
    });

    if (error) {
      setActionId(null);
      setMessage({ type: "error", text: error.message ?? "No se pudo vetar al usuario" });
      return;
    }

    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        title: "Cuenta suspendida",
        message: `Tu acceso a LumixTV fue suspendido. Motivo: ${reason}`,
        type: "warning",
      }),
    });

    setActionId(null);
    setMessage({ type: "success", text: `${user.name} fue vetado correctamente.` });
    void loadUsers();
  }

  async function handleUnban(user: AdminUser) {
    setActionId(user.id);
    setMessage(null);

    const { error } = await authClient.admin.unbanUser({ userId: user.id });

    if (error) {
      setActionId(null);
      setMessage({ type: "error", text: error.message ?? "No se pudo quitar el veto" });
      return;
    }

    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        title: "Acceso restaurado",
        message: "Tu cuenta fue reactivada. Ya puedes volver a usar LumixTV.",
        type: "success",
        href: "/login",
      }),
    });

    setActionId(null);
    setMessage({ type: "success", text: `Se quitó el veto a ${user.name}.` });
    void loadUsers();
  }

  return (
    <FadeIn className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 ring-1 ring-gold-500/20">
          <ShieldCheck size={22} className="text-gold-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Administración de usuarios</h1>
          <p className="text-sm text-zinc-500">Solo super administradores pueden vetar cuentas.</p>
        </div>
      </div>

      {message && (
        <div className="mb-5">
          <AuthAlert type={message.type} message={message.text} />
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gold-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border-subtle bg-black/20 text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Usuario</th>
                  <th className="px-5 py-3 font-medium">Rol</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user.id === currentUserId;
                  const isSuperAdmin = user.role === SUPER_ADMIN_ROLE;

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-border-subtle/60 last:border-0 hover:bg-surface-overlay/40"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="text-xs text-zinc-500">{user.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            isSuperAdmin
                              ? "bg-gold-500/15 text-gold-500"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {isSuperAdmin ? "Super admin" : "Usuario"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {user.banned ? (
                          <span className="text-xs font-medium text-red-400">Vetado</span>
                        ) : user.emailVerified ? (
                          <span className="text-xs font-medium text-emerald-400">Activo</span>
                        ) : (
                          <span className="text-xs font-medium text-amber-400">Sin verificar</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {isSelf || isSuperAdmin ? (
                          <span className="text-xs text-zinc-600">—</span>
                        ) : user.banned ? (
                          <button
                            type="button"
                            disabled={actionId === user.id}
                            onClick={() => void handleUnban(user)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
                          >
                            {actionId === user.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <UserCheck size={14} />
                            )}
                            Quitar veto
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={actionId === user.id}
                            onClick={() => void handleBan(user)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {actionId === user.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Ban size={14} />
                            )}
                            Vetar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FadeIn>
  );
}
