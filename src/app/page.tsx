export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero — dark green works for both light/dark */}
      <div className="flex-1 flex flex-col items-center justify-center bg-[#134e3b] px-6 py-20 text-center">
        <span className="inline-block bg-[#bef2dc] text-[#134e3b] text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wide">
          Shibaura Institute of Technology
        </span>
        <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
          SIT Course<br />Planner
        </h1>
        <p className="text-white/60 mb-10 text-lg max-w-md">
          AI-powered course planning, GPA tracking, and career guidance — built for SIT students.
        </p>
        <a
          href="/login"
          className="bg-[#008482] text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-[#006e6c] transition shadow-lg"
        >
          Get Started
        </a>
      </div>

      {/* Feature strip */}
      <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x dark:divide-gray-700">
        {[
          { title: "Timetable Builder", desc: "Visual weekly grid with conflict detection" },
          { title: "AI Scheduling", desc: "Describe your goals, get a personalized plan" },
          { title: "Career Explorer", desc: "Discover careers and the courses that lead there" },
        ].map(({ title, desc }) => (
          <div key={title} className="px-8 py-6 text-center">
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">{title}</p>
            <p className="text-gray-400 text-xs">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
