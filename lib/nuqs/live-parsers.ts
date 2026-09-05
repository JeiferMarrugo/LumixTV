import { parseAsString } from "nuqs";

export const liveTvSearchParams = {
  country: parseAsString.withDefault("CO"),
  category: parseAsString.withDefault(""),
  q: parseAsString.withDefault(""),
};
