"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { forms } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createForm() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [form] = await db
    .insert(forms)
    .values({ userId: session.user.id, title: "Untitled Form" })
    .returning();

  redirect(`/forms/${form.id}/edit`);
}

export async function deleteForm(formId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .delete(forms)
    .where(and(eq(forms.id, formId), eq(forms.userId, session.user.id)));

  revalidatePath("/dashboard");
}
