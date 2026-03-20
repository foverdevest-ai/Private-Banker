"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function QuickAskPanel() {
  const [question, setQuestion] = useState("How much did I spend last month?");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const payload = await response.json();
    setAnswer(payload.answer ?? payload.error ?? "No answer");
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <h3 className="text-sm uppercase tracking-[0.14em] text-slate-300">Ask my finances</h3>
      <div className="mt-3 flex flex-col gap-3">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300"
        />
        <Button onClick={submit} disabled={loading}>
          {loading ? "Thinking..." : "Ask"}
        </Button>
      </div>
      {answer ? <p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">{answer}</p> : null}
    </div>
  );
}
