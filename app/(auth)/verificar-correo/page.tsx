import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { VerifyEmailContent } from "@/components/features/VerifyEmailContent";
import { auth } from "@/lib/auth";

interface VerifyEmailPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const [{ email }, session] = await Promise.all([
    searchParams,
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (session?.user.emailVerified) {
    redirect("/login?alert=verified");
  }

  return (
    <Suspense>
      <VerifyEmailContent email={email} />
    </Suspense>
  );
}
