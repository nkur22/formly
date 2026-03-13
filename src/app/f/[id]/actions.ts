"use server";

import { db } from "@/lib/db";
import { answers, responses } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function createResponse(formId: string, respondentId: string) {
  const [response] = await db
    .insert(responses)
    .values({ formId, respondentId, complete: false })
    .returning();
  return response.id;
}

export async function saveAnswer(responseId: string, questionId: string, value: string) {
  // Upsert: delete existing answer then insert
  await db
    .delete(answers)
    .where(and(eq(answers.responseId, responseId), eq(answers.questionId, questionId)));

  await db.insert(answers).values({ responseId, questionId, value });
}

export async function completeResponse(responseId: string) {
  await db
    .update(responses)
    .set({ complete: true, submittedAt: new Date() })
    .where(eq(responses.id, responseId));
}
