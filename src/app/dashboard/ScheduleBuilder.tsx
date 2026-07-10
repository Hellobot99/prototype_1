"use client";

import { Fragment, useState, useTransition } from "react";
import { saveSchedule } from "./actions";
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

function FilterChip({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: FilterVal }[];
  value: FilterVal;
  onChange: (v: FilterVal) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
          value !== "all"
            ? "bg-[#008482] text-white border-[#008482]"
            : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-gray-400"
        }`}
      >
        {label}: {selected?.label ?? "All"}
        <span className="text-[10px] opacity-60">▼</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-8 left-0 z-20 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-lg py-1 min-w-[120px]">
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  value === o.value ? "font-bold text-black dark:text-white" : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ScheduleBuilder({ courses, scheduledIds }: ScheduleBuilderProps) {
  const [search, setSearch] = useState("");
  const [filterCampus, setFilterCampus] = useState<FilterVal>("all");
  const [filterDay, setFilterDay] = useState<FilterVal>("all");
  const [filterPeriod, setFilterPeriod] = useState<FilterVal>("all");
  const [filterCredits, setFilterCredits] = useState<FilterVal>("all");
  const [hoveredCourse, setHoveredCourse] = useState<Course | null>(null);
  const todayIndex = new Date().getDay() - 1; // Mon=0 ... Sat=5, Sun=-1
  const [mobileDay, setMobileDay] = useState<string>(DAYS[todayIndex] ?? "Monday");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiCodes, setAiCodes] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [pendingIds, setPendingIds] = useState<string[]>(scheduledIds);
  const isDirty = pendingIds.length !== scheduledIds.length ||
    pendingIds.some((id) => !scheduledIds.includes(id));

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

  const scheduledCourses = courses.filter((c) => pendingIds.includes(c.id));
  const availableCourses = courses.filter((c) => !pendingIds.includes(c.id));
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

  const filtered = availableCourses.filter((c) => {
    const q = search.trim().toLowerCase();
    if (q && !c.code.toLowerCase().includes(q) && !c.name.toLowerCase().includes(q)) return false;
    if (filterCampus !== "all" && c.campus !== filterCampus) return false;
    if (filterDay !== "all" && c.day_of_week !== filterDay) return false;
    if (filterPeriod !== "all" && String(c.period) !== filterPeriod) return false;
    if (filterCredits !== "all" && String(c.credits) !== filterCredits) return false;
    return true;
  });

  const showTable = search.trim().length > 0 || filterCampus !== "all" || filterDay !== "all" || filterPeriod !== "all" || filterCredits !== "all";

  function handleAdd(courseId: string) {
    setPendingIds((prev) => [...new Set([...prev, courseId])]);
  }
  function handleRemove(courseId: string) {
    setPendingIds((prev) => prev.filter((id) => id !== courseId));
  }
  function handleSave() {
    startTransition(async () => { await saveSchedule(pendingIds); });
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
            <div className="flex items-center gap-3">
              {scheduledCourses.length > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {scheduledCourses.length} courses · {totalCredits} credits
                </span>
              )}
              {isDirty && (
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="bg-[#008482] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#006e6c] transition disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save"}
                </button>
              )}
            </div>
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
            <div translate="no" className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-2 text-gray-400 font-normal text-center">Period</div>
            {DAYS.map((d) => (
              <div translate="no" key={d} className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-2 text-gray-700 dark:text-gray-300 font-semibold text-center">
                {DAY_SHORT[d]}
              </div>
            ))}

            {PERIODS.map((period) => (
              <Fragment key={period}>
                <div translate="no" className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-1 flex items-center justify-center text-center text-gray-400 font-medium">
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
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-visible">
          <div className="p-4 border-b dark:border-gray-700">
            <h3 className="font-bold text-sm mb-3 text-gray-900 dark:text-gray-100">Add Courses</h3>
            <input
              type="text"
              placeholder="Search by code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:ring-2 focus:ring-[#008482] text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400"
            />
            <div className="flex flex-wrap gap-1.5">
              <FilterChip label="Campus" value={filterCampus} onChange={setFilterCampus}
                options={[{ label: "All", value: "all" }, { label: "Toyosu", value: "Toyosu" }, { label: "Omiya", value: "Omiya" }]}
              />
              <FilterChip label="Day" value={filterDay} onChange={setFilterDay}
                options={[{ label: "All", value: "all" }, ...DAYS.map((d) => ({ label: DAY_SHORT[d], value: d }))]}
              />
              <FilterChip label="Period" value={filterPeriod} onChange={setFilterPeriod}
                options={[{ label: "All", value: "all" }, ...PERIODS.map((p) => ({ label: `P${p}`, value: String(p) }))]}
              />
              <FilterChip label="Credits" value={filterCredits} onChange={setFilterCredits}
                options={[{ label: "All", value: "all" }, { label: "1cr", value: "1" }, { label: "2cr", value: "2" }, { label: "3cr", value: "3" }, { label: "4cr", value: "4" }]}
              />
              {(filterCampus !== "all" || filterDay !== "all" || filterPeriod !== "all" || filterCredits !== "all" || search) && (
                <button
                  onClick={() => { setSearch(""); setFilterCampus("all"); setFilterDay("all"); setFilterPeriod("all"); setFilterCredits("all"); }}
                  className="px-2.5 py-1 rounded-full text-xs text-gray-500 border border-gray-300 hover:bg-gray-50"
                >Reset</button>
              )}
            </div>
          </div>

          {!showTable ? (
            <p className="text-xs text-gray-400 text-center py-6">Search or filter to browse courses.</p>
          ) : (
            <>
              <p className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">{filtered.length} courses found</p>
              <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
                {filtered.length === 0 ? (
                  <p className="text-center py-8 text-sm text-gray-400">No courses match your filters.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filtered.slice(0, 100).map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-default"
                        onMouseEnter={() => setHoveredCourse(course)}
                        onMouseLeave={() => setHoveredCourse(null)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs truncate">{course.name}</p>
                          <p className="text-gray-400 dark:text-gray-500 text-xs">
                            {course.code}
                            {course.day_of_week ? ` · ${DAY_SHORT[course.day_of_week]} P${course.period}` : " · Intensive"}
                            {` · ${course.campus} · ${course.credits}cr`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAdd(course.id)}
                          disabled={isPending}
                          className="flex-shrink-0 text-xs bg-[#008482] text-white px-2.5 py-1 rounded-lg hover:bg-[#006e6c] disabled:opacity-40"
                        >+ Add</button>
                      </div>
                    ))}
                    {filtered.length > 100 && (
                      <p className="text-xs text-gray-400 text-center py-3">Top 100 shown — narrow your search.</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* AI Section */}
        <AiSection onResult={(s, codes) => { setAiSuggestion(s); setAiCodes(codes); }} />
      </div>

    </div>
  );
}
