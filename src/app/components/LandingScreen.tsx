"use client";

import { ArrowRight, LogIn, UserCircle } from "lucide-react";
import type { ThemeMode } from "../lib/types";
import { BrandLogo } from "./BrandLogo";
import { ThemeToggle } from "./ThemeToggle";

type LandingScreenProps = {
  authMessage: string;
  theme: ThemeMode;
  onGoogleSignIn: () => void;
  onGuestStart: () => void;
  onToggleTheme: () => void;
};

export function LandingScreen({
  authMessage,
  theme,
  onGoogleSignIn,
  onGuestStart,
  onToggleTheme
}: LandingScreenProps) {
  return (
    <main className={`landing-shell ${theme}`}>
      <header className="landing-topbar">
        <div className="landing-brand">
          <BrandLogo />
          <strong>AcademIQ</strong>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </header>

      <section className="landing-hero">
        <div className="landing-copy">
          <span className="eyebrow">Study workspace</span>
          <h1>Build a study pack in minutes.</h1>
          <p>Start as a guest for a temporary workspace, or sign in with Google to keep your chats and study packs.</p>
          {authMessage ? <p className="auth-message">{authMessage}</p> : null}
          <div className="auth-actions">
            <button className="primary-button large" onClick={onGoogleSignIn} type="button">
              <LogIn size={18} />
              Continue with Google
            </button>
            <button className="soft-button large" onClick={onGuestStart} type="button">
              <UserCircle size={18} />
              Continue as guest
            </button>
          </div>
        </div>

        <div className="product-preview" aria-label="AcademIQ workspace preview">
          <div className="preview-window">
            <div className="preview-top">
              <span />
              <span />
              <span />
            </div>
            <div className="preview-content">
              <div className="preview-sidebar">
                <strong>AcademIQ</strong>
                <span />
                <span />
                <span />
              </div>
              <div className="preview-main">
                <div className="preview-heading">
                  <span>Data Science</span>
                  <strong>Beginner roadmap</strong>
                </div>
                <div className="preview-prompt">
                  <p>Explain regression with practice problems</p>
                  <button type="button">
                    <ArrowRight size={16} />
                  </button>
                </div>
                <div className="preview-grid">
                  <span>Lesson</span>
                  <span>Quiz</span>
                  <span>Flashcards</span>
                  <span>Project</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
