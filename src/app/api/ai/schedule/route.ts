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
      ? available.map((c) => {
          let line = `${c.code}: ${c.name} (${c.credits}cr, ${c.campus}, ${c.day_of_week ?? "Intensive"} P${c.period ?? "-"})`;
          if (c.description) line += ` — ${c.description}`;
          if (c.prerequisites?.length) line += ` [Prereqs: ${c.prerequisites.join(", ")}]`;
          if (c.learning_goals?.length) line += ` [Goals: ${c.learning_goals.slice(0, 2).join("; ")}]`;
          return line;
        }).join("\n")
      : "No courses available.";

    const completedList = completedCourses.length > 0
      ? completedCourses.map((c) => `${c.code}: ${c.name}`).join(", ")
      : "None";

    const systemPrompt = `You are a knowledgeable and friendly academic advisor at Shibaura Institute of Technology (SIT), helping students build a well-balanced semester timetable.

Already completed by this student (do NOT recommend these):
${completedList}

Available courses (use EXACT codes):
${courseList}

RESPONSE FORMAT — always reply with valid JSON only, no markdown fences:
{
  "reply": "<conversational message — see rules below>",
  "recommended_codes": ["EXACT_CODE_1", "EXACT_CODE_2", ...]
}

Rules for "reply":
- Keep it to 2-3 sentences max.
- Explain WHY these courses fit the student's goal (e.g. "These courses build the foundation for...").
- Do NOT list course codes or timetable details — the UI displays them automatically.
- If the student's request is too vague to make a good recommendation, ask ONE clarifying question (e.g. year of study, target credit count, campus preference).

Rules for "recommended_codes":
- Use EXACT codes from the available list above.
- Aim for a balanced load: 14–20 credits per semester (adjust based on student preference).
- Avoid recommending courses whose prerequisites haven't been completed yet.
- Minimize same-day campus switches between Toyosu and Omiya.
- Spread courses across different days where possible to avoid overloaded days.
- When the conversation history shows "[Currently recommended courses: ...]", KEEP those courses and only ADD new ones unless the student asks to start over.
- If no schedule update is needed, set "recommended_codes" to [].`;

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
      // Regex fallback: extract reply and recommended_codes from malformed output
      const codesMatch = text.match(/"recommended_codes"\s*:\s*(\[[^\]]*\])/);
      let codes: string[] | undefined;
      if (codesMatch) {
        try { codes = JSON.parse(codesMatch[1]); } catch { /* ignore */ }
      }
      const replyMatch = text.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const cleanReply = replyMatch
        ? replyMatch[1].replace(/\\n/g, " ").replace(/\\"/g, '"')
        : text.replace(/"recommended_codes"\s*:\s*\[[^\]]*\]/g, "").replace(/[{}"]/g, "").trim();
      parsed = { reply: cleanReply, recommended_codes: codes };
    }

    // Strip any "recommended_codes": [...] that leaked into the reply string
    if (parsed.reply) {
      parsed.reply = parsed.reply
        .replace(/"recommended_codes"\s*:\s*\[[^\]]*\]/g, "")
        .trim();
    }

    // Validate recommended_codes against actual available course codes
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
