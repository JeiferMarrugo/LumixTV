import { parseAsBoolean, parseAsString } from "nuqs";

export const liveTvSearchParams = {
  country: parseAsString.withDefault("CO"),
  category: parseAsString.withDefault(""),
  /** working = solo señal activa, all = incluye offline/bloqueado */
  stream: parseAsString.withDefault("working"),
  hd: parseAsBoolean.withDefault(false),
  /** Búsqueda de canales — separada del `q` global del navbar */
  search: parseAsString.withDefault(""),
  section: parseAsString.withDefault("channels"),
};
