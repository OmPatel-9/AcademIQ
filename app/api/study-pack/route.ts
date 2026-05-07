import { NextResponse } from "next/server";

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
    .map((item) => ({
      question: cleanText(item?.question),
      choices: Array.isArray(item?.choices) ? item.choices.map(String).slice(0, 4) : [],
      answer: cleanText(item?.answer),
      explanation: cleanText(item?.explanation)
    }))
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
  "professor": "markdown knowledge base",
  "advisor": "markdown roadmap with milestones and estimated time",
  "librarian": "markdown curated resource notes",
  "assistant": "markdown practice materials with solutions",
  "resources": [{"title":"resource name","type":"docs/course/book/video/search term","why":"why it helps","citation":"URL or Needs verification"}],
  "quiz": [{"question":"...","choices":["...","...","...","..."],"answer":"exact correct choice text","explanation":"..."}],
  "flashcards": [{"front":"prompt","back":"answer","tags":"comma separated tags"}],
  "projects": ["portfolio project idea with goal, features, tech, stretch goal, proof of skill"],
  "progressTopics": ["trackable learning milestone"],
  "mentorNextStep": "recommended follow-up"
}

${wantsPack ? "Create a complete study pack." : "Answer directly, but still fill the schema with concise useful fields."}`;

  const user = `Learning request: ${body.prompt}
Subject/model selector: ${body.subject || "General AI Tutor"}
Difficulty: ${body.difficulty || "Beginner"}
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
      groqJson(buildMessages({ ...body, prompt }), 6500),
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
