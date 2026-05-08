import type { ReactNode } from "react";

function renderInlineMarkdown(text: string): ReactNode[] {
  const tokens: ReactNode[] = [];
  // Match: **bold**, *italic*, `code`, or plain text
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    const segment = match[0];
    const key = `${match.index}-${segment.slice(0, 8)}`;
    if (segment.startsWith("**") && segment.endsWith("**")) {
      tokens.push(<strong key={key}>{segment.slice(2, -2)}</strong>);
    } else if (segment.startsWith("*") && segment.endsWith("*")) {
      tokens.push(<em key={key}>{segment.slice(1, -1)}</em>);
    } else if (segment.startsWith("`") && segment.endsWith("`")) {
      tokens.push(<code key={key} className="inline-code">{segment.slice(1, -1)}</code>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens.length ? tokens : [text];
}

function isCodeFence(line: string) {
  return /^```/.test(line.trim());
}

type MarkdownBlockProps = {
  children: string;
};

export function MarkdownBlock({ children }: MarkdownBlockProps) {
  if (!children?.trim()) {
    return (
      <div className="markdown-block">
        <p>No content generated yet.</p>
      </div>
    );
  }

  const lines = children.split("\n");
  const elements: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      index++;
      continue;
    }

    // Code fence blocks
    if (isCodeFence(trimmed)) {
      const lang = trimmed.replace(/^```\s*/, "").trim();
      const codeLines: string[] = [];
      index++;
      while (index < lines.length && !isCodeFence(lines[index].trim())) {
        codeLines.push(lines[index]);
        index++;
      }
      index++; // skip closing fence
      elements.push(
        <pre key={`code-${elements.length}`} className="code-block" data-lang={lang || undefined}>
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(<hr key={`hr-${elements.length}`} className="md-hr" />);
      index++;
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      if (level <= 2) {
        elements.push(<h3 key={`h-${elements.length}`}>{renderInlineMarkdown(content)}</h3>);
      } else {
        elements.push(
          <h4 key={`h-${elements.length}`} className="md-subheading">
            {renderInlineMarkdown(content)}
          </h4>
        );
      }
      index++;
      continue;
    }

    // Collect consecutive bullet lines
    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*+]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*+]\s+/, ""));
        index++;
      }
      elements.push(
        <ul key={`ul-${elements.length}`}>
          {items.map((item, i) => (
            <li key={i}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Collect consecutive numbered lines
    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+[.)]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+[.)]\s+/, ""));
        index++;
      }
      elements.push(
        <ol key={`ol-${elements.length}`}>
          {items.map((item, i) => (
            <li key={i}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index++;
      }
      elements.push(
        <blockquote key={`bq-${elements.length}`} className="md-blockquote">
          {renderInlineMarkdown(quoteLines.join(" "))}
        </blockquote>
      );
      continue;
    }

    // Regular paragraph — collect consecutive non-special lines
    const paraLines: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isCodeFence(lines[index].trim()) &&
      !/^#{1,4}\s+/.test(lines[index].trim()) &&
      !/^[-*+]\s+/.test(lines[index].trim()) &&
      !/^\d+[.)]\s+/.test(lines[index].trim()) &&
      !/^[-*_]{3,}$/.test(lines[index].trim()) &&
      !lines[index].trim().startsWith(">")
    ) {
      paraLines.push(lines[index].trim());
      index++;
    }
    if (paraLines.length) {
      elements.push(<p key={`p-${elements.length}`}>{renderInlineMarkdown(paraLines.join(" "))}</p>);
    }
  }

  return <div className="markdown-block">{elements}</div>;
}
