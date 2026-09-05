import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceso — LumixTV",
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-black">{children}</div>;
}
