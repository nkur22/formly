"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { forms, questions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function verifyOwnership(formId: string, userId: string) {
  const form = await db.query.forms.findFirst({
    where: and(eq(forms.id, formId), eq(forms.userId, userId)),
  });
  if (!form) throw new Error("Form not found");
  return form;
}

export async function updateFormTitle(formId: string, title: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await verifyOwnership(formId, session.user.id);

  await db.update(forms).set({ title, updatedAt: new Date() }).where(eq(forms.id, formId));
  revalidatePath(`/forms/${formId}/edit`);
  revalidatePath("/dashboard");
}

export async function togglePublished(formId: string, published: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await verifyOwnership(formId, session.user.id);

  await db.update(forms).set({ published, updatedAt: new Date() }).where(eq(forms.id, formId));
  revalidatePath(`/forms/${formId}/edit`);
  revalidatePath("/dashboard");
}

export async function addQuestion(formId: string, order: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await verifyOwnership(formId, session.user.id);

  const [question] = await db
    .insert(questions)
    .values({ formId, type: "short_text", title: "", order })
    .returning();

  revalidatePath(`/forms/${formId}/edit`);
  return question;
}

export async function updateQuestion(
  formId: string,
  questionId: string,
  data: Partial<{
    title: string;
    type: "short_text" | "long_text" | "multiple_choice" | "yes_no" | "rating" | "email" | "number" | "date";
    required: boolean;
    settings: Record<string, unknown>;
  }>
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await verifyOwnership(formId, session.user.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.update(questions).set(data as any).where(and(eq(questions.id, questionId), eq(questions.formId, formId)));

  revalidatePath(`/forms/${formId}/edit`);
}

export async function deleteQuestion(formId: string, questionId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await verifyOwnership(formId, session.user.id);

  await db
    .delete(questions)
    .where(and(eq(questions.id, questionId), eq(questions.formId, formId)));

  revalidatePath(`/forms/${formId}/edit`);
}

export async function reorderQuestions(formId: string, orderedIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await verifyOwnership(formId, session.user.id);

  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(questions)
        .set({ order: index })
        .where(and(eq(questions.id, id), eq(questions.formId, formId)))
    )
  );

  revalidatePath(`/forms/${formId}/edit`);
}
