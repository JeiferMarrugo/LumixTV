import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/features/LoginForm";
import { StreamingLoader } from "@/components/ui/StreamingLoader";
import { auth } from "@/lib/auth";
import { fetchLoginCinemaMovies } from "@/lib/tmdb/service";
import type { LoginCinemaMovie } from "@/lib/tmdb/types";

function LoginFallback() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <StreamingLoader label="Cargando acceso..." size="sm" />
    </div>
  );
}

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/");
  }

  let cinemaMovies: LoginCinemaMovie[] = [];
  try {
    cinemaMovies = await fetchLoginCinemaMovies();
  } catch {
    cinemaMovies = [];
  }

  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm cinemaMovies={cinemaMovies} />
    </Suspense>
  );
}
