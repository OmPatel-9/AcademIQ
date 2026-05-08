"use client";

import { createContext, useContext } from "react";
import type { AgentCard, Difficulty, Session, StudyPack, TabKey, UserAccount } from "../lib/types";

export type StudyState = {
  account: UserAccount | null;
  authStatus: "checking" | "loading" | "ready";
  authMessage: string;
  theme: "light" | "dark";
  sessions: Session[];
  currentSession: Session;
  supabaseEnabled: boolean;
  subject: string;
  prompt: string;
  difficulty: Difficulty;
  learningStyle: string;
  citations: boolean;
  generateStudyPack: boolean;
  selectedAgent: string;
  files: File[];
  activeTab: TabKey;
  activeNavLabel: string;
  quizAnswers: Record<number, string>;
  quizScore: string;
  mentorQuestion: string;
  isMentorLoading: boolean;
  streamingText: string;
  isLoading: boolean;
  error: string;
  searchTerm: string;
};

export type StudyActions = {
  startGuest: () => void;
  startGoogleSignIn: () => void;
  signOut: () => void;
  toggleTheme: () => void;
  resetSession: () => void;
  selectSession: (session: Session) => void;
  setSubject: (value: string) => void;
  setPrompt: (value: string) => void;
  setDifficulty: (value: Difficulty) => void;
  setLearningStyle: (value: string) => void;
  setCitations: (value: boolean) => void;
  setGenerateStudyPack: (value: boolean) => void;
  setSelectedAgent: (value: string) => void;
  handleFiles: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleTabChange: (tab: TabKey) => void;
  handleNav: (label: string) => void;
  setQuizAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  gradeQuiz: () => void;
  setMentorQuestion: (value: string) => void;
  askMentor: (event: React.FormEvent<HTMLFormElement>) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  setSearchTerm: (value: string) => void;
  toggleProgress: (topic: string) => void;
  createGoogleDoc: (section: string, markdown: string) => void;
  printStudyPack: () => void;
  inviteByEmail: () => void;
};

export type StudyContextValue = StudyState & StudyActions & {
  studyPack: StudyPack | null;
  filteredSessions: Session[];
  selectedAgentCard: AgentCard;
};

const StudyContext = createContext<StudyContextValue | null>(null);

export function StudyProvider({ children, value }: { children: React.ReactNode; value: StudyContextValue }) {
  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error("useStudy must be used inside StudyProvider");
  return ctx;
}

export function useAuth() {
  const { account, authStatus, authMessage, startGuest, startGoogleSignIn, signOut } = useStudy();
  return { account, authStatus, authMessage, startGuest, startGoogleSignIn, signOut };
}

export function useThemeContext() {
  const { theme, toggleTheme } = useStudy();
  return { theme, toggleTheme };
}

export function useStudyPack() {
  const {
    studyPack, currentSession, activeTab, quizAnswers, quizScore,
    handleTabChange, setQuizAnswers, gradeQuiz, toggleProgress,
    createGoogleDoc, printStudyPack
  } = useStudy();
  return {
    studyPack, currentSession, activeTab, quizAnswers, quizScore,
    handleTabChange, setQuizAnswers, gradeQuiz, toggleProgress,
    createGoogleDoc, printStudyPack
  };
}

export function useMentor() {
  const { mentorQuestion, isMentorLoading, streamingText, studyPack, setMentorQuestion, askMentor } = useStudy();
  return { mentorQuestion, isMentorLoading, streamingText, studyPack, setMentorQuestion, askMentor };
}
