import CareerForm from "./CareerForm";

export default function CareerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex gap-4 items-center">
        <a href="/dashboard" className="text-sm font-bold">Smart Scheduler</a>
        <a href="/courses" className="text-sm text-gray-500">Courses</a>
        <a href="/reviews" className="text-sm text-gray-500">Reviews</a>
        <a href="/career" className="text-sm font-semibold underline">Career</a>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        <CareerForm />
      </main>
    </div>
  );
}
