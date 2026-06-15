interface Course {
  id: string;
  code: string;
  name: string;
  day_of_week: string | null;
  period: number | null;
  koma_su: number | null;
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
          // Same day - check for overlapping periods, accounting for
          // multi-period (koma_su) courses.
          const span1 = course1.koma_su ?? 1;
          const span2 = course2.koma_su ?? 1;
          const end1 = course1.period + span1 - 1;
          const end2 = course2.period + span2 - 1;
          const overlaps = course1.period <= end2 && course2.period <= end1;

          if (overlaps) {
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
            // travel between Toyosu and Omiya. The gap is measured between
            // the end of the earlier course and the start of the later one.
            const gap = overlaps
              ? 0
              : end1 < course2.period
                ? course2.period - end1
                : course1.period - end2;
            if (gap <= 1) {
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
            } else if (gap === 2) {
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
