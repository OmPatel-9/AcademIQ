"use client";

import { Download, FileText, Printer } from "lucide-react";
import { downloadText, flashcardsCsv, mindMapHtml, packToMarkdown } from "../lib/export-utils";
import type { StudyPack } from "../lib/types";

type ExportsPanelProps = {
  studyPack: StudyPack;
  onCreateGoogleDoc: (section: string, markdown: string) => void;
  onPrint: () => void;
  showGoogleDocs: boolean;
};

export function ExportsPanel({ studyPack, onCreateGoogleDoc, onPrint, showGoogleDocs }: ExportsPanelProps) {
  if (showGoogleDocs) {
    return (
      <div className="export-grid">
        {[
          ["Professor", studyPack.professor],
          ["Roadmap", studyPack.advisor],
          ["Resources", studyPack.librarian],
          ["Practice", studyPack.assistant],
          ["Projects", studyPack.projects.join("\n\n")],
          ["Full Study Pack", packToMarkdown(studyPack)]
        ].map(([section, markdown]) => (
          <button key={section} onClick={() => onCreateGoogleDoc(section, markdown)} type="button">
            <FileText size={18} /> Create {section} Doc
          </button>
        ))}
        {Object.entries(studyPack.googleDocs).map(([section, url]) => (
          <a className="doc-link" href={url} key={section} rel="noreferrer" target="_blank">
            Open {section}
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="export-grid">
      <button onClick={() => downloadText(`${studyPack.topic}.md`, packToMarkdown(studyPack), "text/markdown")} type="button">
        <Download size={18} /> Markdown
      </button>
      <button onClick={() => downloadText(`${studyPack.topic}_anki.csv`, flashcardsCsv(studyPack), "text/csv")} type="button">
        <Download size={18} /> Anki CSV
      </button>
      <button onClick={() => downloadText(`${studyPack.topic}_mind_map.html`, mindMapHtml(studyPack), "text/html")} type="button">
        <Download size={18} /> Mind map HTML
      </button>
      <button onClick={onPrint} type="button">
        <Printer size={18} /> Print / Save PDF
      </button>
    </div>
  );
}
