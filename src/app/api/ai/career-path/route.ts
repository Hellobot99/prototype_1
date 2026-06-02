import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const goal = body?.goal ?? "";

    if (!goal) {
      return NextResponse.json({ error: "Career goal is required" }, { status: 400 });
    }

    const { data: courses } = await supabase.from("courses").select("*");

    const courseList = courses && courses.length > 0
      ? courses.map((c) => `${c.code}: ${c.name} (${c.credits}cr, ${c.campus}, ${c.day_of_week} P${c.period})`).join("\n")
      : "CS101: Introduction to Programming (2cr, Toyosu, Monday P1)\nCS201: Data Structures (2cr, Toyosu, Tuesday P2)";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are an academic advisor for Shibaura Institute of Technology (SIT).

Career Goal: ${goal}

Available Courses at SIT:
${courseList}

Create a 4-semester degree pathway (2 years) for a student with the career goal: "${goal}"

Requirements:
- Each semester: 6-7 courses (~30 credits)
- Progress from foundational to advanced courses
- Include electives that align with the career goal
- Consider course distribution

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "career_goal": "...",
  "semesters": [
    {
      "semester": "Fall 2025",
      "courses": [
        {"code": "CS101", "name": "Introduction to Programming", "credits": 2},
        ...
      ],
      "focus": "Foundation courses",
      "rationale": "Why these courses for this semester..."
    },
    ...
  ],
  "total_credits": 120,
  "key_skills": ["Skill 1", "Skill 2", ...]
}`,
        },
      ],
    });

    let responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Remove markdown code blocks if present
    responseText = responseText.replace(/^```json\n?/, "").replace(/\n?```$/, "");

    const pathway = JSON.parse(responseText);

    return NextResponse.json(pathway);
  } catch (err: unknown) {
    console.error("[Career path error]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
