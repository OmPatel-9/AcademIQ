"use client";

import {
  Activity,
  ArrowRight,
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
  LogIn,
  LogOut,
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
type AuthStatus = "checking" | "loading" | "ready";
type AccountMode = "guest" | "google";
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

type UserAccount = {
  mode: AccountMode;
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
};

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
  { label: "Profile", Icon: UserCircle }
];

const agents: AgentCard[] = [
  { title: "Professor", role: "Core lesson and explanations", Icon: BookOpen },
  { title: "Academic Advisor", role: "Learning path and milestones", Icon: Route },
  { title: "Research Librarian", role: "Resources and citations", Icon: Library },
  { title: "Teaching Assistant", role: "Practice and worked solutions", Icon: PencilRuler },
  { title: "Flashcard Agent", role: "Recall cards for review", Icon: Layers },
  { title: "Project Idea Agent", role: "Portfolio-ready project prompts", Icon: Briefcase },
  { title: "Quiz Generator", role: "Checks and explanations", Icon: CheckCircle2 },
  { title: "Mentor Agent", role: "Follow-up tutoring", Icon: MessageCircle }
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
  "General Tutor",
  "Computer Science",
  "Mathematics",
  "Data Science",
  "Writing Coach",
  "Business",
  "Exam Prep"
];

const learningStyles = ["Step-by-step", "Visual", "Socratic", "Practice-first"];
const difficulties: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];
const GOOGLE_ACCOUNT_KEY = "academiq_google_account_v1";
const GUEST_ACCOUNT_KEY = "academiq_guest_account_v1";

function guestSessionsKey(userId: string) {
  return `academiq_guest_sessions_${userId}`;
}

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function newSession(userId = "guest"): Session {
  const now = new Date().toISOString();
  return {
    id: makeId(),
    userId,
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

function readJson<T>(storage: Storage, key: string): T | null {
  try {
    const item = storage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
}

function readStoredSessions(storage: Storage, key: string) {
  return normalizeSessions(readJson<unknown>(storage, key));
}

function clearOAuthUrl() {
  window.history.replaceState({}, document.title, window.location.pathname);
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
    body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #f4f6f5; color: #161716; }
    main { min-height: 100vh; display: grid; place-items: center; padding: 32px; }
    .map { width: min(920px, 100%); display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .root, .node { border-radius: 8px; padding: 24px; text-align: center; border: 1px solid #d9dfdc; background: #ffffff; }
    .root { grid-column: 1 / -1; background: #193f36; color: #ffffff; font-size: 28px; font-weight: 800; }
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
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [authMessage, setAuthMessage] = useState("");
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
    let cancelled = false;

    async function restoreAccount() {
      setAuthStatus("checking");

      const query = new URLSearchParams(window.location.search);
      const queryError = query.get("auth_error");
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const hashError = hash.get("error_description") || hash.get("error");

      if (queryError || hashError) {
        setAuthMessage(queryError || hashError || "Google sign-in did not finish.");
        clearOAuthUrl();
      }

      const accessToken = hash.get("access_token");
      if (accessToken) {
        setAuthStatus("loading");
        clearOAuthUrl();
        try {
          const response = await fetch("/api/auth/profile", {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const profile = await response.json();
          if (!response.ok) {
            throw new Error(profile.error || "Google sign-in could not be verified.");
          }

          const expiresIn = Number(hash.get("expires_in") || "3600");
          const nextAccount: UserAccount = {
            mode: "google",
            id: String(profile.id),
            name: String(profile.name || profile.email || "Google user"),
            email: String(profile.email || ""),
            avatarUrl: String(profile.avatarUrl || ""),
            accessToken,
            refreshToken: hash.get("refresh_token") || undefined,
            expiresAt: Date.now() + Math.max(expiresIn - 60, 60) * 1000
          };

          localStorage.setItem(GOOGLE_ACCOUNT_KEY, JSON.stringify(nextAccount));
          sessionStorage.removeItem(GUEST_ACCOUNT_KEY);
          if (!cancelled) {
            setAccount(nextAccount);
            setAuthMessage("");
            setAuthStatus("ready");
          }
          return;
        } catch (caughtError) {
          if (!cancelled) {
            setAccount(null);
            setAuthMessage(caughtError instanceof Error ? caughtError.message : "Google sign-in failed.");
            setAuthStatus("ready");
          }
          return;
        }
      }

      const savedGoogle = readJson<UserAccount>(localStorage, GOOGLE_ACCOUNT_KEY);
      if (savedGoogle?.mode === "google" && savedGoogle.accessToken) {
        if (savedGoogle.expiresAt && savedGoogle.expiresAt <= Date.now()) {
          localStorage.removeItem(GOOGLE_ACCOUNT_KEY);
          setAuthMessage("Your Google session expired. Sign in again to see your saved chats.");
        } else if (!cancelled) {
          setAccount(savedGoogle);
          setAuthStatus("ready");
          return;
        }
      }

      const savedGuest = readJson<UserAccount>(sessionStorage, GUEST_ACCOUNT_KEY);
      if (savedGuest?.mode === "guest") {
        setAccount(savedGuest);
      }

      if (!cancelled) {
        setAuthStatus("ready");
      }
    }

    restoreAccount();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSessions() {
      if (!account) {
        return;
      }

      setError("");
      setQuizScore("");
      setQuizAnswers({});
      setSearchTerm("");

      if (account.mode === "guest") {
        setSupabaseEnabled(false);
        const localSessions = readStoredSessions(sessionStorage, guestSessionsKey(account.id));
        if (!cancelled) {
          setSessions(localSessions);
          setCurrentSession(localSessions[0] || newSession(account.id));
        }
        return;
      }

      if (!account.accessToken) {
        return;
      }

      try {
        const response = await fetch("/api/sessions", {
          headers: { Authorization: `Bearer ${account.accessToken}` }
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Saved chats could not be loaded.");
        }

        if (!cancelled) {
          const cloudSessions = normalizeSessions(payload.sessions);
          setSupabaseEnabled(Boolean(payload.enabled));
          setSessions(cloudSessions);
          setCurrentSession(cloudSessions[0] || newSession(account.id));
        }
      } catch (caughtError) {
        if (!cancelled) {
          setSupabaseEnabled(false);
          setSessions([]);
          setCurrentSession(newSession(account.id));
          setError(caughtError instanceof Error ? caughtError.message : "Saved chats could not be loaded.");
        }
      }
    }

    loadSessions();

    return () => {
      cancelled = true;
    };
  }, [account]);

  function startGuest() {
    const guestAccount: UserAccount = {
      mode: "guest",
      id: `guest:${makeId()}`,
      name: "Guest"
    };
    sessionStorage.setItem(GUEST_ACCOUNT_KEY, JSON.stringify(guestAccount));
    setAccount(guestAccount);
    setAuthMessage("");
    setSessions([]);
    setCurrentSession(newSession(guestAccount.id));
  }

  function startGoogleSignIn() {
    window.location.href = "/api/auth/google/start";
  }

  function signOut() {
    if (account?.mode === "guest") {
      sessionStorage.removeItem(guestSessionsKey(account.id));
    }
    sessionStorage.removeItem(GUEST_ACCOUNT_KEY);
    localStorage.removeItem(GOOGLE_ACCOUNT_KEY);
    setAccount(null);
    setSessions([]);
    setCurrentSession(newSession());
    setPrompt("");
    setFiles([]);
    setError("");
    setQuizScore("");
    setQuizAnswers({});
    setActiveTab("professor");
    setAuthStatus("ready");
  }

  function persistSession(nextSession: Session) {
    if (!account) {
      return;
    }

    const updated = { ...nextSession, userId: account.id, updatedAt: new Date().toISOString() };
    setCurrentSession(updated);
    setSessions((current) => {
      const rest = current.filter((item) => item.id !== updated.id);
      const nextSessions = [updated, ...rest].slice(0, 30);
      if (account.mode === "guest") {
        sessionStorage.setItem(guestSessionsKey(account.id), JSON.stringify(nextSessions));
      }
      return nextSessions;
    });

    if (account.mode === "google" && account.accessToken) {
      fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${account.accessToken}`
        },
        body: JSON.stringify(updated)
      })
        .then(async (response) => {
          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            setError(payload.error || "This chat was created, but it could not be saved to your Google account.");
          }
        })
        .catch(() => setError("This chat was created, but it could not be saved to your Google account."));
    }
  }

  function resetSession() {
    const fresh = newSession(account?.id || "guest");
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

  function handleNav(label: string) {
    if (label === "Home") {
      resetSession();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (label === "History") {
      document.querySelector(".history-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const mapLabelToTab: Partial<Record<string, TabKey>> = {
      "Study Packs": "professor",
      Roadmaps: "roadmap",
      Resources: "resources",
      Practice: "practice",
      Flashcards: "flashcards",
      Projects: "projects",
      Quizzes: "quiz"
    };
    const tab = mapLabelToTab[label];
    if (tab && studyPack) {
      setActiveTab(tab);
      document.getElementById("study-pack")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError("Enter a topic or question before sending.");
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
        content: `I created a ${difficulty.toLowerCase()} study pack for ${payload.topic}.`,
        createdAt: new Date().toISOString()
      };
      persistSession({
        ...currentSession,
        userId: account?.id || currentSession.userId,
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
        throw new Error(payload.error || "Mentor failed.");
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
      setError(caughtError instanceof Error ? caughtError.message : "Mentor failed.");
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
              {quizScore ? (
                <p className="muted">
                  Answer: {question.answer}. {question.explanation}
                </p>
              ) : null}
            </fieldset>
          ))}
          <div className="inline-actions">
            <button className="primary-button inline" onClick={gradeQuiz} type="button">
              Grade quiz
            </button>
            {quizScore ? <strong className="score-pill">Score: {quizScore}</strong> : null}
          </div>
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
            <div className="mind-node" key={label}>
              {label}
            </div>
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

  if (authStatus === "checking" || authStatus === "loading") {
    return (
      <main className="landing-shell">
        <div className="loading-card">
          <div className="brand-mark">A</div>
          <strong>{authStatus === "loading" ? "Finishing Google sign-in..." : "Opening AcademIQ..."}</strong>
        </div>
      </main>
    );
  }

  if (!account) {
    return (
      <main className="landing-shell">
        <header className="landing-topbar">
          <div className="landing-brand">
            <div className="brand-mark">A</div>
            <strong>AcademIQ</strong>
          </div>
          <a href="https://wabi.ai/" target="_blank" rel="noreferrer">
            Reference: Wabi
          </a>
        </header>

        <section className="landing-hero">
          <div className="landing-copy">
            <span className="eyebrow">Study workspace</span>
            <h1>Build a study pack in minutes.</h1>
            <p>
              Start as a guest for a temporary workspace, or sign in with Google to keep your chats and study packs.
            </p>
            {authMessage ? <p className="auth-message">{authMessage}</p> : null}
            <div className="auth-actions">
              <button className="primary-button large" onClick={startGoogleSignIn} type="button">
                <LogIn size={18} />
                Continue with Google
              </button>
              <button className="soft-button large" onClick={startGuest} type="button">
                <UserCircle size={18} />
                Continue as guest
              </button>
            </div>
          </div>

          <div className="product-preview" aria-label="AcademIQ workspace preview">
            <div className="preview-window">
              <div className="preview-top">
                <span />
                <span />
                <span />
              </div>
              <div className="preview-content">
                <div className="preview-sidebar">
                  <strong>AcademIQ</strong>
                  <span />
                  <span />
                  <span />
                </div>
                <div className="preview-main">
                  <div className="preview-heading">
                    <span>Data Science</span>
                    <strong>Beginner roadmap</strong>
                  </div>
                  <div className="preview-prompt">
                    <p>Explain regression with practice problems</p>
                    <button type="button">
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="preview-grid">
                    <span>Lesson</span>
                    <span>Quiz</span>
                    <span>Flashcards</span>
                    <span>Project</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={`app-shell ${theme}`}>
      <aside className="sidebar" aria-label="AcademIQ navigation">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <strong>AcademIQ</strong>
            <span>Learning workspace</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map(({ label, Icon }, index) => (
            <button className={`nav-item ${index === 0 ? "active" : ""}`} key={label} onClick={() => handleNav(label)} type="button">
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="history-panel">
          <div className="history-title">
            <History size={16} />
            <span>History</span>
            <small>
              {account.mode === "google" ? (supabaseEnabled ? "Saved" : "Setup") : "Guest"}
            </small>
          </div>
          {filteredSessions.length ? (
            filteredSessions.slice(0, 8).map((session) => (
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
            ))
          ) : (
            <p className="history-empty">No chats yet.</p>
          )}
        </div>

        <div className="profile-chip">
          {account.avatarUrl ? <img alt="" src={account.avatarUrl} /> : <UserCircle size={22} />}
          <div>
            <strong>{account.name}</strong>
            <span>{account.mode === "google" ? account.email || "Google account" : "Guest session"}</span>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <label className="subject-select">
            <span>Workspace</span>
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
                placeholder="Search chats"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <button
              className="soft-button"
              type="button"
              onClick={() => {
                window.location.href = "mailto:?subject=Join me on AcademIQ&body=I am using AcademIQ for studying.";
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
            <button className="soft-button" type="button" onClick={signOut}>
              <LogOut size={17} />
              <span>Log out</span>
            </button>
            <button className="primary-button" type="button" onClick={resetSession}>
              <Plus size={18} />
              <span>New session</span>
            </button>
          </div>
        </header>

        {!studyPack ? (
          <section className="hero">
            <span className="eyebrow">Good afternoon, {account.name.split(" ")[0] || "there"}</span>
            <h1>What are you studying today?</h1>
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
            placeholder="Enter a topic, question, or pasted notes."
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
                    aria-pressed={difficulty === item}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="compact-select">
              <span>Learning style</span>
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
              <span>Study pack</span>
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
              <div className="section-label">Choose a specialist</div>
              <div className="agent-grid">
                {agents.map(({ title, role, Icon }) => (
                  <article className={`agent-card ${selectedAgent === title ? "selected" : ""}`} key={title}>
                    <div className="agent-icon">
                      <Icon size={21} />
                    </div>
                    <h2>{title}</h2>
                    <p>{role}</p>
                    <button type="button" onClick={() => setSelectedAgent(title)}>
                      {selectedAgent === title ? "Selected" : "Choose"}
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="quick-section">
              <div className="section-label">Quick start</div>
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
          <section className="study-pack" id="study-pack">
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
          <div className="section-label">Mentor</div>
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
              Ask mentor
            </button>
          </form>
        </section>

        {isLoading ? (
          <div className="loading-state">
            <selectedAgentCard.Icon size={24} />
            <strong>{selectedAgentCard.title} is building your workspace...</strong>
          </div>
        ) : null}
      </section>
    </main>
  );
}
