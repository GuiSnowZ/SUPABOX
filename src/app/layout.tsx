import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { SignInPrompt, Toaster } from "@/components/layout/overlays";
import { ReviewPrompt } from "@/components/reviews/review-prompt";
import { QuickAddDialog } from "@/components/games/quick-add";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { StoreStarter } from "@/components/layout/store-starter";
import { ALLOW_INDEXING, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const DESCRIPTION =
  "Supabox is a social diary for video games. Track what you play, rate and review games, build lists and see what your friends are playing.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Supabox — Your games. Your story.", template: "%s · Supabox" },
  description: DESCRIPTION,
  applicationName: "Supabox",
  openGraph: {
    type: "website",
    siteName: "Supabox",
    title: "Supabox — Your games. Your story.",
    description: DESCRIPTION,
    images: [{ url: "/brand/supabox-icon-1024.png", width: 1024, height: 1024, alt: "Supabox" }],
  },
  twitter: { card: "summary", images: ["/brand/supabox-icon-1024.png"] },
  // Pre-launch: keep the site out of search results until NEXT_PUBLIC_ALLOW_INDEXING=true.
  robots: ALLOW_INDEXING ? undefined : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#101214",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-bg text-fg">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-accent px-3 py-2 text-accent-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <StoreStarter />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <MobileTabBar />
        <Toaster />
        <SignInPrompt />
        <ReviewPrompt />
        <QuickAddDialog />
      </body>
    </html>
  );
}
