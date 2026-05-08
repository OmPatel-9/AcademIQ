import { envInt, rateLimit } from "../../lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export async function POST(request: Request) {
  const limiter = rateLimit(request, {
    namespace: "mentor",
    limit: envInt("MENTOR_RATE_LIMIT", 20),
    windowMs: envInt("MENTOR_RATE_LIMIT_WINDOW_MS", 60_000)
  });
  if (limiter.limited) {
    return new Response(
      JSON.stringify({ error: "Too many mentor requests. Please wait a moment and try again." }),
      { status: 429, headers: { ...limiter.headers, "Content-Type": "application/json" } }
    );
  }

  if (!process.env.GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing GROQ_API_KEY." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const body = await request.json().catch(() => null);
  const question = String(body?.question || "").trim();
  if (!question) {
    return new Response(JSON.stringify({ error: "A follow-up question is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
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

  const groqResponse = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL_ID || DEFAULT_MODEL,
      temperature: 0.35,
      max_tokens: 1800,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You are AcademIQ's Mentor Agent. Answer follow-up tutoring questions using the generated study pack context. Be direct, adaptive, and practical. Return polished markdown with short headings, compact bullets, concrete examples, and a clear next step. Do NOT use excessive markdown decoration or emoji."
        },
        {
          role: "user",
          content: `Study pack context:\n${context}\n\nFollow-up question:\n${question}`
        }
      ]
    })
  });

  if (!groqResponse.ok) {
    return new Response(JSON.stringify({ error: "Mentor Agent failed to answer." }), {
      status: groqResponse.status,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Stream the response using Server-Sent Events
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = groqResponse.body?.getReader();
      if (!reader) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, content: "" })}\n\n`));
        controller.close();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed?.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } catch {
        // stream error — close gracefully
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}
