"use client";

import { ChevronDown, GraduationCap, LogOut, Plus, Search, UserPlus } from "lucide-react";
import { subjects } from "../lib/constants";
import type { ThemeMode } from "../lib/types";
import { ThemeToggle } from "./ThemeToggle";

type TopbarProps = {
  subject: string;
  searchTerm: string;
  theme: ThemeMode;
  onSubjectChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onInvite: () => void;
  onToggleTheme: () => void;
  onSignOut: () => void;
  onNewSession: () => void;
};

export function Topbar({
  subject,
  searchTerm,
  theme,
  onSubjectChange,
  onSearchChange,
  onInvite,
  onToggleTheme,
  onSignOut,
  onNewSession
}: TopbarProps) {
  return (
    <header className="topbar">
      <label className="subject-select">
        <span>Workspace</span>
        <div className="select-shell">
          <GraduationCap size={17} />
          <select value={subject} onChange={(event) => onSubjectChange(event.target.value)}>
            {subjects.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <ChevronDown size={16} />
        </div>
      </label>

      <div className="top-actions">
        <label className="search-box">
          <Search size={17} />
          <input placeholder="Search chats" value={searchTerm} onChange={(event) => onSearchChange(event.target.value)} />
        </label>
        <button className="soft-button" type="button" onClick={onInvite}>
          <UserPlus size={17} />
          <span>Invite</span>
        </button>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <button className="soft-button" type="button" onClick={onSignOut}>
          <LogOut size={17} />
          <span>Log out</span>
        </button>
        <button className="primary-button" type="button" onClick={onNewSession}>
          <Plus size={18} />
          <span>New session</span>
        </button>
      </div>
    </header>
  );
}
