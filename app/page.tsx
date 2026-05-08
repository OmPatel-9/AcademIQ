"use client";

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
import { StudyProvider } from "./context/StudyContext";
import { useStudySession } from "./hooks/useStudySession";

function AppContent() {
  const ctx = useStudySession();
  const {
    account, authStatus, authMessage, theme, studyPack, selectedAgentCard,
    filteredSessions, currentSession, supabaseEnabled, activeNavLabel,
    subject, searchTerm, prompt, difficulty, learningStyle, citations,
    generateStudyPack, files, isLoading, error, selectedAgent, activeTab,
    quizAnswers, quizScore, mentorQuestion, isMentorLoading, streamingText,
    // Actions
    toggleTheme, startGoogleSignIn, startGuest, signOut, resetSession,
    selectSession, setSubject, setSearchTerm, setPrompt, setDifficulty,
    setLearningStyle, setCitations, setGenerateStudyPack, handleFiles,
    handleSubmit, setSelectedAgent, handleTabChange, setQuizAnswers,
    gradeQuiz, toggleProgress, createGoogleDoc, printStudyPack,
    setMentorQuestion, askMentor, handleNav, inviteByEmail
  } = ctx;

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
    <StudyProvider value={ctx}>
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
            <p className="info-banner" key={note}>{note}</p>
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
            streamingText={streamingText}
            studyPack={studyPack}
            onMentorQuestionChange={setMentorQuestion}
            onSubmit={askMentor}
          />

          {isLoading ? <WorkspaceLoading agent={selectedAgentCard} /> : null}
        </section>
      </main>
    </StudyProvider>
  );
}

export default function HomePage() {
  return <AppContent />;
}
