import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "LumixTV — Películas, Series, Anime y TV en Vivo",
  description:
    "Plataforma de streaming premium con películas, series, anime y televisión en vivo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("dark font-sans", geist.variable)}>
      <body className="min-h-screen bg-black antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
