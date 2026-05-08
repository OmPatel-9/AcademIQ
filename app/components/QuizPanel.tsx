"use client";

import type { QuizItem } from "../lib/types";

type QuizPanelProps = {
  quiz: QuizItem[];
  quizAnswers: Record<number, string>;
  quizScore: string;
  onAnswer: (index: number, choice: string) => void;
  onGrade: () => void;
};

export function QuizPanel({ quiz, quizAnswers, quizScore, onAnswer, onGrade }: QuizPanelProps) {
  return (
    <div className="quiz-list">
      {quiz.map((question, index) => (
        <fieldset key={question.question}>
          <legend>
            {index + 1}. {question.question}
          </legend>
          {question.choices.map((choice) => (
            <label key={choice}>
              <input
                checked={quizAnswers[index] === choice}
                name={`quiz-${index}`}
                onChange={() => onAnswer(index, choice)}
                type="radio"
              />
              <span>{choice}</span>
            </label>
          ))}
          {quizScore ? (
            <p className="muted">
              Answer: {question.answer}. {question.explanation}
            </p>
          ) : null}
        </fieldset>
      ))}
      <div className="inline-actions">
        <button className="primary-button inline" onClick={onGrade} type="button">
          Grade quiz
        </button>
        {quizScore ? <strong className="score-pill">Score: {quizScore}</strong> : null}
      </div>
    </div>
  );
}
