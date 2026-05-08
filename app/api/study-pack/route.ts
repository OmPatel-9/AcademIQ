import { NextResponse } from "next/server";
import { envInt, rateLimit } from "../../lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Attachment = {
  name: string;
  type?: string;
  size?: number;
  content?: string;
};

type StudyPackRequest = {
  prompt?: string;
  subject?: string;
  difficulty?: string;
  learningStyle?: string;
  citations?: boolean;
  generateStudyPack?: boolean;
  agent?: string;
  attachments?: Attachment[];
};

type GroqMessage = {
  role: "system" | "user";
  content: string;
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeJson(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

function difficultyGuidance(value: string) {
  const difficulty = value.toLowerCase();
  if (difficulty.includes("advanced")) {
    return `Advanced level — THIS IS CRITICAL, follow strictly:
- Assume the learner already knows fundamentals and intermediate concepts. Do NOT explain basics.
- Use precise technical terminology without dumbing it down.
- Professor section: cover edge cases, tradeoffs, performance implications, real-world gotchas, and design patterns.
- Quiz: questions should require reasoning and analysis, not just recall. Include tricky distractors that test deep understanding. At least 3 questions should involve code/scenario analysis.
- Flashcards: focus on subtle distinctions, common misconceptions, and advanced patterns.
- Practice: include challenging problems that require combining multiple concepts.
- Projects: suggest production-grade or research-level projects.
- Roadmap: assume 2-4 weeks of prior study, focus on mastery and specialization paths.`;
  }
  if (difficulty.includes("intermediate")) {
    return `Intermediate level — THIS IS CRITICAL, follow strictly:
- Assume the learner knows basic definitions but needs to connect concepts and apply them.
- Professor section: bridge theory to practice with applied examples, comparisons, and "when to use what" guidance.
- Quiz: mix recall with application questions. Distractors should test common misunderstandings.
- Flashcards: focus on relationships between concepts, not just definitions.
- Practice: include exercises that require applying concepts to realistic scenarios.
- Projects: suggest practical portfolio projects with moderate complexity.
- Roadmap: assume 1-2 weeks of basics done, focus on building working knowledge.`;
  }
  return `Beginner level — THIS IS CRITICAL, follow strictly:
- Define ALL jargon and technical terms when first introduced.
- Go step by step with concrete, everyday analogies and examples.
- Professor section: start from absolute zero. Explain WHY before HOW. Use simple language.
- Quiz: questions should test basic recall and comprehension. Distractors should be clearly wrong to someone who read the material.
- Flashcards: focus on key term definitions and fundamental concepts.
- Practice: keep exercises simple and approachable with clear instructions.
- Projects: suggest beginner-friendly projects with step-by-step guidance.
- Roadmap: assume no prior knowledge, include prerequisite steps.`;
}

function attachmentContext(attachments: Attachment[] = []) {
  if (!attachments.length) {
    return "No attachments were provided.";
  }

  return attachments
    .map((file) => {
      const header = `Attachment: ${file.name} (${file.type || "unknown type"}, ${file.size || 0} bytes)`;
      if (!file.content) {
        return `${header}\nContent was not readable in the browser. Use the filename as context only.`;
      }
      return `${header}\n${file.content.slice(0, 12000)}`;
    })
    .join("\n\n");
}

async function groqJson(messages: GroqMessage[], maxTokens = 6000) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY.");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL_ID || DEFAULT_MODEL,
      messages,
      temperature: 0.35,
      max_tokens: maxTokens,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Groq failed: ${detail.slice(0, 800)}`);
  }

  const payload = await response.json();
  const content = String(payload?.choices?.[0]?.message?.content || "");
  return safeJson(content);
}

async function searchYouTube(topic: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || apiKey.toLowerCase().startsWith("your_")) {
    return { videos: [], note: "Add YOUTUBE_API_KEY to enable YouTube tutorial search." };
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", `${topic} tutorial`);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "5");
  url.searchParams.set("key", apiKey);

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      return { videos: [], note: "YouTube search failed. Check YOUTUBE_API_KEY." };
    }
    const data = await response.json();
    const videos = Array.isArray(data.items)
      ? data.items
          .map((item: any) => {
            const videoId = item?.id?.videoId;
            if (!videoId) {
              return null;
            }
            return {
              title: cleanText(item?.snippet?.title, "Untitled video"),
              channel: cleanText(item?.snippet?.channelTitle, "Unknown channel"),
              url: `https://www.youtube.com/watch?v=${videoId}`
            };
          })
          .filter(Boolean)
      : [];
    return { videos, note: "" };
  } catch {
    return { videos: [], note: "YouTube search failed." };
  }
}

function normalizeQuiz(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const choices = Array.isArray(item?.choices) ? item.choices.map(String).slice(0, 4) : [];
      const rawAnswer = cleanText(item?.answer);
      const letterMatch = rawAnswer.trim().match(/^[A-Da-d](?:[).:\s]|$)/);
      const letterIndex = letterMatch ? "abcd".indexOf(letterMatch[0][0].toLowerCase()) : -1;
      const answer = choices.includes(rawAnswer) ? rawAnswer : choices[letterIndex] || rawAnswer;

      return {
        question: cleanText(item?.question),
        choices,
        answer,
        explanation: cleanText(item?.explanation)
      };
    })
    .filter((item) => item.question && item.choices.length === 4);
}

function normalizeResources(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => ({
        title: cleanText(item?.title, "Learning resource"),
        type: cleanText(item?.type, "Resource"),
        why: cleanText(item?.why, "Useful for this topic."),
        citation: cleanText(item?.citation, "Needs verification")
      }))
    : [];
}

function normalizeFlashcards(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((item) => ({
          front: cleanText(item?.front),
          back: cleanText(item?.back),
          tags: cleanText(item?.tags, "academiq")
        }))
        .filter((item) => item.front && item.back)
    : [];
}

function normalizePack(data: any, request: Required<Pick<StudyPackRequest, "prompt" | "difficulty">> & StudyPackRequest, youtube: any) {
  const now = new Date().toISOString();
  const topic = cleanText(data?.topic, request.prompt);
  const progressTopics = strings(data?.progressTopics).length
    ? strings(data?.progressTopics)
    : [
        "Read the professor notes",
        "Follow the roadmap",
        "Complete the practice exercises",
        "Take the quiz",
        "Review flashcards",
        "Pick a portfolio project"
      ];

  return {
    id: crypto.randomUUID(),
    title: topic.slice(0, 54),
    topic,
    subject: cleanText(request.subject, "General AI Tutor"),
    difficulty: request.difficulty,
    learningStyle: cleanText(request.learningStyle, "Step-by-step"),
    selectedAgent: cleanText(request.agent, "Professor"),
    summary: cleanText(data?.summary, "Your AcademIQ study pack is ready."),
    professor: cleanText(data?.professor),
    advisor: cleanText(data?.advisor),
    librarian: cleanText(data?.librarian),
    assistant: cleanText(data?.assistant),
    quiz: normalizeQuiz(data?.quiz),
    flashcards: normalizeFlashcards(data?.flashcards),
    projects: strings(data?.projects),
    progressTopics,
    learnedTopics: [],
    completionPercent: 0,
    youtube: youtube.videos,
    integrationNotes: [youtube.note].filter(Boolean),
    mentorNextStep: cleanText(data?.mentorNextStep, "Ask a follow-up question when you are ready."),
    googleDocs: {},
    createdAt: now,
    updatedAt: now,
    resources: normalizeResources(data?.resources)
  };
}

function buildMessages(body: StudyPackRequest): GroqMessage[] {
  const wantsPack = body.generateStudyPack !== false;
  const difficulty = cleanText(body.difficulty, "Beginner");
  const system = `You are AcademIQ, a premium AI tutor app powered by specialized learning agents.
Generate the same feature surface as a multi-agent tutoring workspace:
- Professor: comprehensive knowledge base and core lesson
- Academic Advisor: ordered roadmap
- Research Librarian: curated resources with citations when requested
- Teaching Assistant: practice exercises and solutions
- Quiz Generator: multiple choice assessment
- Flashcard Agent: Anki-ready flashcards
- Project Idea Agent: portfolio project ideas
- Mentor Agent: next-step tutoring prompt

Return strict JSON only. Use this schema:
{
  "topic": "short topic title",
  "summary": "3-5 sentence overview",
  "professor": "markdown knowledge base (at least 400 words with multiple sections)",
  "advisor": "markdown roadmap with numbered milestones, estimated time per step, and prerequisites",
  "librarian": "markdown curated resource notes with specific recommendations",
  "assistant": "markdown practice materials with 3-5 exercises including worked solutions",
  "resources": [{"title":"resource name","type":"docs/course/book/video/search term","why":"why it helps","citation":"URL or Needs verification"}],
  "quiz": [{"question":"...","choices":["A) ...","B) ...","C) ...","D) ..."],"answer":"exact correct choice text including letter prefix","explanation":"why this is correct and why other choices are wrong"}],
  "flashcards": [{"front":"prompt or question","back":"concise answer","tags":"comma separated tags"}],
  "projects": ["portfolio project idea with goal, features, tech, stretch goal, proof of skill"],
  "progressTopics": ["trackable learning milestone"],
  "mentorNextStep": "recommended follow-up"
}

CRITICAL QUANTITY REQUIREMENTS:
- quiz: Generate EXACTLY 10 questions. Not 3, not 5. TEN questions covering different aspects of the topic.
- flashcards: Generate EXACTLY 15 flashcards. Cover key terms, concepts, and common pitfalls.
- resources: At least 6 diverse resources (mix of docs, courses, books, videos).
- projects: At least 3 project ideas at varying complexity.
- progressTopics: At least 8 trackable milestones.

CRITICAL QUALITY RULES:
- Do NOT use raw markdown symbols (**, ##, *, \`) inside quiz choices, flashcard fronts, or flashcard backs. Those fields must be plain readable text.
- Quiz choices MUST start with a letter prefix like "A) ", "B) ", "C) ", "D) ".
- Quiz answer field must exactly match one of the choices including the letter prefix.
- Quiz explanations must explain why the correct answer is right AND why at least one distractor is wrong.
- Flashcard fronts should be questions or "fill in the blank" prompts, not just terms.
- Each agent section (professor, advisor, librarian, assistant) must provide DIFFERENT content — no copy-pasting between sections.

Style contract for every markdown field:
- Make the output polished, scannable, and student-friendly.
- Use short descriptive headings (## or ###), compact bullets, concrete examples, and practice prompts.
- Avoid generic filler, walls of text, and repeated wording across agents.
- Put the most useful next action near the top of each section.
- Use clean markdown: headings, bold for key terms, bullet lists. No excessive decoration or emoji.

${wantsPack ? "Create a complete study pack." : "Answer directly, but still fill the schema with concise useful fields."}`;

  const user = `Learning request: ${body.prompt}
Subject/model selector: ${body.subject || "General AI Tutor"}
Difficulty: ${difficulty}
Difficulty contract: ${difficultyGuidance(difficulty)}
IMPORTANT: The difficulty level MUST fundamentally change the content. A Beginner pack and an Advanced pack on the same topic should look completely different in depth, vocabulary, examples, and quiz difficulty.
Learning style: ${body.learningStyle || "Step-by-step"}
Selected agent: ${body.agent || "Professor"}
Citations requested: ${body.citations ? "yes" : "no"}
Generate full study pack: ${wantsPack ? "yes" : "no"}

Attachments:
${attachmentContext(body.attachments)}`;

  return [
    { role: "system", content: system },
    { role: "user", content: user }
  ];
}

export async function POST(request: Request) {
  const limiter = rateLimit(request, {
    namespace: "study-pack",
    limit: envInt("STUDY_PACK_RATE_LIMIT", 8),
    windowMs: envInt("STUDY_PACK_RATE_LIMIT_WINDOW_MS", 60_000)
  });
  if (limiter.limited) {
    return NextResponse.json(
      { error: "Too many study pack requests. Please wait a moment and try again." },
      { status: 429, headers: limiter.headers }
    );
  }

  let body: StudyPackRequest;
  try {
    body = (await request.json()) as StudyPackRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = cleanText(body.prompt);
  if (!prompt) {
    return NextResponse.json({ error: "A learning request is required." }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "Missing GROQ_API_KEY. Add it locally and in Vercel Project Settings." },
      { status: 500 }
    );
  }

  try {
    const [data, youtube] = await Promise.all([
      groqJson(buildMessages({ ...body, prompt }), 8000),
      searchYouTube(prompt)
    ]);
    const pack = normalizePack(data, { ...body, prompt, difficulty: cleanText(body.difficulty, "Beginner") }, youtube);
    return NextResponse.json(pack);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Study pack generation failed." },
      { status: 500 }
    );
  }
}
