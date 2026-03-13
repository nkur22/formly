import type { QuestionType } from "./types";

type Question = {
  id: string;
  type: QuestionType;
  [key: string]: unknown;
};

export function hasLikertQuestion(questions: Question[]): boolean {
  return questions.some((q) => q.type === "likert");
}
