"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileBottomDock } from "@/components/layout/MobileBottomDock";
import { ExpandableSearch } from "@/components/features/SearchBar";

export type NotchPosition = "top" | "bottom";

export interface NotchItemData {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: string;
}

interface NotchNavProps {
  items: NotchItemData[];
  activeId: string;
  position?: NotchPosition;
  logo?: ReactNode;
  rightContent?: ReactNode;
  showLogo?: boolean;
  showRightContent?: boolean;
  searchSlot?: ReactNode;
  mobileProfileSlot?: ReactNode;
  onActiveChange?: (id: string) => void;
  children?: ReactNode;
}

function DesktopTopBar({
  showLogo,
  logo,
  items,
  activeId,
  onActiveChange,
  showRightContent,
  rightContent,
}: {
  showLogo: boolean;
  logo?: ReactNode;
  items: NotchItemData[];
  activeId: string;
  onActiveChange?: (id: string) => void;
  showRightContent: boolean;
  rightContent?: ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative w-full border-b border-white/[0.06] bg-zinc-950/95 backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />

      <div className="flex h-16 w-full items-center gap-4 px-4 sm:px-6 lg:gap-6">
        {showLogo && logo && (
          <div className="flex shrink-0 items-center">
            <div className="rounded-2xl bg-white/[0.04] px-3.5 py-2.5 ring-1 ring-white/[0.06]">
              {logo}
            </div>
          </div>
        )}

        <div className="relative flex min-w-0 flex-1 items-center justify-center overflow-visible">
          <nav
            aria-label="Principal"
            className={cn(
              "flex items-center gap-0.5 overflow-x-auto rounded-2xl bg-white/[0.03] p-1 ring-1 ring-white/[0.05] transition-all duration-300 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              searchOpen
                ? "pointer-events-none absolute inset-0 scale-95 opacity-0"
                : "opacity-100",
            )}
          >
            {items.map(({ id, label, icon: Icon, href, badge }) => {
              const active = activeId === id;

              return (
                <Link
                  key={id}
                  href={href}
                  onClick={() => onActiveChange?.(id)}
                  title={label}
                  className={cn(
                    "group relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 transition-all duration-200",
                    active
                      ? "text-black"
                      : "text-zinc-400 hover:text-zinc-100",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="desktop-nav-indicator"
                      className="absolute inset-0 rounded-xl bg-gold-500 shadow-[0_0_22px_rgba(212,160,23,0.35)]"
                      transition={{ type: "spring", stiffness: 440, damping: 34 }}
                    />
                  )}
                  <Icon
                    size={15}
                    className={cn(
                      "relative shrink-0 transition-colors",
                      active ? "text-black" : "text-zinc-500 group-hover:text-zinc-300",
                    )}
                    strokeWidth={active ? 2.25 : 1.75}
                  />
                  <span
                    className={cn(
                      "relative whitespace-nowrap text-[13px] leading-none tracking-[0.04em]",
                      active ? "font-bold" : "font-medium",
                    )}
                  >
                    {label}
                  </span>
                  {badge && (
                    <span
                      className={cn(
                        "relative rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em]",
                        active
                          ? "bg-black/20 text-black/80"
                          : "bg-gold-500/12 text-gold-400 ring-1 ring-gold-500/20",
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div
            className={cn(
              "mx-auto w-full transition-all duration-300",
              searchOpen ? "max-w-2xl overflow-visible opacity-100" : "max-w-0 overflow-hidden opacity-0",
            )}
          >
            <ExpandableSearch
              open={searchOpen}
              onOpenChange={setSearchOpen}
              variant="field"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-l border-white/[0.06] pl-4">
          <ExpandableSearch
            open={searchOpen}
            onOpenChange={setSearchOpen}
            variant="trigger"
          />
          {showRightContent && rightContent}
        </div>
      </div>
    </div>
  );
}

export function NotchNav({
  items,
  activeId,
  position = "top",
  logo,
  rightContent,
  showLogo = true,
  showRightContent = true,
  searchSlot,
  mobileProfileSlot,
  onActiveChange,
  children,
}: NotchNavProps) {
  const isTop = position === "top";

  return (
    <>
      <header className={cn("sticky z-50", isTop ? "top-0" : "bottom-0")}>
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 h-24 bg-gradient-to-b from-black via-black/90 to-transparent",
            isTop ? "top-0" : "bottom-0 rotate-180",
          )}
        />

        <div className="relative hidden lg:block">
          <DesktopTopBar
            showLogo={showLogo}
            logo={logo}
            items={items}
            activeId={activeId}
            onActiveChange={onActiveChange}
            showRightContent={showRightContent}
            rightContent={rightContent}
          />
        </div>

        <div className="relative px-4 pb-3 pt-2 lg:hidden sm:px-6">
          <div className="flex items-center justify-between gap-3 py-1">
            {showLogo && logo}
            {showRightContent && (
              <div className="ml-auto flex items-center gap-1">{rightContent}</div>
            )}
          </div>

          {searchSlot && (
            <div className="relative overflow-visible rounded-2xl border border-white/[0.06] bg-zinc-950/90 px-1 py-1 shadow-lg backdrop-blur-xl">
              {searchSlot}
            </div>
          )}
        </div>
      </header>

      <MobileBottomDock
        items={items}
        activeId={activeId}
        onNavigate={onActiveChange}
        profileSlot={mobileProfileSlot}
      />

      {children}
    </>
  );
}
