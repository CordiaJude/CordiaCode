import type { Metadata } from "next";
import { Newsreader, Work_Sans, Inter } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-newsreader",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-work-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cordia Collaborate",
  description: "Task board for Cordia Collaborate",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${newsreader.variable} ${workSans.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
