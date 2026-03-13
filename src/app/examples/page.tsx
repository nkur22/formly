import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  {
    title: "Customer Satisfaction Survey",
    description: "Measure how happy your customers are with your product or service.",
    questions: [
      { type: "rating", label: "How satisfied are you overall?" },
      { type: "multiple_choice", label: "What do you like most?" },
      { type: "long_text", label: "Any suggestions for improvement?" },
      { type: "email", label: "Email for follow-up (optional)" },
    ],
    color: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-700",
  },
  {
    title: "Job Application Form",
    description: "Collect applicant info in a conversational, friendly way.",
    questions: [
      { type: "short_text", label: "Full name" },
      { type: "email", label: "Email address" },
      { type: "short_text", label: "Role you're applying for" },
      { type: "long_text", label: "Why do you want to join us?" },
      { type: "rating", label: "Rate your experience level (1–10)" },
    ],
    color: "bg-purple-50 border-purple-200",
    badge: "bg-purple-100 text-purple-700",
  },
  {
    title: "Event Registration",
    description: "Sign people up for your next event with zero friction.",
    questions: [
      { type: "short_text", label: "Your name" },
      { type: "email", label: "Email address" },
      { type: "multiple_choice", label: "Which session will you attend?" },
      { type: "yes_no", label: "Will you need dietary accommodations?" },
      { type: "number", label: "How many tickets?" },
    ],
    color: "bg-green-50 border-green-200",
    badge: "bg-green-100 text-green-700",
  },
  {
    title: "Product Feedback",
    description: "Find out what users love and what they'd change.",
    questions: [
      { type: "rating", label: "How likely are you to recommend us?" },
      { type: "multiple_choice", label: "Which feature do you use most?" },
      { type: "yes_no", label: "Did we solve your problem?" },
      { type: "long_text", label: "What would make it 10x better?" },
    ],
    color: "bg-orange-50 border-orange-200",
    badge: "bg-orange-100 text-orange-700",
  },
];

const TYPE_LABELS: Record<string, string> = {
  short_text: "Short text",
  long_text: "Long text",
  multiple_choice: "Multiple choice",
  yes_no: "Yes / No",
  rating: "Rating",
  email: "Email",
  number: "Number",
  date: "Date",
};

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Formly
        </Link>
        <div className="flex gap-3">
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
            Log in
          </Link>
          <Link href="/sign-up" className={buttonVariants()}>
            Get started
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="text-center px-6 py-16 border-b">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Example forms</h1>
        <p className="text-gray-500 text-lg max-w-lg mx-auto">
          See what you can build with Formly. Sign up to use any of these as a starting point.
        </p>
      </section>

      {/* Grid */}
      <section className="max-w-5xl mx-auto px-8 py-14 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {EXAMPLES.map((ex) => (
          <div
            key={ex.title}
            className={cn("border rounded-xl p-6 flex flex-col gap-4", ex.color)}
          >
            <div>
              <h2 className="text-lg font-bold mb-1">{ex.title}</h2>
              <p className="text-sm text-gray-600">{ex.description}</p>
            </div>

            {/* Question preview */}
            <ul className="flex flex-col gap-1.5">
              {ex.questions.map((q, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded font-medium shrink-0",
                      ex.badge
                    )}
                  >
                    {TYPE_LABELS[q.type]}
                  </span>
                  <span className="text-gray-700 truncate">{q.label}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/sign-up"
              className={cn(buttonVariants({ size: "sm" }), "mt-auto self-start")}
            >
              Use this template
            </Link>
          </div>
        ))}
      </section>
    </div>
  );
}
