"use client";

import { useState } from "react";
import { submitReview } from "./actions";

interface Course {
  id: string;
  code: string;
  name: string;
}

interface CreateReviewModalProps {
  courses: Course[];
  initialCourseId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateReviewModal({ courses, initialCourseId, onClose, onSuccess }: CreateReviewModalProps) {
  const [courseId, setCourseId] = useState(initialCourseId ?? "");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!courseId || !rating) {
      setError("Please select a course and a rating.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData();
    formData.append("courseId", courseId);
    formData.append("rating", rating.toString());
    formData.append("comment", comment);

    const result = await submitReview(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.message) {
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1000);
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-sm w-full mx-4 text-center">
          <p className="text-green-600 font-semibold">✓ Review posted successfully!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Write a Review</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Select Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#008482] text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
            >
              <option value="">-- Choose a course --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl transition ${star <= rating ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"}`}
                >
                  ★
                </button>
              ))}
            </div>
            {rating > 0 && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{rating} stars</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this course..."
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#008482] resize-none h-24 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border dark:border-gray-600 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#008482] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#006e6c] transition disabled:opacity-50"
            >
              {loading ? "Posting..." : "Post Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
