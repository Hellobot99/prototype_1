import { createClient } from "@/lib/supabase/server";
import CoursesContent from "./CoursesContent";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase.from("courses").select("*, reviews(rating)").order("code");

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex gap-4 items-center">
        <a href="/dashboard" className="text-sm font-bold">Smart Scheduler</a>
        <a href="/courses" className="text-sm font-semibold underline">Courses</a>
        <a href="/reviews" className="text-sm text-gray-500">Reviews</a>
      </nav>

      <CoursesContent courses={courses} />
    </div>
  );
}
