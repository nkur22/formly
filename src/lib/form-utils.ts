type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "yes_no"
  | "rating"
  | "likert"
  | "email"
  | "number"
  | "date";

type Question = {
  id: string;
  type: QuestionType;
  [key: string]: unknown;
};

export function hasLikertQuestion(questions: Question[]): boolean {
  return questions.some((q) => q.type === "likert");
}
