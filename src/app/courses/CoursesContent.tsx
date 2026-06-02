"use client";

import { useState } from "react";
import CreateReviewModal from "@/app/reviews/CreateReviewModal";

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

interface CoursesContentProps {
  courses: Course[] | null;
}

export default function CoursesContent({ courses }: CoursesContentProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const selectedCourse = courses?.find((c) => c.id === selectedCourseId);
  const coursesForModal = courses?.map((c) => ({ id: c.id, code: c.code, name: c.name })) ?? [];

  const handleWriteReview = (courseId: string) => {
    setSelectedCourseId(courseId);
    setShowModal(true);
  };

  return (
    <>
      <main className="max-w-5xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Course Catalog</h2>
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Credits</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Campus</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Schedule</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Rating</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {courses?.map((course) => {
                const ratings = course.reviews?.map((r) => r.rating) ?? [];
                const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "—";
                return (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{course.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{course.name}</td>
                    <td className="px-4 py-3 text-center text-gray-900">{course.credits}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${course.campus === "Toyosu" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"
                          }`}
                      >
                        {course.campus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {course.day_of_week} P{course.period}
                    </td>
                    <td className="px-4 py-3 text-gray-900">⭐ {avg}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleWriteReview(course.id)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium underline"
                      >
                        Rate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {showModal && (
        <CreateReviewModal
          courses={coursesForModal}
          onClose={() => {
            setShowModal(false);
            setSelectedCourseId("");
          }}
          onSuccess={() => {
            // Page will auto-revalidate via revalidatePath in server action
          }}
        />
      )}
    </>
  );
}
