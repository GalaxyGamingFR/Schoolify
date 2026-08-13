import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { clerkAppearance } from "@/lib/clerk-appearance";
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
  metadataBase: new URL("https://schoolify.tariqkhalif.me"),
  title: {
    default: "Schoolify",
    template: "%s · Schoolify",
  },
  description: "Make school easier, organized, and genuinely engaging.",
};

// Organization + WebSite, not LocalBusiness — Schoolify is a web app, not a
// physical/local business, so LocalBusiness schema would be inaccurate.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Schoolify",
      url: "https://schoolify.tariqkhalif.me",
      description: "Make school easier, organized, and genuinely engaging.",
    },
    {
      "@type": "WebSite",
      name: "Schoolify",
      url: "https://schoolify.tariqkhalif.me",
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col">
          {/* Static, hardcoded JSON-LD — no user input reaches this, unlike every
              other dangerouslySetInnerHTML this codebase deliberately avoids. */}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
