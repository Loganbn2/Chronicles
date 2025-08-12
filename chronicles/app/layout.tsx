import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chronicles — Immersive Historical Roleplay",
  description:
    "Step into history with immersive roleplay experiences. Chat with legendary figures, craft your character, and shape the course of civilizations across different eras.",
  openGraph: {
    title: "Chronicles — Historical Roleplay",
    description: "Immersive historical fiction roleplay with curated storylines and legendary characters.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="antialiased min-h-full font-serif">
        {children}
      </body>
    </html>
  );
}
