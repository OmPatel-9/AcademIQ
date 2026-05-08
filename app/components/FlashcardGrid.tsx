"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, Shuffle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import type { FlashcardItem } from "../lib/types";

type CardState = {
  index: number;
  easeFactor: number;
  interval: number;
  repetitions: number;
  bucket: "new" | "learning" | "known";
};

type FlashcardGridProps = {
  cards: FlashcardItem[];
  topic: string;
};

function initCardStates(count: number): CardState[] {
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    bucket: "new" as const
  }));
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function FlashcardGrid({ cards, topic }: FlashcardGridProps) {
  const [mode, setMode] = useState<"grid" | "study">("grid");
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [cardStates, setCardStates] = useState<CardState[]>(() => initCardStates(cards.length));
  const [studyOrder, setStudyOrder] = useState<number[]>(() => cards.map((_, i) => i));
  const [studyIndex, setStudyIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const stats = useMemo(() => {
    const known = cardStates.filter((c) => c.bucket === "known").length;
    const learning = cardStates.filter((c) => c.bucket === "learning").length;
    const fresh = cardStates.filter((c) => c.bucket === "new").length;
    return { known, learning, new: fresh, total: cards.length };
  }, [cardStates, cards.length]);

  const currentCardIndex = studyOrder[studyIndex] ?? 0;
  const currentCard = cards[currentCardIndex];

  const rateCard = useCallback(
    (quality: number) => {
      // SM-2 simplified: quality 0-2 = fail, 3 = hard, 4 = good, 5 = easy
      setCardStates((prev) => {
        const updated = [...prev];
        const state = { ...updated[currentCardIndex] };

        if (quality >= 3) {
          state.repetitions += 1;
          state.interval = state.repetitions === 1 ? 1 : state.repetitions === 2 ? 6 : Math.round(state.interval * state.easeFactor);
          state.bucket = state.repetitions >= 2 ? "known" : "learning";
        } else {
          state.repetitions = 0;
          state.interval = 0;
          state.bucket = "learning";
        }

        state.easeFactor = Math.max(1.3, state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
        updated[currentCardIndex] = state;
        return updated;
      });

      setIsFlipped(false);

      if (studyIndex < studyOrder.length - 1) {
        setStudyIndex((i) => i + 1);
      } else {
        // Cycle back to cards that aren't "known"
        const remaining = cardStates
          .filter((c) => c.bucket !== "known" || c.index === currentCardIndex)
          .map((c) => c.index);
        if (remaining.length > 0 && !(remaining.length === 1 && cardStates[remaining[0]].bucket === "known")) {
          setStudyOrder(shuffleArray(remaining));
          setStudyIndex(0);
        } else {
          setMode("grid");
        }
      }
    },
    [currentCardIndex, studyIndex, studyOrder.length, cardStates]
  );

  function startStudy() {
    const order = shuffleArray(cards.map((_, i) => i));
    setStudyOrder(order);
    setStudyIndex(0);
    setIsFlipped(false);
    setMode("study");
  }

  function resetProgress() {
    setCardStates(initCardStates(cards.length));
    setFlippedCards({});
    setMode("grid");
  }

  if (mode === "study" && currentCard) {
    return (
      <div className="flashcard-study">
        <div className="study-topbar">
          <button className="soft-button" onClick={() => setMode("grid")} type="button">
            <ChevronLeft size={16} /> Back to grid
          </button>
          <span className="study-progress-text">
            {studyIndex + 1} / {studyOrder.length}
          </span>
        </div>

        <div className="study-stats-bar">
          <span className="stat-chip known">{stats.known} known</span>
          <span className="stat-chip learning">{stats.learning} learning</span>
          <span className="stat-chip new">{stats.new} new</span>
        </div>

        <div className="study-progress-bar">
          <span style={{ width: `${Math.round((stats.known / stats.total) * 100)}%` }} />
        </div>

        <button
          className={`study-card ${isFlipped ? "flipped" : ""}`}
          onClick={() => setIsFlipped((f) => !f)}
          type="button"
          aria-label={isFlipped ? "Showing answer" : "Showing question — click to reveal"}
        >
          <span className="flashcard-side">{isFlipped ? "Answer" : "Question"}</span>
          <strong>{isFlipped ? currentCard.back : currentCard.front}</strong>
          {!isFlipped && <small className="flip-hint">Click to reveal answer</small>}
          <small>{currentCard.tags || topic}</small>
        </button>

        {isFlipped && (
          <div className="study-actions">
            <button className="rate-button again" onClick={() => rateCard(1)} type="button">
              <XCircle size={16} /> Again
            </button>
            <button className="rate-button hard" onClick={() => rateCard(3)} type="button">
              Hard
            </button>
            <button className="rate-button good" onClick={() => rateCard(4)} type="button">
              Good
            </button>
            <button className="rate-button easy" onClick={() => rateCard(5)} type="button">
              <CheckCircle2 size={16} /> Easy
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flashcard-container">
      <div className="flashcard-toolbar">
        <button className="primary-button inline" onClick={startStudy} type="button">
          <Shuffle size={16} /> Study mode
        </button>
        {stats.known > 0 && (
          <button className="soft-button" onClick={resetProgress} type="button">
            <RotateCcw size={16} /> Reset
          </button>
        )}
        <div className="flashcard-stats">
          <span className="stat-chip known">{stats.known} known</span>
          <span className="stat-chip learning">{stats.learning} learning</span>
          <span className="stat-chip new">{stats.new} new</span>
        </div>
      </div>

      <div className="flashcard-grid">
        {cards.map((card, index) => {
          const flipped = Boolean(flippedCards[index]);
          const state = cardStates[index];
          return (
            <button
              aria-label={`${flipped ? "Back" : "Front"} of flashcard ${index + 1}`}
              aria-pressed={flipped}
              className={`flashcard ${flipped ? "flipped" : ""} ${state?.bucket === "known" ? "card-known" : ""} ${state?.bucket === "learning" ? "card-learning" : ""}`}
              key={`${card.front}-${index}`}
              onClick={() => setFlippedCards((current) => ({ ...current, [index]: !flipped }))}
              type="button"
            >
              <span className="flashcard-side">{flipped ? "Back" : "Front"}</span>
              <strong>{flipped ? card.back : card.front}</strong>
              <div className="flashcard-footer">
                <small>{card.tags || topic}</small>
                {state?.bucket !== "new" && (
                  <small className={`bucket-badge ${state?.bucket}`}>
                    {state?.bucket === "known" ? "Known" : "Learning"}
                  </small>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
