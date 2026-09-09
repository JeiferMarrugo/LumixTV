export type HomeCategoryType = "movie" | "series";

export interface HomeCategory {
  id: string;
  title: string;
  genre: string;
  type: HomeCategoryType;
  badge?: string;
}

export const HOME_CATEGORIES: HomeCategory[] = [
  { id: "accion", title: "Acción", genre: "Acción", type: "movie", badge: "TOP" },
  { id: "aventura", title: "Aventura", genre: "Aventura", type: "movie" },
  { id: "romance", title: "Romance", genre: "Romance", type: "movie" },
  { id: "terror", title: "Terror", genre: "Terror", type: "movie", badge: "NUEVO" },
  { id: "drama", title: "Drama", genre: "Drama", type: "series" },
  { id: "comedia", title: "Comedia", genre: "Comedia", type: "series" },
];

export const HOME_ROW_SIZE = 6;
export const HOME_FEATURED_COUNT = 6;
