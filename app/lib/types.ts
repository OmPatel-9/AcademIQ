import type { LucideIcon } from "lucide-react";

export type ThemeMode = "light" | "dark";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type AuthStatus = "checking" | "loading" | "ready";
export type AccountMode = "guest" | "google";
export type TabKey =
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

export type UserAccount = {
  mode: AccountMode;
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
};

export type AttachmentPayload = {
  name: string;
  type: string;
  size: number;
  content?: string;
};

export type ResourceItem = {
  title: string;
  type: string;
  why: string;
  citation: string;
};

export type VideoItem = {
  title: string;
  channel: string;
  url: string;
};

export type QuizItem = {
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
};

export type FlashcardItem = {
  front: string;
  back: string;
  tags?: string;
};

export type StudyPack = {
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

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type Session = {
  id: string;
  userId: string;
  title: string;
  pack: StudyPack | null;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

export type NavItem = {
  label: string;
  Icon: LucideIcon;
};

export type AgentCard = {
  title: string;
  role: string;
  Icon: LucideIcon;
};
