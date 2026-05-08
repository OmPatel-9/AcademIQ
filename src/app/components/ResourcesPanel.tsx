import type { StudyPack } from "../lib/types";
import { MarkdownBlock } from "./MarkdownBlock";

type ResourcesPanelProps = {
  studyPack: StudyPack;
};

export function ResourcesPanel({ studyPack }: ResourcesPanelProps) {
  return (
    <div className="tab-stack">
      <MarkdownBlock>{studyPack.librarian}</MarkdownBlock>
      <div className="resource-row full">
        {studyPack.resources.map((resource, index) => (
          <div className="resource-card" key={`${resource.title}-${index}`}>
            <strong>{resource.title}</strong>
            <span>{resource.type}</span>
            <p>{resource.why}</p>
            <small>{resource.citation}</small>
          </div>
        ))}
      </div>
      <h3>YouTube Tutorials</h3>
      {studyPack.youtube.length ? (
        <ul className="clean-list">
          {studyPack.youtube.map((video) => (
            <li key={video.url}>
              <a href={video.url} target="_blank" rel="noreferrer">
                {video.title}
              </a>{" "}
              - {video.channel}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Add `YOUTUBE_API_KEY` to enable video search.</p>
      )}
    </div>
  );
}
