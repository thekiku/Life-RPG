import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Life RPG — Turn Tasks Into Quests",
  description: "A gamified productivity RPG with XP, streaks, attributes, rewards, and persistent progress."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
