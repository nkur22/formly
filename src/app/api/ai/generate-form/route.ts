import "server-only";
import { auth } from "@/auth";
import { anthropic } from "@/lib/anthropic";
import { db } from "@/lib/db";
import { forms, questions } from "@/lib/db/schema";
import type { QuestionType } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

// Longer timeout needed — Claude can take 15-30s for complex forms
// Requires Vercel Pro plan; on Hobby the max is 10s
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a form creation assistant for a Typeform-style application.
Your only job is to call the generate_form tool with a complete form based on the user's description.

Rules:
- Generate between 3 and 15 questions unless the user specifies otherwise
- For multiple_choice: always include 2–6 meaningful options in settings.options
- For likert: settings.options must be exactly: ["Strongly Disagree","Disagree","Neutral","Agree","Strongly Agree"]
- For rating: settings.max must be 5 or 10
- Make question titles conversational and friendly — this is a Typeform clone
- Set required: true only for genuinely essential fields (name, email on contact forms)
- Do not add questions not clearly implied by the request
- Always call generate_form — never respond with plain text`;

const GENERATE_FORM_TOOL: Parameters<typeof anthropic.messages.create>[0]["tools"] = [
  {
    name: "generate_form",
    description: "Generate a complete form definition based on the user's description",
    input_schema: {
      type: "object" as const,
      required: ["title", "questions"],
      properties: {
        title: { type: "string" as const, description: "Form title, max 200 characters" },
        description: { type: "string" as const, description: "Optional form subtitle or instructions" },
        questions: {
          type: "array" as const,
          minItems: 1,
          maxItems: 20,
          items: {
            type: "object" as const,
            required: ["type", "title"],
            properties: {
              type: {
                type: "string" as const,
                enum: ["short_text", "long_text", "multiple_choice", "yes_no", "rating", "likert", "email", "number", "date"],
              },
              title: { type: "string" as const },
              description: { type: "string" as const },
              required: { type: "boolean" as const, default: false },
              settings: {
                type: "object" as const,
                properties: {
                  options: { type: "array" as const, items: { type: "string" as const }, maxItems: 6 },
                  max: { type: "number" as const, enum: [5, 10] },
                },
              },
            },
          },
        },
      },
    },
  },
];

type GeneratedQuestion = {
  type: string;
  title: string;
  description?: string;
  required?: boolean;
  settings?: Record<string, unknown>;
};

type GeneratedForm = {
  title: string;
  description?: string;
  questions: GeneratedQuestion[];
};

export async function POST(req: NextRequest) {
  // Auth check FIRST — middleware does not cover /api/ai/* routes
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let prompt: string;
  try {
    const body = await req.json();
    prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (prompt.length < 5 || prompt.length > 2000) {
    return NextResponse.json(
      { error: "Prompt must be between 5 and 2000 characters" },
      { status: 400 }
    );
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: GENERATE_FORM_TOOL,
      tool_choice: { type: "tool", name: "generate_form" },
      messages: [{ role: "user", content: prompt }],
    });

    // Find the tool_use content block
    const toolUse = message.content.find(
      (b): b is Extract<typeof b, { type: "tool_use" }> => b.type === "tool_use"
    );

    if (!toolUse) {
      return NextResponse.json({ error: "AI did not generate a form" }, { status: 500 });
    }

    const generated = toolUse.input as GeneratedForm;

    // Insert form + questions in a single transaction
    const formId = await db.transaction(async (tx) => {
      const [form] = await tx
        .insert(forms)
        .values({
          userId: session.user!.id!,
          title: (generated.title ?? "Untitled Form").slice(0, 200),
          description: generated.description?.slice(0, 500),
          published: false,
        })
        .returning({ id: forms.id });

      const validTypes = new Set<string>([
        "short_text", "long_text", "multiple_choice", "yes_no",
        "rating", "likert", "email", "number", "date",
      ]);

      const questionRows = (generated.questions ?? [])
        .slice(0, 20)
        .filter((q) => validTypes.has(q.type))
        .map((q, i) => ({
          formId: form.id,
          type: q.type as QuestionType,
          title: (q.title ?? "").slice(0, 500),
          description: q.description?.slice(0, 1000),
          required: q.required ?? false,
          order: i,
          settings: q.settings ?? null,
        }));

      if (questionRows.length > 0) {
        await tx.insert(questions).values(questionRows);
      }

      return form.id;
    });

    return NextResponse.json({ formId });
  } catch (err) {
    console.error("AI form generation error:", err);
    return NextResponse.json({ error: "Form generation failed" }, { status: 500 });
  }
}
