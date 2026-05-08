import type { StudyPack } from "../lib/types";

type MindMapPanelProps = {
  studyPack: StudyPack;
};

export function MindMapPanel({ studyPack }: MindMapPanelProps) {
  return (
    <div className="mind-map">
      <div className="mind-node root">{studyPack.topic}</div>
      {["Professor", "Roadmap", "Resources", "Practice", "Quiz", "Projects", "Flashcards"].map((label) => (
        <div className="mind-node" key={label}>
          {label}
        </div>
      ))}
    </div>
  );
}
