import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { goal } = await request.json();
  const { data: courses } = await supabase.from("courses").select("*");

  const courseList = courses
    ?.map((c) => `${c.code}: ${c.name} (${c.credits}cr, ${c.campus}, ${c.day_of_week} P${c.period})`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a course scheduling assistant for Shibaura Institute of Technology (SIT).

Available courses:
${courseList}

Student goal: ${goal}

Suggest an optimal schedule. List recommended courses with brief reasoning. Keep it concise.`,
      },
    ],
  });

  const suggestion = message.content[0].type === "text" ? message.content[0].text : "";
  return NextResponse.json({ suggestion });
}
