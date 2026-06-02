"use client";

import { useState, useTransition } from "react";
import { addCourse, removeCourse } from "./actions";

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
  const [isPending, startTransition] = useTransition();

  const scheduledCourses = courses.filter((c) => scheduledIds.includes(c.id));
  const availableCourses = courses.filter((c) => !scheduledIds.includes(c.id));
  const totalCredits = scheduledCourses.reduce((s, c) => s + c.credits, 0);

  const getCellCourses = (day: string, period: number) =>
    scheduledCourses.filter((c) => c.day_of_week === day && c.period === period);

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
    <div className="space-y-4">
      {/* Timetable Grid */}
      <div className="bg-white border rounded-xl p-4 overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base">Timetable</h3>
          {scheduledCourses.length > 0 && (
            <span className="text-xs text-gray-500">
              {scheduledCourses.length} courses · {totalCredits} credits
            </span>
          )}
        </div>
        <table className="w-full text-xs border-collapse" style={{ minWidth: 560 }}>
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
                  const cell = getCellCourses(day, period);
                  const conflict = cell.length > 1;
                  return (
                    <td
                      key={day}
                      className={`border border-gray-200 p-1 align-top ${conflict ? "bg-red-50" : "bg-white"}`}
                      style={{ minHeight: 56, minWidth: 80 }}
                    >
                      {cell.map((course) => (
                        <div key={course.id} className={`mb-1 p-1 rounded leading-tight ${conflict ? "bg-red-100" : "bg-blue-50"}`}>
                          <div className="flex items-start justify-between gap-0.5">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-800 truncate">{course.code}</p>
                              <p className="text-gray-600 truncate">{course.name}</p>
                              <p className="text-gray-400">{course.campus}</p>
                            </div>
                            <button
                              onClick={() => handleRemove(course.id)}
                              disabled={isPending}
                              className="text-red-400 hover:text-red-600 text-sm font-bold leading-none mt-0.5 flex-shrink-0 disabled:opacity-40"
                            >×</button>
                          </div>
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {scheduledCourses.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No courses yet — add courses below.</p>
        )}
      </div>

      {untimedCourses.length > 0 && (
        <div className="bg-white border rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-2 text-gray-700">Intensive / Other Courses</h3>
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

      {/* Course Search Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-bold text-base mb-3">Add Courses</h3>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by course code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:ring-2 focus:ring-black text-gray-900"
          />

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            <FilterChip
              label="Campus"
              value={filterCampus}
              onChange={setFilterCampus}
              options={[
                { label: "All", value: "all" },
                { label: "Toyosu", value: "Toyosu" },
                { label: "Omiya", value: "Omiya" },
              ]}
            />
            <FilterChip
              label="Day"
              value={filterDay}
              onChange={setFilterDay}
              options={[
                { label: "All", value: "all" },
                ...DAYS.map((d) => ({ label: DAY_SHORT[d], value: d })),
              ]}
            />
            <FilterChip
              label="Period"
              value={filterPeriod}
              onChange={setFilterPeriod}
              options={[
                { label: "All", value: "all" },
                ...PERIODS.map((p) => ({ label: `${p}Period`, value: String(p) })),
              ]}
            />
            <FilterChip
              label="Credits"
              value={filterCredits}
              onChange={setFilterCredits}
              options={[
                { label: "All", value: "all" },
                { label: "1 cr", value: "1" },
                { label: "2 cr", value: "2" },
                { label: "3 cr", value: "3" },
                { label: "4 cr", value: "4" },
              ]}
            />
            {(filterCampus !== "all" || filterDay !== "all" || filterPeriod !== "all" || filterCredits !== "all" || search) && (
              <button
                onClick={() => { setSearch(""); setFilterCampus("all"); setFilterDay("all"); setFilterPeriod("all"); setFilterCredits("all"); }}
                className="px-3 py-1.5 rounded-full text-xs text-gray-500 border border-gray-300 hover:bg-gray-50"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {!showTable ? (
          <p className="text-xs text-gray-400 text-center py-8">
            Enter a search term or select a filter to browse courses.
          </p>
        ) : (
          <>
            <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500">
              {filtered.length} courses found
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 400 }}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 border-b z-10">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-600 text-xs w-32">Code</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600 text-xs">Course Name</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600 text-xs w-20">Day / Period</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600 text-xs w-20">Campus</th>
                    <th className="text-center px-4 py-2 font-medium text-gray-600 text-xs w-12">Credits</th>
                    <th className="px-4 py-2 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-sm text-gray-400">
                        No courses match your filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.slice(0, 100).map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">{course.code}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-gray-900 text-sm">{course.name}</p>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                          {course.day_of_week ? `${DAY_SHORT[course.day_of_week]} P${course.period}` : <span className="text-gray-400">Intensive</span>}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">{course.campus ?? "-"}</td>
                        <td className="px-4 py-2.5 text-center text-xs font-medium text-gray-900">{course.credits}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => handleAdd(course.id)}
                            disabled={isPending}
                            className="text-xs bg-black text-white px-3 py-1 rounded-lg hover:bg-gray-800 disabled:opacity-40 whitespace-nowrap"
                          >
                            + Add
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {filtered.length > 100 && (
                <p className="text-xs text-gray-400 text-center py-3">
                  Showing top 100 results. Narrow your search for more specific results.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
