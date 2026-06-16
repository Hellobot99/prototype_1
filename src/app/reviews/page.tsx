import { createClient } from "@/lib/supabase/server";
import ReviewsContent from "./ReviewsContent";

export default async function ReviewsPage() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, courses(id, code, name)")
    .order("created_at", { ascending: false });

  const { data: courses } = await supabase.from("courses").select("id, code, name").order("name");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ReviewsContent reviews={reviews} courses={courses ?? []} />
    </div>
  );
}
