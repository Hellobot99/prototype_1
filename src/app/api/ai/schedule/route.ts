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
    const messages: Array<{ role: string; content: string }> = body?.messages ?? [];

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

    const systemPrompt = `You are a friendly course scheduling assistant for Shibaura Institute of Technology (SIT). Help students plan their timetable through conversation.

Already completed by this student (do NOT recommend):
${completedList}

Available courses:
${courseList}

Rules:
- When recommending a schedule, always include "recommended_codes" in your response.
- If the student asks follow-up questions or wants adjustments, update the recommendation accordingly.
- Keep replies concise and friendly.

Always respond with valid JSON only (no markdown):
{
  "reply": "Your conversational reply here",
  "recommended_codes": ["CODE1", "CODE2"]
}

If no schedule update is needed, omit "recommended_codes" or set it to an empty array.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
    });

    let text = completion.choices[0]?.message?.content ?? "";
    text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();

    let parsed: { reply?: string; recommended_codes?: string[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { reply: text };
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error("[AI schedule error]", err);
    return NextResponse.json({ error: "Failed to generate a response. Please try again." }, { status: 500 });
  }
}
