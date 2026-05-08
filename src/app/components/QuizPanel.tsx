"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { QuizItem } from "../lib/types";

type QuizPanelProps = {
  quiz: QuizItem[];
  quizAnswers: Record<number, string>;
  quizScore: string;
  onAnswer: (index: number, choice: string) => void;
  onGrade: () => void;
};

export function QuizPanel({ quiz, quizAnswers, quizScore, onAnswer, onGrade }: QuizPanelProps) {
  const [revealedExplanations, setRevealedExplanations] = useState<Record<number, boolean>>({});
  const isGraded = Boolean(quizScore);

  function isCorrect(index: number) {
    return quizAnswers[index] === quiz[index]?.answer;
  }

  function toggleExplanation(index: number) {
    setRevealedExplanations((current) => ({ ...current, [index]: !current[index] }));
  }

  return (
    <div className="quiz-list">
      <div className="quiz-header">
        <strong>{quiz.length} Questions</strong>
        {isGraded ? (
          <span className="quiz-summary">
            {quiz.filter((_, i) => isCorrect(i)).length} correct, {quiz.filter((_, i) => !isCorrect(i) && quizAnswers[i]).length} incorrect,{" "}
            {quiz.filter((_, i) => !quizAnswers[i]).length} unanswered
          </span>
        ) : (
          <span className="quiz-summary">Answer all questions, then grade.</span>
        )}
      </div>

      {quiz.map((question, index) => {
        const answered = Boolean(quizAnswers[index]);
        const correct = isGraded && isCorrect(index);
        const incorrect = isGraded && answered && !isCorrect(index);
        const unanswered = isGraded && !answered;

        return (
          <fieldset
            key={`q-${index}`}
            className={`quiz-fieldset ${correct ? "quiz-correct" : ""} ${incorrect ? "quiz-incorrect" : ""} ${unanswered ? "quiz-unanswered" : ""}`}
          >
            <legend>
              <span className="quiz-number">Q{index + 1}</span>
              {question.question}
              {isGraded && answered ? (
                correct ? (
                  <CheckCircle2 size={16} className="quiz-icon correct" />
                ) : (
                  <XCircle size={16} className="quiz-icon incorrect" />
                )
              ) : null}
            </legend>

            {question.choices.map((choice) => {
              const isSelected = quizAnswers[index] === choice;
              const isAnswer = choice === question.answer;
              let choiceClass = "";
              if (isGraded && isAnswer) choiceClass = "choice-correct";
              else if (isGraded && isSelected && !isAnswer) choiceClass = "choice-incorrect";

              return (
                <label key={choice} className={`quiz-choice ${choiceClass}`}>
                  <input
                    checked={isSelected}
                    disabled={isGraded}
                    name={`quiz-${index}`}
                    onChange={() => onAnswer(index, choice)}
                    type="radio"
                  />
                  <span>{choice}</span>
                </label>
              );
            })}

            {isGraded && (
              <div className="quiz-feedback">
                {correct ? (
                  <span className="feedback-correct">Correct!</span>
                ) : answered ? (
                  <span className="feedback-incorrect">
                    Incorrect — the answer is: {question.answer}
                  </span>
                ) : (
                  <span className="feedback-skipped">
                    Skipped — the answer is: {question.answer}
                  </span>
                )}
                <button
                  className="explain-toggle"
                  onClick={() => toggleExplanation(index)}
                  type="button"
                >
                  {revealedExplanations[index] ? "Hide explanation" : "Show explanation"}
                </button>
                {revealedExplanations[index] && (
                  <p className="quiz-explanation">{question.explanation}</p>
                )}
              </div>
            )}
          </fieldset>
        );
      })}

      <div className="inline-actions">
        {!isGraded ? (
          <button className="primary-button inline" onClick={onGrade} type="button">
            Grade quiz ({Object.keys(quizAnswers).length}/{quiz.length} answered)
          </button>
        ) : (
          <strong className="score-pill">
            Score: {quizScore} ({Math.round((parseInt(quizScore) / quiz.length) * 100)}%)
          </strong>
        )}
      </div>
    </div>
  );
}
