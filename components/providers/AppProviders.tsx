"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}
