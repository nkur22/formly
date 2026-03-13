import { auth } from "@/auth";
import { db } from "@/lib/db";
import { forms, questions } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import FormBuilder from "./FormBuilder";

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const form = await db.query.forms.findFirst({
    where: and(eq(forms.id, id), eq(forms.userId, session.user!.id!)),
  });
  if (!form) notFound();

  const qs = await db
    .select()
    .from(questions)
    .where(eq(questions.formId, id))
    .orderBy(asc(questions.order));

  return <FormBuilder form={form} initialQuestions={qs} />;
}
