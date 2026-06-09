"use client";

import { useState, useTransition } from "react";
import { addCourse, removeCourse } from "./actions";
import AiSection from "./AiSection";

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
            ? "bg-black text-white border-black"
            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
        }`}
      >
        {label}: {selected?.label ?? "All"}
        <span className="text-[10px] opacity-60">▼</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-8 left-0 z-20 bg-white border rounded-xl shadow-lg py-1 min-w-[120px]">
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 ${
                  value === o.value ? "font-bold text-black" : "text-gray-700"
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
    startTransition(async () => { await addCourse(courseId); });
  }
  function handleRemove(courseId: string) {
    startTransition(async () => { await removeCourse(courseId); });
  }

  return (
    <div className="flex gap-4 items-start">

      {/* ── LEFT: Timetable (65%) ── */}
      <div className="flex-[13] min-w-0 space-y-3">
        <div className="bg-white border rounded-xl p-4 overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base">Timetable</h3>
            {scheduledCourses.length > 0 && (
              <span className="text-xs text-gray-500">
                {scheduledCourses.length} courses · {totalCredits} credits
              </span>
            )}
          </div>
          <table className="w-full text-xs border-collapse" style={{ minWidth: 480 }}>
          <thead>
            <tr>
              <th className="border border-gray-200 bg-gray-50 p-2 text-gray-400 font-normal w-8">Period</th>
              {DAYS.map((d) => (
                <th key={d} className="border border-gray-200 bg-gray-50 p-2 text-gray-700 font-semibold">
                  {DAY_SHORT[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => (
              <tr key={period}>
                <td className="border border-gray-200 bg-gray-50 p-1 text-center text-gray-400 font-medium">
                  {period}
                </td>
                {DAYS.map((day) => {
                  if (isCoveredBySpan(day, period)) return null;

                  const starting = getStartingCourses(day, period);
                  const conflict = starting.length > 1;
                  const span = starting.length === 1 ? (starting[0].koma_su ?? 1) : 1;

                  const isHoverStart =
                    hoveredCourse?.day_of_week === day && hoveredCourse?.period === period;
                  const isHoverConflict = isHoverStart && starting.length > 0;

                  return (
                    <td
                      key={day}
                      rowSpan={span}
                      className={`border border-gray-200 p-1 align-top relative ${conflict ? "bg-red-50" : "bg-white"}`}
                      style={{ minWidth: 80 }}
                    >
                      {starting.map((course) => (
                        <div key={course.id} className={`mb-1 p-1 rounded leading-tight ${conflict ? "bg-red-100" : "bg-blue-50"}`}>
                          <div className="flex items-start justify-between gap-0.5">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-800 truncate">{course.code}</p>
                              <p className="text-gray-600 truncate">{course.name}</p>
                              <p className="text-gray-400">{course.campus}</p>
                              {(course.koma_su ?? 1) > 1 && (
                                <p className="text-blue-400 font-medium">P{course.period}–{(course.period ?? 0) + (course.koma_su ?? 1) - 1}</p>
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
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
          {scheduledCourses.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">No courses yet — search and add from the right panel.</p>
          )}
        </div>

        {/* Intensive / untimed courses */}
        {untimedCourses.length > 0 && (
          <div className="bg-white border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-2 text-gray-600">Intensive / Other Courses</h3>
            <div className="space-y-1">
              {untimedCourses.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm py-1">
                  <div>
                    <span className="font-medium text-gray-800">{c.code}</span>
                    <span className="text-gray-500 ml-2">{c.name}</span>
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
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">AI Suggested Timetable</h3>
                {aiSuggestion && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{aiSuggestion}</p>}
              </div>
              <button onClick={() => { setAiCodes([]); setAiSuggestion(""); }} className="text-gray-300 hover:text-gray-500 text-lg leading-none ml-3 flex-shrink-0">×</button>
            </div>
            <div className="p-3 overflow-x-auto">
              <p className="text-xs text-gray-400 mb-2">{aiCourses.length} courses · {aiCredits} credits</p>
              <table className="w-full text-xs border-collapse" style={{ minWidth: 480 }}>
                <thead>
                  <tr>
                    <th className="border border-gray-200 bg-gray-50 p-1 text-gray-400 font-normal w-8 text-center">P</th>
                    {DAYS.map((d) => (
                      <th key={d} className="border border-gray-200 bg-gray-50 p-1 text-gray-600 font-medium text-center">
                        {DAY_SHORT[d]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((period) => (
                    <tr key={period}>
                      <td className="border border-gray-200 bg-gray-50 p-1 text-center text-gray-400">{period}</td>
                      {DAYS.map((day) => {
                        if (isAiCovered(day, period)) return null;
                        const course = getAiCell(day, period);
                        const span = course ? (course.koma_su ?? 1) : 1;
                        return (
                          <td
                            key={day}
                            rowSpan={span}
                            className={`border border-gray-200 p-0.5 align-middle ${course ? "bg-purple-50" : "bg-white"}`}
                            style={{ minWidth: 70 }}
                          >
                            {course && (
                              <div className="bg-purple-100 rounded p-1 leading-tight">
                                <p className="font-bold text-purple-800 truncate text-xs">{course.code}</p>
                                <p className="text-purple-600 truncate" style={{ fontSize: 9 }}>{course.name}</p>
                                {(course.koma_su ?? 1) > 1 && (
                                  <p className="text-purple-400" style={{ fontSize: 9 }}>P{course.period}–{(course.period ?? 0) + (course.koma_su ?? 1) - 1}</p>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
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
      <div className="flex-[7] min-w-0 space-y-3 sticky top-4">

        {/* Course Search */}
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-bold text-sm mb-3">Add Courses</h3>
            <input
              type="text"
              placeholder="Search by code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:ring-2 focus:ring-black text-gray-900"
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
              <p className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500">{filtered.length} courses found</p>
              <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
                {filtered.length === 0 ? (
                  <p className="text-center py-8 text-sm text-gray-400">No courses match your filters.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filtered.slice(0, 100).map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors cursor-default"
                        onMouseEnter={() => setHoveredCourse(course)}
                        onMouseLeave={() => setHoveredCourse(null)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 text-xs truncate">{course.name}</p>
                          <p className="text-gray-400 text-xs">
                            {course.code}
                            {course.day_of_week ? ` · ${DAY_SHORT[course.day_of_week]} P${course.period}` : " · Intensive"}
                            {` · ${course.campus} · ${course.credits}cr`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAdd(course.id)}
                          disabled={isPending}
                          className="flex-shrink-0 text-xs bg-black text-white px-2.5 py-1 rounded-lg hover:bg-gray-800 disabled:opacity-40"
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
