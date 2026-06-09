"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleCompleted(courseId: string, isCompleted: boolean, semester?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  if (isCompleted) {
    await supabase.from("completed_courses").delete()
      .eq("user_id", user.id).eq("course_id", courseId);
  } else {
    await supabase.from("completed_courses").insert({
      user_id: user.id,
      course_id: courseId,
      semester: semester ?? "",
    });
  }
  revalidatePath("/courses");
}

export async function updateRecord(courseId: string, field: "grade" | "semester", value: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("completed_courses")
    .update({ [field]: value })
    .eq("user_id", user.id)
    .eq("course_id", courseId);

  revalidatePath("/courses");
}
