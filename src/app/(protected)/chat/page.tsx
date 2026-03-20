"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [question, setQuestion] = useState("What is my total net worth right now?");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!question.trim()) return;
    const outgoing: Message = { id: crypto.randomUUID(), role: "user", content: question };
    setMessages((previous) => [...previous, outgoing]);
    setLoading(true);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const payload = await response.json();
    setMessages((previous) => [
      ...previous,
      {
        id: payload.messageId ?? crypto.randomUUID(),
        role: "assistant",
        content: payload.answer ?? payload.error ?? "No response.",
      },
    ]);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-white">Finance Copilot</h2>
      <p className="text-sm text-slate-300">Tool-first financial answers with calculations, confidence, and citations.</p>
      <div className="space-y-3 rounded-xl border border-white/10 bg-slate-900/50 p-4">
        <div className="max-h-[420px] space-y-3 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg p-3 text-sm ${message.role === "assistant" ? "bg-slate-950 text-slate-200" : "bg-emerald-400 text-slate-900"}`}
            >
              {message.content}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm"
          />
          <Button disabled={loading} onClick={ask}>
            {loading ? "..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
