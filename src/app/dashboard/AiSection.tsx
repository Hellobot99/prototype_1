"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  codes?: string[];
}

interface AiSectionProps {
  onResult: (suggestion: string, codes: string[]) => void;
}

const MAX_HISTORY = 8;

export default function AiSection({ onResult }: AiSectionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError("");

    const history = newMessages.slice(-MAX_HISTORY).map(({ role, content, codes }) => ({
      role,
      content: role === "assistant" && codes?.length
        ? `${content}\n[Currently recommended courses: ${codes.join(", ")}]`
        : content,
    }));

    try {
      const res = await fetch("/api/ai/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      const assistantMsg: Message = {
        role: "assistant",
        content: data.reply ?? "",
        codes: data.recommended_codes,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (data.recommended_codes?.length > 0) {
        onResult(data.reply ?? "", data.recommended_codes);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl flex flex-col h-[360px]">
      <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">AI Schedule Assistant</h3>
          <p className="text-xs text-gray-400">Describe your goals to get a personalized timetable.</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-10">
            e.g. &quot;I want to focus on AI and robotics this semester&quot;
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-[#008482] text-white rounded-br-sm"
                : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm"
            }`}>
              {msg.content}
              {msg.codes && msg.codes.length > 0 && (
                <p className="text-xs mt-1 opacity-60">↑ Timetable updated ({msg.codes.length} courses)</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-gray-400">
              <span className="animate-pulse">···</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-red-500 text-xs px-4 pb-1">{error}</p>}
      <div className="p-3 border-t dark:border-gray-700 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type your goal..."
          disabled={loading}
          className="flex-1 border dark:border-gray-600 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#008482] text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 disabled:opacity-50 min-w-0"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-[#008482] text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-[#006e6c] transition disabled:opacity-50 flex-shrink-0"
        >
          Send
        </button>
      </div>
    </div>
  );
}
