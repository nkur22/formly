import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";

export default async function LandingPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b">
        <span className="text-xl font-bold tracking-tight">Formly</span>
        <div className="flex gap-3">
          {session ? (
            <Link href="/dashboard" className={buttonVariants()}>
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
                Log in
              </Link>
              <Link href="/login" className={buttonVariants()}>
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-32 gap-6">
        <h1 className="text-6xl font-bold tracking-tight max-w-3xl leading-tight">
          Build forms people{" "}
          <span className="text-blue-600">actually enjoy</span> filling out
        </h1>
        <p className="text-xl text-gray-500 max-w-xl">
          Beautiful, conversational forms and surveys. One question at a time.
          No friction, more responses.
        </p>
        <div className="flex gap-4 mt-4">
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Start for free
          </Link>
          <Link href="/examples" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
            See examples
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8 py-20 max-w-6xl mx-auto">
        {[
          {
            title: "Conversational",
            desc: "One question at a time keeps users focused and completion rates high.",
          },
          {
            title: "Beautiful by default",
            desc: "Every form looks great out of the box. No design skills required.",
          },
          {
            title: "Powerful logic",
            desc: "Skip logic, branching, and conditional questions that just work.",
          },
        ].map((f) => (
          <div key={f.title} className="border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
            <p className="text-gray-500 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
