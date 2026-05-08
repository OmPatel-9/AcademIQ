"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AuthStatus, ChatMessage, Difficulty, Session, StudyPack, TabKey, UserAccount } from "../lib/types";
import type { StudyContextValue } from "../context/StudyContext";
import {
  agents,
  GOOGLE_ACCOUNT_KEY,
  GUEST_ACCOUNT_KEY,
  learningStyles,
  NAV_LABEL_TO_TAB,
  subjects,
  TAB_TO_NAV_LABEL,
  THEME_KEY
} from "../lib/constants";
import {
  clearOAuthUrl,
  guestSessionsKey,
  makeId,
  newSession,
  normalizeSessions,
  readAttachment,
  readJson,
  readStoredSessions
} from "../lib/client-utils";

export function useStudySession(): StudyContextValue {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [themeReady, setThemeReady] = useState(false);
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
  const [activeNavLabel, setActiveNavLabel] = useState("Home");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizScore, setQuizScore] = useState("");
  const [mentorQuestion, setMentorQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMentorLoading, setIsMentorLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState("");

  const pendingFilesRef = useRef<File[]>([]);

  const studyPack = currentSession.pack;
  const selectedAgentCard = useMemo(
    () => agents.find((agent) => agent.title === selectedAgent) || agents[0],
    [selectedAgent]
  );
  const filteredSessions = sessions.filter((session) =>
    `${session.title} ${session.pack?.topic || ""}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── Theme ──────────────────────────────────────────
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
    setThemeReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    if (themeReady) localStorage.setItem(THEME_KEY, theme);
  }, [theme, themeReady]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  // ─── Auth ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function restoreAccount() {
      setAuthStatus("checking");
      localStorage.removeItem(GOOGLE_ACCOUNT_KEY);

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
          if (!response.ok) throw new Error(profile.error || "Google sign-in could not be verified.");

          const expiresIn = Number(hash.get("expires_in") || "3600");
          const providerToken = hash.get("provider_token") || undefined;
          const nextAccount: UserAccount = {
            mode: "google",
            id: String(profile.id),
            name: String(profile.name || profile.email || "Google user"),
            email: String(profile.email || ""),
            avatarUrl: String(profile.avatarUrl || ""),
            accessToken,
            providerToken,
            refreshToken: hash.get("refresh_token") || undefined,
            expiresAt: Date.now() + Math.max(expiresIn - 60, 60) * 1000
          };

          sessionStorage.setItem(GOOGLE_ACCOUNT_KEY, JSON.stringify(nextAccount));
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

      const savedGoogle = readJson<UserAccount>(sessionStorage, GOOGLE_ACCOUNT_KEY);
      if (savedGoogle?.mode === "google" && savedGoogle.accessToken) {
        if (savedGoogle.expiresAt && savedGoogle.expiresAt <= Date.now()) {
          sessionStorage.removeItem(GOOGLE_ACCOUNT_KEY);
          setAuthMessage("Your Google session expired. Sign in again to see your saved chats.");
        } else if (!cancelled) {
          setAccount(savedGoogle);
          setAuthStatus("ready");
          return;
        }
      }

      const savedGuest = readJson<UserAccount>(sessionStorage, GUEST_ACCOUNT_KEY);
      if (savedGuest?.mode === "guest") setAccount(savedGuest);
      if (!cancelled) setAuthStatus("ready");
    }

    restoreAccount();
    return () => { cancelled = true; };
  }, []);

  // ─── Sessions ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadSessions() {
      if (!account) return;
      setError("");
      setQuizScore("");
      setQuizAnswers({});
      setSearchTerm("");
      setActiveNavLabel("Home");

      if (account.mode === "guest") {
        setSupabaseEnabled(false);
        const localSessions = readStoredSessions(sessionStorage, guestSessionsKey(account.id));
        if (!cancelled) {
          setSessions(localSessions);
          setCurrentSession(localSessions[0] || newSession(account.id));
          setActiveNavLabel(localSessions[0]?.pack ? "Study Packs" : "Home");
        }
        return;
      }

      if (!account.accessToken) return;

      try {
        const response = await fetch("/api/sessions", {
          headers: { Authorization: `Bearer ${account.accessToken}` }
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Saved chats could not be loaded.");

        if (!cancelled) {
          const cloudSessions = normalizeSessions(payload.sessions);
          setSupabaseEnabled(Boolean(payload.enabled));
          setSessions(cloudSessions);
          setCurrentSession(cloudSessions[0] || newSession(account.id));
          setActiveNavLabel(cloudSessions[0]?.pack ? "Study Packs" : "Home");
        }
      } catch (caughtError) {
        if (!cancelled) {
          setSupabaseEnabled(false);
          setSessions([]);
          setCurrentSession(newSession(account.id));
          setActiveNavLabel("Home");
          setError(caughtError instanceof Error ? caughtError.message : "Saved chats could not be loaded.");
        }
      }
    }

    loadSessions();
    return () => { cancelled = true; };
  }, [account]);

  // ─── Persist ────────────────────────────────────────
  const persistSession = useCallback(
    (nextSession: Session) => {
      if (!account) return;
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
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${account.accessToken}` },
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
    },
    [account]
  );

  // ─── Actions ────────────────────────────────────────
  const startGuest = useCallback(() => {
    const guestAccount: UserAccount = { mode: "guest", id: `guest:${makeId()}`, name: "Guest" };
    sessionStorage.setItem(GUEST_ACCOUNT_KEY, JSON.stringify(guestAccount));
    setAccount(guestAccount);
    setAuthMessage("");
    setSessions([]);
    setCurrentSession(newSession(guestAccount.id));
    setActiveNavLabel("Home");
  }, []);

  const startGoogleSignIn = useCallback(() => {
    window.location.href = "/api/auth/google/start";
  }, []);

  const signOut = useCallback(() => {
    if (account?.mode === "guest") sessionStorage.removeItem(guestSessionsKey(account.id));
    sessionStorage.removeItem(GUEST_ACCOUNT_KEY);
    sessionStorage.removeItem(GOOGLE_ACCOUNT_KEY);
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
    setActiveNavLabel("Home");
    setAuthStatus("ready");
  }, [account]);

  const resetSession = useCallback(() => {
    const fresh = newSession(account?.id || "guest");
    setPrompt("");
    setFiles([]);
    setCurrentSession(fresh);
    setError("");
    setQuizScore("");
    setQuizAnswers({});
    setActiveTab("professor");
    setActiveNavLabel("Home");
  }, [account]);

  const selectSession = useCallback((session: Session) => {
    setCurrentSession(session);
    setQuizScore("");
    setQuizAnswers({});
    setActiveTab("professor");
    setActiveNavLabel(session.pack ? "Study Packs" : "Home");
  }, []);

  const handleFiles = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(event.target.files || []));
  }, []);

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    setActiveNavLabel(TAB_TO_NAV_LABEL[tab] || "Study Packs");
  }, []);

  const handleNav = useCallback(
    (label: string) => {
      setActiveNavLabel(label);
      if (label === "Home") {
        resetSession();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (label === "Chat") {
        document.querySelector(".mentor-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      if (label === "History") {
        document.querySelector(".history-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      const tab = NAV_LABEL_TO_TAB[label];
      if (tab && studyPack) {
        setActiveTab(tab);
        document.getElementById("study-pack")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [resetSession, studyPack]
  );

  // Step 1: User submits the form → show difficulty modal
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmedPrompt = prompt.trim();
      if (!trimmedPrompt) {
        setError("Enter a topic or question before sending.");
        return;
      }
      setError("");
      setPendingPrompt(trimmedPrompt);
      pendingFilesRef.current = files;
      setShowDifficultyModal(true);
    },
    [prompt, files]
  );

  // Step 2: User picks difficulty → fire the API
  const confirmDifficulty = useCallback(
    async (chosenDifficulty: Difficulty) => {
      setShowDifficultyModal(false);
      setDifficulty(chosenDifficulty);
      setIsLoading(true);
      setError("");
      setQuizScore("");
      setQuizAnswers({});

      try {
        const attachments = await Promise.all(pendingFilesRef.current.map(readAttachment));
        const response = await fetch("/api/study-pack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: pendingPrompt,
            subject,
            difficulty: chosenDifficulty,
            learningStyle,
            citations,
            generateStudyPack,
            agent: selectedAgent,
            attachments
          })
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "AcademIQ could not generate a response.");

        const message: ChatMessage = { role: "user", content: pendingPrompt, createdAt: new Date().toISOString() };
        const assistant: ChatMessage = {
          role: "assistant",
          content: `I created a ${chosenDifficulty.toLowerCase()} study pack for ${payload.topic}.`,
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
        setPendingPrompt("");
        pendingFilesRef.current = [];
        setActiveTab("professor");
        setActiveNavLabel("Study Packs");
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
      } finally {
        setIsLoading(false);
      }
    },
    [pendingPrompt, subject, learningStyle, citations, generateStudyPack, selectedAgent, persistSession, currentSession, account]
  );

  const cancelDifficulty = useCallback(() => {
    setShowDifficultyModal(false);
    setPendingPrompt("");
    pendingFilesRef.current = [];
  }, []);

  const askMentor = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!studyPack || !mentorQuestion.trim()) return;

      setIsMentorLoading(true);
      setError("");
      setStreamingText("");
      setActiveNavLabel("Chat");

      try {
        const response = await fetch("/api/mentor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: mentorQuestion, pack: studyPack })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Mentor failed.");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream.");

        const decoder = new TextDecoder();
        let fullText = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.content) {
                fullText += data.content;
                setStreamingText(fullText);
              }
              if (data.done) break;
            } catch {
              // skip malformed
            }
          }
        }

        setStreamingText("");
        persistSession({
          ...currentSession,
          messages: [
            ...currentSession.messages,
            { role: "user", content: mentorQuestion, createdAt: new Date().toISOString() },
            { role: "assistant", content: fullText, createdAt: new Date().toISOString() }
          ]
        });
        setMentorQuestion("");
      } catch (caughtError) {
        setStreamingText("");
        setError(caughtError instanceof Error ? caughtError.message : "Mentor failed.");
      } finally {
        setIsMentorLoading(false);
      }
    },
    [studyPack, mentorQuestion, persistSession, currentSession]
  );

  const toggleProgress = useCallback(
    (topic: string) => {
      if (!studyPack) return;
      const learned = new Set(studyPack.learnedTopics);
      if (learned.has(topic)) learned.delete(topic);
      else learned.add(topic);
      const learnedTopics = Array.from(learned);
      const completionPercent = Math.round((learnedTopics.length / Math.max(studyPack.progressTopics.length, 1)) * 100);
      persistSession({ ...currentSession, pack: { ...studyPack, learnedTopics, completionPercent } });
    },
    [studyPack, persistSession, currentSession]
  );

  const gradeQuiz = useCallback(() => {
    if (!studyPack) return;
    const correct = studyPack.quiz.reduce((total, question, index) => {
      return total + (quizAnswers[index] === question.answer ? 1 : 0);
    }, 0);
    setQuizScore(`${correct}/${studyPack.quiz.length}`);
  }, [studyPack, quizAnswers]);

  const createGoogleDoc = useCallback(
    (section: string, markdown: string) => {
      if (!studyPack) return;
      const token = account?.providerToken;
      if (!token) {
        setError("Google Docs export requires signing in with Google. Sign out and sign in again to grant access.");
        return;
      }
      setError("");
      fetch("/api/google-doc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: `[${section}] ${studyPack.topic}`, markdown })
      })
        .then(async (response) => {
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error || "Google Docs export failed.");
          persistSession({
            ...currentSession,
            pack: { ...studyPack, googleDocs: { ...studyPack.googleDocs, [section]: payload.url } }
          });
        })
        .catch((caughtError) => {
          setError(caughtError instanceof Error ? caughtError.message : "Google Docs export failed.");
        });
    },
    [studyPack, account, persistSession, currentSession]
  );

  const printStudyPack = useCallback(() => window.print(), []);
  const inviteByEmail = useCallback(() => {
    window.location.href = "mailto:?subject=Join me on AcademIQ&body=I am using AcademIQ for studying.";
  }, []);

  return {
    // State
    theme,
    account,
    authStatus,
    authMessage,
    subject,
    prompt,
    difficulty,
    learningStyle,
    citations,
    generateStudyPack,
    selectedAgent,
    files,
    sessions,
    currentSession,
    activeTab,
    activeNavLabel,
    quizAnswers,
    quizScore,
    mentorQuestion,
    isMentorLoading,
    streamingText,
    isLoading,
    error,
    searchTerm,
    supabaseEnabled,
    showDifficultyModal,
    pendingPrompt,

    // Derived
    studyPack,
    filteredSessions,
    selectedAgentCard,

    // Actions
    toggleTheme,
    startGuest,
    startGoogleSignIn,
    signOut,
    resetSession,
    selectSession,
    setSubject,
    setPrompt,
    setDifficulty,
    setLearningStyle,
    setCitations,
    setGenerateStudyPack,
    setSelectedAgent,
    handleFiles,
    handleTabChange,
    handleNav,
    setQuizAnswers,
    gradeQuiz,
    setMentorQuestion,
    askMentor,
    handleSubmit,
    setSearchTerm,
    toggleProgress,
    createGoogleDoc,
    printStudyPack,
    inviteByEmail,
    confirmDifficulty,
    cancelDifficulty
  };
}
