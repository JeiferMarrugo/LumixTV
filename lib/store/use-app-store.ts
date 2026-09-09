import { create } from "zustand";
import { persist } from "zustand/middleware";
import { syncWatchProgress, syncWatchStart, syncRemoveFromContinueWatching } from "@/lib/watch-history-client";

export interface ContinueWatchingItem {
  id: string;
  title: string;
  progress: number;
  watchedAt: string;
  episode?: string;
  image?: string;
}

interface AppState {
  watchlist: string[];
  continueWatching: ContinueWatchingItem[];
  addToWatchlist: (id: string) => void;
  removeFromWatchlist: (id: string) => void;
  toggleWatchlist: (id: string) => void;
  isInWatchlist: (id: string) => boolean;
  reorderContinueWatching: (items: ContinueWatchingItem[]) => void;
  hydrateContinueWatching: (items: ContinueWatchingItem[]) => void;
  startWatching: (item: {
    id: string;
    title: string;
    image?: string;
    episode?: string;
    progress?: number;
    genre?: string;
    contentType?: "movie" | "series" | "anime";
    season?: number;
    episodeNumber?: number;
  }) => void;
  updateProgress: (
    id: string,
    progress: number,
    extras?: { season?: number; episode?: number },
  ) => void;
  removeFromContinueWatching: (id: string) => void;
}

const MOCK_CONTINUE_IDS = new Set(["5", "6", "7"]);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      watchlist: [],
      continueWatching: [],

      addToWatchlist: (id) =>
        set((state) => ({
          watchlist: state.watchlist.includes(id)
            ? state.watchlist
            : [...state.watchlist, id],
        })),

      removeFromWatchlist: (id) =>
        set((state) => ({
          watchlist: state.watchlist.filter((item) => item !== id),
        })),

      toggleWatchlist: (id) => {
        const { watchlist, addToWatchlist, removeFromWatchlist } = get();
        if (watchlist.includes(id)) removeFromWatchlist(id);
        else addToWatchlist(id);
      },

      isInWatchlist: (id) => get().watchlist.includes(id),

      reorderContinueWatching: (items) => set({ continueWatching: items }),

      hydrateContinueWatching: (items) =>
        set((state) => {
          const localById = new Map(state.continueWatching.map((item) => [item.id, item]));
          const merged = items.map((serverItem) => {
            const local = localById.get(serverItem.id);
            if (!local) return serverItem;
            return new Date(local.watchedAt) > new Date(serverItem.watchedAt) ? local : serverItem;
          });

          for (const localItem of state.continueWatching) {
            if (!merged.some((item) => item.id === localItem.id)) {
              merged.push(localItem);
            }
          }

          return {
            continueWatching: merged
              .sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime())
              .slice(0, 20),
          };
        }),

      startWatching: (item) => {
        set((state) => {
          const now = new Date().toISOString();
          const existing = state.continueWatching.find((i) => i.id === item.id);

          const entry: ContinueWatchingItem = existing
            ? {
                ...existing,
                title: item.title,
                image: item.image ?? existing.image,
                episode: item.episode ?? existing.episode,
                progress: item.progress ?? existing.progress,
                watchedAt: now,
              }
            : {
                id: item.id,
                title: item.title,
                image: item.image,
                episode: item.episode,
                progress: item.progress ?? 5,
                watchedAt: now,
              };

          const rest = state.continueWatching.filter((i) => i.id !== item.id);
          return {
            continueWatching: [entry, ...rest].slice(0, 20),
          };
        });

        void syncWatchStart({
          contentId: item.id,
          title: item.title,
          image: item.image,
          genre: item.genre,
          contentType: item.contentType,
          progress: item.progress ?? 5,
          season: item.season,
          episode: item.episodeNumber,
        });
      },

      updateProgress: (id, progress, extras) => {
        set((state) => {
          const clamped = Math.min(100, Math.max(0, progress));
          const exists = state.continueWatching.some((item) => item.id === id);
          if (!exists) return state;

          const updated = state.continueWatching.map((item) =>
            item.id === id
              ? { ...item, progress: clamped, watchedAt: new Date().toISOString() }
              : item,
          );

          return {
            continueWatching: updated.sort(
              (a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime(),
            ),
          };
        });

        void syncWatchProgress({
          contentId: id,
          progress,
          season: extras?.season,
          episode: extras?.episode,
        });
      },

      removeFromContinueWatching: (id) => {
        set((state) => ({
          continueWatching: state.continueWatching.filter((item) => item.id !== id),
        }));
        void syncRemoveFromContinueWatching(id);
      },
    }),
    {
      name: "lumixtv-store",
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as AppState;
        if (version < 1) {
          return {
            ...state,
            continueWatching: (state.continueWatching ?? []).filter(
              (item) => !MOCK_CONTINUE_IDS.has(item.id),
            ),
          };
        }
        return state;
      },
    },
  ),
);
