"use client";

import { quickStarts } from "../lib/constants";

type QuickStartSectionProps = {
  onPickPrompt: (prompt: string) => void;
};

export function QuickStartSection({ onPickPrompt }: QuickStartSectionProps) {
  return (
    <section className="quick-section">
      <div className="section-label">Quick start</div>
      <div className="quick-grid">
        {quickStarts.map((item) => (
          <button type="button" key={item} onClick={() => onPickPrompt(item)}>
            {item}
          </button>
        ))}
      </div>
    </section>
  );
}
