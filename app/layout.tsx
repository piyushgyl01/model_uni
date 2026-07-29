import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
  const protocol =
    forwardedProtocol ?? (host?.startsWith("localhost") ? "http" : "https");
  const metadataBase = host ? new URL(`${protocol}://${host}`) : undefined;

  return {
    metadataBase,
    title: "Course Atlas — Complete learning paths built from free resources",
    description:
      "A content-driven catalog of complete self-study programs with executable learning units, assessments, evidence, competencies, and carefully labeled free resources.",
    applicationName: "Course Atlas",
    keywords: [
      "open curriculum",
      "self-directed learning",
      "computer science",
      "electrical engineering",
      "spreadsheet course",
      "free courses",
      "course planner",
    ],
    openGraph: {
      title: "Course Atlas",
      description:
        "Choose an outcome. Get the whole path—what to learn, where to learn it, what to do and what evidence to keep.",
      type: "website",
      siteName: "Course Atlas",
      images: [
        {
          url: "/og-v2.png",
          width: 1200,
          height: 630,
          alt: "Course Atlas — Choose an outcome. Get the whole path.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Course Atlas",
      description: "Complete, executable self-study routes built from free resources.",
      images: ["/og-v2.png"],
    },
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
  };
}

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
