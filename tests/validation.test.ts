import { describe, expect, it } from "vitest";
import { createOrderRequestSchema, storyDataSchema } from "@/lib/validation/order";
import { MAX_INTERESTS } from "@/lib/content/options";

const validStory = {
  childName: "Аня",
  childAge: 6,
  interests: ["space", "animals"],
  extraDetails: "",
  theme: "cosmos",
  mood: "magical",
  wish: "",
};

const validOrder = {
  ...validStory,
  email: "parent@example.com",
  consent: true as const,
};

describe("storyDataSchema", () => {
  it("accepts a filled-in story request and applies defaults", () => {
    const parsed = storyDataSchema.parse({
      childName: "Аня",
      childAge: 6,
      theme: "forest",
      mood: "cozy",
    });
    expect(parsed.interests).toEqual([]);
    expect(parsed.extraDetails).toBe("");
    expect(parsed.wish).toBe("");
  });

  it("normalizes whitespace, control characters and unicode form", () => {
    const parsed = storyDataSchema.parse({
      ...validStory,
      childName: "  Аня\u0000  Мария ",
      extraDetails: "Любит   космос\tи  звёзды",
    });
    expect(parsed.childName).toBe("Аня Мария");
    expect(parsed.extraDetails).toBe("Любит космос и звёзды");
  });

  it("rejects names with digits, symbols or one letter", () => {
    for (const childName of ["А", "Аня3", "Аня!", "Аня@дом"]) {
      expect(storyDataSchema.safeParse({ ...validStory, childName }).success).toBe(false);
    }
    expect(storyDataSchema.safeParse({ ...validStory, childName: "Аня-Мария" }).success).toBe(true);
    expect(storyDataSchema.safeParse({ ...validStory, childName: "Д'Артаньян" }).success).toBe(true);
  });

  it("accepts ages from 2 to 14 only", () => {
    expect(storyDataSchema.safeParse({ ...validStory, childAge: "7" }).success).toBe(true);
    expect(storyDataSchema.safeParse({ ...validStory, childAge: 2 }).success).toBe(true);
    expect(storyDataSchema.safeParse({ ...validStory, childAge: 14 }).success).toBe(true);
    expect(storyDataSchema.safeParse({ ...validStory, childAge: 1 }).success).toBe(false);
    expect(storyDataSchema.safeParse({ ...validStory, childAge: 15 }).success).toBe(false);
    expect(storyDataSchema.safeParse({ ...validStory, childAge: 6.5 }).success).toBe(false);
  });

  it("limits interests and rejects unknown ids", () => {
    const tooMany = Array.from({ length: MAX_INTERESTS + 1 }, () => "space");
    expect(storyDataSchema.safeParse({ ...validStory, interests: tooMany }).success).toBe(false);
    expect(storyDataSchema.safeParse({ ...validStory, interests: ["football"] }).success).toBe(true);
    expect(storyDataSchema.safeParse({ ...validStory, interests: ["crypto"] }).success).toBe(false);
  });

  it("rejects unknown themes and moods", () => {
    expect(storyDataSchema.safeParse({ ...validStory, theme: "sci-fi" }).success).toBe(false);
    expect(storyDataSchema.safeParse({ ...validStory, mood: "terrible" }).success).toBe(false);
  });

  it("rejects content that is not suitable for a children's story", () => {
    expect(storyDataSchema.safeParse({ ...validStory, wish: "сексуальное содержание" }).success).toBe(false);
    expect(storyDataSchema.safeParse({ ...validStory, extraDetails: "история про убийство" }).success).toBe(false);
  });

  it("enforces the maximal lengths of free-form fields", () => {
    expect(storyDataSchema.safeParse({ ...validStory, wish: "а".repeat(401) }).success).toBe(false);
    expect(storyDataSchema.safeParse({ ...validStory, extraDetails: "а".repeat(401) }).success).toBe(false);
    expect(storyDataSchema.safeParse({ ...validStory, childName: "а".repeat(31) }).success).toBe(false);
  });
});

describe("orderInputSchema", () => {
  it("normalizes the email address", () => {
    const parsed = createOrderRequestSchema.parse({ ...validOrder, email: "  Parent@Example.COM " });
    expect(parsed.email).toBe("parent@example.com");
  });

  it("requires a valid email and explicit consent", () => {
    expect(createOrderRequestSchema.safeParse({ ...validOrder, email: "not-an-email" }).success).toBe(false);
    expect(createOrderRequestSchema.safeParse({ ...validOrder, consent: false }).success).toBe(false);
    expect(createOrderRequestSchema.safeParse({ ...validOrder, consent: undefined }).success).toBe(false);
  });

  it("blocks the honeypot field", () => {
    expect(createOrderRequestSchema.safeParse({ ...validOrder, company: "ООО Ромашка" }).success).toBe(false);
    expect(createOrderRequestSchema.safeParse({ ...validOrder, company: "" }).success).toBe(true);
  });
});
