"use client";

import { useState } from "react";

interface AiSectionProps {
  onResult: (suggestion: string, codes: string[]) => void;
}

export default function AiSection({ onResult }: AiSectionProps) {
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onResult(data.suggestion ?? "", data.recommended_codes ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4">
      <h3 className="font-semibold text-sm mb-1 text-gray-900 dark:text-gray-100">AI Schedule Suggestion</h3>
      <p className="text-xs text-gray-400 mb-3">Describe your goals to get a suggested schedule.</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. I want to focus on AI and robotics"
          className="flex-1 border dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#008482] text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 min-w-0"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#008482] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#006e6c] transition disabled:opacity-50 whitespace-nowrap flex-shrink-0"
        >
          {loading ? "..." : "Ask AI"}
        </button>
      </form>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}
