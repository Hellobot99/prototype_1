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
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateReviewModal({ courses, onClose, onSuccess }: CreateReviewModalProps) {
  const [courseId, setCourseId] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!courseId || !rating) {
      setError("과목과 평점을 선택해주세요.");
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
        <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4 text-center">
          <p className="text-green-600 font-semibold">✓ Review posted successfully!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Write a Review</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Course Selector */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">Select Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black text-gray-900 bg-white"
            >
              <option value="">-- Choose a course --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>

          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl transition ${star <= rating ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"
                    }`}
                >
                  ★
                </button>
              ))}
            </div>
            {rating > 0 && <p className="text-xs text-gray-500 mt-1">{rating} stars</p>}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this course..."
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black resize-none h-24 text-gray-900"
            />
          </div>

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? "Posting..." : "Post Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
