import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceso — LumixTV",
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-12">
      <div
        className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-gold-600/5 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,160,23,0.06),transparent_50%)]"
        aria-hidden
      />
      {children}
    </div>
  );
}
