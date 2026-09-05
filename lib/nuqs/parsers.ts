import { parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs";

export const searchParams = {
  q: parseAsString.withDefault(""),
  genre: parseAsString.withDefault(""),
  year: parseAsInteger,
  minRating: parseAsInteger,
  view: parseAsStringLiteral(["grid", "table"] as const).withDefault("grid"),
};
