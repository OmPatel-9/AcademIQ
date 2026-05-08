"use client";

import type { FormEvent } from "react";
import { Sparkles } from "lucide-react";
import type { ChatMessage, StudyPack } from "../lib/types";

type MentorChatProps = {
  isMentorLoading: boolean;
  mentorQuestion: string;
  messages: ChatMessage[];
  studyPack: StudyPack | null;
  onMentorQuestionChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function MentorChat({
  isMentorLoading,
  mentorQuestion,
  messages,
  studyPack,
  onMentorQuestionChange,
  onSubmit
}: MentorChatProps) {
  return (
    <section className="mentor-panel">
      <div className="section-label">Mentor</div>
      <div className="chat-log">
        {messages.map((message, index) => (
          <div className={`chat-message ${message.role}`} key={`${message.createdAt}-${index}`}>
            <strong>{message.role === "user" ? "You" : "AcademIQ"}</strong>
            <p>{message.content}</p>
          </div>
        ))}
      </div>
      <form className="mentor-form" onSubmit={onSubmit}>
        <input
          disabled={!studyPack}
          placeholder={studyPack ? "Ask a follow-up question..." : "Generate a study pack to unlock follow-up mentoring."}
          value={mentorQuestion}
          onChange={(event) => onMentorQuestionChange(event.target.value)}
        />
        <button className="primary-button inline" disabled={!studyPack || isMentorLoading} type="submit">
          <Sparkles size={17} />
          Ask mentor
        </button>
      </form>
    </section>
  );
}
