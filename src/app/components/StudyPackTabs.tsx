"use client";

import { tabs } from "../lib/constants";
import type { StudyPack, TabKey } from "../lib/types";
import { ExportsPanel } from "./ExportsPanel";
import { FlashcardGrid } from "./FlashcardGrid";
import { ListBlock } from "./ListBlock";
import { MarkdownBlock } from "./MarkdownBlock";
import { MindMapPanel } from "./MindMapPanel";
import { ProgressPanel } from "./ProgressPanel";
import { QuizPanel } from "./QuizPanel";
import { ResourcesPanel } from "./ResourcesPanel";

type StudyPackTabsProps = {
  activeTab: TabKey;
  quizAnswers: Record<number, string>;
  quizScore: string;
  studyPack: StudyPack;
  onCreateGoogleDoc: (section: string, markdown: string) => void;
  onGradeQuiz: () => void;
  onPrint: () => void;
  onQuizAnswer: (index: number, choice: string) => void;
  onTabChange: (tab: TabKey) => void;
  onToggleProgress: (topic: string) => void;
};

export function StudyPackTabs({
  activeTab,
  quizAnswers,
  quizScore,
  studyPack,
  onCreateGoogleDoc,
  onGradeQuiz,
  onPrint,
  onQuizAnswer,
  onTabChange,
  onToggleProgress
}: StudyPackTabsProps) {
  return (
    <section className="study-pack" id="study-pack">
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            className={activeTab === tab.key ? "active" : ""}
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-panel">
        <StudyPackTabContent
          activeTab={activeTab}
          quizAnswers={quizAnswers}
          quizScore={quizScore}
          studyPack={studyPack}
          onCreateGoogleDoc={onCreateGoogleDoc}
          onGradeQuiz={onGradeQuiz}
          onPrint={onPrint}
          onQuizAnswer={onQuizAnswer}
          onToggleProgress={onToggleProgress}
        />
      </div>
    </section>
  );
}

type StudyPackTabContentProps = Omit<StudyPackTabsProps, "onTabChange">;

function StudyPackTabContent({
  activeTab,
  quizAnswers,
  quizScore,
  studyPack,
  onCreateGoogleDoc,
  onGradeQuiz,
  onPrint,
  onQuizAnswer,
  onToggleProgress
}: StudyPackTabContentProps) {
  if (activeTab === "professor") {
    return <MarkdownBlock>{studyPack.professor}</MarkdownBlock>;
  }
  if (activeTab === "roadmap") {
    return <MarkdownBlock>{studyPack.advisor}</MarkdownBlock>;
  }
  if (activeTab === "resources") {
    return <ResourcesPanel studyPack={studyPack} />;
  }
  if (activeTab === "practice") {
    return <MarkdownBlock>{studyPack.assistant}</MarkdownBlock>;
  }
  if (activeTab === "quiz") {
    return (
      <QuizPanel
        quiz={studyPack.quiz}
        quizAnswers={quizAnswers}
        quizScore={quizScore}
        onAnswer={onQuizAnswer}
        onGrade={onGradeQuiz}
      />
    );
  }
  if (activeTab === "progress") {
    return <ProgressPanel studyPack={studyPack} onToggleProgress={onToggleProgress} />;
  }
  if (activeTab === "projects") {
    return <ListBlock items={studyPack.projects} empty="No projects generated yet." />;
  }
  if (activeTab === "flashcards") {
    return <FlashcardGrid cards={studyPack.flashcards} topic={studyPack.topic} />;
  }
  if (activeTab === "mindmap") {
    return <MindMapPanel studyPack={studyPack} />;
  }
  if (activeTab === "exports") {
    return <ExportsPanel studyPack={studyPack} onCreateGoogleDoc={onCreateGoogleDoc} onPrint={onPrint} showGoogleDocs={false} />;
  }
  return <ExportsPanel studyPack={studyPack} onCreateGoogleDoc={onCreateGoogleDoc} onPrint={onPrint} showGoogleDocs />;
}
