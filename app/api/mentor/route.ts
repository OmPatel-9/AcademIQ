import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export async function POST(request: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "Missing GROQ_API_KEY." }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const question = String(body?.question || "").trim();
  if (!question) {
    return NextResponse.json({ error: "A follow-up question is required." }, { status: 400 });
  }

  const pack = body?.pack || {};
  const context = [
    pack.professor,
    pack.advisor,
    pack.librarian,
    pack.assistant,
    Array.isArray(pack.projects) ? pack.projects.join("\n") : "",
    Array.isArray(pack.flashcards) ? JSON.stringify(pack.flashcards.slice(0, 20)) : ""
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 20000);

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL_ID || DEFAULT_MODEL,
      temperature: 0.35,
      max_tokens: 1800,
      messages: [
        {
          role: "system",
          content:
            "You are AcademIQ's Mentor Agent. Answer follow-up tutoring questions using the generated study pack context. Be direct, adaptive, and practical. Return markdown."
        },
        {
          role: "user",
          content: `Study pack context:\n${context}\n\nFollow-up question:\n${question}`
        }
      ]
    })
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Mentor Agent failed to answer." }, { status: response.status });
  }

  const payload = await response.json();
  return NextResponse.json({ answer: String(payload?.choices?.[0]?.message?.content || "").trim() });
}
