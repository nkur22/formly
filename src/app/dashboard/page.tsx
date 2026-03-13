import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { forms, responses } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import Link from "next/link";
import { createForm, deleteForm } from "./actions";
import { BarChart2, ExternalLink, Pencil, Trash2 } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userForms = await db
    .select({
      id: forms.id,
      title: forms.title,
      published: forms.published,
      createdAt: forms.createdAt,
    })
    .from(forms)
    .where(eq(forms.userId, session.user!.id!));

  // Get response counts per form
  const responseCounts = await db
    .select({ formId: responses.formId, count: count() })
    .from(responses)
    .where(eq(responses.complete, true))
    .groupBy(responses.formId);

  const countMap = Object.fromEntries(responseCounts.map((r) => [r.formId, r.count]));

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex items-center justify-between px-8 py-5 bg-white border-b">
        <span className="text-xl font-bold tracking-tight">Formly</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{session.user?.email}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button variant="outline" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">My Forms</h1>
          <form action={createForm}>
            <Button type="submit">+ New form</Button>
          </form>
        </div>

        {userForms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl">
            <p className="text-gray-400 text-lg">No forms yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first form to get started</p>
            <form action={createForm} className="mt-6">
              <Button type="submit">Create a form</Button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userForms.map((form) => (
              <div key={form.id} className="bg-white border rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-base leading-tight">{form.title}</h2>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      form.published
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {form.published ? "Live" : "Draft"}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {countMap[form.id] ?? 0} response{(countMap[form.id] ?? 0) !== 1 ? "s" : ""}
                </p>
                <div className="flex items-center gap-2 mt-auto pt-2 border-t">
                  <Link
                    href={`/forms/${form.id}/edit`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Pencil className="size-3.5" /> Edit
                  </Link>
                  <Link
                    href={`/forms/${form.id}/results`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <BarChart2 className="size-3.5" /> Results
                  </Link>
                  {form.published && (
                    <Link
                      href={`/f/${form.id}`}
                      target="_blank"
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      <ExternalLink className="size-3.5" />
                    </Link>
                  )}
                  <form
                    action={async () => {
                      "use server";
                      await deleteForm(form.id);
                    }}
                    className="ml-auto"
                  >
                    <Button variant="ghost" size="sm" type="submit" className="text-red-500 hover:text-red-600">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
