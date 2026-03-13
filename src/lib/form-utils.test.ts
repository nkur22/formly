import { describe, expect, it } from "vitest";
import { hasLikertQuestion } from "./form-utils";

describe("hasLikertQuestion", () => {
  it("returns true when at least one question is a likert type", () => {
    const questions = [
      { id: "1", type: "short_text" as const },
      { id: "2", type: "likert" as const },
    ];
    expect(hasLikertQuestion(questions)).toBe(true);
  });

  it("returns false when no questions are likert type", () => {
    const questions = [
      { id: "1", type: "short_text" as const },
      { id: "2", type: "multiple_choice" as const },
    ];
    expect(hasLikertQuestion(questions)).toBe(false);
  });

  it("returns false for an empty form", () => {
    expect(hasLikertQuestion([])).toBe(false);
  });

  it("returns true when the only question is a likert", () => {
    const questions = [{ id: "1", type: "likert" as const }];
    expect(hasLikertQuestion(questions)).toBe(true);
  });
});
