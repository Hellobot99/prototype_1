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
    if (!goal) return NextResponse.json({ error: "Career goal is required" }, { status: 400 });

    const [{ data: courses }, { data: completed }] = await Promise.all([
      supabase.from("courses").select("*"),
      supabase.from("completed_courses").select("course_id").eq("user_id", user.id),
    ]);

    const completedIds = new Set(completed?.map((c) => c.course_id) ?? []);
    const available = (courses ?? []).filter((c) => !completedIds.has(c.id));
    const completedCourses = (courses ?? []).filter((c) => completedIds.has(c.id));

    const courseList = available
      .map((c) => `${c.code}: ${c.name} (${c.credits}cr, ${c.campus})`)
      .join("\n");

    const completedList = completedCourses.length > 0
      ? completedCourses.map((c) => `${c.code}: ${c.name}`).join(", ")
      : "None";

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `You are an academic advisor at Shibaura Institute of Technology (SIT).

Target career: ${goal}

Already completed (do not recommend):
${completedList}

Available courses:
${courseList}

Recommend 8-10 courses most valuable for this career. Choose only from the available list above.

Respond ONLY with valid JSON (no markdown):
{
  "career_goal": "...",
  "summary": "One sentence on why these courses fit the career.",
  "recommendations": [
    {
      "code": "XXXX",
      "name": "Course Name",
      "credits": 2,
      "reason": "One sentence on why this matters for the career."
    }
  ]
}`,
      }],
    });

    let text = completion.choices[0]?.message?.content ?? "";
    text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    return NextResponse.json(JSON.parse(text));
  } catch (err: unknown) {
    console.error("[Career path error]", err);
    return NextResponse.json({ error: "Failed to generate course recommendations. Please try again." }, { status: 500 });
  }
}
