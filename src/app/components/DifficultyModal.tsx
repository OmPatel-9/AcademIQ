"use client";

import { BookOpen, GraduationCap, Rocket } from "lucide-react";
import type { Difficulty } from "../lib/types";

type DifficultyModalProps = {
  topic: string;
  onSelect: (difficulty: Difficulty) => void;
  onCancel: () => void;
};

const options: { level: Difficulty; Icon: typeof BookOpen; label: string; description: string }[] = [
  {
    level: "Beginner",
    Icon: BookOpen,
    label: "Beginner",
    description: "Simple language, foundational concepts, lots of examples"
  },
  {
    level: "Intermediate",
    Icon: GraduationCap,
    label: "Intermediate",
    description: "Deeper analysis, connections between ideas, moderate complexity"
  },
  {
    level: "Advanced",
    Icon: Rocket,
    label: "Advanced",
    description: "Expert-level depth, edge cases, research-oriented content"
  }
];

export function DifficultyModal({ topic, onSelect, onCancel }: DifficultyModalProps) {
  return (
    <div className="difficulty-overlay" onClick={onCancel}>
      <div className="difficulty-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Choose your level</h2>
        <p className="difficulty-topic">
          Generating a study pack for <strong>{topic}</strong>
        </p>
        <div className="difficulty-options">
          {options.map(({ level, Icon, label, description }) => (
            <button
              key={level}
              className="difficulty-option"
              onClick={() => onSelect(level)}
            >
              <Icon size={28} />
              <span className="difficulty-option-label">{label}</span>
              <span className="difficulty-option-desc">{description}</span>
            </button>
          ))}
        </div>
        <button className="difficulty-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
