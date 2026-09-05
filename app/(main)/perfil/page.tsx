import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/features/ProfileForm";
import { requireAuthSession } from "@/lib/session";

export default async function ProfilePage() {
  const session = await requireAuthSession();
  if (!session) redirect("/login");

  return (
    <div className="p-8">
      <ProfileForm initialName={session.user.name} email={session.user.email} />
    </div>
  );
}
