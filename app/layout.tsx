import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AcademIQ",
  description: "A focused study workspace for lessons, roadmaps, quizzes, flashcards, and saved chats."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
