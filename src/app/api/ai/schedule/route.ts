import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "AI features are not configured." }, { status: 503 });
  }
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const goal = body?.goal ?? "";

    const [{ data: courses }, { data: completed }] = await Promise.all([
      supabase.from("courses").select("*"),
      supabase.from("completed_courses").select("course_id").eq("user_id", user.id),
    ]);

    const completedIds = new Set(completed?.map((c) => c.course_id) ?? []);
    const available = (courses ?? []).filter((c) => !completedIds.has(c.id));
    const completedCourses = (courses ?? []).filter((c) => completedIds.has(c.id));

    const courseList = available.length > 0
      ? available.map((c) => `${c.code}: ${c.name} (${c.credits}cr, ${c.campus}, ${c.day_of_week} P${c.period})`).join("\n")
      : "No courses available.";

    const completedList = completedCourses.length > 0
      ? completedCourses.map((c) => `${c.code}: ${c.name}`).join(", ")
      : "None";

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a course scheduling assistant for Shibaura Institute of Technology (SIT).

Already completed courses (DO NOT recommend these):
${completedList}

Available courses to recommend:
${courseList}

Student goal: ${goal}

Respond ONLY with valid JSON (no markdown):
{
  "suggestion": "Brief explanation of the recommended schedule (2-3 sentences)",
  "recommended_codes": ["CODE1", "CODE2", "CODE3"]
}

Pick 5-8 courses from the AVAILABLE list that best fit the student's goal. Use the exact course codes from the list.`,
        },
      ],
    });

    let text = completion.choices[0]?.message?.content ?? "";
    text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error("[AI schedule error]", err);
    return NextResponse.json({ error: "Failed to generate a schedule suggestion. Please try again." }, { status: 500 });
  }
}
