import { parseAsBoolean, parseAsInteger, parseAsString } from "nuqs";

export const liveSearchParams = {
  q: parseAsString.withDefault(""),
  country: parseAsString.withDefault(""),
  category: parseAsString.withDefault(""),
  hd: parseAsBoolean.withDefault(false),
  page: parseAsInteger.withDefault(1),
};
