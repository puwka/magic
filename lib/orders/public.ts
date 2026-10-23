import type { Order } from "@/lib/orders/types";
import type { StoryBook } from "@/lib/generation/types";
import { getMood, getTheme } from "@/lib/content/options";

export type PublicOrderStory = {
  title: string;
  subtitle: string;
  dedication: string;
  chapters: Array<{ title: string; text: string }>;
  letter: string;
  closingLine: string;
};

export type PublicOrder = {
  id: string;
  orderNumber: string;
  status: Order["status"];
  paymentStatus: Order["paymentStatus"];
  paymentProvider: Order["paymentProvider"];
  generationStatus: Order["generation"]["status"];
  childName: string;
  childAge: number;
  email: string;
  themeLabel: string;
  moodLabel: string;
  priceRub: number;
  currency: "RUB";
  isDemo: boolean;
  testPaymentEnabled: boolean;
  createdAt: string;
  paidAt: string | null;
  completedAt: string | null;
  checkoutUrl: string | null;
  dataDeleted: boolean;
  progress: {
    percent: number;
    step: string;
    attempts: number;
    maxAttempts: number;
  };
  error: string | null;
  emailDelivery: "sent" | "failed" | "pending" | "no_email";
  result: {
    title: string;
    subtitle: string;
    dedication: string;
    chapterCount: number;
    coverPath: string;
    pdfPath: string;
    warnings: string[];
    providers: { text: string; images: string };
    illustrations: Array<{ key: string; path: string; alt: string; chapterIndex: number | null }>;
    story: PublicOrderStory | null;
  } | null;
};

export const toPublicOrder = (
  order: Order,
  maxAttempts: number,
  options: { testPaymentEnabled?: boolean } = {},
): PublicOrder => {
  const result = order.result;
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentProvider: order.paymentProvider,
    generationStatus: order.generation.status,
    childName: order.input.childName,
    childAge: order.input.childAge,
    email: order.email,
    themeLabel: getTheme(order.input.theme).label,
    moodLabel: getMood(order.input.mood).label,
    priceRub: order.priceRub,
    currency: order.currency,
    isDemo: order.isDemo,
    testPaymentEnabled: Boolean(options.testPaymentEnabled),
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    completedAt: order.completedAt,
    checkoutUrl: order.checkoutUrl,
    dataDeleted: Boolean(order.dataDeletedAt),
    progress: {
      percent: order.generation.progress,
      step: order.generation.step,
      attempts: order.generation.attempts,
      maxAttempts,
    },
    error: order.generation.error,
    emailDelivery: order.emailSentAt ? "sent" : order.emailError ? "failed" : order.status === "completed" ? "pending" : "no_email",
    result: result
      ? {
          title: result.story.title,
          subtitle: result.story.subtitle,
          dedication: result.story.dedication,
          chapterCount: result.story.chapters.length,
          coverPath: "/api/orders/" + order.id + "/cover",
          pdfPath: "/api/orders/" + order.id + "/pdf",
          warnings: result.warnings,
          providers: result.providers,
          illustrations: result.illustrations.map((illustration) => ({
            key: illustration.key,
            path: "/api/orders/" + order.id + "/asset/" + encodeURIComponent(illustration.key),
            alt: illustration.alt,
            chapterIndex: illustration.chapterIndex ?? null,
          })),
          story: publicStory(result.story),
        }
      : null,
  };
};

const publicStory = (story: StoryBook): PublicOrderStory => ({
  title: story.title,
  subtitle: story.subtitle,
  dedication: story.dedication,
  chapters: story.chapters.map((chapter) => ({ title: chapter.title, text: chapter.text })),
  letter: story.letter,
  closingLine: story.closingLine,
});
