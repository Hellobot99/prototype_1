"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CURRENT_SEMESTER } from "./constants";

async function getOrCreateSchedule(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("schedules")
    .select("id, course_ids")
    .eq("user_id", userId)
    .eq("semester", CURRENT_SEMESTER)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) return data;

  const { data: created } = await supabase
    .from("schedules")
    .insert({ user_id: userId, semester: CURRENT_SEMESTER, course_ids: [] })
    .select("id, course_ids")
    .single();

  return created;
}

export async function addCourse(courseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in first." };

  const schedule = await getOrCreateSchedule(supabase, user.id);
  if (!schedule) return { error: "Failed to access schedule." };

  const newIds = [...new Set([...schedule.course_ids, courseId])];
  await supabase.from("schedules").update({ course_ids: newIds }).eq("id", schedule.id);

  revalidatePath("/dashboard");
}

export async function removeCourse(courseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in first." };

  const schedule = await getOrCreateSchedule(supabase, user.id);
  if (!schedule) return { error: "Failed to access schedule." };

  const newIds = schedule.course_ids.filter((id: string) => id !== courseId);
  await supabase.from("schedules").update({ course_ids: newIds }).eq("id", schedule.id);

  revalidatePath("/dashboard");
}
