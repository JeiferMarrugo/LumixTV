"use client";

import { Suspense } from "react";
import { SearchBar } from "@/components/features/SearchBar";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";

interface HeaderProps {
  showSearch?: boolean;
  isAuthenticated?: boolean;
}

function SearchFallback() {
  return (
    <div className="h-10 max-w-xl flex-1 animate-pulse rounded-full bg-surface-raised" />
  );
}

export function Header({ showSearch = true, isAuthenticated = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-black/80 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        {showSearch ? (
          <Suspense fallback={<SearchFallback />}>
            <SearchBar />
          </Suspense>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex items-center gap-3">
          <NotificationBell />
          <UserMenu serverAuthenticated={isAuthenticated} />
        </div>
      </div>
    </header>
  );
}
