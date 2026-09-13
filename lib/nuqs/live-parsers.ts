import { parseAsBoolean, parseAsInteger, parseAsString } from "nuqs";

export const liveSearchParams = {
  /** Búsqueda de canales (separada del `q` global del header). */
  canal: parseAsString.withDefault(""),
  country: parseAsString.withDefault(""),
  category: parseAsString.withDefault(""),
  hd: parseAsBoolean.withDefault(false),
  page: parseAsInteger.withDefault(1),
};
