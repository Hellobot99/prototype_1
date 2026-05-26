import { createClient } from "@/lib/supabase/server";

export default async function ReviewsPage() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, courses(code, name)")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex gap-4 items-center">
        <a href="/dashboard" className="text-sm font-bold">Smart Scheduler</a>
        <a href="/courses" className="text-sm text-gray-500">Courses</a>
        <a href="/reviews" className="text-sm font-semibold underline">Reviews</a>
      </nav>

      <main className="max-w-3xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Course Reviews</h2>
        <div className="space-y-4">
          {reviews?.length === 0 && (
            <p className="text-gray-400 text-sm">No reviews yet. Be the first!</p>
          )}
          {reviews?.map((review) => (
            <div key={review.id} className="bg-white border rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-semibold text-sm">{review.courses?.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{review.courses?.code}</span>
                </div>
                <span className="text-yellow-500 text-sm">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
              </div>
              <p className="text-sm text-gray-600">{review.comment || <span className="text-gray-300 italic">No comment</span>}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
