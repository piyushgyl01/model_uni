import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { ServiceWorkerRegistration } from "./service-worker-registration";
import { DEFAULT_THEME, THEME_BOOTSTRAP_SCRIPT } from "./theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    // Matches the default theme's page background, so the browser chrome does
    // not band against it on a phone.
    { media: "(prefers-color-scheme: light)", color: "#fdf0d5" },
    { media: "(prefers-color-scheme: dark)", color: "#000080" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

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
      "mechanical engineering",
      "physics",
      "mathematics",
      "pure mathematics",
      "applied mathematics",
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
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      title: "Course Atlas",
      statusBarStyle: "default",
    },
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/icon.svg",
      apple: "/apple-touch-icon.png",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The default styling is server-rendered so it never arrives late; the
    // bootstrap script below clears it for a learner who chose otherwise, and
    // suppressHydrationWarning covers that one attribute it may change.
    <html
      lang="en"
      // The font custom properties are declared on the root rather than on the
      // body so that tokens defined at :root can reference them; a token whose
      // value resolves to an undefined property invalidates the declaration
      // that uses it.
      className={`${geistSans.variable} ${geistMono.variable}`}
      data-theme={DEFAULT_THEME}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <script
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
