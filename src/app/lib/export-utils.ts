import type { StudyPack } from "./types";

export function packToMarkdown(pack: StudyPack) {
  const resources = pack.resources
    .map((item) => `- **${item.title}** (${item.type}) - ${item.why}\n  Citation: ${item.citation}`)
    .join("\n");
  const videos = pack.youtube.map((video) => `- [${video.title}](${video.url}) - ${video.channel}`).join("\n");
  const quiz = pack.quiz
    .map((item, index) => `${index + 1}. ${item.question}\n   Answer: ${item.answer}\n   ${item.explanation}`)
    .join("\n\n");
  const flashcards = pack.flashcards
    .map((item) => `- Front: ${item.front}\n  Back: ${item.back}\n  Tags: ${item.tags || "academiq"}`)
    .join("\n");

  return `# ${pack.topic}

Difficulty: ${pack.difficulty}
Subject: ${pack.subject}
Learning style: ${pack.learningStyle}

## Summary
${pack.summary}

## Professor
${pack.professor}

## Roadmap
${pack.advisor}

## Resources
${pack.librarian}

${resources}

## YouTube Tutorials
${videos || "No YouTube tutorials available."}

## Practice
${pack.assistant}

## Quiz
${quiz}

## Flashcards
${flashcards}

## Projects
${pack.projects.map((item) => `- ${item}`).join("\n")}
`;
}

export function flashcardsCsv(pack: StudyPack) {
  const rows = pack.flashcards.map((card) =>
    [card.front, card.back, card.tags || pack.topic]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(",")
  );
  return `"Front","Back","Tags"\n${rows.join("\n")}`;
}

function htmlEscape(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function mindMapHtml(pack: StudyPack) {
  const nodes = ["Professor", "Roadmap", "Resources", "Practice", "Quiz", "Projects", "Flashcards"]
    .map((label) => `<div class="node">${label}</div>`)
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${htmlEscape(pack.topic)} Mind Map</title>
  <style>
    body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #f4f6f5; color: #161716; }
    main { min-height: 100vh; display: grid; place-items: center; padding: 32px; }
    .map { width: min(920px, 100%); display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .root, .node { border-radius: 8px; padding: 24px; text-align: center; border: 1px solid #d9dfdc; background: #ffffff; }
    .root { grid-column: 1 / -1; background: #193f36; color: #ffffff; font-size: 28px; font-weight: 800; }
    @media (max-width: 720px) { .map { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main>
    <section class="map">
      <div class="root">${htmlEscape(pack.topic)}</div>
      ${nodes}
    </section>
  </main>
</body>
</html>`;
}

export function downloadText(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
