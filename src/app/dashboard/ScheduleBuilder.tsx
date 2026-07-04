"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { addCourse, removeCourse } from "./actions";
import AiSection from "./AiSection";
import { validateSchedule } from "@/lib/scheduling/validator";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS = [1, 2, 3, 4, 5, 6];
const DAY_SHORT: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
  Thursday: "Thu", Friday: "Fri", Saturday: "Sat",
};

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  campus: string | null;
  day_of_week: string | null;
  period: number | null;
  koma_su: number | null;
}

interface ScheduleBuilderProps {
  courses: Course[];
  scheduledIds: string[];
}

type FilterVal = string;
type SortKey = "name" | "campus" | "period" | "day";
type SortDirection = "asc" | "desc";

const DAY_ORDER = new Map(DAYS.map((day, index) => [day, index]));

function SortButton({
  label,
  column,
  sortKey,
  sortDirection,
  onSort,
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (column: SortKey) => void;
}) {
  const active = sortKey === column;

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className="inline-flex w-full items-center gap-1 text-left font-semibold text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white"
      aria-label={`Sort by ${label} ${active && sortDirection === "asc" ? "descending" : "ascending"}`}
    >
      <span>{label}</span>
      <span aria-hidden="true" className={active ? "text-[#008482]" : "text-gray-300 dark:text-gray-600"}>
        {active ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </button>
  );
}

export default function ScheduleBuilder({ courses, scheduledIds }: ScheduleBuilderProps) {
  const [search, setSearch] = useState("");
  const [filterCampus, setFilterCampus] = useState<FilterVal>("all");
  const [filterDay, setFilterDay] = useState<FilterVal>("all");
  const [filterPeriod, setFilterPeriod] = useState<FilterVal>("all");
  const [filterCredits, setFilterCredits] = useState<FilterVal>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [hoveredCourse, setHoveredCourse] = useState<Course | null>(null);
  const todayIndex = new Date().getDay() - 1; // Mon=0 ... Sat=5, Sun=-1
  const [mobileDay, setMobileDay] = useState<string>(DAYS[todayIndex] ?? "Monday");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiCodes, setAiCodes] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const aiCourses = courses.filter((c) => aiCodes.includes(c.code));
  const aiTimed = aiCourses.filter((c) => c.day_of_week && c.period);
  const aiUntimed = aiCourses.filter((c) => !c.day_of_week || !c.period);
  const aiCredits = aiCourses.reduce((s, c) => s + c.credits, 0);

  const isAiCovered = (day: string, period: number) =>
    aiTimed.some((c) => {
      if (c.day_of_week !== day || !c.period) return false;
      return c.period < period && c.period + (c.koma_su ?? 1) > period;
    });
  const getAiCell = (day: string, period: number) =>
    aiTimed.find((c) => c.day_of_week === day && c.period === period) ?? null;

  const scheduledCourses = courses.filter((c) => scheduledIds.includes(c.id));
  const availableCourses = courses.filter((c) => !scheduledIds.includes(c.id));
  const totalCredits = scheduledCourses.reduce((s, c) => s + c.credits, 0);

  const conflicts = validateSchedule(scheduledIds, courses);
  const campusErrors = conflicts.filter((c) => c.type === "campus_conflict" && c.severity === "error");
  const campusWarnings = conflicts.filter((c) => c.type === "campus_conflict" && c.severity === "warning");
  // each conflict is reported from both courses' perspectives, so de-dupe pairs for display
  const dedupe = (list: typeof conflicts) => {
    const seen = new Set<string>();
    const result: typeof conflicts = [];
    for (const c of list) {
      const key = [c.courseId, c.conflictingCourseId].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(c);
    }
    return result;
  };
  const campusErrorsUnique = dedupe(campusErrors);
  const campusWarningsUnique = dedupe(campusWarnings);

  // courses that START at this cell
  const getStartingCourses = (day: string, period: number) =>
    scheduledCourses.filter((c) => c.day_of_week === day && c.period === period);

  // returns true if a course that started earlier is still spanning this cell
  const isCoveredBySpan = (day: string, period: number) =>
    scheduledCourses.some((c) => {
      if (c.day_of_week !== day || !c.period) return false;
      const span = c.koma_su ?? 1;
      return c.period < period && c.period + span > period;
    });

  const untimedCourses = scheduledCourses.filter((c) => !c.day_of_week || !c.period);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = availableCourses.filter((c) => {
      if (q && !c.code.toLowerCase().includes(q) && !c.name.toLowerCase().includes(q)) return false;
      if (filterCampus !== "all" && c.campus !== filterCampus) return false;
      if (filterDay === "intensive" && c.day_of_week) return false;
      if (filterDay !== "all" && filterDay !== "intensive" && c.day_of_week !== filterDay) return false;
      if (filterPeriod === "intensive" && c.period) return false;
      if (filterPeriod !== "all" && filterPeriod !== "intensive" && String(c.period) !== filterPeriod) return false;
      if (filterCredits !== "all" && String(c.credits) !== filterCredits) return false;
      return true;
    });

    return result.sort((a, b) => {
      let comparison = 0;
      if (sortKey === "name") comparison = a.name.localeCompare(b.name);
      if (sortKey === "campus") comparison = (a.campus ?? "").localeCompare(b.campus ?? "");
      if (sortKey === "period") comparison = (a.period ?? Number.MAX_SAFE_INTEGER) - (b.period ?? Number.MAX_SAFE_INTEGER);
      if (sortKey === "day") {
        comparison = (DAY_ORDER.get(a.day_of_week ?? "") ?? Number.MAX_SAFE_INTEGER)
          - (DAY_ORDER.get(b.day_of_week ?? "") ?? Number.MAX_SAFE_INTEGER);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [
    availableCourses,
    filterCampus,
    filterCredits,
    filterDay,
    filterPeriod,
    search,
    sortDirection,
    sortKey,
  ]);

  const hasFilters = Boolean(
    search
    || filterCampus !== "all"
    || filterDay !== "all"
    || filterPeriod !== "all"
    || filterCredits !== "all"
  );

  function handleSort(column: SortKey) {
    if (column === sortKey) {
      setSortDirection((current) => current === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(column);
    setSortDirection("asc");
  }

  function handleAdd(courseId: string) {
    startTransition(async () => { await addCourse(courseId); });
  }
  function handleRemove(courseId: string) {
    startTransition(async () => { await removeCourse(courseId); });
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">

      {/* ── LEFT: Timetable (65%) ── */}
      <div className="w-full lg:flex-[13] min-w-0 space-y-3">
        {(campusErrorsUnique.length > 0 || campusWarningsUnique.length > 0) && (
          <div className="space-y-2">
            {campusErrorsUnique.map((c) => (
              <div key={`${c.courseId}-${c.conflictingCourseId}`} className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
                <span className="font-semibold">{c.courseName}</span> ↔{" "}
                <span className="font-semibold">{c.conflictingCourseName}</span>: {c.message}
              </div>
            ))}
            {campusWarningsUnique.map((c) => (
              <div key={`${c.courseId}-${c.conflictingCourseId}`} className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs rounded-lg px-3 py-2">
                <span className="font-semibold">{c.courseName}</span> ↔{" "}
                <span className="font-semibold">{c.conflictingCourseName}</span>: {c.message}
              </div>
            ))}
          </div>
        )}
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-2 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Timetable</h3>
            {scheduledCourses.length > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {scheduledCourses.length} courses · {totalCredits} credits
              </span>
            )}
          </div>
          {/* Mobile: day-by-day list view */}
          <div className="sm:hidden">
            <div className="flex gap-1 mb-2">
              {DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => setMobileDay(d)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                    mobileDay === d ? "bg-[#008482] text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {DAY_SHORT[d]}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              {PERIODS.map((period) => {
                if (isCoveredBySpan(mobileDay, period)) return null;
                const starting = getStartingCourses(mobileDay, period);
                const conflict = starting.length > 1;
                const span = starting.length === 1 ? (starting[0].koma_su ?? 1) : 1;

                return (
                  <div key={period} className="flex items-stretch gap-2">
                    <div className="w-10 flex-shrink-0 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center text-xs text-gray-400 font-medium">
                      {span > 1 ? `${period}–${period + span - 1}` : period}
                    </div>
                    <div className={`flex-1 min-w-0 rounded-lg border px-2 py-1.5 ${
                      conflict ? "border-red-200 bg-red-50 dark:bg-red-950" : starting.length ? "border-[#008482]/20 bg-[#e8faf6] dark:bg-[#1a3a2a]" : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
                    }`}>
                      {starting.length === 0 ? (
                        <p className="text-xs text-gray-300">—</p>
                      ) : (
                        starting.map((course) => (
                          <div key={course.id} className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#134e3b] dark:text-[#bef2dc] truncate">{course.name}</p>
                              <p className="text-xs text-gray-400">{course.code} · {course.campus}</p>
                            </div>
                            <button
                              onClick={() => handleRemove(course.id)}
                              disabled={isPending}
                              className="text-red-400 hover:text-red-600 text-sm font-bold flex-shrink-0 disabled:opacity-40"
                            >×</button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop: weekly grid view */}
          <div className="hidden sm:grid w-full text-xs grid-cols-[2.5rem_repeat(6,minmax(80px,1fr))]">
            <div className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-2 text-gray-400 font-normal text-center">Period</div>
            {DAYS.map((d) => (
              <div key={d} className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-2 text-gray-700 dark:text-gray-300 font-semibold text-center">
                {DAY_SHORT[d]}
              </div>
            ))}

            {PERIODS.map((period) => (
              <Fragment key={period}>
                <div className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-1 flex items-center justify-center text-center text-gray-400 font-medium">
                  {period}
                </div>
                {DAYS.map((day) => {
                  if (isCoveredBySpan(day, period)) return null;

                  const starting = getStartingCourses(day, period);
                  const conflict = starting.length > 1;
                  const span = starting.length === 1 ? (starting[0].koma_su ?? 1) : 1;

                  const isHoverStart =
                    hoveredCourse?.day_of_week === day && hoveredCourse?.period === period;
                  const isHoverConflict = isHoverStart && starting.length > 0;

                  return (
                    <div
                      key={day}
                      className={`border border-gray-200 dark:border-gray-700 p-1 relative ${conflict ? "bg-red-50 dark:bg-red-950" : "bg-white dark:bg-gray-800"}`}
                      style={{ gridRow: `span ${span} / span ${span}` }}
                    >
                      {starting.map((course) => (
                        <div key={course.id} className={`p-1 rounded leading-tight h-full ${conflict ? "mb-1 bg-red-100" : "bg-[#bef2dc]"}`}>
                          <div className="flex items-start justify-between gap-0.5">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-[#134e3b] truncate">{course.code}</p>
                              <p className="text-[#134e3b]/70 truncate">{course.name}</p>
                              <p className="text-[#134e3b]/50">{course.campus}</p>
                              {(course.koma_su ?? 1) > 1 && (
                                <p className="text-[#008482] font-medium">P{course.period}–{(course.period ?? 0) + (course.koma_su ?? 1) - 1}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemove(course.id)}
                              disabled={isPending}
                              className="text-red-400 hover:text-red-600 text-sm font-bold leading-none mt-0.5 flex-shrink-0 disabled:opacity-40"
                            >×</button>
                          </div>
                        </div>
                      ))}

                      {/* Ghost preview — absolutely positioned so it never affects layout */}
                      {isHoverStart && hoveredCourse && (
                        <div className={`absolute inset-0 p-1 border-2 border-dashed pointer-events-none z-10 rounded-sm ${
                          isHoverConflict
                            ? "bg-red-100/80 border-red-400"
                            : "bg-green-100/80 border-green-400"
                        }`}>
                          <p className="font-bold truncate text-xs text-gray-800">{hoveredCourse.code}</p>
                          <p className="truncate text-xs text-gray-600">{hoveredCourse.name}</p>
                          {isHoverConflict && <p className="text-xs text-red-600 font-semibold">Conflict!</p>}
                          {(hoveredCourse.koma_su ?? 1) > 1 && (
                            <p className="text-xs text-green-600">P{hoveredCourse.period}–{(hoveredCourse.period ?? 0) + (hoveredCourse.koma_su ?? 1) - 1}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
          {scheduledCourses.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No courses yet — search and add from the right panel.</p>
          )}
        </div>

        {/* Intensive / untimed courses */}
        {untimedCourses.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-300">Intensive / Other Courses</h3>
            <div className="space-y-1">
              {untimedCourses.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm py-1">
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{c.code}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">{c.name}</span>
                    <span className="text-gray-400 text-xs ml-2">{c.campus} · {c.credits} cr</span>
                  </div>
                  <button onClick={() => handleRemove(c.id)} disabled={isPending} className="text-red-400 hover:text-red-600 text-xs font-bold disabled:opacity-40">× Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Suggested Timetable */}
        {aiCourses.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">AI Suggested Timetable</h3>
                {aiSuggestion && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{aiSuggestion}</p>}
              </div>
              <button onClick={() => { setAiCodes([]); setAiSuggestion(""); }} className="text-gray-300 hover:text-gray-500 text-lg leading-none ml-3 flex-shrink-0">×</button>
            </div>
            <div className="p-2 sm:p-3">
              <p className="text-xs text-gray-400 mb-2">{aiCourses.length} courses · {aiCredits} credits</p>

              {/* Mobile: day-by-day list view */}
              <div className="sm:hidden">
                <div className="flex gap-1 mb-2">
                  {DAYS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setMobileDay(d)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                        mobileDay === d ? "bg-[#008482] text-white" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {DAY_SHORT[d]}
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5">
                  {PERIODS.map((period) => {
                    if (isAiCovered(mobileDay, period)) return null;
                    const course = getAiCell(mobileDay, period);
                    const span = course ? (course.koma_su ?? 1) : 1;

                    return (
                      <div key={period} className="flex items-stretch gap-2">
                        <div className="w-10 flex-shrink-0 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center text-xs text-gray-400 font-medium">
                          {span > 1 ? `${period}–${period + span - 1}` : period}
                        </div>
                        <div className={`flex-1 min-w-0 rounded-lg border px-2 py-1.5 ${
                          course ? "border-purple-100 bg-purple-50 dark:bg-purple-950 dark:border-purple-900" : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
                        }`}>
                          {!course ? (
                            <p className="text-xs text-gray-300">—</p>
                          ) : (
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-purple-800 dark:text-purple-300 truncate">{course.name}</p>
                              <p className="text-xs text-gray-400">{course.code} · {course.campus}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desktop: weekly grid view */}
              <div className="hidden sm:grid w-full text-xs grid-cols-[1.75rem_repeat(6,minmax(70px,1fr))]">
                <div className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-1 text-gray-400 font-normal text-center">P</div>
                {DAYS.map((d) => (
                  <div key={d} className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-1 text-gray-600 dark:text-gray-300 font-medium text-center">
                    {DAY_SHORT[d]}
                  </div>
                ))}

                {PERIODS.map((period) => (
                  <Fragment key={period}>
                    <div className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-1 flex items-center justify-center text-center text-gray-400">{period}</div>
                    {DAYS.map((day) => {
                      if (isAiCovered(day, period)) return null;
                      const course = getAiCell(day, period);
                      const span = course ? (course.koma_su ?? 1) : 1;
                      return (
                        <div
                          key={day}
                          className={`border border-gray-200 dark:border-gray-700 p-0.5 ${course ? "bg-purple-50 dark:bg-purple-950" : "bg-white dark:bg-gray-800"}`}
                          style={{ gridRow: `span ${span} / span ${span}` }}
                        >
                          {course && (
                            <div className="bg-purple-100 rounded p-1 leading-tight h-full">
                              <p className="font-bold text-purple-800 truncate text-xs">{course.code}</p>
                              <p className="text-purple-600 truncate" style={{ fontSize: 9 }}>{course.name}</p>
                              {(course.koma_su ?? 1) > 1 && (
                                <p className="text-purple-400" style={{ fontSize: 9 }}>P{course.period}–{(course.period ?? 0) + (course.koma_su ?? 1) - 1}</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>

              {aiUntimed.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {aiUntimed.map((c) => (
                    <span key={c.id} className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">{c.code} · {c.name}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: Search + AI (35%) ── */}
      <div className="w-full lg:flex-[7] min-w-0 space-y-3 lg:sticky lg:top-4">

        {/* Course Search */}
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Add Courses</h3>
                <p className="mt-0.5 text-xs text-gray-400">Select a time slot or sort a column to find a course.</p>
              </div>
              {hasFilters && (
                <button
                  onClick={() => { setSearch(""); setFilterCampus("all"); setFilterDay("all"); setFilterPeriod("all"); setFilterCredits("all"); }}
                  className="flex-shrink-0 text-xs font-medium text-gray-500 underline-offset-2 hover:text-black hover:underline dark:text-gray-400 dark:hover:text-white"
                >Reset</button>
              )}
            </div>
            <label className="block">
              <span className="sr-only">Search courses</span>
              <input
                type="search"
                placeholder="Search by course name or code"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#008482] text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400"
              />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                Location
                <select
                  value={filterCampus}
                  onChange={(e) => setFilterCampus(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-[#008482] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="all">All locations</option>
                  <option value="Toyosu">Toyosu</option>
                  <option value="Omiya">Omiya</option>
                </select>
              </label>
              <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                Day
                <select
                  value={filterDay}
                  onChange={(e) => setFilterDay(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-[#008482] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="all">All days</option>
                  {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                  <option value="intensive">Intensive</option>
                </select>
              </label>
              <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                Period
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-[#008482] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="all">All periods</option>
                  {PERIODS.map((period) => <option key={period} value={period}>Period {period}</option>)}
                  <option value="intensive">Intensive</option>
                </select>
              </label>
              <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                Credits
                <select
                  value={filterCredits}
                  onChange={(e) => setFilterCredits(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-[#008482] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="all">All credits</option>
                  {[1, 2, 3, 4].map((credit) => <option key={credit} value={credit}>{credit} credits</option>)}
                </select>
              </label>
            </div>
          </div>

          <p className="border-b bg-gray-50 px-4 py-2 text-xs text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "course" : "courses"} found
          </p>
          <div className="max-h-[420px] overflow-y-auto overflow-x-hidden">
            <table className="w-full table-fixed border-collapse text-[11px]">
              <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#e5e7eb] dark:bg-gray-800 dark:shadow-[0_1px_0_0_#374151]">
                <tr>
                  <th className="w-[36%] px-2 py-2.5 text-left">
                    <SortButton label="Course Name" column="name" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="w-[18%] px-1 py-2.5 text-left">
                    <SortButton label="Location" column="campus" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="w-[14%] px-1 py-2.5 text-left">
                    <SortButton label="Period" column="period" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="w-[14%] px-1 py-2.5 text-left">
                    <SortButton label="Day" column="day" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="w-[18%] px-2 py-2.5"><span className="sr-only">Add</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                      No courses match your filters.
                    </td>
                  </tr>
                ) : filtered.slice(0, 100).map((course) => (
                  <tr
                    key={course.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    onMouseEnter={() => setHoveredCourse(course)}
                    onMouseLeave={() => setHoveredCourse(null)}
                  >
                    <td className="px-2 py-2.5">
                      <p className="truncate font-semibold text-gray-900 dark:text-gray-100" title={course.name}>{course.name}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-gray-400 dark:text-gray-500">{course.code} · {course.credits}cr</p>
                    </td>
                    <td className="truncate px-1 py-2.5 text-gray-600 dark:text-gray-300" title={course.campus ?? undefined}>{course.campus ?? "—"}</td>
                    <td className="truncate px-1 py-2.5 text-gray-600 dark:text-gray-300">{course.period ? `P${course.period}` : "Int."}</td>
                    <td className="truncate px-1 py-2.5 text-gray-600 dark:text-gray-300">{course.day_of_week ? DAY_SHORT[course.day_of_week] : "—"}</td>
                    <td className="px-2 py-2.5 text-right">
                      <button
                        onClick={() => handleAdd(course.id)}
                        disabled={isPending}
                        aria-label={`Add ${course.name}`}
                        className="w-full rounded-lg bg-[#008482] px-1.5 py-1.5 font-semibold text-white hover:bg-[#006e6c] disabled:opacity-40"
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 100 && (
              <p className="border-t px-4 py-3 text-center text-xs text-gray-400 dark:border-gray-700">Top 100 shown — narrow your filters.</p>
            )}
          </div>
        </div>

        {/* AI Section */}
        <AiSection onResult={(s, codes) => { setAiSuggestion(s); setAiCodes(codes); }} />
      </div>

    </div>
  );
}
