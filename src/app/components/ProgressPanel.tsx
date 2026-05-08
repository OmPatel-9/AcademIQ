"use client";

import type { StudyPack } from "../lib/types";

type ProgressPanelProps = {
  studyPack: StudyPack;
  onToggleProgress: (topic: string) => void;
};

export function ProgressPanel({ studyPack, onToggleProgress }: ProgressPanelProps) {
  return (
    <div className="progress-panel">
      <div className="progress-bar">
        <span style={{ width: `${studyPack.completionPercent}%` }} />
      </div>
      <strong>{studyPack.completionPercent}% complete</strong>
      {studyPack.progressTopics.map((topic) => (
        <label className="progress-item" key={topic}>
          <input
            checked={studyPack.learnedTopics.includes(topic)}
            onChange={() => onToggleProgress(topic)}
            type="checkbox"
          />
          <span>{topic}</span>
        </label>
      ))}
    </div>
  );
}
