"use client";

import { useState } from "react";
import Roadmap from "./Roadmap";

interface PathwaySemester {
  semester: string;
  courses: Array<{ code: string; name: string; credits: number }>;
  focus: string;
  rationale: string;
}

interface PathwayResponse {
  career_goal: string;
  semesters: PathwaySemester[];
  total_credits: number;
  key_skills: string[];
}

export default function CareerForm() {
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pathway, setPathway] = useState<PathwayResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim()) {
      setError("Please enter a career goal.");
      return;
    }

    setLoading(true);
    setError("");
    setPathway(null);

    try {
      const res = await fetch("/api/ai/career-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate pathway");

      setPathway(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (pathway) {
    return <Roadmap pathway={pathway} onBack={() => setPathway(null)} />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-2">Career Pathfinder</h2>
        <p className="text-gray-600 mb-6">
          Enter your career goal and we'll map out a 4-semester course pathway for you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">What's your career goal?</label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., I want to become an AI/ML engineer specializing in computer vision"
              className="w-full border rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black resize-none h-24 text-gray-900"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? "Generating pathway..." : "Generate My Pathway"}
          </button>
        </form>

        {/* Suggestions */}
        <div className="mt-8 pt-6 border-t">
          <p className="text-sm text-gray-600 mb-3">Quick suggestions:</p>
          <div className="space-y-2">
            {[
              "I want to be a Full-Stack Web Developer",
              "I want to become a Data Scientist",
              "I want to work as a Cloud Architect",
              "I want to be an AI/ML Engineer",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setGoal(suggestion);
                  handleSubmit({
                    preventDefault: () => {},
                  } as React.FormEvent);
                }}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 border rounded-lg hover:bg-gray-50 transition"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
