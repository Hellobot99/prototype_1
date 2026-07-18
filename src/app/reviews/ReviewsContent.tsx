"use client";

import { useState, useEffect } from "react";
import CreateReviewModal from "./CreateReviewModal";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  courses: { id: string; code: string; name: string } | null;
}

interface Course {
  id: string;
  code: string;
  name: string;
}

interface ReviewsContentProps {
  reviews: Review[] | null;
  courses: Course[];
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-200"}>★</span>
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const long = (review.comment?.length ?? 0) > 120;
  const text = review.comment || "";

  return (
    <div className="border-b border-gray-100 dark:border-gray-700 py-4 last:border-0">
      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{review.courses?.name ?? "Unknown"}</p>
      <p className="text-xs text-gray-400 mb-1">{review.courses?.code}</p>
      <Stars rating={review.rating} />
      {text && (
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
          {long && !expanded ? text.slice(0, 120) + "…" : text}
          {long && (
            <button
              onClick={() => setExpanded((p) => !p)}
              className="ml-1 text-xs text-gray-400 hover:text-gray-600"
            >
              {expanded ? "less" : "more"}
            </button>
          )}
        </p>
      )}
    </div>
  );
}

// simple deterministic shuffle by index seed
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ReviewsContent({ reviews, courses }: ReviewsContentProps) {
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showModal, setShowModal] = useState(false);

  const allReviews = reviews ?? [];

  const [shuffled, setShuffled] = useState<Review[]>(allReviews);
  // Shuffle only after mount so the server-rendered order matches the
  // client's initial render, then randomize client-side to avoid a
  // hydration mismatch.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { setShuffled(shuffle(allReviews)); }, []);

  const displayReviews = selectedCourse
    ? allReviews.filter((r) => r.courses?.id === selectedCourse.id)
    : shuffled;

  const filteredCourses = search.trim().length === 0
    ? []
    : courses.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 20);

  const reviewedCourseIds = new Set(allReviews.map((r) => r.courses?.id).filter(Boolean));

  return (
    <>
      <div className="flex flex-col md:flex-row md:min-h-[calc(100vh-57px)]">

        {/* ── LEFT SIDEBAR ── */}
        <div className="w-full md:w-72 md:flex-shrink-0 border-b md:border-b-0 md:border-r dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b dark:border-gray-700">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedCourse(null); }}
                placeholder="Search by course or code..."
                className="w-full border dark:border-gray-600 rounded-lg pl-3 pr-8 py-2 text-sm outline-none focus:ring-2 focus:ring-[#008482] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 placeholder-gray-400"
              />
              <span className="absolute right-2.5 top-2.5 text-gray-400 text-sm">⌕</span>
            </div>
          </div>

          {/* Course list or search results */}
          <div className="max-h-72 md:max-h-none md:flex-1 overflow-y-auto">
            {search.trim().length === 0 ? (
              /* Default: courses that have reviews */
              <div>
                <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Reviewed Courses
                </p>
                {courses
                  .filter((c) => reviewedCourseIds.has(c.id))
                  .map((c) => {
                    const count = allReviews.filter((r) => r.courses?.id === c.id).length;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCourse(selectedCourse?.id === c.id ? null : c)}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          selectedCourse?.id === c.id ? "bg-gray-100 dark:bg-gray-700 font-semibold" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.code}</p>
                        </div>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{count}</span>
                      </button>
                    );
                  })}
                {reviewedCourseIds.size === 0 && (
                  <p className="px-4 py-6 text-sm text-gray-400">No reviews yet.</p>
                )}
              </div>
            ) : (
              /* Search results */
              <div>
                <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Results
                </p>
                {filteredCourses.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-gray-400">No courses found.</p>
                ) : (
                  filteredCourses.map((c) => {
                    const count = allReviews.filter((r) => r.courses?.id === c.id).length;
                    return (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedCourse(c); setSearch(""); }}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          selectedCourse?.id === c.id ? "bg-gray-100 dark:bg-gray-700 font-semibold" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.code}</p>
                        </div>
                        {count > 0 && (
                          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{count}</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Write Review button */}
          <div className="p-4 border-t dark:border-gray-700">
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-[#008482] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#006e6c] transition"
            >
              + Write Review
            </button>
          </div>
        </div>

        {/* ── RIGHT FEED ── */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="max-w-2xl mx-auto p-6">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              {selectedCourse ? (
                <div>
                  <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">{selectedCourse.name}</h2>
                  <p className="text-xs text-gray-400">{selectedCourse.code} · {displayReviews.length} review{displayReviews.length !== 1 ? "s" : ""}</p>
                </div>
              ) : (
                <div>
                  <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">Course Reviews</h2>
                  <p className="text-xs text-gray-400">All reviews · random order</p>
                </div>
              )}
              {selectedCourse && (
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  ← All reviews
                </button>
              )}
            </div>

            {/* Review cards */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 px-5">
              {displayReviews.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-gray-400 text-sm">No reviews for this course yet.</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-3 text-sm text-gray-700 dark:text-gray-300 underline"
                  >
                    Be the first to write one
                  </button>
                </div>
              ) : (
                displayReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <CreateReviewModal
          courses={courses}
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      )}
    </>
  );
}
