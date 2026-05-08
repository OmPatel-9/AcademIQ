"use client";

import type { ChangeEvent, FormEvent } from "react";
import { Paperclip, Send } from "lucide-react";
import { learningStyles } from "../lib/constants";

type PromptPanelProps = {
  citations: boolean;
  files: File[];
  generateStudyPack: boolean;
  isLoading: boolean;
  learningStyle: string;
  prompt: string;
  onCitationsChange: (value: boolean) => void;
  onFilesChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onGenerateStudyPackChange: (value: boolean) => void;
  onLearningStyleChange: (value: string) => void;
  onPromptChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function PromptPanel({
  citations,
  files,
  generateStudyPack,
  isLoading,
  learningStyle,
  prompt,
  onCitationsChange,
  onFilesChange,
  onGenerateStudyPackChange,
  onLearningStyleChange,
  onPromptChange,
  onSubmit
}: PromptPanelProps) {
  return (
    <form className="prompt-panel" onSubmit={onSubmit}>
      <textarea
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        placeholder="Enter a topic, question, or pasted notes."
        aria-label="Learning request"
      />

      <div className="prompt-controls">
        <label className="attach-control">
          <Paperclip size={17} />
          <span>{files.length ? `${files.length} attached` : "Attach"}</span>
          <input type="file" multiple accept=".txt,.md,.csv,.json,.pdf" onChange={onFilesChange} />
        </label>

        <label className="compact-select">
          <span>Learning style</span>
          <select value={learningStyle} onChange={(event) => onLearningStyleChange(event.target.value)}>
            {learningStyles.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="check-control">
          <input checked={citations} onChange={(event) => onCitationsChange(event.target.checked)} type="checkbox" />
          <span>Citations</span>
        </label>

        <label className="check-control">
          <input
            checked={generateStudyPack}
            onChange={(event) => onGenerateStudyPackChange(event.target.checked)}
            type="checkbox"
          />
          <span>Study pack</span>
        </label>

        <button className="send-button" type="submit" aria-label="Send learning request" disabled={isLoading}>
          <Send size={18} />
        </button>
      </div>
    </form>
  );
}
