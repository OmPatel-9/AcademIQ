"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { AgentSection } from "./components/AgentSection";
import { LandingScreen } from "./components/LandingScreen";
import { LoadingScreen } from "./components/LoadingScreen";
import { MentorChat } from "./components/MentorChat";
import { PackHeader } from "./components/PackHeader";
import { PromptPanel } from "./components/PromptPanel";
import { QuickStartSection } from "./components/QuickStartSection";
import { Sidebar } from "./components/Sidebar";
import { StudyPackTabs } from "./components/StudyPackTabs";
import { Topbar } from "./components/Topbar";
import { WelcomeHero } from "./components/WelcomeHero";
import { WorkspaceLoading } from "./components/WorkspaceLoading";
import {
  agents,
  GOOGLE_ACCOUNT_KEY,
  GUEST_ACCOUNT_KEY,
  learningStyles,
  NAV_LABEL_TO_TAB,
  subjects,
  TAB_TO_NAV_LABEL,
  THEME_KEY
} from "./lib/constants";
import {
  clearOAuthUrl,
  guestSessionsKey,
  makeId,
  newSession,
  normalizeSessions,
  readAttachment,
  readJson,
  readStoredSessions
} from "./lib/client-utils";
import type { AuthStatus, ChatMessage, Difficulty, Session, StudyPack, TabKey, UserAccount } from "./lib/types";

export default function HomePage() {
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
    if (themeReady) {
      localStorage.setItem(THEME_KEY, theme);
    }
  }, [theme, themeReady]);

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
    setActiveNavLabel("Home");
  }

  function startGoogleSignIn() {
    window.location.href = "/api/auth/google/start";
  }

  function signOut() {
    if (account?.mode === "guest") {
      sessionStorage.removeItem(guestSessionsKey(account.id));
    }
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
    setActiveNavLabel("Home");
  }

  function selectSession(session: Session) {
    setCurrentSession(session);
    setQuizScore("");
    setQuizAnswers({});
    setActiveTab("professor");
    setActiveNavLabel(session.pack ? "Study Packs" : "Home");
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files || []));
  }

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    setActiveNavLabel(TAB_TO_NAV_LABEL[tab] || "Study Packs");
  }

  function handleNav(label: string) {
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
      setActiveNavLabel("Study Packs");
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
    setActiveNavLabel("Chat");
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

  function createGoogleDoc(section: string, markdown: string) {
    if (!studyPack) {
      return;
    }
    setError("");
    fetch("/api/google-doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `[${section}] ${studyPack.topic}`, markdown })
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Google Docs export failed.");
        }
        persistSession({
          ...currentSession,
          pack: {
            ...studyPack,
            googleDocs: { ...studyPack.googleDocs, [section]: payload.url }
          }
        });
      })
      .catch((caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : "Google Docs export failed.");
      });
  }

  function printStudyPack() {
    window.print();
  }

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  function inviteByEmail() {
    window.location.href = "mailto:?subject=Join me on AcademIQ&body=I am using AcademIQ for studying.";
  }

  if (authStatus === "checking" || authStatus === "loading") {
    return <LoadingScreen authStatus={authStatus} theme={theme} />;
  }

  if (!account) {
    return (
      <LandingScreen
        authMessage={authMessage}
        theme={theme}
        onGoogleSignIn={startGoogleSignIn}
        onGuestStart={startGuest}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <main className={`app-shell ${theme}`}>
      <Sidebar
        account={account}
        activeNavLabel={activeNavLabel}
        currentSessionId={currentSession.id}
        sessions={filteredSessions}
        supabaseEnabled={supabaseEnabled}
        onNavigate={handleNav}
        onSelectSession={selectSession}
      />

      <section className="workspace">
        <Topbar
          subject={subject}
          searchTerm={searchTerm}
          theme={theme}
          onSubjectChange={setSubject}
          onSearchChange={setSearchTerm}
          onInvite={inviteByEmail}
          onToggleTheme={toggleTheme}
          onSignOut={signOut}
          onNewSession={resetSession}
        />

        {!studyPack ? <WelcomeHero name={account.name} /> : <PackHeader studyPack={studyPack} quizScore={quizScore} />}

        <PromptPanel
          citations={citations}
          difficulty={difficulty}
          files={files}
          generateStudyPack={generateStudyPack}
          isLoading={isLoading}
          learningStyle={learningStyle}
          prompt={prompt}
          onCitationsChange={setCitations}
          onDifficultyChange={setDifficulty}
          onFilesChange={handleFiles}
          onGenerateStudyPackChange={setGenerateStudyPack}
          onLearningStyleChange={setLearningStyle}
          onPromptChange={setPrompt}
          onSubmit={handleSubmit}
        />

        {error ? <p className="error-banner">{error}</p> : null}
        {studyPack?.integrationNotes.map((note) => (
          <p className="info-banner" key={note}>
            {note}
          </p>
        ))}

        {!studyPack ? (
          <>
            <AgentSection selectedAgent={selectedAgent} onSelectAgent={setSelectedAgent} />
            <QuickStartSection onPickPrompt={setPrompt} />
          </>
        ) : (
          <StudyPackTabs
            activeTab={activeTab}
            quizAnswers={quizAnswers}
            quizScore={quizScore}
            studyPack={studyPack}
            onCreateGoogleDoc={createGoogleDoc}
            onGradeQuiz={gradeQuiz}
            onPrint={printStudyPack}
            onQuizAnswer={(index, choice) => setQuizAnswers((current) => ({ ...current, [index]: choice }))}
            onTabChange={handleTabChange}
            onToggleProgress={toggleProgress}
          />
        )}

        <MentorChat
          isMentorLoading={isMentorLoading}
          mentorQuestion={mentorQuestion}
          messages={currentSession.messages}
          studyPack={studyPack}
          onMentorQuestionChange={setMentorQuestion}
          onSubmit={askMentor}
        />

        {isLoading ? <WorkspaceLoading agent={selectedAgentCard} /> : null}
      </section>
    </main>
  );
}
