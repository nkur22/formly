"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { createForm } from "./actions";
import { CreateWithAIModal } from "./CreateWithAIModal";

export function DashboardHeader() {
  const [showAI, setShowAI] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setShowAI(true)} className="gap-1.5">
          <Sparkles className="size-4" />
          Create with AI
        </Button>
        <form action={createForm}>
          <Button type="submit">+ New form</Button>
        </form>
      </div>
      {showAI && <CreateWithAIModal onClose={() => setShowAI(false)} />}
    </>
  );
}
