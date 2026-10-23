export const AGE_OPTIONS = Array.from({ length: 13 }, (_, index) => index + 2);

export const INTEREST_OPTIONS = [
  { id: "space", label: "Космос" },
  { id: "animals", label: "Животные" },
  { id: "dinosaurs", label: "Динозавры" },
  { id: "drawing", label: "Рисование" },
  { id: "music", label: "Музыка" },
  { id: "football", label: "Футбол" },
  { id: "sea", label: "Море" },
  { id: "robots", label: "Роботы" },
  { id: "princesses", label: "Принцессы" },
  { id: "travel", label: "Путешествия" },
  { id: "books", label: "Книги" },
  { id: "nature", label: "Природа" },
] as const;

export type InterestId = (typeof INTEREST_OPTIONS)[number]["id"];

export const THEMES = [
  {
    id: "cosmos",
    label: "Космос",
    short: "Планеты, звёзды и большое путешествие",
    scene: "cosmos",
  },
  {
    id: "forest",
    label: "Волшебный лес",
    short: "Тропинки, тайны и лесные друзья",
    scene: "forest",
  },
  {
    id: "ocean",
    label: "Море",
    short: "Острова, маяки и морские истории",
    scene: "ocean",
  },
  {
    id: "dinosaurs",
    label: "Динозавры",
    short: "Древние долины и добрые великаны",
    scene: "dinosaurs",
  },
  {
    id: "mountains",
    label: "Северные горы",
    short: "Снег, сияние и тёплый дом",
    scene: "mountains",
  },
  {
    id: "city",
    label: "Город чудес",
    short: "Крыши, фонари и секретные двери",
    scene: "city",
  },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const MOODS = [
  { id: "magical", label: "Волшебная", description: "Чудеса рядом и немного магии" },
  { id: "adventure", label: "Приключенческая", description: "Дорога, загадка и смелый шаг" },
  { id: "kind", label: "Добрая", description: "Тихая история о заботе и дружбе" },
  { id: "funny", label: "Смешная", description: "Неожиданности, шутки и улыбки" },
  { id: "cozy", label: "Перед сном", description: "Тёплая сказка для спокойного вечера" },
] as const;

export type MoodId = (typeof MOODS)[number]["id"];

export const MAX_INTERESTS = 6;
export const MAX_NAME_LENGTH = 30;
export const MAX_EXTRA_LENGTH = 400;
export const MAX_WISH_LENGTH = 400;

export const DEFAULT_THEME: ThemeId = "forest";
export const DEFAULT_MOOD: MoodId = "magical";

export const getTheme = (id: string) => THEMES.find((theme) => theme.id === id) ?? THEMES[1];
export const getMood = (id: string) => MOODS.find((mood) => mood.id === id) ?? MOODS[0];
export const getInterest = (id: string) => INTEREST_OPTIONS.find((item) => item.id === id);
