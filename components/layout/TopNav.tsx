"use client";

import { Suspense, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Film, Home, Radio, Sparkles, Tv } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import {
  NotchNav,
  type NotchItemData,
} from "@/components/ui/adaptive-notch-navigation-bar";
import { SearchBar } from "@/components/features/SearchBar";
import { NavClock } from "@/components/layout/NavClock";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";

const navItems: NotchItemData[] = [
  { id: "home", href: "/", label: "Inicio", icon: Home },
  { id: "movies", href: "/peliculas", label: "Películas", icon: Film },
  { id: "series", href: "/series", label: "Series", icon: Tv },
  { id: "anime", href: "/anime", label: "Anime", icon: Sparkles },
  { id: "live", href: "/en-vivo", label: "En Vivo", icon: Radio, badge: "Live" },
];

function SearchFallback() {
  return (
    <div className="h-9 w-full animate-pulse rounded-xl bg-zinc-100 dark:bg-white/[0.03]" />
  );
}

interface TopNavProps {
  isAuthenticated?: boolean;
}

export function TopNav({ isAuthenticated = false }: TopNavProps) {
  const pathname = usePathname();

  const isLiveTv = pathname.startsWith("/en-vivo");

  const activeId = useMemo(() => {
    if (pathname === "/") return "home";
    if (pathname.startsWith("/peliculas")) return "movies";
    if (pathname.startsWith("/series")) return "series";
    if (pathname.startsWith("/anime")) return "anime";
    if (isLiveTv) return "live";
    return "home";
  }, [pathname, isLiveTv]);

  return (
    <NotchNav
      items={navItems}
      activeId={activeId}
      position="top"
      logo={<Logo size="sm" align="left" compact />}
      rightContent={
        <>
          <NavClock compact />
          <ThemeToggle compact />
          <NotificationBell compact />
          <UserMenu serverAuthenticated={isAuthenticated} compact />
        </>
      }
      searchSlot={
        isLiveTv ? undefined : (
          <Suspense fallback={<SearchFallback />}>
            <SearchBar embedded />
          </Suspense>
        )
      }
    />
  );
}
