"use client";

import { useState } from "react";

interface Career {
  title: string;
  description: string;
  companies: string[];
  skills: string[];
  salary_range: string;
}

interface CourseRec {
  code: string;
  name: string;
  credits: number;
  reason: string;
}

const SUGGESTIONS = [
  "AI & Machine Learning",
  "Web & App Development",
  "Robotics & Automation",
  "Data Science",
  "Cybersecurity",
  "Civil & Architecture",
];

export default function CareerForm() {
  const [interest, setInterest] = useState("");
  const [step, setStep] = useState<"input" | "careers" | "courses">("input");
  const [careers, setCareers] = useState<Career[]>([]);
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
  const [courses, setCourses] = useState<CourseRec[]>([]);
  const [courseSummary, setCourseSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleExplore(value?: string) {
    const query = value ?? interest;
    if (!query.trim()) return;
    setInterest(query);
    setLoading(true);
    setError("");
    setCareers([]);
    setStep("input");

    try {
      const res = await fetch("/api/ai/careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interest: query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCareers(data.careers ?? []);
      setStep("careers");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGetCourses(career: Career) {
    setSelectedCareer(career);
    setLoading(true);
    setError("");
    setCourses([]);
    setStep("courses");

    try {
      const res = await fetch("/api/ai/career-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: career.title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCourses(data.recommendations ?? []);
      setCourseSummary(data.summary ?? "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Search bar — always visible */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-1">Career Explorer</h2>
        <p className="text-gray-500 text-sm mb-4">Enter your interest to discover related careers and recommended courses.</p>
        <div className="flex gap-2">
          <input
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleExplore()}
            placeholder="e.g. AI, robotics, web development..."
            className="flex-1 border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black text-gray-900"
          />
          <button
            onClick={() => handleExplore()}
            disabled={loading}
            className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? "Searching..." : "Explore"}
          </button>
        </div>

        {/* Quick tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleExplore(s)}
              disabled={loading}
              className="px-3 py-1 rounded-full text-xs border text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>

      {/* Career cards */}
      {step === "careers" && careers.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-3 px-1">
            {careers.length} careers related to <span className="font-medium text-gray-600">&quot;{interest}&quot;</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {careers.map((career) => (
              <div
                key={career.title}
                className={`bg-white border rounded-xl p-5 flex flex-col gap-3 transition ${
                  selectedCareer?.title === career.title ? "border-black ring-1 ring-black" : "hover:border-gray-300"
                }`}
              >
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{career.title}</h3>
                  {career.salary_range && (
                    <p className="text-xs text-gray-400 mt-0.5">{career.salary_range}</p>
                  )}
                </div>

                <p className="text-sm text-gray-600 leading-relaxed">{career.description}</p>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5">
                  {career.skills.map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{s}</span>
                  ))}
                </div>

                {/* Companies */}
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Related companies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {career.companies.map((c) => (
                      <span key={c} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">{c}</span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleGetCourses(career)}
                  disabled={loading}
                  className="mt-auto w-full border-2 border-black text-black text-sm font-medium py-2 rounded-lg hover:bg-black hover:text-white transition disabled:opacity-40"
                >
                  View Recommended Courses →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course recommendations */}
      {step === "courses" && selectedCareer && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Courses for — {selectedCareer.title}</h3>
              {courseSummary && <p className="text-xs text-gray-500 mt-0.5">{courseSummary}</p>}
            </div>
            <button
              onClick={() => { setStep("careers"); setSelectedCareer(null); }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ← Back
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">Finding relevant courses...</div>
          ) : (
            <div className="divide-y">
              {courses.map((c) => (
                <div key={c.code} className="px-5 py-3 flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                      <span className="text-xs text-gray-400 font-mono flex-shrink-0">{c.code}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">{c.credits}cr</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{c.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
