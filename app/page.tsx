"use client";

import {
  Activity,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  GraduationCap,
  History,
  Home,
  Layers,
  Library,
  ListChecks,
  Map,
  MessageCircle,
  Moon,
  Package,
  Paperclip,
  PencilRuler,
  Plus,
  Printer,
  Route,
  Search,
  Send,
  Settings,
  Sparkles,
  Sun,
  UserCircle,
  UserPlus
} from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";

type ThemeMode = "light" | "dark";
type Difficulty = "Beginner" | "Intermediate" | "Advanced";
type TabKey =
  | "professor"
  | "roadmap"
  | "resources"
  | "practice"
  | "quiz"
  | "progress"
  | "projects"
  | "flashcards"
  | "mindmap"
  | "exports"
  | "googleDocs";

type AttachmentPayload = {
  name: string;
  type: string;
  size: number;
  content?: string;
};

type ResourceItem = {
  title: string;
  type: string;
  why: string;
  citation: string;
};

type VideoItem = {
  title: string;
  channel: string;
  url: string;
};

type QuizItem = {
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
};

type FlashcardItem = {
  front: string;
  back: string;
  tags?: string;
};

type StudyPack = {
  id: string;
  title: string;
  topic: string;
  subject: string;
  difficulty: string;
  learningStyle: string;
  selectedAgent: string;
  summary: string;
  professor: string;
  advisor: string;
  librarian: string;
  assistant: string;
  resources: ResourceItem[];
  quiz: QuizItem[];
  flashcards: FlashcardItem[];
  projects: string[];
  progressTopics: string[];
  learnedTopics: string[];
  completionPercent: number;
  youtube: VideoItem[];
  integrationNotes: string[];
  mentorNextStep: string;
  googleDocs: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type Session = {
  id: string;
  userId: string;
  title: string;
  pack: StudyPack | null;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

type NavItem = {
  label: string;
  Icon: LucideIcon;
};

type AgentCard = {
  title: string;
  role: string;
  Icon: LucideIcon;
};

const navItems: NavItem[] = [
  { label: "Home", Icon: Home },
  { label: "Chat", Icon: MessageCircle },
  { label: "Study Packs", Icon: Package },
  { label: "Roadmaps", Icon: Map },
  { label: "Resources", Icon: Library },
  { label: "Practice", Icon: Activity },
  { label: "Flashcards", Icon: Layers },
  { label: "Projects", Icon: Briefcase },
  { label: "Quizzes", Icon: ListChecks },
  { label: "History", Icon: History },
  { label: "Settings", Icon: Settings },
  { label: "User Profile", Icon: UserCircle }
];

const agents: AgentCard[] = [
  { title: "Professor", role: "Research and Knowledge Specialist", Icon: BookOpen },
  { title: "Academic Advisor", role: "Learning Path Designer", Icon: Route },
  { title: "Research Librarian", role: "Learning Resource Specialist", Icon: Library },
  { title: "Teaching Assistant", role: "Exercise Creator", Icon: PencilRuler },
  { title: "Flashcard Agent", role: "Anki Flashcard Creator", Icon: Layers },
  { title: "Project Idea Agent", role: "Portfolio Project Coach", Icon: Briefcase },
  { title: "Quiz Generator", role: "Assessment Writer", Icon: CheckCircle2 },
  { title: "Mentor Agent", role: "Follow-up Tutor", Icon: Sparkles }
];

const tabs: { key: TabKey; label: string }[] = [
  { key: "professor", label: "Professor" },
  { key: "roadmap", label: "Roadmap" },
  { key: "resources", label: "Resources" },
  { key: "practice", label: "Practice" },
  { key: "quiz", label: "Quiz" },
  { key: "progress", label: "Progress" },
  { key: "projects", label: "Projects" },
  { key: "flashcards", label: "Flashcards" },
  { key: "mindmap", label: "Mind Map" },
  { key: "exports", label: "Exports" },
  { key: "googleDocs", label: "Google Docs" }
];

const quickStarts = [
  "Generate a complete study pack on Python",
  "Create a beginner roadmap for machine learning",
  "Quiz me on networking fundamentals",
  "Make flashcards from my uploaded notes"
];

const subjects = [
  "General AI Tutor",
  "Computer Science",
  "Mathematics",
  "Data Science",
  "Writing Coach",
  "Business",
  "Exam Prep"
];

const learningStyles = ["Step-by-step", "Visual", "Socratic", "Practice-first"];
const difficulties: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];
const STORAGE_KEY = "academiq_sessions_v2";
const USER_ID = "guest";

function newSession(): Session {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    userId: USER_ID,
    title: "New study session",
    pack: null,
    messages: [],
    createdAt: now,
    updatedAt: now
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function normalizeSessions(value: unknown): Session[] {
  return Array.isArray(value) ? (value as Session[]).filter((item) => item?.id) : [];
}

function packToMarkdown(pack: StudyPack) {
  const resources = pack.resources
    .map((item) => `- **${item.title}** (${item.type}) - ${item.why}\n  Citation: ${item.citation}`)
    .join("\n");
  const videos = pack.youtube.map((video) => `- [${video.title}](${video.url}) - ${video.channel}`).join("\n");
  const quiz = pack.quiz
    .map((item, index) => `${index + 1}. ${item.question}\n   Answer: ${item.answer}\n   ${item.explanation}`)
    .join("\n\n");
  const flashcards = pack.flashcards
    .map((item) => `- Front: ${item.front}\n  Back: ${item.back}\n  Tags: ${item.tags || "academiq"}`)
    .join("\n");

  return `# ${pack.topic}

Difficulty: ${pack.difficulty}
Subject: ${pack.subject}
Learning style: ${pack.learningStyle}

## Summary
${pack.summary}

## Professor
${pack.professor}

## Roadmap
${pack.advisor}

## Resources
${pack.librarian}

${resources}

## YouTube Tutorials
${videos || "No YouTube tutorials available."}

## Practice
${pack.assistant}

## Quiz
${quiz}

## Flashcards
${flashcards}

## Projects
${pack.projects.map((item) => `- ${item}`).join("\n")}
`;
}

function flashcardsCsv(pack: StudyPack) {
  const rows = pack.flashcards.map((card) =>
    [card.front, card.back, card.tags || pack.topic]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(",")
  );
  return `"Front","Back","Tags"\n${rows.join("\n")}`;
}

function htmlEscape(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function mindMapHtml(pack: StudyPack) {
  const nodes = ["Professor", "Roadmap", "Resources", "Practice", "Quiz", "Projects", "Flashcards"]
    .map((label) => `<div class="node">${label}</div>`)
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${htmlEscape(pack.topic)} Mind Map</title>
  <style>
    body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #0d1323; color: #f7f3ff; }
    main { min-height: 100vh; display: grid; place-items: center; padding: 32px; }
    .map { width: min(920px, 100%); display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
    .root, .node { border-radius: 18px; padding: 24px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,.35); }
    .root { grid-column: 1 / -1; background: linear-gradient(135deg, #8b5cf6, #c026d3 52%, #ec4899); font-size: 28px; font-weight: 800; }
    .node { background: #172235; border: 1px solid rgba(185,165,255,.24); }
    @media (max-width: 720px) { .map { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main>
    <section class="map">
      <div class="root">${htmlEscape(pack.topic)}</div>
      ${nodes}
    </section>
  </main>
</body>
</html>`;
}

function downloadText(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function readLocalSessions() {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    return normalizeSessions(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return [];
  }
}

async function readAttachment(file: File): Promise<AttachmentPayload> {
  const base = { name: file.name, type: file.type || "unknown", size: file.size };
  const readableText = file.type.startsWith("text/") || /\.(txt|md|csv|json)$/i.test(file.name);
  if (!readableText) {
    return base;
  }
  const content = await file.text();
  return { ...base, content: content.slice(0, 12000) };
}

function MarkdownBlock({ children }: { children: string }) {
  return <div className="markdown-block">{children || "No content generated yet."}</div>;
}

function ListBlock({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) {
    return <p className="muted">{empty}</p>;
  }
  return (
    <ul className="clean-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

export default function HomePage() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [subject, setSubject] = useState(subjects[0]);
  const [prompt, setPrompt] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Beginner");
  const [learningStyle, setLearningStyle] = useState(learningStyles[0]);
  const [citations, setCitations] = useState(true);
  const [generateStudyPack, setGenerateStudyPack] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(agents[0].title);
  const [files, setFiles] = useState<File[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session>(() => newSession());
  const [activeTab, setActiveTab] = useState<TabKey>("professor");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizScore, setQuizScore] = useState<string>("");
  const [mentorQuestion, setMentorQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMentorLoading, setIsMentorLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);

  const studyPack = currentSession.pack;
  const selectedAgentCard = useMemo(
    () => agents.find((agent) => agent.title === selectedAgent) || agents[0],
    [selectedAgent]
  );
  const filteredSessions = sessions.filter((session) =>
    `${session.title} ${session.pack?.topic || ""}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const localSessions = readLocalSessions();
    if (localSessions.length) {
      setSessions(localSessions);
      setCurrentSession(localSessions[0]);
    }

    fetch(`/api/sessions?userId=${USER_ID}`)
      .then((response) => response.json())
      .then((payload) => {
        setSupabaseEnabled(Boolean(payload.enabled));
        if (Array.isArray(payload.sessions) && payload.sessions.length) {
          setSessions(payload.sessions);
          setCurrentSession(payload.sessions[0]);
        }
      })
      .catch(() => setSupabaseEnabled(false));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  function persistSession(nextSession: Session) {
    const updated = { ...nextSession, updatedAt: new Date().toISOString() };
    setCurrentSession(updated);
    setSessions((current) => {
      const rest = current.filter((item) => item.id !== updated.id);
      return [updated, ...rest].slice(0, 30);
    });

    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    }).catch(() => undefined);
  }

  function resetSession() {
    const fresh = newSession();
    setPrompt("");
    setFiles([]);
    setCurrentSession(fresh);
    setError("");
    setQuizScore("");
    setQuizAnswers({});
    setActiveTab("professor");
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files || []));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError("Enter a topic or question before sending it to AcademIQ.");
      return;
    }

    setIsLoading(true);
    setError("");
    setQuizScore("");
    setQuizAnswers({});

    try {
      const attachments = await Promise.all(files.map(readAttachment));
      const response = await fetch("/api/study-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          subject,
          difficulty,
          learningStyle,
          citations,
          generateStudyPack,
          agent: selectedAgent,
          attachments
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "AcademIQ could not generate a response.");
      }

      const message: ChatMessage = { role: "user", content: trimmedPrompt, createdAt: new Date().toISOString() };
      const assistant: ChatMessage = {
        role: "assistant",
        content: `I created a study pack for ${payload.topic}.`,
        createdAt: new Date().toISOString()
      };
      persistSession({
        ...currentSession,
        title: payload.title || payload.topic,
        pack: payload as StudyPack,
        messages: [...currentSession.messages, message, assistant]
      });
      setPrompt("");
      setFiles([]);
      setActiveTab("professor");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  async function askMentor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!studyPack || !mentorQuestion.trim()) {
      return;
    }
    setIsMentorLoading(true);
    setError("");
    try {
      const response = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: mentorQuestion, pack: studyPack })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Mentor Agent failed.");
      }
      persistSession({
        ...currentSession,
        messages: [
          ...currentSession.messages,
          { role: "user", content: mentorQuestion, createdAt: new Date().toISOString() },
          { role: "assistant", content: payload.answer, createdAt: new Date().toISOString() }
        ]
      });
      setMentorQuestion("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Mentor Agent failed.");
    } finally {
      setIsMentorLoading(false);
    }
  }

  function toggleProgress(topic: string) {
    if (!studyPack) {
      return;
    }
    const learned = new Set(studyPack.learnedTopics);
    if (learned.has(topic)) {
      learned.delete(topic);
    } else {
      learned.add(topic);
    }
    const learnedTopics = Array.from(learned);
    const completionPercent = Math.round((learnedTopics.length / Math.max(studyPack.progressTopics.length, 1)) * 100);
    persistSession({
      ...currentSession,
      pack: { ...studyPack, learnedTopics, completionPercent }
    });
  }

  function gradeQuiz() {
    if (!studyPack) {
      return;
    }
    const correct = studyPack.quiz.reduce((total, question, index) => {
      return total + (quizAnswers[index] === question.answer ? 1 : 0);
    }, 0);
    setQuizScore(`${correct}/${studyPack.quiz.length}`);
  }

  async function createGoogleDoc(section: string, markdown: string) {
    if (!studyPack) {
      return;
    }
    setError("");
    const response = await fetch("/api/google-doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `[${section}] ${studyPack.topic}`, markdown })
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Google Docs export failed.");
      return;
    }
    persistSession({
      ...currentSession,
      pack: {
        ...studyPack,
        googleDocs: { ...studyPack.googleDocs, [section]: payload.url }
      }
    });
  }

  function printStudyPack() {
    window.print();
  }

  function renderTab() {
    if (!studyPack) {
      return null;
    }

    if (activeTab === "professor") {
      return <MarkdownBlock>{studyPack.professor}</MarkdownBlock>;
    }
    if (activeTab === "roadmap") {
      return <MarkdownBlock>{studyPack.advisor}</MarkdownBlock>;
    }
    if (activeTab === "resources") {
      return (
        <div className="tab-stack">
          <MarkdownBlock>{studyPack.librarian}</MarkdownBlock>
          <div className="resource-row full">
            {studyPack.resources.map((resource, index) => (
              <div className="resource-card" key={`${resource.title}-${index}`}>
                <strong>{resource.title}</strong>
                <span>{resource.type}</span>
                <p>{resource.why}</p>
                <small>{resource.citation}</small>
              </div>
            ))}
          </div>
          <h3>YouTube Tutorials</h3>
          {studyPack.youtube.length ? (
            <ul className="clean-list">
              {studyPack.youtube.map((video) => (
                <li key={video.url}>
                  <a href={video.url} target="_blank" rel="noreferrer">
                    {video.title}
                  </a>{" "}
                  - {video.channel}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Add `YOUTUBE_API_KEY` to enable video search.</p>
          )}
        </div>
      );
    }
    if (activeTab === "practice") {
      return <MarkdownBlock>{studyPack.assistant}</MarkdownBlock>;
    }
    if (activeTab === "quiz") {
      return (
        <div className="quiz-list">
          {studyPack.quiz.map((question, index) => (
            <fieldset key={question.question}>
              <legend>
                {index + 1}. {question.question}
              </legend>
              {question.choices.map((choice) => (
                <label key={choice}>
                  <input
                    checked={quizAnswers[index] === choice}
                    name={`quiz-${index}`}
                    onChange={() => setQuizAnswers((current) => ({ ...current, [index]: choice }))}
                    type="radio"
                  />
                  <span>{choice}</span>
                </label>
              ))}
              {quizScore ? <p className="muted">Answer: {question.answer}. {question.explanation}</p> : null}
            </fieldset>
          ))}
          <button className="primary-button inline" onClick={gradeQuiz} type="button">
            Grade quiz
          </button>
          {quizScore ? <strong className="score-pill">Score: {quizScore}</strong> : null}
        </div>
      );
    }
    if (activeTab === "progress") {
      return (
        <div className="progress-panel">
          <div className="progress-bar">
            <span style={{ width: `${studyPack.completionPercent}%` }} />
          </div>
          <strong>{studyPack.completionPercent}% complete</strong>
          {studyPack.progressTopics.map((topic) => (
            <label className="progress-item" key={topic}>
              <input
                checked={studyPack.learnedTopics.includes(topic)}
                onChange={() => toggleProgress(topic)}
                type="checkbox"
              />
              <span>{topic}</span>
            </label>
          ))}
        </div>
      );
    }
    if (activeTab === "projects") {
      return <ListBlock items={studyPack.projects} empty="No projects generated yet." />;
    }
    if (activeTab === "flashcards") {
      return (
        <div className="flashcard-grid">
          {studyPack.flashcards.map((card, index) => (
            <div className="flashcard" key={`${card.front}-${index}`}>
              <strong>{card.front}</strong>
              <p>{card.back}</p>
              <small>{card.tags || studyPack.topic}</small>
            </div>
          ))}
        </div>
      );
    }
    if (activeTab === "mindmap") {
      return (
        <div className="mind-map">
          <div className="mind-node root">{studyPack.topic}</div>
          {["Professor", "Roadmap", "Resources", "Practice", "Quiz", "Projects", "Flashcards"].map((label) => (
            <div className="mind-node" key={label}>{label}</div>
          ))}
        </div>
      );
    }
    if (activeTab === "exports") {
      return (
        <div className="export-grid">
          <button onClick={() => downloadText(`${studyPack.topic}.md`, packToMarkdown(studyPack), "text/markdown")} type="button">
            <Download size={18} /> Markdown
          </button>
          <button onClick={() => downloadText(`${studyPack.topic}_anki.csv`, flashcardsCsv(studyPack), "text/csv")} type="button">
            <Download size={18} /> Anki CSV
          </button>
          <button onClick={() => downloadText(`${studyPack.topic}_mind_map.html`, mindMapHtml(studyPack), "text/html")} type="button">
            <Download size={18} /> Mind map HTML
          </button>
          <button onClick={printStudyPack} type="button">
            <Printer size={18} /> Print / Save PDF
          </button>
        </div>
      );
    }
    return (
      <div className="export-grid">
        {[
          ["Professor", studyPack.professor],
          ["Roadmap", studyPack.advisor],
          ["Resources", studyPack.librarian],
          ["Practice", studyPack.assistant],
          ["Projects", studyPack.projects.join("\n\n")],
          ["Full Study Pack", packToMarkdown(studyPack)]
        ].map(([section, markdown]) => (
          <button key={section} onClick={() => createGoogleDoc(section, markdown)} type="button">
            <FileText size={18} /> Create {section} Doc
          </button>
        ))}
        {Object.entries(studyPack.googleDocs).map(([section, url]) => (
          <a className="doc-link" href={url} key={section} rel="noreferrer" target="_blank">
            Open {section}
          </a>
        ))}
      </div>
    );
  }

  return (
    <main className={`app-shell ${theme}`}>
      <aside className="sidebar" aria-label="AcademIQ navigation">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <strong>AcademIQ</strong>
            <span>AI learning agents</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map(({ label, Icon }, index) => (
            <button className={`nav-item ${index === 0 ? "active" : ""}`} key={label}>
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="history-panel">
          <div className="history-title">
            <History size={16} />
            <span>History</span>
            <small>{supabaseEnabled ? "Supabase" : "Local"}</small>
          </div>
          {filteredSessions.slice(0, 8).map((session) => (
            <button
              className={`history-item ${session.id === currentSession.id ? "active" : ""}`}
              key={session.id}
              onClick={() => {
                setCurrentSession(session);
                setQuizScore("");
                setQuizAnswers({});
              }}
              type="button"
            >
              <strong>{session.title}</strong>
              <span>{formatDate(session.updatedAt)}</span>
            </button>
          ))}
        </div>

        <div className="profile-chip">
          <UserCircle size={20} />
          <div>
            <strong>Jason</strong>
            <span>Focused workspace</span>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <label className="subject-select">
            <span>AI Tutor</span>
            <div className="select-shell">
              <GraduationCap size={17} />
              <select value={subject} onChange={(event) => setSubject(event.target.value)}>
                {subjects.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <ChevronDown size={16} />
            </div>
          </label>

          <div className="top-actions">
            <label className="search-box">
              <Search size={17} />
              <input
                placeholder="Search Study Pack"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <button
              className="soft-button"
              type="button"
              onClick={() => {
                window.location.href = "mailto:?subject=Join me on AcademIQ&body=I am using AcademIQ for AI-powered studying.";
              }}
            >
              <UserPlus size={17} />
              <span>Invite</span>
            </button>
            <button
              className="theme-toggle"
              type="button"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              aria-label="Toggle light and dark mode"
            >
              {theme === "dark" ? <Moon size={17} /> : <Sun size={17} />}
              <span>{theme === "dark" ? "Dark" : "Light"}</span>
            </button>
            <button className="primary-button" type="button" onClick={resetSession}>
              <Plus size={18} />
              <span>New Study Session</span>
            </button>
          </div>
        </header>

        {!studyPack ? (
          <section className="hero">
            <div className="ai-orb" aria-hidden="true" />
            <h1>
              <span>Good Afternoon, Jason</span>
              <span>
                What would you like to <mark>learn today?</mark>
              </span>
            </h1>
          </section>
        ) : (
          <section className="pack-header">
            <span>{studyPack.selectedAgent}</span>
            <h1>{studyPack.topic}</h1>
            <p>{studyPack.summary}</p>
            <div className="chip-row">
              <span>Difficulty: {studyPack.difficulty}</span>
              <span>Progress: {studyPack.completionPercent}%</span>
              <span>Quiz: {quizScore || "Not taken"}</span>
              <span>Generated: {formatDate(studyPack.createdAt)}</span>
            </div>
          </section>
        )}

        <form className="prompt-panel" onSubmit={handleSubmit}>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ask your AI tutor a question, enter a topic, or generate a study pack."
            aria-label="Learning request"
          />

          <div className="prompt-controls">
            <label className="attach-control">
              <Paperclip size={17} />
              <span>{files.length ? `${files.length} attached` : "Attach"}</span>
              <input type="file" multiple accept=".txt,.md,.csv,.json,.pdf" onChange={handleFiles} />
            </label>

            <fieldset className="difficulty-control">
              <legend>Difficulty</legend>
              <div>
                {difficulties.map((item) => (
                  <button
                    className={difficulty === item ? "selected" : ""}
                    key={item}
                    type="button"
                    onClick={() => setDifficulty(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="compact-select">
              <span>Learning Style</span>
              <select value={learningStyle} onChange={(event) => setLearningStyle(event.target.value)}>
                {learningStyles.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="check-control">
              <input checked={citations} onChange={(event) => setCitations(event.target.checked)} type="checkbox" />
              <span>Citations</span>
            </label>

            <label className="check-control">
              <input
                checked={generateStudyPack}
                onChange={(event) => setGenerateStudyPack(event.target.checked)}
                type="checkbox"
              />
              <span>Generate Study Pack</span>
            </label>

            <button className="send-button" type="submit" aria-label="Send learning request" disabled={isLoading}>
              <Send size={18} />
            </button>
          </div>
        </form>

        {error ? <p className="error-banner">{error}</p> : null}
        {studyPack?.integrationNotes.map((note) => <p className="info-banner" key={note}>{note}</p>)}

        {!studyPack ? (
          <>
            <section className="agent-section">
              <div className="section-label">CHOOSE YOUR AI TUTOR AGENT</div>
              <div className="agent-grid">
                {agents.map(({ title, role, Icon }) => (
                  <article className={`agent-card ${selectedAgent === title ? "selected" : ""}`} key={title}>
                    <div className="agent-icon">
                      <Icon size={21} />
                    </div>
                    <h2>{title}</h2>
                    <p>{role}</p>
                    <button type="button" onClick={() => setSelectedAgent(title)}>
                      {selectedAgent === title ? "Selected" : "Choose Agent"}
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="quick-section">
              <div className="section-label">Quick Start</div>
              <div className="quick-grid">
                {quickStarts.map((item) => (
                  <button type="button" key={item} onClick={() => setPrompt(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="study-pack">
            <div className="tabs">
              {tabs.map((tab) => (
                <button
                  className={activeTab === tab.key ? "active" : ""}
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="tab-panel">{renderTab()}</div>
          </section>
        )}

        <section className="mentor-panel">
          <div className="section-label">Mentor Agent</div>
          <div className="chat-log">
            {currentSession.messages.map((message, index) => (
              <div className={`chat-message ${message.role}`} key={`${message.createdAt}-${index}`}>
                <strong>{message.role === "user" ? "You" : "AcademIQ"}</strong>
                <p>{message.content}</p>
              </div>
            ))}
          </div>
          <form className="mentor-form" onSubmit={askMentor}>
            <input
              disabled={!studyPack}
              placeholder={studyPack ? "Ask a follow-up question..." : "Generate a study pack to unlock follow-up mentoring."}
              value={mentorQuestion}
              onChange={(event) => setMentorQuestion(event.target.value)}
            />
            <button className="primary-button inline" disabled={!studyPack || isMentorLoading} type="submit">
              <Sparkles size={17} />
              Ask Mentor
            </button>
          </form>
        </section>

        {isLoading ? (
          <div className="loading-state">
            <div className="mini-orb" />
            <strong>{selectedAgentCard.title} is building your learning workspace...</strong>
          </div>
        ) : null}
      </section>
    </main>
  );
}
