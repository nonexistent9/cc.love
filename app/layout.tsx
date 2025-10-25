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
  title: "Cupid Copilot (cc.love) - Your AI Dating Wingman",
  description: "Got funded? Time to get laid. cc.love is your AI wingman that analyzes dating profiles and gives you rizz that actually works. No more 'hey'. Get more matches, better conversations, and actual dates.",
  keywords: ["dating app", "AI wingman", "dating assistant", "rizz", "dating coach", "tinder helper", "hinge assistant", "dating ai"],
  authors: [{ name: "Cupid Copilot" }],
  openGraph: {
    title: "Cupid Copilot - Your AI Dating Wingman",
    description: "Stop swiping with no game. Get AI-powered rizz that actually works.",
    url: "https://cc.love",
    siteName: "Cupid Copilot",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cupid Copilot - Your AI Dating Wingman",
    description: "Stop swiping with no game. Get AI-powered rizz that actually works.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
