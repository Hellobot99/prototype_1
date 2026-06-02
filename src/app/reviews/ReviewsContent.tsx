"use client";

import { useState } from "react";
import CreateReviewModal from "./CreateReviewModal";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  courses: { code: string; name: string } | null;
}

interface ReviewsContentProps {
  reviews: Review[] | null;
  courses: Array<{ id: string; code: string; name: string }>;
}

export default function ReviewsContent({ reviews, courses }: ReviewsContentProps) {
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <main className="max-w-3xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Course Reviews</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
          >
            + Write Review
          </button>
        </div>

        <div className="space-y-4">
          {reviews?.length === 0 && (
            <p className="text-gray-400 text-sm">No reviews yet. Be the first!</p>
          )}
          {reviews?.map((review) => (
            <div key={review.id} className="bg-white border rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-semibold text-sm text-gray-900">{review.courses?.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{review.courses?.code}</span>
                </div>
                <span className="text-yellow-500 text-sm">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
              </div>
              <p className="text-sm text-gray-600">{review.comment || <span className="text-gray-300 italic">No comment</span>}</p>
            </div>
          ))}
        </div>
      </main>

      {showModal && (
        <CreateReviewModal
          courses={courses}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setRefreshKey((k) => k + 1);
            // Page will auto-revalidate via revalidatePath in server action
          }}
        />
      )}
    </>
  );
}
