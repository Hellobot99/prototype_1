"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitReview(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Please log in first." };

    const courseId = formData.get("courseId") as string;
    const rating = parseInt(formData.get("rating") as string);
    const comment = formData.get("comment") as string;

    if (!courseId || !rating || rating < 1 || rating > 5) {
      return { error: "Please select a course and rating (1-5)." };
    }

    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      course_id: courseId,
      rating,
      comment: comment || null,
    });

    if (error) {
      if (error.code === "23505") {
        return { error: "You have already reviewed this course." };
      }
      return { error: error.message };
    }

    revalidatePath("/reviews");
    revalidatePath("/courses");
    return { message: "Review posted successfully!" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An error occurred.";
    return { error: message };
  }
}
