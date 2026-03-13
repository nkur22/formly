import { db } from "@/lib/db";
import { forms, questions } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ConversationalForm from "./ConversationalForm";

export default async function PublicFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const form = await db.query.forms.findFirst({
    where: and(eq(forms.id, id), eq(forms.published, true)),
  });
  if (!form) notFound();

  const qs = await db
    .select()
    .from(questions)
    .where(eq(questions.formId, id))
    .orderBy(asc(questions.order));

  return <ConversationalForm form={form} questions={qs} />;
}
