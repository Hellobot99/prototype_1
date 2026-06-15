import { createClient } from "@/lib/supabase/server";
import CoursesContent from "./CoursesContent";
import { CURRENT_SEMESTER } from "@/app/dashboard/constants";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: courses }, { data: completed }, { data: schedule }] = await Promise.all([
    supabase.from("courses").select("*, reviews(rating)").order("name"),
    supabase.from("completed_courses").select("course_id, grade, semester").eq("user_id", user?.id ?? ""),
    supabase.from("schedules").select("course_ids")
      .eq("user_id", user?.id ?? "")
      .eq("semester", CURRENT_SEMESTER)
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const completedMap = Object.fromEntries(
    (completed ?? []).map((c) => [c.course_id, { grade: c.grade ?? "", semester: c.semester ?? "" }])
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <CoursesContent
        courses={courses}
        completedMap={completedMap}
        scheduledIds={schedule?.course_ids ?? []}
      />
    </div>
  );
}
