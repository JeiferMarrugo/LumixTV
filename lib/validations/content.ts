import { z } from "zod";

export const contentTypeSchema = z.enum(["movie", "series", "anime", "live"]);

export const contentItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  genre: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  rating: z.number().min(0).max(10),
  image: z.string().url(),
  type: contentTypeSchema,
});

export const contentFiltersSchema = z.object({
  q: z.string().trim().max(100).optional(),
  genre: z.string().trim().optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  minRating: z.coerce.number().min(0).max(10).optional(),
  view: z.enum(["grid", "table"]).default("grid"),
});

export type ContentFilters = z.infer<typeof contentFiltersSchema>;

export function parseContentFilters(
  params: Record<string, string | string[] | undefined>,
): ContentFilters {
  const raw = {
    q: typeof params.q === "string" ? params.q : undefined,
    genre: typeof params.genre === "string" ? params.genre : undefined,
    year: typeof params.year === "string" ? params.year : undefined,
    minRating: typeof params.minRating === "string" ? params.minRating : undefined,
    view: typeof params.view === "string" ? params.view : undefined,
  };

  return contentFiltersSchema.parse(raw);
}
