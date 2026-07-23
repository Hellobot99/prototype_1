"use client";

import { useState } from "react";

interface CurriculumCourse {
  no: string;
  name: string;
  cat: string;
  cr: number;
  yr: number;
  sem: string;
  req: string;
  courses: string;
}

interface Curriculum {
  university: string;
  year: number;
  graduation: {
    credits: number;
    gpa: number;
    thesis_start: string;
    promotion_stop: string;
  };
  req_legend: Record<string, string>;
  courses: CurriculumCourse[];
}

interface Props {
  curricula: Curriculum[];
}

const REQ_STYLE: Record<string, string> = {
  required:          "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300",
  course_required:   "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300",
  elective_required: "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300",
  elective:          "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
  free:              "bg-blue-50 dark:bg-blue-950 text-blue-500 dark:text-blue-400",
};

const REQ_LABEL: Record<string, string> = {
  required:          "必修",
  course_required:   "コース必修",
  elective_required: "選択必修",
  elective:          "選択",
  free:              "自由",
};

const SEM_LABEL: Record<string, string> = {
  "前":   "Spring",
  "後":   "Fall",
  "前後": "Both",
  "":     "—",
};

const DEPT_SHORT = ["Architecture", "Design Eng."];

export default function CurriculumContent({ curricula }: Props) {
  const [deptIdx, setDeptIdx] = useState(0);
  const [activeYear, setActiveYear] = useState<number | "all">("all");
  const [search, setSearch] = useState("");

  const curr = curricula[deptIdx];
  const years = [1, 2, 3, 4] as const;

  const filtered = curr.courses.filter((c) => {
    if (activeYear !== "all" && c.yr !== activeYear) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.no.toLowerCase().includes(q) && !c.cat.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Group by category
  const grouped = filtered.reduce<Record<string, CurriculumCourse[]>>((acc, c) => {
    (acc[c.cat] = acc[c.cat] ?? []).push(c);
    return acc;
  }, {});

  const totalFiltered = filtered.reduce((s, c) => s + c.cr, 0);

  return (
    <div className="space-y-4">

      {/* Department tabs */}
      <div className="flex gap-2">
        {curricula.map((c, i) => (
          <button
            key={i}
            onClick={() => { setDeptIdx(i); setActiveYear("all"); setSearch(""); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              deptIdx === i
                ? "bg-[#008482] text-white"
                : "bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400"
            }`}
          >
            {DEPT_SHORT[i]}
          </button>
        ))}
      </div>

      {/* Graduation requirements */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Graduation Requirements</p>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <span className="text-gray-400 text-xs">Total credits</span>
            <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">{curr.graduation.credits} cr</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">Min GPA</span>
            <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">{curr.graduation.gpa}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">Thesis eligibility</span>
            <p className="text-gray-700 dark:text-gray-300 text-sm">{curr.graduation.thesis_start}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">Academic probation</span>
            <p className="text-gray-700 dark:text-gray-300 text-sm">{curr.graduation.promotion_stop}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Year tabs */}
        <div className="flex gap-1">
          {(["all", ...years] as const).map((y) => (
            <button
              key={y}
              onClick={() => setActiveYear(y)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeYear === y
                  ? "bg-[#008482] text-white"
                  : "bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400"
              }`}
            >
              {y === "all" ? "All" : `${y}年`}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses..."
          className="border dark:border-gray-600 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#008482] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 w-44"
        />

        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length} courses · {totalFiltered} credits
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(curr.req_legend).map(([key, label]) => (
          <span key={key} className={`text-xs px-2 py-0.5 rounded-full ${REQ_STYLE[key]}`}>
            {label} ({REQ_LABEL[key]})
          </span>
        ))}
      </div>

      {/* Course groups */}
      {Object.keys(grouped).length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-sm">No courses found.</p>
      ) : (
        Object.entries(grouped).map(([cat, courses]) => (
          <div key={cat} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
              <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{cat}</p>
              <span className="text-xs text-gray-400">
                {courses.length} courses · {courses.reduce((s, c) => s + c.cr, 0)} cr
              </span>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 w-28">Code</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Course Name</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 w-12">Yr</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 w-16">Sem</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 w-12">Cr</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 w-24">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {courses.map((c) => (
                    <tr key={c.no} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{c.no}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100">{c.name}</td>
                      <td className="px-4 py-2.5 text-center text-xs text-gray-500 dark:text-gray-400">{c.yr}</td>
                      <td className="px-4 py-2.5 text-center text-xs text-gray-500 dark:text-gray-400">{SEM_LABEL[c.sem] ?? c.sem}</td>
                      <td className="px-4 py-2.5 text-center text-xs text-gray-700 dark:text-gray-300 font-medium">{c.cr}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${REQ_STYLE[c.req] ?? REQ_STYLE.elective}`}>
                          {REQ_LABEL[c.req] ?? c.req}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-700">
              {courses.map((c) => (
                <div key={c.no} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{c.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.no} · {c.yr}年 · {SEM_LABEL[c.sem] ?? c.sem} · {c.cr}cr
                      </p>
                    </div>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${REQ_STYLE[c.req] ?? REQ_STYLE.elective}`}>
                      {REQ_LABEL[c.req] ?? c.req}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
