"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Film, Home, Radio, Sparkles, Tv, User } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import {
  NotchNav,
  type NotchItemData,
} from "@/components/ui/adaptive-notch-navigation-bar";
import { SearchBar } from "@/components/features/SearchBar";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";

const navItems: NotchItemData[] = [
  { id: "home", href: "/", label: "Inicio", icon: Home },
  { id: "movies", href: "/peliculas", label: "Películas", icon: Film },
  { id: "series", href: "/series", label: "Series", icon: Tv },
  { id: "anime", href: "/anime", label: "Anime", icon: Sparkles },
  { id: "live", href: "/live-tv", label: "En Vivo", icon: Radio, badge: "Live" },
];

function SearchFallback() {
  return (
    <div className="h-9 w-full animate-pulse rounded-xl bg-white/[0.03]" />
  );
}

function MobileProfileButton() {
  return (
    <Link
      href="/perfil"
      aria-label="Perfil"
      className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-gold-400"
    >
      <User size={20} strokeWidth={1.75} />
    </Link>
  );
}

interface TopNavProps {
  isAuthenticated?: boolean;
}

export function TopNav({ isAuthenticated = false }: TopNavProps) {
  const pathname = usePathname();

  const activeId = useMemo(() => {
    if (pathname === "/") return "home";
    if (pathname.startsWith("/peliculas")) return "movies";
    if (pathname.startsWith("/series")) return "series";
    if (pathname.startsWith("/anime")) return "anime";
    if (pathname.startsWith("/live-tv") || pathname.startsWith("/futbol")) return "live";
    return "home";
  }, [pathname]);

  return (
    <NotchNav
      items={navItems}
      activeId={activeId}
      position="top"
      logo={<Logo size="sm" align="left" compact />}
      rightContent={
        <>
          <NotificationBell compact />
          <UserMenu serverAuthenticated={isAuthenticated} compact />
        </>
      }
      mobileProfileSlot={<MobileProfileButton />}
      searchSlot={
        <Suspense fallback={<SearchFallback />}>
          <SearchBar embedded />
        </Suspense>
      }
    />
  );
}
