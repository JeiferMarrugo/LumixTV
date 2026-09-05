import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

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
    <html lang="es">
      <body className="min-h-screen bg-black antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
