"use client";

interface Course {
  code: string;
  name: string;
  credits: number;
}

interface Semester {
  semester: string;
  courses: Course[];
  focus: string;
  rationale: string;
}

interface RoadmapProps {
  pathway: {
    career_goal: string;
    semesters: Semester[];
    total_credits: number;
    key_skills: string[];
  };
  onBack: () => void;
}

export default function Roadmap({ pathway, onBack }: RoadmapProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border rounded-xl p-6">
        <button
          onClick={onBack}
          className="text-blue-600 text-sm hover:underline mb-4"
        >
          ← Back
        </button>
        <h2 className="text-3xl font-bold mb-2">{pathway.career_goal}</h2>
        <p className="text-gray-600">4-semester pathway • {pathway.total_credits} total credits</p>
      </div>

      {/* Key Skills */}
      <div className="bg-white border rounded-xl p-6">
        <h3 className="font-semibold mb-3 text-gray-900">Key Skills You'll Develop</h3>
        <div className="flex flex-wrap gap-2">
          {pathway.key_skills.map((skill) => (
            <span key={skill} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Semesters */}
      <div className="space-y-4">
        {pathway.semesters.map((semester, idx) => (
          <div key={idx} className="bg-white border rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{semester.semester}</h3>
                <p className="text-sm text-gray-600">{semester.focus}</p>
              </div>
              <span className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-full text-gray-900">
                {semester.courses.reduce((sum, c) => sum + c.credits, 0)} credits
              </span>
            </div>

            {/* Courses */}
            <div className="mb-4 space-y-2">
              {semester.courses.map((course) => (
                <div key={course.code} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{course.code}</p>
                    <p className="text-xs text-gray-600">{course.name}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{course.credits}cr</span>
                </div>
              ))}
            </div>

            {/* Rationale */}
            <p className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">Why:</span> {semester.rationale}
            </p>

          </div>
        ))}
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        className="w-full border rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
      >
        Generate Another Pathway
      </button>
    </div>
  );
}
