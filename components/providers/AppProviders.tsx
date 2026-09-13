"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NuqsAdapter>{children}</NuqsAdapter>
    </ThemeProvider>
  );
}
