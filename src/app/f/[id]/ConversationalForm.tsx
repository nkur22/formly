"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Check, ChevronRight } from "lucide-react";
import { completeResponse, createResponse, saveAnswer } from "./actions";

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
  type: QuestionType;
  title: string;
  required: boolean;
  settings: Record<string, unknown> | null;
};

type Form = {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
};

type State = "intro" | "questions" | "thankyou";

export default function ConversationalForm({
  form,
  questions,
}: {
  form: Form;
  questions: Question[];
}) {
  const [state, setState] = useState<State>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [answerMap, setAnswerMap] = useState<Record<string, string>>({});
  const [responseId, setResponseId] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const current = questions[currentIndex];
  const progress = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  useEffect(() => {
    if (state === "questions") {
      setTimeout(() => (inputRef.current as HTMLElement | null)?.focus(), 50);
    }
  }, [currentIndex, state]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (state !== "questions") return;
      if (e.key === "Enter" && !e.shiftKey && current?.type !== "long_text") {
        e.preventDefault();
        void advance();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state, currentIndex, answerMap]);

  async function start() {
    let rid = responseId;
    if (!rid) {
      let respondentId = localStorage.getItem("respondentId");
      if (!respondentId) {
        respondentId = crypto.randomUUID();
        localStorage.setItem("respondentId", respondentId);
      }
      rid = await createResponse(form.id, respondentId);
      setResponseId(rid);
    }
    setState("questions");
    setCurrentIndex(0);
    setDirection("forward");
    setAnimKey((k) => k + 1);
  }

  async function advance() {
    if (!current || !responseId) return;
    const val = answerMap[current.id] ?? "";
    if (current.required && !val.trim()) return;

    await saveAnswer(responseId, current.id, val);

    if (currentIndex >= questions.length - 1) {
      await completeResponse(responseId);
      setState("thankyou");
    } else {
      setDirection("forward");
      setAnimKey((k) => k + 1);
      setCurrentIndex((i) => i + 1);
    }
  }

  async function goBack() {
    if (currentIndex === 0) return;
    setDirection("back");
    setAnimKey((k) => k + 1);
    setCurrentIndex((i) => i - 1);
  }

  function setAnswer(questionId: string, value: string) {
    setAnswerMap((prev) => ({ ...prev, [questionId]: value }));
  }

  if (state === "intro") {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {form.coverImage && (
          <div className="w-full" style={{ height: "280px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.coverImage}
              alt="Form banner"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <h1 className="text-4xl font-bold max-w-xl">{form.title}</h1>
          {form.description && (
            <p className="text-gray-500 text-lg max-w-md">{form.description}</p>
          )}
          <Button size="lg" onClick={start}>
            Start <ChevronRight className="size-4" />
          </Button>
          <p className="text-xs text-gray-400">{questions.length} question{questions.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
    );
  }

  if (state === "thankyou") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="size-16 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="size-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold">Thanks for completing!</h1>
        <p className="text-gray-500">Your response has been recorded.</p>
      </div>
    );
  }

  if (!current) return null;

  const answer = answerMap[current.id] ?? "";
  const canAdvance = !current.required || !!answer.trim();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100 z-10">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div
          key={animKey}
          className={cn(
            "w-full max-w-xl animate-in duration-300",
            direction === "forward" ? "slide-in-from-bottom-8" : "slide-in-from-top-8"
          )}
        >
          <div className="mb-1 text-sm text-gray-400">
            {currentIndex + 1} / {questions.length}
          </div>
          <h2 className="text-2xl font-bold mb-6">
            {current.title || "Untitled question"}
            {current.required && <span className="text-red-500 ml-1">*</span>}
          </h2>

          <QuestionInput
            question={current}
            value={answer}
            onChange={(v) => setAnswer(current.id, v)}
            onEnter={advance}
            inputRef={inputRef as React.RefObject<HTMLInputElement | HTMLTextAreaElement>}
          />

          {/* OK button (not shown for auto-advance types) */}
          {!["yes_no", "multiple_choice", "rating", "likert"].includes(current.type) && (
            <div className="mt-6 flex items-center gap-3">
              <Button onClick={advance} disabled={!canAdvance}>
                {currentIndex >= questions.length - 1 ? "Submit" : "OK"}
                <ChevronRight className="size-4" />
              </Button>
              <span className="text-xs text-gray-400">press Enter ↵</span>
            </div>
          )}
        </div>
      </div>

      {/* Nav arrows */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2">
        <button
          onClick={goBack}
          disabled={currentIndex === 0}
          className="size-9 rounded-lg border bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-colors"
        >
          <ArrowUp className="size-4" />
        </button>
        <button
          onClick={advance}
          disabled={!canAdvance}
          className="size-9 rounded-lg border bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-colors"
        >
          <ArrowDown className="size-4" />
        </button>
      </div>
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
  onEnter,
  inputRef,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
}) {
  const { type, settings } = question;

  if (type === "short_text" || type === "email" || type === "number" || type === "date") {
    return (
      <Input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type === "short_text" ? "text" : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={type === "email" ? "your@email.com" : "Type your answer..."}
        className="text-lg h-12 border-0 border-b border-gray-300 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
      />
    );
  }

  if (type === "long_text") {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer..."
        rows={4}
        className="w-full text-lg border-0 border-b border-gray-300 rounded-none px-0 resize-none outline-none focus:border-primary bg-transparent transition-colors"
      />
    );
  }

  if (type === "yes_no") {
    return (
      <div className="flex gap-3">
        {["Yes", "No"].map((opt) => (
          <button
            key={opt}
            onClick={() => {
              onChange(opt);
              setTimeout(onEnter, 150);
            }}
            className={cn(
              "px-8 py-3 rounded-xl border-2 text-base font-medium transition-all",
              value === opt
                ? "border-primary bg-primary text-primary-foreground"
                : "border-gray-200 hover:border-primary"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (type === "multiple_choice") {
    const options = (settings?.options as string[]) ?? [];
    return (
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => {
              onChange(opt);
              setTimeout(onEnter, 150);
            }}
            className={cn(
              "w-full text-left px-4 py-3 rounded-xl border-2 text-base transition-all",
              value === opt
                ? "border-primary bg-primary/5 text-primary font-medium"
                : "border-gray-200 hover:border-primary"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (type === "rating") {
    const max = (settings?.max as number) ?? 5;
    return (
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => {
              onChange(String(n));
              setTimeout(onEnter, 150);
            }}
            className={cn(
              "size-12 rounded-xl border-2 text-base font-medium transition-all",
              value === String(n)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-gray-200 hover:border-primary"
            )}
          >
            {n}
          </button>
        ))}
      </div>
    );
  }

  if (type === "likert") {
    const labels = (settings?.labels as string[]) ?? [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ];
    return (
      <div className="flex flex-col gap-2">
        {labels.map((label, i) => (
          <button
            key={label}
            onClick={() => {
              onChange(label);
              setTimeout(onEnter, 150);
            }}
            className={cn(
              "w-full text-left px-4 py-3 rounded-xl border-2 text-base transition-all flex items-center gap-3",
              value === label
                ? "border-primary bg-primary/5 text-primary font-medium"
                : "border-gray-200 hover:border-primary"
            )}
          >
            <span className="text-sm text-gray-400 w-4 shrink-0">{i + 1}</span>
            {label}
          </button>
        ))}
      </div>
    );
  }

  return null;
}
