export interface ContentItem {
  id: string;
  title: string;
  genre: string;
  year: number;
  rating: number;
  image: string;
  type: "movie" | "series" | "anime";
}

const cover = (id: string) =>
  `https://images.unsplash.com/${id}?w=600&q=85&auto=format&fit=crop`;

export const featuredContent = {
  title: "The Last Galaxy",
  description:
    "En un futuro lejano, la humanidad lucha por sobrevivir en los confines del universo. Una misión desesperada podría ser la última esperanza.",
  genre: "Sci-Fi",
  year: 2024,
  rating: "PG-13",
  image: cover("photo-1446776811953-b23d57bd21aa"),
};

export const mockMovies: ContentItem[] = [
  {
    id: "1",
    title: "Neon Requiem",
    genre: "Acción",
    year: 2024,
    rating: 4.8,
    image: cover("photo-1536440136628-849c177e76a1"),
    type: "movie",
  },
  {
    id: "2",
    title: "Void Horizon",
    genre: "Sci-Fi",
    year: 2024,
    rating: 4.6,
    image: cover("photo-1451187580459-43490279c0fa"),
    type: "movie",
  },
  {
    id: "3",
    title: "Silent Echoes",
    genre: "Drama",
    year: 2023,
    rating: 4.5,
    image: cover("photo-1517604931442-7e0c8ed2963c"),
    type: "movie",
  },
  {
    id: "4",
    title: "Descent",
    genre: "Thriller",
    year: 2024,
    rating: 4.7,
    image: cover("photo-1489599849927-2ee91cede3ba"),
    type: "movie",
  },
];

export const mockSeries: ContentItem[] = [
  {
    id: "5",
    title: "Nightcall Detective",
    genre: "Crimen",
    year: 2024,
    rating: 4.9,
    image: cover("photo-1478720568477-152d9b164e26"),
    type: "series",
  },
  {
    id: "6",
    title: "Empire of Dust",
    genre: "Drama",
    year: 2023,
    rating: 4.4,
    image: cover("photo-1485846234645-a62644f84728"),
    type: "series",
  },
  {
    id: "7",
    title: "Neon Echoes",
    genre: "Sci-Fi",
    year: 2024,
    rating: 4.7,
    image: cover("photo-1535016120720-40a687788105"),
    type: "series",
  },
  {
    id: "8",
    title: "The Grid",
    genre: "Thriller",
    year: 2024,
    rating: 4.6,
    image: cover("photo-1478720568477-152d9b164e26"),
    type: "series",
  },
];

export const mockAnime: ContentItem[] = [
  {
    id: "9",
    title: "Crimson Blade",
    genre: "Acción",
    year: 2024,
    rating: 4.9,
    image: cover("photo-1578632767115-351597cf2477"),
    type: "anime",
  },
  {
    id: "10",
    title: "Spirit Realm",
    genre: "Fantasía",
    year: 2023,
    rating: 4.8,
    image: cover("photo-1613376021183-4117fb619d92"),
    type: "anime",
  },
  {
    id: "11",
    title: "Mecha Genesis",
    genre: "Mecha",
    year: 2024,
    rating: 4.5,
    image: cover("photo-1558618666-fcd25c85cd64"),
    type: "anime",
  },
  {
    id: "12",
    title: "Shadow Academy",
    genre: "Escolar",
    year: 2024,
    rating: 4.7,
    image: cover("photo-1607604276583-eef5d0763315"),
    type: "anime",
  },
];

export const allContent: ContentItem[] = [
  ...mockMovies,
  ...mockSeries,
  ...mockAnime,
];

export function getContentById(id: string) {
  return allContent.find((item) => item.id === id);
}
