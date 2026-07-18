import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Field → keyword patterns for pre-filtering courses by name
const FIELD_PATTERNS: Record<string, RegExp> = {
  cs:      /program|algorith|software|comput|network|web|database|data.struct|information.system|digital|machine.learn|artificial.intel|deep.learn|neural|robot|signal|logic|operat|system|cyber|secur|coding|code|simulat|parallel|embed|compiler|os\b|iot|cloud|devops/i,
  ai:      /artificial|intelligen|machine.learn|deep.learn|neural|robot|vision|nlp|natural.language|data.sci|pattern|recogni|optim/i,
  math:    /calcul|algebra|statistic|probabilit|linear|discrete|differential|matrix|numeric|analysis|mathemat/i,
  physics: /physic|mechanic|quantum|electro|thermodynam|optic|wave|fluid/i,
  web:     /web|html|css|javascript|frontend|backend|ui|ux|interface|internet/i,
  data:    /data|database|sql|big.data|analytic|statistic|mining|warehouse/i,
  network: /network|protocol|tcp|ip|wireless|mobile|communication|telecom/i,
  english: /english|presentat|writing|communication|language/i,
};

function scoreCourseName(name: string, userText: string): number {
  const lower = userText.toLowerCase();
  // Check which fields the user mentioned
  let fieldScore = 0;
  for (const [, pattern] of Object.entries(FIELD_PATTERNS)) {
    if (pattern.test(lower)) {
      if (pattern.test(name)) fieldScore += 2;
    }
  }

  // Direct word overlap: words the user typed that appear in course name
  const userWords = lower
    .split(/\W+/)
    .filter((w) => w.length >= 4)
    .map((w) => w.replace(/(ing|tion|ment|ics|ity)$/, ""));
  const nameLower = name.toLowerCase();
  const overlapScore = userWords.filter((w) => nameLower.includes(w)).length;

  return fieldScore + overlapScore;
}

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

    // Build combined user text from recent conversation for relevance scoring
    const userText = messages
      .filter((m) => m.role === "user")
      .slice(-5)
      .map((m) => m.content)
      .join(" ");

    // Score and sort courses by relevance to user's stated interests
    const scored = available
      .map((c) => ({ ...c, _score: scoreCourseName(c.name, userText) }))
      .sort((a, b) => b._score - a._score);

    // Send relevant courses (score > 0) first; if fewer than 30, pad with others
    const relevant = scored.filter((c) => c._score > 0);
    const others   = scored.filter((c) => c._score === 0);
    const toSend   = relevant.length >= 10
      ? relevant                            // enough relevant → only relevant
      : [...relevant, ...others.slice(0, 40 - relevant.length)]; // pad to 40

    const formatCourse = (c: typeof toSend[number]) => {
      let line = `${c.code}: ${c.name} (${c.credits}cr, ${c.campus}, ${c.day_of_week ?? "Intensive"} P${c.period ?? "-"})`;
      if (c.description) line += ` — ${c.description}`;
      if (c.prerequisites?.length) line += ` [Prereqs: ${c.prerequisites.join(", ")}]`;
      return line;
    };

    const courseList = toSend.length > 0
      ? toSend.map(formatCourse).join("\n")
      : "No courses available.";

    const completedList = completedCourses.length > 0
      ? completedCourses.map((c) => `${c.code}: ${c.name}`).join(", ")
      : "None";

    const systemPrompt = `You are a knowledgeable academic advisor at Shibaura Institute of Technology (SIT), helping students build a well-balanced semester timetable.

Already completed by this student (do NOT recommend these):
${completedList}

Available courses most relevant to this student (use EXACT codes):
${courseList}

RESPONSE FORMAT — always reply with valid JSON only, no markdown fences:
{
  "reply": "<conversational message — see rules below>",
  "recommended_codes": ["EXACT_CODE_1", "EXACT_CODE_2", ...]
}

Rules for "reply":
- Keep it to 2-3 sentences max.
- Explain WHY these courses fit the student's goal.
- Do NOT list course codes or timetable details — the UI shows them.
- If there are genuinely few matching courses, say so honestly.

Rules for "recommended_codes":
- Use EXACT codes from the list above only.
- ONLY recommend courses whose name clearly relates to the student's stated field. Do NOT recommend unrelated courses (Chemistry, Biology, Civil Eng, etc.) just to fill credits.
- Aim for 14–20 credits. If fewer relevant courses exist, recommend only the relevant ones.
- Avoid courses whose prerequisites the student hasn't completed.
- Minimize same-day Toyosu ↔ Omiya campus switches.
- Spread courses across different days where possible.
- When history shows "[Currently recommended courses: ...]", KEEP those and only ADD new ones unless the student asks to start over.
- If no update is needed, set "recommended_codes" to [].`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
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

    if (parsed.reply) {
      parsed.reply = parsed.reply
        .replace(/"recommended_codes"\s*:\s*\[[^\]]*\]/g, "")
        .trim();
    }

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
