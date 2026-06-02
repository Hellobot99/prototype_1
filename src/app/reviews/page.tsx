import { createClient } from "@/lib/supabase/server";
import ReviewsContent from "./ReviewsContent";

export default async function ReviewsPage() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, courses(code, name)")
    .order("created_at", { ascending: false });

  const { data: courses } = await supabase.from("courses").select("id, code, name");

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex gap-4 items-center">
        <a href="/dashboard" className="text-sm font-bold">Smart Scheduler</a>
        <a href="/courses" className="text-sm text-gray-500">Courses</a>
        <a href="/reviews" className="text-sm font-semibold underline">Reviews</a>
      </nav>

      <ReviewsContent reviews={reviews} courses={courses ?? []} />
    </div>
  );
}
