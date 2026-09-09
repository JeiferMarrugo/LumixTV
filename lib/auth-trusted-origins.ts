const DEV_LAN_PORTS = ["3000", "3001"] as const;

function addOrigin(origins: Set<string>, value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return;

  if (trimmed.includes("*")) {
    origins.add(trimmed);
    return;
  }

  try {
    origins.add(new URL(trimmed).origin);
  } catch {
    origins.add(trimmed);
  }
}

export function getTrustedOrigins(): string[] {
  const origins = new Set<string>();

  addOrigin(origins, process.env.BETTER_AUTH_URL);
  addOrigin(origins, process.env.NEXT_PUBLIC_BETTER_AUTH_URL);
  addOrigin(origins, "http://localhost:3000");
  addOrigin(origins, "http://localhost:3001");
  addOrigin(origins, "http://127.0.0.1:3000");
  addOrigin(origins, "http://127.0.0.1:3001");

  for (const entry of process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? []) {
    addOrigin(origins, entry);
  }

  if (process.env.NODE_ENV !== "production") {
    for (const port of DEV_LAN_PORTS) {
      origins.add(`http://192.168.*:${port}`);
      origins.add(`http://10.*:${port}`);
      origins.add(`http://172.*:${port}`);
    }
  }

  return [...origins];
}
