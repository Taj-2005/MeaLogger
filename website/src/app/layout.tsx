import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MeaLogger - Track Your Meals Effortlessly",
  description:
    "Photo-based meal tracking app with streak tracking, smart reminders, and beautiful timeline. Build consistent eating habits with MeaLogger.",
  keywords:
    "meal tracking, food diary, nutrition app, meal logger, health tracking, diet app, android app",
  authors: [{ name: "MeaLogger Team" }],
  openGraph: {
    title: "MeaLogger - Track Your Meals Effortlessly",
    description:
      "Photo-based meal tracking app with streak tracking and smart reminders.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "MeaLogger - Track Your Meals Effortlessly",
    description:
      "Photo-based meal tracking app with streak tracking and smart reminders.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
