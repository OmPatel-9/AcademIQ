"use client";

import type { FormEvent } from "react";
import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import type { ChatMessage, StudyPack } from "../lib/types";
import { MarkdownBlock } from "./MarkdownBlock";

type MentorChatProps = {
  isMentorLoading: boolean;
  mentorQuestion: string;
  messages: ChatMessage[];
  streamingText: string;
  studyPack: StudyPack | null;
  onMentorQuestionChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function MentorChat({
  isMentorLoading,
  mentorQuestion,
  messages,
  streamingText,
  studyPack,
  onMentorQuestionChange,
  onSubmit
}: MentorChatProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  return (
    <section className="mentor-panel">
      <div className="section-label">Mentor</div>
      <div className="chat-log" ref={logRef}>
        {messages.map((message, index) => (
          <div className={`chat-message ${message.role}`} key={`${message.createdAt}-${index}`}>
            <strong>{message.role === "user" ? "You" : "AcademIQ"}</strong>
            {message.role === "assistant" ? (
              <MarkdownBlock>{message.content}</MarkdownBlock>
            ) : (
              <p>{message.content}</p>
            )}
          </div>
        ))}
        {streamingText ? (
          <div className="chat-message assistant streaming">
            <strong>AcademIQ</strong>
            <MarkdownBlock>{streamingText}</MarkdownBlock>
          </div>
        ) : null}
        {isMentorLoading && !streamingText ? (
          <div className="chat-message assistant">
            <strong>AcademIQ</strong>
            <p className="typing-indicator">Thinking...</p>
          </div>
        ) : null}
      </div>
      <form className="mentor-form" onSubmit={onSubmit}>
        <input
          disabled={!studyPack || isMentorLoading}
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
