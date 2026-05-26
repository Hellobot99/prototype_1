export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <h1 className="text-4xl font-bold mb-3">Smart Course Scheduler</h1>
      <p className="text-gray-500 mb-8 text-lg">AI-powered scheduling for SIT students</p>
      <a
        href="/login"
        className="bg-black text-white px-8 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition"
      >
        Get Started
      </a>
    </div>
  );
}
