import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import AiSection from "./AiSection";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: courses } = await supabase.from("courses").select("*").order("day_of_week");

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">Smart Scheduler</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.email}</span>
          <a href="/courses" className="text-sm text-gray-700 hover:underline">Courses</a>
          <a href="/reviews" className="text-sm text-gray-700 hover:underline">Reviews</a>
          <form action={logout}>
            <button type="submit" className="text-sm text-red-500 hover:underline">Logout</button>
          </form>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-2">Your Schedule</h2>
        <p className="text-gray-500 mb-6 text-sm">Select courses and let AI build your optimal schedule.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {courses?.map((course) => (
            <div key={course.id} className="bg-white border rounded-xl p-4 flex justify-between items-start">
              <div>
                <p className="font-semibold text-sm">{course.name}</p>
                <p className="text-xs text-gray-400 mt-1">{course.code} · {course.credits} credits · {course.campus}</p>
                <p className="text-xs text-gray-400">{course.day_of_week} Period {course.period}</p>
              </div>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{course.campus}</span>
            </div>
          ))}
        </div>

        <AiSection />
      </main>
    </div>
  );
}

