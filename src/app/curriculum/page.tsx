import curriculum1 from "@/data/curriculum1.json";
import curriculum2 from "@/data/curriculum2.json";
import CurriculumContent from "./CurriculumContent";

export default function CurriculumPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-5xl mx-auto p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-100">Degree Requirements</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">SIT 2024 curriculum course requirements</p>
        </div>
        <CurriculumContent curricula={[curriculum1, curriculum2]} />
      </main>
    </div>
  );
}
