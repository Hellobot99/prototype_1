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

    const systemPrompt = `You are a friendly course scheduling assistant for Shibaura Institute of Technology (SIT).

Already completed by this student (do NOT recommend):
${completedList}

Available courses (use the exact codes shown):
${courseList}

RESPONSE FORMAT — always reply with valid JSON only, no markdown fences:
{
  "reply": "<short conversational message explaining WHY you chose these courses — do NOT list course codes or schedules here, the UI shows them automatically>",
  "recommended_codes": ["EXACT_CODE_1", "EXACT_CODE_2", ...]
}

Rules:
- "reply" must ONLY contain reasoning and explanation (1-3 sentences). Never list course codes or timetable details in "reply".
- "recommended_codes" must use the EXACT course codes from the available courses list above.
- Always include "recommended_codes" whenever you suggest a schedule.
- IMPORTANT: If the conversation history shows "[Currently recommended courses: ...]", those are the courses already on the student's timetable. When the student asks to ADD a topic or course, keep all existing recommended courses AND add the new ones. Only replace the full list if the student explicitly asks to start over or create a completely new schedule.
- If no schedule change is needed (e.g. a simple question), set "recommended_codes" to [].`;

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
      console.error("[AI schedule] JSON parse failed, raw text:", text.slice(0, 300));
      parsed = { reply: text };
    }

    // Ensure recommended_codes only contains strings that exist in available course codes
    const availableCodes = new Set(available.map((c) => c.code));
    if (parsed.recommended_codes) {
      parsed.recommended_codes = parsed.recommended_codes.filter((code) => availableCodes.has(code));
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error("[AI schedule error]", err);
    return NextResponse.json({ error: "Failed to generate a response. Please try again." }, { status: 500 });
  }
}
