"use client";

import { useState } from "react";
import { validateSchedule, hasErrors, getErrorCount, getWarningCount } from "@/lib/scheduling/validator";
import { saveSchedule } from "./actions";

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
}

export default function ScheduleBuilder({ courses }: ScheduleBuilderProps) {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [semester, setSemester] = useState("Fall 2025");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const conflicts = validateSchedule(selectedCourses, courses);
  const hasConflictErrors = hasErrors(conflicts);
  const errorCount = getErrorCount(conflicts);
  const warningCount = getWarningCount(conflicts);

  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const selectAll = () => {
    setSelectedCourses(courses.map((c) => c.id));
  };

  const clearAll = () => {
    setSelectedCourses([]);
  };

  async function handleSave() {
    if (selectedCourses.length === 0) {
      setError("Please select at least one course.");
      return;
    }

    if (hasConflictErrors) {
      setError("Cannot save schedule with time conflicts.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("semester", semester);
    selectedCourses.forEach((id) => formData.append("courseIds", id));

    const result = await saveSchedule(formData);

    if (result?.error) {
      setError(result.error);
    } else if (result?.message) {
      setSuccess(result.message);
      setSelectedCourses([]);
      setTimeout(() => setSuccess(""), 3000);
    }

    setLoading(false);
  }

  return (
    <div className="bg-white border rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4">Build Your Schedule</h3>

      {/* Semester Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-900">Semester</label>
        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black text-gray-900 bg-white"
        >
          <option>Fall 2025</option>
          <option>Spring 2026</option>
          <option>Summer 2026</option>
        </select>
      </div>

      {/* Conflicts Summary */}
      {conflicts.length > 0 && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${hasConflictErrors ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}>
          {hasConflictErrors ? (
            <p className="font-medium">❌ {errorCount} time conflict(s) detected</p>
          ) : (
            <p className="font-medium">⚠️ {warningCount} warning(s)</p>
          )}
        </div>
      )}

      {/* Conflict Details */}
      {conflicts.length > 0 && (
        <div className="mb-4 space-y-2 max-h-32 overflow-y-auto">
          {conflicts.map((conflict, idx) => (
            <div
              key={idx}
              className={`text-xs p-2 rounded ${conflict.severity === "error"
                  ? "bg-red-50 text-red-600"
                  : "bg-yellow-50 text-yellow-600"
                }`}
            >
              <p className="font-medium">{conflict.courseName}</p>
              <p>{conflict.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Course Selection */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-900">
            Select Courses ({selectedCourses.length}/{courses.length})
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-blue-600 hover:underline"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-gray-500 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-gray-50">
          {courses.length === 0 ? (
            <p className="text-xs text-gray-500">No courses available</p>
          ) : (
            courses.map((course) => {
              const isSelected = selectedCourses.includes(course.id);
              const courseConflicts = conflicts.filter((c) => c.courseId === course.id);
              const hasError = courseConflicts.some((c) => c.severity === "error");

              return (
                <label
                  key={course.id}
                  className={`flex items-start gap-3 p-2 rounded cursor-pointer ${hasError ? "bg-red-50" : isSelected ? "bg-blue-50" : "hover:bg-gray-100"
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCourse(course.id)}
                    className="mt-1 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${hasError ? "text-red-700" : "text-gray-900"}`}>
                      {course.code} - {course.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {course.credits}cr · {course.campus} · {course.day_of_week} P{course.period}
                    </p>
                    {courseConflicts.length > 0 && (
                      <p className={`text-xs mt-1 ${hasError ? "text-red-600" : "text-yellow-600"}`}>
                        {courseConflicts[0]?.message}
                      </p>
                    )}
                  </div>
                </label>
              );
            })
          )}
        </div>
      </div>

      {/* Messages */}
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      {success && <p className="text-green-600 text-sm mb-3">{success}</p>}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={loading || selectedCourses.length === 0 || hasConflictErrors}
        className="w-full bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Schedule"}
      </button>
    </div>
  );
}
