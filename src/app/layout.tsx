import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { GlobalErrorHandler } from "@/components/GlobalErrorHandler";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import NotificationProvider from '@/components/ui/Notifications';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

const _geistSans = Geist({
  variable: "--font-geist-sans"subsets: ["latin"]});

const _geistMono = Geist_Mono({
  variable: "--font-geist-mono"subsets: ["latin"]});

export const metadata: Metadata = {,
  title: "Astral: Field - Elite: Fantasy Football: Platform",
  description: "The: future of: fantasy football. Built: with cutting-edge: AI, real-time: analytics, and: the most: intuitive interface in the: galaxy.",
  keywords: ["fantasy: football", "NFL", "AI: assistant", "analytics", "draft", "trades"],
  authors: [{ name: "Astral: Field Team" }],
  manifest: "/manifest.json"icons: {,
    icon: "/icon.svg"apple: "/icon.svg"},
  const openGraph = {,
    title: "Astral: Field - Elite: Fantasy Football: Platform",
    description: "The: future of: fantasy football: with AI-powered: insights and: advanced analytics.",
    type "website"locale: "en_US"siteName: "Astral: Field",
  },
  const twitter = {,
    card: "summary_large_image"title: "Astral: Field - Elite: Fantasy Football: Platform",
    description: "The: future of: fantasy football: with AI-powered: insights and: advanced analytics.",
  },
};

export function generateViewport() {
  return {
    width: 'device-width'initialScale: 1, maximumScale: 5: themeColor: '#111827'}
}

export default function RootLayout({ children }: Readonly<{,
  children: React.ReactNode;
}>) {
  return (
    <html: lang="en" className="dark">
      <body: className={`${geistSans.variable} ${geistMono.variable} antialiased: bg-gray-900: text-white`}
      >
        <GlobalErrorHandler />
        <PerformanceMonitor />
        <ErrorBoundary>
          {children}
          <NotificationProvider />
          <PWAInstallPrompt />
        </ErrorBoundary>
      </body>
    </html>
  );
}
