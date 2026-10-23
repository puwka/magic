import { AGE_OPTIONS, INTEREST_OPTIONS, MAX_EXTRA_LENGTH, MAX_INTERESTS, MAX_NAME_LENGTH, MAX_WISH_LENGTH, MOODS, THEMES } from "@/lib/content/options";

export type BuilderDraft = {
  childName: string;
  childAge: number;
  interests: string[];
  extraDetails: string;
  theme: string;
  mood: string;
  wish: string;
  email: string;
  consent: boolean;
};

export type BuilderErrors = Partial<Record<keyof BuilderDraft, string>>;

export const emptyBuilderDraft = (): BuilderDraft => ({
  childName: "",
  childAge: 6,
  interests: [],
  extraDetails: "",
  theme: THEMES[1].id,
  mood: MOODS[0].id,
  wish: "",
  email: "",
  consent: false,
});

const namePattern = /^[\p{L}\p{M}'’\- ]+$/u;

const normalize = (value: string) => value.normalize("NFC").replace(/\s+/g, " ").trim();

export const validateBuilderStep = (step: 0 | 1 | 2, draft: BuilderDraft): BuilderErrors => {
  const errors: BuilderErrors = {};

  if (step === 0) {
    const name = normalize(draft.childName);
    if (name.length < 2) errors.childName = "Укажите имя ребёнка — хотя бы две буквы.";
    else if (name.length > MAX_NAME_LENGTH) errors.childName = "Имя слишком длинное.";
    else if (!namePattern.test(name)) errors.childName = "В имени допустимы буквы, пробел, дефис и апостроф.";

    if (!AGE_OPTIONS.includes(draft.childAge)) errors.childAge = "Выберите возраст от 2 до 14 лет.";

    const knownInterests = new Set(INTEREST_OPTIONS.map((item) => item.id as string));
    if (draft.interests.length > MAX_INTERESTS) errors.interests = "Можно выбрать не больше " + MAX_INTERESTS + " увлечений.";
    else if (draft.interests.some((id) => !knownInterests.has(id))) errors.interests = "Выберите увлечения из списка.";

    if (draft.extraDetails.length > MAX_EXTRA_LENGTH) {
      errors.extraDetails = "Слишком длинный текст: не больше " + MAX_EXTRA_LENGTH + " символов.";
    }
  }

  if (step === 1) {
    if (!THEMES.some((item) => item.id === draft.theme)) errors.theme = "Выберите тематику сказки.";
    if (!MOODS.some((item) => item.id === draft.mood)) errors.mood = "Выберите характер истории.";
    if (draft.wish.length > MAX_WISH_LENGTH) {
      errors.wish = "Слишком длинное пожелание: не больше " + MAX_WISH_LENGTH + " символов.";
    }
  }

  if (step === 2) {
    const email = draft.email.trim().toLowerCase();
    if (!email) errors.email = "Укажите электронную почту — на неё придёт готовая книга.";
    else if (email.length > 120) errors.email = "Адрес слишком длинный.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Проверьте адрес почты.";
    if (!draft.consent) errors.consent = "Подтвердите согласие на обработку данных.";
  }

  return errors;
};
