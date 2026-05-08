"use client";

import { useState } from "react";
import type { FlashcardItem } from "../lib/types";

type FlashcardGridProps = {
  cards: FlashcardItem[];
  topic: string;
};

export function FlashcardGrid({ cards, topic }: FlashcardGridProps) {
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  return (
    <div className="flashcard-grid">
      {cards.map((card, index) => {
        const isFlipped = Boolean(flippedCards[index]);
        return (
          <button
            aria-label={`${isFlipped ? "Back" : "Front"} of flashcard ${index + 1}`}
            aria-pressed={isFlipped}
            className={`flashcard ${isFlipped ? "flipped" : ""}`}
            key={`${card.front}-${index}`}
            onClick={() => setFlippedCards((current) => ({ ...current, [index]: !isFlipped }))}
            type="button"
          >
            <span className="flashcard-side">{isFlipped ? "Back" : "Front"}</span>
            <strong>{isFlipped ? card.back : card.front}</strong>
            <small>{card.tags || topic}</small>
          </button>
        );
      })}
    </div>
  );
}
