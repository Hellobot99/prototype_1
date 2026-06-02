"use client";

import { useState } from "react";

export default function AiSection() {
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim()) return;
    setLoading(true);
    setResult("");
    setError("");

    try {
      const res = await fetch("/api/ai/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data.suggestion);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border rounded-xl p-6">
      <h3 className="font-semibold mb-1">AI Schedule Suggestion</h3>
      <p className="text-sm text-gray-500 mb-4">Describe your goals and let Claude suggest a schedule.</p>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. I want to focus on AI and avoid Omiya campus"
          className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black text-gray-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Ask AI"}
        </button>
      </form>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {result && (
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap">
          {result}
        </div>
      )}
    </div>
  );
}
