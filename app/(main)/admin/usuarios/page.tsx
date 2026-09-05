import { redirect } from "next/navigation";
import { AdminUsersPanel } from "@/components/features/AdminUsersPanel";
import { requireSuperAdminSession } from "@/lib/session";

export default async function AdminUsersPage() {
  const session = await requireSuperAdminSession();
  if (!session) redirect("/");

  return (
    <div className="p-8">
      <AdminUsersPanel currentUserId={session.user.id} />
    </div>
  );
}
