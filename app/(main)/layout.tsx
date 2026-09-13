import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SessionInactivityGuard } from "@/components/auth/SessionInactivityGuard";
import { WatchHistorySync } from "@/components/auth/WatchHistorySync";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { PixelCursorTrail } from "@/components/ui/pixel-trail";
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
    <div className="relative flex min-h-screen flex-col">
      <SessionInactivityGuard />
      <WatchHistorySync />
      <PixelCursorTrail maxOpacity={0.22} pixelSize={8} trailLength={28} zIndex={0} />
      <div className="relative z-10 flex min-h-screen flex-col">
        <TopNav isAuthenticated />
        <main className="flex-1 pb-24 lg:pb-0">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
