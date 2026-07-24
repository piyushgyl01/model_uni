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
    title: "Course Atlas — Every subject. One navigable education.",
    description:
      "A growing map of complete learning programs, courses, modules, and carefully labeled free resources. Begin with the full Electrical Engineering program.",
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
      description: "Every subject. One navigable education.",
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
      description: "Every subject. One navigable education.",
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
