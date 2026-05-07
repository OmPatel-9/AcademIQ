import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AcademIQ",
  description: "A premium AI tutor dashboard powered by specialized learning agents."
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
