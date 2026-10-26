import { describe, expect, it } from "vitest";
import { sceneSequence } from "@/lib/generation/pipeline";
import { THEMES } from "@/lib/content/options";
import { sceneKindForTheme } from "@/lib/illustration/scenes";

describe("sceneSequence", () => {
  it("gives every theme four distinct illustration scenes", () => {
    for (const theme of THEMES) {
      const sequence = sceneSequence(theme.id);
      const primary = sceneKindForTheme(theme.id);

      expect(sequence).toHaveLength(4);
      expect(sequence[0]).toBe("home");
      expect(sequence[1]).toBe(primary);
      expect(sequence[2]).not.toBe(sequence[1]);
      expect(sequence[2]).not.toBe(sequence[0]);
      expect(sequence[3]).toBe(primary);
      expect(new Set(sequence.slice(0, 3)).size).toBe(3);
    }
  });
});
