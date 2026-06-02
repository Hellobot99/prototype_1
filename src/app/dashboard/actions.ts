"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveSchedule(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Please log in first." };

    const semester = formData.get("semester") as string;
    const courseIds = formData.getAll("courseIds") as string[];

    if (!semester || courseIds.length === 0) {
      return { error: "Please select a semester and at least one course." };
    }

    const { error } = await supabase.from("schedules").insert({
      user_id: user.id,
      semester,
      course_ids: courseIds,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/dashboard");
    return { message: "Schedule saved successfully!" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An error occurred.";
    return { error: message };
  }
}
