import { createClient } from "@/lib/supabase/server";
import ScheduleBuilder from "./ScheduleBuilder";
import { CURRENT_SEMESTER } from "./constants";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: courses }, { data: schedule }] = await Promise.all([
    supabase.from("courses").select("id, code, name, credits, campus, day_of_week, period, koma_su").order("code"),
    supabase
      .from("schedules")
      .select("course_ids")
      .eq("user_id", user?.id ?? "")
      .eq("semester", CURRENT_SEMESTER)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-[1400px] mx-auto p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-100">My Timetable</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{CURRENT_SEMESTER}</p>
        </div>
        <ScheduleBuilder courses={courses ?? []} scheduledIds={schedule?.course_ids ?? []} />
      </main>
    </div>
  );
}
