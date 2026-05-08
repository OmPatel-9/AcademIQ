import {
  Activity,
  BookOpen,
  Briefcase,
  CheckCircle2,
  History,
  Home,
  Layers,
  Library,
  ListChecks,
  Map,
  MessageCircle,
  Package,
  PencilRuler,
  Route,
  Settings,
  UserCircle
} from "lucide-react";
import type { AgentCard, Difficulty, NavItem, TabKey } from "./types";

export const navItems: NavItem[] = [
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

export const agents: AgentCard[] = [
  { title: "Professor", role: "Core lesson and explanations", Icon: BookOpen },
  { title: "Academic Advisor", role: "Learning path and milestones", Icon: Route },
  { title: "Research Librarian", role: "Resources and citations", Icon: Library },
  { title: "Teaching Assistant", role: "Practice and worked solutions", Icon: PencilRuler },
  { title: "Flashcard Agent", role: "Recall cards for review", Icon: Layers },
  { title: "Project Idea Agent", role: "Portfolio-ready project prompts", Icon: Briefcase },
  { title: "Quiz Generator", role: "Checks and explanations", Icon: CheckCircle2 },
  { title: "Mentor Agent", role: "Follow-up tutoring", Icon: MessageCircle }
];

export const tabs: { key: TabKey; label: string }[] = [
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

export const quickStarts = [
  "Generate a complete study pack on Python",
  "Create a beginner roadmap for machine learning",
  "Quiz me on networking fundamentals",
  "Make flashcards from my uploaded notes"
];

export const subjects = [
  "General Tutor",
  "Computer Science",
  "Mathematics",
  "Data Science",
  "Writing Coach",
  "Business",
  "Exam Prep"
];

export const learningStyles = ["Step-by-step", "Visual", "Socratic", "Practice-first"];
export const difficulties: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

export const GOOGLE_ACCOUNT_KEY = "academiq_google_account_v1";
export const GUEST_ACCOUNT_KEY = "academiq_guest_account_v1";
export const THEME_KEY = "academiq_theme_v1";
export const BRAND_LOGO_SRC = "/logo.png";

export const NAV_LABEL_TO_TAB: Partial<Record<string, TabKey>> = {
  "Study Packs": "professor",
  Roadmaps: "roadmap",
  Resources: "resources",
  Practice: "practice",
  Flashcards: "flashcards",
  Projects: "projects",
  Quizzes: "quiz"
};

export const TAB_TO_NAV_LABEL: Partial<Record<TabKey, string>> = {
  professor: "Study Packs",
  roadmap: "Roadmaps",
  resources: "Resources",
  practice: "Practice",
  quiz: "Quizzes",
  projects: "Projects",
  flashcards: "Flashcards"
};
