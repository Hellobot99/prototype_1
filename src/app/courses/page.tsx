import { createClient } from "@/lib/supabase/server";

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

      <main className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Course Catalog</h2>
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Credits</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Campus</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Schedule</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {courses?.map((course) => {
                const ratings = course.reviews?.map((r: { rating: number }) => r.rating) ?? [];
                const avg = ratings.length ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) : "—";
                return (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{course.code}</td>
                    <td className="px-4 py-3 font-medium">{course.name}</td>
                    <td className="px-4 py-3 text-center">{course.credits}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${course.campus === "Toyosu" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
                        {course.campus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{course.day_of_week} P{course.period}</td>
                    <td className="px-4 py-3">⭐ {avg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
