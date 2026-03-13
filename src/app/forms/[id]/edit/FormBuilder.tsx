"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  addQuestion,
  deleteQuestion,
  reorderQuestions,
  togglePublished,
  updateFormTitle,
  updateQuestion,
} from "./actions";
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronLeft,
  ExternalLink,
  Hash,
  List,
  Mail,
  Plus,
  Star,
  ToggleLeft,
  Trash2,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "yes_no"
  | "rating"
  | "likert"
  | "email"
  | "number"
  | "date";

type Question = {
  id: string;
  formId: string;
  type: QuestionType;
  title: string;
  description: string | null;
  required: boolean;
  order: number;
  settings: Record<string, unknown> | null;
};

type Form = {
  id: string;
  title: string;
  published: boolean;
};

const TYPE_LABELS: Record<QuestionType, string> = {
  short_text: "Short text",
  long_text: "Long text",
  multiple_choice: "Multiple choice",
  yes_no: "Yes / No",
  rating: "Rating",
  likert: "Likert",
  email: "Email",
  number: "Number",
  date: "Date",
};

const TYPE_ICONS: Record<QuestionType, React.ReactNode> = {
  short_text: <Type className="size-4" />,
  long_text: <AlignLeft className="size-4" />,
  multiple_choice: <List className="size-4" />,
  yes_no: <ToggleLeft className="size-4" />,
  rating: <Star className="size-4" />,
  likert: <Star className="size-4" />,
  email: <Mail className="size-4" />,
  number: <Hash className="size-4" />,
  date: <Calendar className="size-4" />,
};

export default function FormBuilder({
  form,
  initialQuestions,
}: {
  form: Form;
  initialQuestions: Question[];
}) {
  const [title, setTitle] = useState(form.title);
  const [published, setPublished] = useState(form.published);
  const [qs, setQs] = useState<Question[]>(initialQuestions);
  const [selectedId, setSelectedId] = useState<string | null>(qs[0]?.id ?? null);
  const [, startTransition] = useTransition();

  const selected = qs.find((q) => q.id === selectedId) ?? null;

  function handleTitleBlur() {
    startTransition(() => updateFormTitle(form.id, title));
  }

  function handleTogglePublish() {
    const next = !published;
    setPublished(next);
    startTransition(() => togglePublished(form.id, next));
  }

  async function handleAddQuestion() {
    const order = qs.length;
    const q = await addQuestion(form.id, order);
    setQs((prev) => [...prev, q as Question]);
    setSelectedId(q.id);
  }

  function handleDeleteQuestion(id: string) {
    const next = qs.filter((q) => q.id !== id);
    setQs(next);
    setSelectedId(next[0]?.id ?? null);
    startTransition(() => deleteQuestion(form.id, id));
  }

  function handleMove(id: string, dir: "up" | "down") {
    const idx = qs.findIndex((q) => q.id === id);
    if (dir === "up" && idx === 0) return;
    if (dir === "down" && idx === qs.length - 1) return;
    const next = [...qs];
    const swap = dir === "up" ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const reordered = next.map((q, i) => ({ ...q, order: i }));
    setQs(reordered);
    startTransition(() => reorderQuestions(form.id, reordered.map((q) => q.id)));
  }

  function handleUpdateField(field: keyof Question, value: unknown) {
    if (!selected) return;
    const updated = { ...selected, [field]: value };
    setQs((prev) => prev.map((q) => (q.id === selected.id ? updated : q)));
    startTransition(() =>
      updateQuestion(form.id, selected.id, { [field]: value } as Parameters<typeof updateQuestion>[2])
    );
  }

  function handleOptionChange(index: number, value: string) {
    if (!selected) return;
    const opts = ((selected.settings?.options as string[]) ?? []).slice();
    opts[index] = value;
    handleUpdateField("settings", { ...selected.settings, options: opts });
  }

  function handleAddOption() {
    if (!selected) return;
    const opts = ((selected.settings?.options as string[]) ?? []);
    handleUpdateField("settings", { ...selected.settings, options: [...opts, ""] });
  }

  function handleRemoveOption(index: number) {
    if (!selected) return;
    const opts = ((selected.settings?.options as string[]) ?? []).filter((_, i) => i !== index);
    handleUpdateField("settings", { ...selected.settings, options: opts });
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <ChevronLeft className="size-4" /> Dashboard
          </Link>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="text-base font-semibold bg-transparent border-none outline-none focus:ring-0 w-56"
          />
        </div>
        <div className="flex items-center gap-2">
          {published && (
            <Link
              href={`/f/${form.id}`}
              target="_blank"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ExternalLink className="size-3.5" /> Preview
            </Link>
          )}
          <Button
            size="sm"
            variant={published ? "outline" : "default"}
            onClick={handleTogglePublish}
          >
            {published ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — question list */}
        <aside className="w-64 bg-white border-r flex flex-col overflow-y-auto">
          <div className="p-3 border-b">
            <Button size="sm" className="w-full" onClick={handleAddQuestion}>
              <Plus className="size-4" /> Add question
            </Button>
          </div>
          <ul className="flex-1 p-2 space-y-1">
            {qs.map((q, idx) => (
              <li
                key={q.id}
                onClick={() => setSelectedId(q.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm",
                  selectedId === q.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-gray-100"
                )}
              >
                <span className="shrink-0 text-xs opacity-60">{idx + 1}</span>
                <span className="shrink-0">{TYPE_ICONS[q.type]}</span>
                <span className="truncate flex-1">{q.title || "Untitled"}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Editor panel */}
        <main className="flex-1 overflow-y-auto p-8">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <p>No questions yet</p>
              <Button onClick={handleAddQuestion}>
                <Plus className="size-4" /> Add your first question
              </Button>
            </div>
          ) : (
            <div className="max-w-xl mx-auto bg-white border rounded-xl p-6 space-y-5">
              {/* Type selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Question type
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(TYPE_LABELS) as QuestionType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleUpdateField("type", type)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors",
                        selected.type === type
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-gray-50 border-gray-200"
                      )}
                    >
                      {TYPE_ICONS[type]}
                      <span className="leading-tight text-center">{TYPE_LABELS[type]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Question
                </label>
                <Input
                  value={selected.title}
                  onChange={(e) => handleUpdateField("title", e.target.value)}
                  placeholder="Enter your question..."
                  className="text-base h-10"
                />
              </div>

              {/* Multiple choice options */}
              {selected.type === "multiple_choice" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Options
                  </label>
                  <div className="space-y-2">
                    {((selected.settings?.options as string[]) ?? []).map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={opt}
                          onChange={(e) => handleOptionChange(i, e.target.value)}
                          placeholder={`Option ${i + 1}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOption(i)}
                          className="text-red-400 shrink-0"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={handleAddOption}>
                      <Plus className="size-3.5" /> Add option
                    </Button>
                  </div>
                </div>
              )}

              {/* Rating max */}
              {selected.type === "rating" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Scale
                  </label>
                  <div className="flex gap-2">
                    {[5, 10].map((max) => (
                      <button
                        key={max}
                        onClick={() =>
                          handleUpdateField("settings", { ...selected.settings, max })
                        }
                        className={cn(
                          "px-4 py-1.5 rounded-lg border text-sm transition-colors",
                          (selected.settings?.max ?? 5) === max
                            ? "bg-primary text-primary-foreground border-primary"
                            : "hover:bg-gray-50 border-gray-200"
                        )}
                      >
                        1 – {max}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Likert labels */}
              {selected.type === "likert" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Scale labels
                  </label>
                  <div className="space-y-2">
                    {(
                      (selected.settings?.labels as string[]) ??
                      ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
                    ).map((label, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}</span>
                        <Input
                          value={label}
                          onChange={(e) => {
                            const labels = [
                              ...((selected.settings?.labels as string[]) ??
                                ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]),
                            ];
                            labels[i] = e.target.value;
                            handleUpdateField("settings", { ...selected.settings, labels });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Required toggle */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Required</span>
                <button
                  onClick={() => handleUpdateField("required", !selected.required)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    selected.required ? "bg-primary" : "bg-gray-200"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      selected.required ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {/* Reorder / delete */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMove(selected.id, "up")}
                  disabled={qs.indexOf(selected) === 0}
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMove(selected.id, "down")}
                  disabled={qs.indexOf(selected) === qs.length - 1}
                >
                  <ArrowDown className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto text-red-500 hover:text-red-600"
                  onClick={() => handleDeleteQuestion(selected.id)}
                >
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
