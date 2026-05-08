import type { ReactNode } from "react";

function renderInlineMarkdown(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index): ReactNode => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

type MarkdownBlockProps = {
  children: string;
};

export function MarkdownBlock({ children }: MarkdownBlockProps) {
  const blocks = children
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) {
    return (
      <div className="markdown-block">
        <p>No content generated yet.</p>
      </div>
    );
  }

  return (
    <div className="markdown-block">
      {blocks.map((block, index) => {
        const lines = block
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        const headingMatch = lines[0]?.match(/^#{1,3}\s+(.+)/);
        const bulletLines = lines.filter((line) => /^[-*]\s+/.test(line));
        const numberedLines = lines.filter((line) => /^\d+[.)]\s+/.test(line));

        if (headingMatch && lines.length === 1) {
          return <h3 key={`${block}-${index}`}>{renderInlineMarkdown(headingMatch[1])}</h3>;
        }

        if (headingMatch) {
          return (
            <section className="markdown-section" key={`${block}-${index}`}>
              <h3>{renderInlineMarkdown(headingMatch[1])}</h3>
              <p>{renderInlineMarkdown(lines.slice(1).join("\n"))}</p>
            </section>
          );
        }

        if (bulletLines.length === lines.length) {
          return (
            <ul key={`${block}-${index}`}>
              {lines.map((line) => (
                <li key={line}>{renderInlineMarkdown(line.replace(/^[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }

        if (numberedLines.length === lines.length) {
          return (
            <ol key={`${block}-${index}`}>
              {lines.map((line) => (
                <li key={line}>{renderInlineMarkdown(line.replace(/^\d+[.)]\s+/, ""))}</li>
              ))}
            </ol>
          );
        }

        return <p key={`${block}-${index}`}>{renderInlineMarkdown(lines.join("\n"))}</p>;
      })}
    </div>
  );
}
