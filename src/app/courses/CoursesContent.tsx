"use client";

import { useState, useTransition } from "react";
import CreateReviewModal from "@/app/reviews/CreateReviewModal";
import { toggleCompleted, updateRecord } from "./actions";

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  campus: string;
  day_of_week: string;
  period: number;
  reviews?: Array<{ rating: number }>;
}

interface CompletedInfo { grade: string; semester: string; }

interface CoursesContentProps {
  courses: Course[] | null;
  completedMap: Record<string, CompletedInfo>;
  myReviews: Array<{ rating: number }>;
  scheduledIds: string[];
}

const GRADES = ["S", "A+", "A", "B+", "B", "C+", "C", "D", "F", "P"];

const GRADE_POINTS: Record<string, number | null> = {
  S: 4.0, "A+": 4.0, A: 3.7, "B+": 3.3, B: 3.0,
  "C+": 2.3, C: 2.0, D: 1.0, F: 0, P: null,
};

const GRADE_COLOR: Record<string, string> = {
  S: "bg-purple-500", "A+": "bg-blue-500", A: "bg-blue-400",
  "B+": "bg-green-500", B: "bg-green-400", "C+": "bg-yellow-500",
  C: "bg-yellow-400", D: "bg-orange-400", F: "bg-red-500", P: "bg-gray-400",
};

// Generate semester options: 2022 Spring ~ 2026 Fall
const SEMESTERS: string[] = [];
for (let y = 2022; y <= 2026; y++) {
  SEMESTERS.push(`${y} Spring`, `${y} Fall`);
}

function calcGPA(courses: Course[], completedMap: Record<string, CompletedInfo>, semFilter?: string) {
  let totalPoints = 0, totalCredits = 0;
  for (const c of courses) {
    const info = completedMap[c.id];
    if (!info) continue;
    if (semFilter && info.semester !== semFilter) continue;
    const pts = GRADE_POINTS[info.grade];
    if (pts === null || pts === undefined) continue;
    totalPoints += pts * c.credits;
    totalCredits += c.credits;
  }
  return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : null;
}

function calcCredits(courses: Course[], completedMap: Record<string, CompletedInfo>, semFilter?: string) {
  return courses.reduce((s, c) => {
    const info = completedMap[c.id];
    if (!info) return s;
    if (semFilter && info.semester !== semFilter) return s;
    if (!info.grade || info.grade === "F") return s;
    return s + c.credits;
  }, 0);
}

export default function CoursesContent({ courses, completedMap, myReviews, scheduledIds }: CoursesContentProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [activeSem, setActiveSem] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const allCourses = courses ?? [];
  const completedCourses = allCourses.filter((c) => c.id in completedMap);

  // semesters that have courses
  const usedSemesters = [...new Set(
    completedCourses.map((c) => completedMap[c.id].semester).filter(Boolean)
  )].sort();

  const overallGPA = calcGPA(allCourses, completedMap);
  const overallCredits = calcCredits(allCourses, completedMap);
  const semGPA = activeSem !== "all" ? calcGPA(allCourses, completedMap, activeSem) : null;
  const semCredits = activeSem !== "all" ? calcCredits(allCourses, completedMap, activeSem) : null;

  // Grade distribution for current view
  const viewCourses = activeSem === "all"
    ? completedCourses
    : completedCourses.filter((c) => completedMap[c.id].semester === activeSem);

  const gradeDist = GRADES.map((g) => ({
    grade: g,
    count: viewCourses.filter((c) => completedMap[c.id].grade === g).length,
  })).filter((d) => d.count > 0);
  const maxCount = Math.max(...gradeDist.map((d) => d.count), 1);

  const coursesForModal = allCourses.map((c) => ({ id: c.id, code: c.code, name: c.name }));

  // Courses to display in table
  const displayed = allCourses.filter((c) => {
    const q = search.trim().toLowerCase();
    if (q && !c.name.toLowerCase().includes(q) && !c.code.toLowerCase().includes(q)) return false;
    if (activeSem === "all") return c.id in completedMap;
    return completedMap[c.id]?.semester === activeSem;
  });

  function handleToggle(courseId: string) {
    startTransition(async () => {
      const isCompleted = courseId in completedMap;
      const sem = activeSem !== "all" && activeSem !== "not-taken" ? activeSem : "";
      await toggleCompleted(courseId, isCompleted, sem);
    });
  }

  function handleField(courseId: string, field: "grade" | "semester", value: string) {
    startTransition(async () => { await updateRecord(courseId, field, value); });
  }

  return (
    <>
      <div className="max-w-5xl mx-auto p-6 space-y-4">

        {/* ── Stats Header ── */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-end gap-10 mb-5 flex-wrap">
            <div>
              <p className="text-xs text-gray-400 mb-1">Overall GPA</p>
              <p className="text-4xl font-bold text-black">
                {overallGPA ?? "—"}
                <span className="text-base font-normal text-gray-400 ml-1">/ 4.0</span>
              </p>
            </div>
            {semGPA !== null && activeSem !== "all" && (
              <div>
                <p className="text-xs text-gray-400 mb-1">{activeSem} GPA</p>
                <p className="text-4xl font-bold text-gray-700">
                  {semGPA ?? "—"}
                  <span className="text-base font-normal text-gray-400 ml-1">/ 4.0</span>
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 mb-1">
                {activeSem !== "all" ? `${activeSem} Credits` : "Total Credits"}
              </p>
              <p className="text-4xl font-bold text-black">
                {activeSem !== "all" ? semCredits : overallCredits}
                <span className="text-base font-normal text-gray-400 ml-1">cr</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Courses Taken</p>
              <p className="text-4xl font-bold text-black">
                {activeSem !== "all" ? viewCourses.length : completedCourses.length}
                <span className="text-base font-normal text-gray-400 ml-1">courses</span>
              </p>
            </div>
          </div>

          <div className="flex gap-8 items-start flex-wrap">
            {gradeDist.length > 0 && (
              <div className="space-y-1.5 w-52">
                {gradeDist.map(({ grade, count }) => (
                  <div key={grade} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-6 text-right font-medium">{grade}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${GRADE_COLOR[grade] ?? "bg-gray-400"}`}
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-4">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Semester Tabs ── */}
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="border-b overflow-x-auto">
            <div className="flex min-w-max px-2 pt-2">
              {[
                { key: "all", label: "All Taken" },
                ...usedSemesters.map((s) => ({ key: s, label: s })),
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setActiveSem(key); setSearch(""); }}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeSem === key
                      ? "border-black text-black"
                      : "border-transparent text-gray-400 hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="px-4 py-2 border-b flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeSem === "all" ? "Search taken courses..." : `Search in ${activeSem}...`}
              className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-black text-gray-900 w-52"
            />
            <span className="text-xs text-gray-400 ml-auto">{displayed.length} courses</span>
          </div>

          {/* Table */}
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2.5 w-8"></th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Code</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Course Name</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500">Cr</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Campus</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500">Semester</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500">Grade</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500">Rating</th>
                <th className="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 text-sm">
                    {activeSem === "all" ? "No courses taken yet. Check courses below to add them." : "No courses recorded for this semester."}
                  </td>
                </tr>
              ) : (
                displayed.map((course) => {
                  const done = course.id in completedMap;
                  const info = completedMap[course.id];
                  const ratings = course.reviews?.map((r) => r.rating) ?? [];
                  const avg = ratings.length
                    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
                    : null;

                  return (
                    <tr key={course.id} className={`transition-colors ${done ? "bg-gray-50/40" : "hover:bg-gray-50"}`}>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => handleToggle(course.id)}
                          disabled={isPending}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all disabled:opacity-40 ${
                            done ? "bg-black border-black text-white" : "border-gray-300 hover:border-gray-500"
                          }`}
                        >
                          {done && <span className="text-xs leading-none">✓</span>}
                        </button>
                      </td>
                      <td className={`px-4 py-2.5 font-mono text-xs ${done ? "text-gray-300" : "text-gray-400"}`}>
                        {course.code}
                      </td>
                      <td className={`px-4 py-2.5 font-medium ${done ? "text-gray-400" : "text-gray-900"}`}>
                        {course.name}
                      </td>
                      <td className={`px-4 py-2.5 text-center text-xs ${done ? "text-gray-400" : "text-gray-700"}`}>
                        {course.credits}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          done ? "bg-gray-100 text-gray-400" :
                          course.campus === "Toyosu" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                        }`}>
                          {course.campus}
                        </span>
                      </td>
                      {/* Semester selector */}
                      <td className="px-4 py-2.5 text-center">
                        {done ? (
                          <select
                            value={info?.semester ?? ""}
                            onChange={(e) => handleField(course.id, "semester", e.target.value)}
                            disabled={isPending}
                            className="text-xs border rounded-md px-1.5 py-1 outline-none focus:ring-1 focus:ring-black bg-white text-gray-700 disabled:opacity-50 max-w-[110px]"
                          >
                            <option value="">—</option>
                            {SEMESTERS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : <span className="text-gray-200 text-xs">—</span>}
                      </td>
                      {/* Grade selector */}
                      <td className="px-4 py-2.5 text-center">
                        {done ? (
                          <select
                            value={info?.grade ?? ""}
                            onChange={(e) => handleField(course.id, "grade", e.target.value)}
                            disabled={isPending}
                            className="text-xs border rounded-md px-1.5 py-1 outline-none focus:ring-1 focus:ring-black bg-white text-gray-700 disabled:opacity-50"
                          >
                            <option value="">—</option>
                            {GRADES.map((g) => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        ) : <span className="text-gray-200 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {avg
                          ? <span className="text-xs text-yellow-500">★ {avg}</span>
                          : <span className="text-xs text-gray-200">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => { setSelectedCourseId(course.id); setShowModal(true); }}
                          className="text-xs text-gray-300 hover:text-blue-500 transition-colors"
                        >
                          Rate
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Courses ── */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Add Course to Records</h3>
        </div>

        {/* Current timetable courses */}
        {scheduledIds.length > 0 && (
          <div>
            <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Current Timetable
            </p>
            <div className="divide-y">
              {allCourses
                .filter((c) => scheduledIds.includes(c.id))
                .map((course) => {
                  const done = course.id in completedMap;
                  return (
                    <div key={course.id} className={`flex items-center gap-3 px-4 py-2.5 ${done ? "bg-gray-50" : "hover:bg-gray-50"}`}>
                      <button
                        onClick={() => handleToggle(course.id)}
                        disabled={isPending}
                        className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all disabled:opacity-40 ${
                          done ? "bg-black border-black text-white" : "border-gray-300 hover:border-gray-500"
                        }`}
                      >
                        {done && <span className="text-xs leading-none">✓</span>}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${done ? "text-gray-400" : "text-gray-900"}`}>{course.name}</p>
                        <p className="text-xs text-gray-400">
                          {course.code} · {course.campus} · {course.day_of_week ? `${course.day_of_week.slice(0,3)} P${course.period}` : "Intensive"} · {course.credits}cr
                        </p>
                      </div>
                      {done && <span className="text-xs text-green-600 font-medium flex-shrink-0">✓ Added</span>}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Search other courses */}
        <div className="px-4 pt-3 pb-2 border-t">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Search Other Courses</p>
          <input
            type="text"
            value={addSearch}
            onChange={(e) => setAddSearch(e.target.value)}
            placeholder="Type to search all courses..."
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black text-gray-900"
          />
        </div>

        {addSearch.trim().length >= 2 && (
          <div className="divide-y max-h-64 overflow-y-auto border-t">
            {allCourses
              .filter((c) => {
                if (scheduledIds.includes(c.id)) return false; // already shown above
                const q = addSearch.toLowerCase();
                return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
              })
              .slice(0, 40)
              .map((course) => {
                const done = course.id in completedMap;
                return (
                  <div key={course.id} className={`flex items-center gap-3 px-4 py-2.5 ${done ? "bg-gray-50" : "hover:bg-gray-50"}`}>
                    <button
                      onClick={() => handleToggle(course.id)}
                      disabled={isPending}
                      className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all disabled:opacity-40 ${
                        done ? "bg-black border-black text-white" : "border-gray-300 hover:border-gray-500"
                      }`}
                    >
                      {done && <span className="text-xs leading-none">✓</span>}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${done ? "text-gray-400" : "text-gray-900"}`}>{course.name}</p>
                      <p className="text-xs text-gray-400">
                        {course.code} · {course.campus} · {course.day_of_week ? `${course.day_of_week.slice(0,3)} P${course.period}` : "Intensive"} · {course.credits}cr
                      </p>
                    </div>
                    {done && <span className="text-xs text-green-600 font-medium flex-shrink-0">✓ Added</span>}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {showModal && (
        <CreateReviewModal
          courses={coursesForModal}
          onClose={() => { setShowModal(false); setSelectedCourseId(""); }}
          onSuccess={() => {}}
        />
      )}
    </>
  );
}
