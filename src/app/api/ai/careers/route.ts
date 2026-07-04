import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const interest = body?.interest ?? "";
    if (!interest) return NextResponse.json({ error: "Interest is required" }, { status: 400 });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `You are a career advisor for engineering students at Shibaura Institute of Technology (SIT) in Japan.

Student's interest: "${interest}"

List 5-6 relevant career paths for this interest, tailored to engineering graduates in Japan.

Respond ONLY with valid JSON (no markdown):
{
  "careers": [
    {
      "title": "Job title",
      "description": "2-3 sentences about what this role involves day-to-day.",
      "companies": ["Company A", "Company B", "Company C", "Company D"],
      "skills": ["Skill 1", "Skill 2", "Skill 3"],
      "salary_range": "e.g. ¥4M - ¥8M / year"
    }
  ]
}

Include a mix of Japanese companies (e.g. Toyota, Sony, NTT, Fujitsu, Rakuten, Mercari, SoftBank) and global companies with Japan presence (e.g. Google Japan, Amazon Japan, Microsoft Japan).`,
      }],
    });

    let text = completion.choices[0]?.message?.content ?? "";
    text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    return NextResponse.json(JSON.parse(text));
  } catch (err: unknown) {
    console.error("[Careers error]", err);
    return NextResponse.json({ error: "Failed to find related careers. Please try again." }, { status: 500 });
  }
}
