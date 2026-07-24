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
    title: "Course Atlas — Complete degrees built from free courses",
    description:
      "A scalable catalog of complete degree-shaped self-study programs, each with semesters, courses, executable weeks, assessments, and carefully labeled free resources.",
    applicationName: "Course Atlas",
    keywords: [
      "open curriculum",
      "self-directed learning",
      "electrical engineering",
      "free courses",
      "course planner",
    ],
    openGraph: {
      title: "Course Atlas",
      description: "Pick a degree. Get the whole path—built from the best free courses on the open web.",
      type: "website",
      siteName: "Course Atlas",
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: "Course Atlas — Every subject. One navigable education.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Course Atlas",
      description: "Complete degree-shaped self-study routes built from free courses.",
      images: ["/og.png"],
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
