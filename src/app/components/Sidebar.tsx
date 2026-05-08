"use client";

import { History, UserCircle } from "lucide-react";
import { navItems } from "../lib/constants";
import { formatDate } from "../lib/client-utils";
import type { Session, UserAccount } from "../lib/types";
import { BrandLogo } from "./BrandLogo";

type SidebarProps = {
  account: UserAccount;
  activeNavLabel: string;
  currentSessionId: string;
  sessions: Session[];
  supabaseEnabled: boolean;
  onNavigate: (label: string) => void;
  onSelectSession: (session: Session) => void;
};

export function Sidebar({
  account,
  activeNavLabel,
  currentSessionId,
  sessions,
  supabaseEnabled,
  onNavigate,
  onSelectSession
}: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="AcademIQ navigation">
      <div className="brand">
        <BrandLogo />
        <div>
          <strong>AcademIQ</strong>
          <span>Learning workspace</span>
        </div>
      </div>

      <nav className="nav-list">
        {navItems.map(({ label, Icon }) => (
          <button
            aria-current={activeNavLabel === label ? "page" : undefined}
            className={`nav-item ${activeNavLabel === label ? "active" : ""}`}
            key={label}
            onClick={() => onNavigate(label)}
            type="button"
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="history-panel">
        <div className="history-title">
          <History size={16} />
          <span>History</span>
          <small>{account.mode === "google" ? (supabaseEnabled ? "Saved" : "Setup") : "Guest"}</small>
        </div>
        {sessions.length ? (
          sessions.slice(0, 8).map((session) => (
            <button
              className={`history-item ${session.id === currentSessionId ? "active" : ""}`}
              key={session.id}
              onClick={() => onSelectSession(session)}
              type="button"
            >
              <strong>{session.title}</strong>
              <span>{formatDate(session.updatedAt)}</span>
            </button>
          ))
        ) : (
          <p className="history-empty">No chats yet.</p>
        )}
      </div>

      <div className="profile-chip">
        {account.avatarUrl ? <img alt="" src={account.avatarUrl} /> : <UserCircle size={22} />}
        <div>
          <strong>{account.name}</strong>
          <span>{account.mode === "google" ? account.email || "Google account" : "Guest session"}</span>
        </div>
      </div>
    </aside>
  );
}
