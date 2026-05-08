import type { AuthStatus, ThemeMode } from "../lib/types";
import { BrandLogo } from "./BrandLogo";

type LoadingScreenProps = {
  authStatus: AuthStatus;
  theme: ThemeMode;
};

export function LoadingScreen({ authStatus, theme }: LoadingScreenProps) {
  return (
    <main className={`landing-shell ${theme}`}>
      <div className="loading-card">
        <BrandLogo />
        <strong>{authStatus === "loading" ? "Finishing Google sign-in..." : "Opening AcademIQ..."}</strong>
      </div>
    </main>
  );
}
