import { z } from "zod";
import {
  AGE_OPTIONS,
  INTEREST_OPTIONS,
  MAX_EXTRA_LENGTH,
  MAX_INTERESTS,
  MAX_NAME_LENGTH,
  MAX_WISH_LENGTH,
  MOODS,
  THEMES,
} from "@/lib/content/options";

const themeIds = THEMES.map((item) => item.id) as [string, ...string[]];
const moodIds = MOODS.map((item) => item.id) as [string, ...string[]];
const interestIds = INTEREST_OPTIONS.map((item) => item.id) as [string, ...string[]];
const ageValues = AGE_OPTIONS as unknown as [number, ...number[]];

export const CONSENT_VERSION = "2026-10-23";

const normalizeText = (value: unknown) => {
  if (typeof value !== "string") return value;
  return value.normalize("NFC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim();
};

// Кириллица не образует \b в JS-регулярках без Unicode-границ, поэтому
// блок-лист использует подстроки: ложное срабатывание безопаснее пропуска.
const unsafeContentPattern =
  /(порн|секс|эротич|изнасил|интимн(ый|ая|ые)(?![\p{L}])|обнаж[её]н|убий|расчлен|суицид|самоубий|наркот|террорист|взрывчат|пытк|детск(ая|ое) порн|сексуальн)/iu;

const safeText = (max: number, label: string) =>
  z.preprocess(
    normalizeText,
    z
      .string()
      .max(max, label + ": не больше " + max + " символов")
      .refine((value) => !unsafeContentPattern.test(value), {
        message: "Пожалуйста, уберите темы, не подходящие для детской сказки",
      }),
  );

export const storyDataSchema = z.object({
  childName: z.preprocess(
    normalizeText,
    z
      .string()
      .min(2, "Укажите имя ребёнка")
      .max(MAX_NAME_LENGTH, "Имя слишком длинное")
      .regex(/^[\p{L}\p{M}'’\- ]+$/u, "В имени допустимы буквы, пробел, дефис и апостроф"),
  ),
  childAge: z.coerce
    .number()
    .int()
    .refine((value) => (ageValues as number[]).includes(value), "Выберите возраст от 2 до 14 лет"),
  interests: z
    .array(z.enum(interestIds))
    .max(MAX_INTERESTS, "Можно выбрать не больше " + MAX_INTERESTS + " увлечений")
    .default([]),
  extraDetails: safeText(MAX_EXTRA_LENGTH, "Дополнительная информация").optional().default(""),
  theme: z.enum(themeIds, { message: "Выберите тематику сказки" }),
  mood: z.enum(moodIds, { message: "Выберите характер истории" }),
  wish: safeText(MAX_WISH_LENGTH, "Пожелание").optional().default(""),
});

export const orderInputSchema = storyDataSchema.extend({
  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
    z.string().min(5, "Укажите электронную почту").max(120, "Адрес слишком длинный").email("Проверьте адрес почты"),
  ),
  consent: z.literal(true, { message: "Подтвердите согласие на обработку данных" }),
  consentVersion: z.literal(CONSENT_VERSION).default(CONSENT_VERSION),
});

export const createOrderRequestSchema = orderInputSchema.extend({
  company: z.string().max(0).optional().default(""),
});

export type StoryDataInput = z.infer<typeof storyDataSchema>;
export type OrderInput = z.infer<typeof orderInputSchema>;

export const storyRequestSchema = z.object({
  childName: storyDataSchema.shape.childName,
  childAge: storyDataSchema.shape.childAge,
  interests: storyDataSchema.shape.interests,
  extraDetails: storyDataSchema.shape.extraDetails,
  theme: storyDataSchema.shape.theme,
  mood: storyDataSchema.shape.mood,
  wish: storyDataSchema.shape.wish,
});

export { unsafeContentPattern };
