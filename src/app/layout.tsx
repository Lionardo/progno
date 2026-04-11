import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getViewer } from "@/lib/auth";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  description:
    "Progno is a Swiss shadow-futarchy market for federal initiatives, using play points and AI-designed welfare metrics.",
  title: {
    default: "Progno",
    template: "%s | Progno",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await getViewer();

  return (
    <html
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} ${newsreader.variable} h-full scroll-smooth`}
      lang="en"
    >
      <body className="min-h-full bg-[color:var(--color-background)] text-[color:var(--color-ink)] antialiased">
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-80 [background:radial-gradient(circle_at_top_left,rgba(69,215,192,0.14),transparent_22%),radial-gradient(circle_at_top_right,rgba(242,198,109,0.12),transparent_18%),linear-gradient(180deg,rgba(7,16,24,0.24),transparent_35%)]" />
          <SiteHeader
            isAdmin={viewer.isAdmin}
            userEmail={viewer.user?.email ?? null}
          />
          <div className="relative z-10">{children}</div>
          <SiteFooter />
          <Analytics />
        </div>
      </body>
    </html>
  );
}
