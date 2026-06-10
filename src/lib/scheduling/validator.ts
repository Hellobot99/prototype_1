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

// Approximate one-way commute time between the Toyosu and Omiya campuses.
const TRANSIT_TIME_MINUTES = 90;

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
            // Different campuses on the same day - each period is ~90min,
            // so a 1-period gap (~90min) is not enough to physically
            // travel between Toyosu and Omiya.
            const periodDifference = Math.abs(course1.period - course2.period);
            if (periodDifference <= 1) {
              conflicts.push({
                courseId: course1.id,
                courseName: `${course1.code} - ${course1.name}`,
                type: "campus_conflict",
                severity: "error",
                message: `Impossible: ${course2.code} is at the ${course2.campus} campus, but campus transit takes ~${TRANSIT_TIME_MINUTES}min`,
                conflictingCourseId: course2.id,
                conflictingCourseName: `${course2.code} - ${course2.name}`,
              });
              conflicts.push({
                courseId: course2.id,
                courseName: `${course2.code} - ${course2.name}`,
                type: "campus_conflict",
                severity: "error",
                message: `Impossible: ${course1.code} is at the ${course1.campus} campus, but campus transit takes ~${TRANSIT_TIME_MINUTES}min`,
                conflictingCourseId: course1.id,
                conflictingCourseName: `${course1.code} - ${course1.name}`,
              });
            } else if (periodDifference === 2) {
              conflicts.push({
                courseId: course1.id,
                courseName: `${course1.code} - ${course1.name}`,
                type: "campus_conflict",
                severity: "warning",
                message: `Tight schedule: ${course2.code} is at the ${course2.campus} campus (~${TRANSIT_TIME_MINUTES}min travel needed)`,
                conflictingCourseId: course2.id,
                conflictingCourseName: `${course2.code} - ${course2.name}`,
              });
              conflicts.push({
                courseId: course2.id,
                courseName: `${course2.code} - ${course2.name}`,
                type: "campus_conflict",
                severity: "warning",
                message: `Tight schedule: ${course1.code} is at the ${course1.campus} campus (~${TRANSIT_TIME_MINUTES}min travel needed)`,
                conflictingCourseId: course1.id,
                conflictingCourseName: `${course1.code} - ${course1.name}`,
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
