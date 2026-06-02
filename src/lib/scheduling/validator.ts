interface Course {
  id: string;
  code: string;
  name: string;
  day_of_week: string | null;
  period: number | null;
  campus: string | null;
}

interface ValidationResult {
  courseId: string;
  courseName: string;
  type: "time_conflict" | "campus_conflict";
  severity: "error" | "warning";
  message: string;
  conflictingCourseId?: string;
  conflictingCourseName?: string;
}

const TRANSIT_TIME_MINUTES = 30;

export function validateSchedule(
  selectedCourseIds: string[],
  allCourses: Course[]
): ValidationResult[] {
  const selectedCourses = allCourses.filter((c) =>
    selectedCourseIds.includes(c.id)
  );

  const conflicts: ValidationResult[] = [];

  for (let i = 0; i < selectedCourses.length; i++) {
    for (let j = i + 1; j < selectedCourses.length; j++) {
      const course1 = selectedCourses[i];
      const course2 = selectedCourses[j];

      // Check time conflicts
      if (
        course1.day_of_week &&
        course2.day_of_week &&
        course1.period &&
        course2.period
      ) {
        if (course1.day_of_week === course2.day_of_week) {
          // Same day - check periods
          if (course1.period === course2.period) {
            conflicts.push({
              courseId: course1.id,
              courseName: `${course1.code} - ${course1.name}`,
              type: "time_conflict",
              severity: "error",
              message: `Time conflict with ${course2.code} (Period ${course2.period})`,
              conflictingCourseId: course2.id,
              conflictingCourseName: `${course2.code} - ${course2.name}`,
            });
            conflicts.push({
              courseId: course2.id,
              courseName: `${course2.code} - ${course2.name}`,
              type: "time_conflict",
              severity: "error",
              message: `Time conflict with ${course1.code} (Period ${course1.period})`,
              conflictingCourseId: course1.id,
              conflictingCourseName: `${course1.code} - ${course1.name}`,
            });
          }

          // Check campus conflicts
          if (
            course1.campus &&
            course2.campus &&
            course1.campus !== course2.campus
          ) {
            // Different campuses on same day - warn if not enough buffer
            const periodDifference = Math.abs(course1.period - course2.period);
            if (periodDifference < 2) {
              // Assume each period is ~50min, so less than 2 periods = less than 1.5 hours
              conflicts.push({
                courseId: course1.id,
                courseName: `${course1.code} - ${course1.name}`,
                type: "campus_conflict",
                severity: "warning",
                message: `Campus switch warning: ${course2.code} is at ${course2.campus} (${TRANSIT_TIME_MINUTES}min travel needed)`,
                conflictingCourseId: course2.id,
                conflictingCourseName: `${course2.code} - ${course2.name}`,
              });
            }
          }
        }
      }
    }
  }

  return conflicts;
}

export function hasErrors(conflicts: ValidationResult[]): boolean {
  return conflicts.some((c) => c.severity === "error");
}

export function getErrorCount(conflicts: ValidationResult[]): number {
  return conflicts.filter((c) => c.severity === "error").length;
}

export function getWarningCount(conflicts: ValidationResult[]): number {
  return conflicts.filter((c) => c.severity === "warning").length;
}
