"use client";

import { useMemo, useState } from "react";
import type { StudyPack } from "../lib/types";

type MindMapPanelProps = {
  studyPack: StudyPack;
};

type MindNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  type: "root" | "branch" | "leaf";
  parent?: string;
};

function buildMindMapNodes(pack: StudyPack): MindNode[] {
  const nodes: MindNode[] = [];
  const centerX = 450;
  const centerY = 280;

  // Root node
  nodes.push({ id: "root", label: pack.topic, x: centerX, y: centerY, type: "root" });

  // Branch nodes — the main sections
  const branches = [
    { id: "professor", label: "Professor Notes" },
    { id: "roadmap", label: "Roadmap" },
    { id: "resources", label: "Resources" },
    { id: "practice", label: "Practice" },
    { id: "quiz", label: `Quiz (${pack.quiz.length}Q)` },
    { id: "flashcards", label: `Flashcards (${pack.flashcards.length})` },
    { id: "projects", label: `Projects (${pack.projects.length})` }
  ];

  const branchRadius = 165;
  const startAngle = -Math.PI / 2;

  branches.forEach((branch, i) => {
    const angle = startAngle + (2 * Math.PI * i) / branches.length;
    nodes.push({
      id: branch.id,
      label: branch.label,
      x: centerX + branchRadius * Math.cos(angle),
      y: centerY + branchRadius * Math.sin(angle),
      type: "branch",
      parent: "root"
    });
  });

  // Leaf nodes — progress topics distributed around their relevant branches
  const leafRadius = 80;
  const topicsPerBranch = Math.ceil(pack.progressTopics.length / branches.length);

  pack.progressTopics.forEach((topic, i) => {
    const branchIndex = Math.min(Math.floor(i / topicsPerBranch), branches.length - 1);
    const branch = branches[branchIndex];
    const branchNode = nodes.find((n) => n.id === branch.id);
    if (!branchNode) return;

    const localIndex = i % topicsPerBranch;
    const spread = Math.PI * 0.6;
    const branchAngle = startAngle + (2 * Math.PI * branchIndex) / branches.length;
    const leafAngle = branchAngle - spread / 2 + (spread * localIndex) / Math.max(topicsPerBranch - 1, 1);

    nodes.push({
      id: `leaf-${i}`,
      label: topic.length > 30 ? topic.slice(0, 28) + "…" : topic,
      x: branchNode.x + leafRadius * Math.cos(leafAngle),
      y: branchNode.y + leafRadius * Math.sin(leafAngle),
      type: "leaf",
      parent: branch.id
    });
  });

  return nodes;
}

function CurvedLink({ x1, y1, x2, y2, type }: { x1: number; y1: number; x2: number; y2: number; type: string }) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx = midX - dy * 0.15;
  const cy = midY + dx * 0.15;

  return (
    <path
      d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
      fill="none"
      stroke={type === "root" ? "var(--accent-strong)" : "var(--border-strong)"}
      strokeWidth={type === "root" ? 2 : 1.2}
      strokeDasharray={type === "root" ? "none" : "4 3"}
      opacity={type === "root" ? 0.7 : 0.5}
    />
  );
}

export function MindMapPanel({ studyPack }: MindMapPanelProps) {
  const nodes = useMemo(() => buildMindMapNodes(studyPack), [studyPack]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showLeaves, setShowLeaves] = useState(true);

  const links = nodes
    .filter((n) => n.parent)
    .map((n) => {
      const parent = nodes.find((p) => p.id === n.parent);
      if (!parent) return null;
      return { from: parent, to: n, type: n.type === "branch" ? "root" : "branch" };
    })
    .filter(Boolean);

  const visibleNodes = showLeaves ? nodes : nodes.filter((n) => n.type !== "leaf");
  const visibleLinks = showLeaves ? links : links.filter((l) => l && l.type === "root");

  return (
    <div className="mindmap-container">
      <div className="mindmap-toolbar">
        <button
          className={`soft-button ${showLeaves ? "" : "active"}`}
          onClick={() => setShowLeaves((s) => !s)}
          type="button"
        >
          {showLeaves ? "Hide milestones" : "Show milestones"}
        </button>
        <span className="muted" style={{ fontSize: "13px" }}>
          {nodes.filter((n) => n.type === "branch").length} sections · {nodes.filter((n) => n.type === "leaf").length} milestones
        </span>
      </div>

      <svg
        viewBox="0 0 900 560"
        className="mindmap-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Links */}
        {visibleLinks.map((link, i) =>
          link ? (
            <CurvedLink
              key={`link-${i}`}
              x1={link.from.x}
              y1={link.from.y}
              x2={link.to.x}
              y2={link.to.y}
              type={link.type}
            />
          ) : null
        )}

        {/* Nodes */}
        {visibleNodes.map((node) => {
          const isHovered = hoveredNode === node.id;
          const isRoot = node.type === "root";
          const isBranch = node.type === "branch";
          const isLeaf = node.type === "leaf";
          const isLearned = studyPack.learnedTopics.includes(node.label);

          const rx = isRoot ? 70 : isBranch ? 56 : 48;
          const ry = isRoot ? 32 : isBranch ? 22 : 16;

          return (
            <g
              key={node.id}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: "default" }}
            >
              <ellipse
                cx={node.x}
                cy={node.y}
                rx={rx + (isHovered ? 3 : 0)}
                ry={ry + (isHovered ? 2 : 0)}
                fill={
                  isRoot
                    ? "var(--accent-strong)"
                    : isBranch
                      ? isHovered
                        ? "var(--accent-soft)"
                        : "var(--panel-soft)"
                      : isLearned
                        ? "var(--accent-soft)"
                        : "var(--panel)"
                }
                stroke={
                  isRoot
                    ? "var(--accent)"
                    : isBranch
                      ? "var(--accent-strong)"
                      : isLearned
                        ? "var(--accent)"
                        : "var(--border)"
                }
                strokeWidth={isRoot ? 2.5 : isBranch ? 1.5 : 1}
                style={{ transition: "all 200ms ease" }}
              />
              <text
                x={node.x}
                y={node.y + (isRoot ? 1 : 0)}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isRoot ? "#ffffff" : "var(--text)"}
                fontSize={isRoot ? 13 : isBranch ? 11 : 9}
                fontWeight={isRoot ? 800 : isBranch ? 700 : 500}
                style={{ pointerEvents: "none" }}
              >
                {node.label.length > (isRoot ? 25 : isBranch ? 18 : 22)
                  ? node.label.slice(0, isRoot ? 23 : isBranch ? 16 : 20) + "…"
                  : node.label}
              </text>
              {isLeaf && isLearned && (
                <circle
                  cx={node.x + rx - 4}
                  cy={node.y - ry + 4}
                  r={5}
                  fill="var(--accent)"
                  stroke="var(--panel)"
                  strokeWidth={1.5}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
