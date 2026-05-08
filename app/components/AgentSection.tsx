"use client";

import { agents } from "../lib/constants";

type AgentSectionProps = {
  selectedAgent: string;
  onSelectAgent: (agent: string) => void;
};

export function AgentSection({ selectedAgent, onSelectAgent }: AgentSectionProps) {
  return (
    <section className="agent-section">
      <div className="section-label">Choose a specialist</div>
      <div className="agent-grid">
        {agents.map(({ title, role, Icon }) => (
          <article className={`agent-card ${selectedAgent === title ? "selected" : ""}`} key={title}>
            <div className="agent-icon">
              <Icon size={21} />
            </div>
            <h2>{title}</h2>
            <p>{role}</p>
            <button type="button" onClick={() => onSelectAgent(title)}>
              {selectedAgent === title ? "Selected" : "Choose"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
