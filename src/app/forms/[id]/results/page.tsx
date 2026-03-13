import { auth } from "@/auth";
import { db } from "@/lib/db";
import { answers, forms, questions, responses } from "@/lib/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { ChevronLeft } from "lucide-react";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
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

  const rs = await db
    .select()
    .from(responses)
    .where(and(eq(responses.formId, id), eq(responses.complete, true)))
    .orderBy(asc(responses.submittedAt));

  const responseIds = rs.map((r) => r.id);
  const allAnswers =
    responseIds.length > 0
      ? await db.select().from(answers).where(inArray(answers.responseId, responseIds))
      : [];

  // Group answers by responseId
  const answersByResponse: Record<string, Record<string, string>> = {};
  for (const a of allAnswers) {
    if (!answersByResponse[a.responseId]) answersByResponse[a.responseId] = {};
    answersByResponse[a.responseId][a.questionId] = a.value ?? "";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-8 py-4 flex items-center gap-4">
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ChevronLeft className="size-4" /> Dashboard
        </Link>
        <div>
          <h1 className="font-semibold text-base">{form.title}</h1>
          <p className="text-sm text-gray-500">{rs.length} response{rs.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href={`/forms/${id}/edit`}
          className={`ml-auto ${buttonVariants({ variant: "outline", size: "sm" })}`}
        >
          Edit form
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">
        {rs.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg">No responses yet</p>
            <p className="text-sm mt-1">Share the form link to start collecting responses</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                    Submitted
                  </th>
                  {qs.map((q) => (
                    <th key={q.id} className="text-left px-4 py-3 font-medium text-gray-500 max-w-48">
                      <span className="truncate block">{q.title || "Untitled"}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rs.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(r.submittedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    {qs.map((q) => (
                      <td key={q.id} className="px-4 py-3 max-w-48">
                        <span className="block truncate">
                          {answersByResponse[r.id]?.[q.id] ?? (
                            <span className="text-gray-300">—</span>
                          )}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
