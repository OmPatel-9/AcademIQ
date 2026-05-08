import { formatDate } from "../lib/client-utils";
import type { StudyPack } from "../lib/types";

type PackHeaderProps = {
  studyPack: StudyPack;
  quizScore: string;
};

export function PackHeader({ studyPack, quizScore }: PackHeaderProps) {
  return (
    <section className="pack-header">
      <span>{studyPack.selectedAgent}</span>
      <h1>{studyPack.topic}</h1>
      <p>{studyPack.summary}</p>
      <div className="chip-row">
        <span>Difficulty: {studyPack.difficulty}</span>
        <span>Progress: {studyPack.completionPercent}%</span>
        <span>Quiz: {quizScore || "Not taken"}</span>
        <span>Generated: {formatDate(studyPack.createdAt)}</span>
      </div>
    </section>
  );
}
