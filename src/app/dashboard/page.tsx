import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import AiSection from "./AiSection";
import ScheduleBuilder from "./ScheduleBuilder";
import { CURRENT_SEMESTER } from "./constants";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: courses }, { data: schedule }] = await Promise.all([
    supabase.from("courses").select("id, code, name, credits, campus, day_of_week, period").order("code"),
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">Smart Scheduler</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.email}</span>
          <a href="/courses" className="text-sm text-gray-700 hover:underline">Courses</a>
          <a href="/reviews" className="text-sm text-gray-700 hover:underline">Reviews</a>
          <a href="/career" className="text-sm text-gray-700 hover:underline">Career</a>
          <form action={logout}>
            <button type="submit" className="text-sm text-red-500 hover:underline">Logout</button>
          </form>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">My Timetable</h2>
          <p className="text-gray-500 text-sm">{CURRENT_SEMESTER}</p>
        </div>

        <ScheduleBuilder courses={courses ?? []} scheduledIds={schedule?.course_ids ?? []} />

        <AiSection />
      </main>
    </div>
  );
}

