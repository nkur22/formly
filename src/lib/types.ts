// Single source of truth for question types — eliminates duplicated definitions
// across FormBuilder.tsx, ConversationalForm.tsx, and form-utils.ts

export const QUESTION_TYPES = [
  "short_text",
  "long_text",
  "multiple_choice",
  "yes_no",
  "rating",
  "likert",
  "email",
  "number",
  "date",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];
