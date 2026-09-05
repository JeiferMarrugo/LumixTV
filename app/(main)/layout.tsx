import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { auth } from "@/lib/auth";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?alert=auth_required");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-64 flex min-h-screen flex-1 flex-col">
        <Header isAuthenticated />
        <main className="flex-1">
          <AuthGuard>{children}</AuthGuard>
        </main>
        <Footer />
      </div>
    </div>
  );
}
