import type { AgentCard } from "../lib/types";

type WorkspaceLoadingProps = {
  agent: AgentCard;
};

export function WorkspaceLoading({ agent }: WorkspaceLoadingProps) {
  const Icon = agent.Icon;

  return (
    <div className="loading-state">
      <Icon size={24} />
      <strong>{agent.title} is building your workspace...</strong>
    </div>
  );
}
