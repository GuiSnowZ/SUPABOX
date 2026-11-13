import type { Metadata, Viewport } from "next";
import { VerifyEmailBanner } from "@/components/auth/verify-email-banner";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { notFound } from "next/navigation";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { SignInPrompt, Toaster } from "@/components/layout/overlays";
import { ReviewPrompt } from "@/components/reviews/review-prompt";
import { QuickAddDialog } from "@/components/games/quick-add";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { StoreStarter } from "@/components/layout/store-starter";
import { LocaleProvider } from "@/i18n/client";
import { isLocale, LOCALES } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { ALLOW_INDEXING, SITE_URL } from "@/lib/site";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

/** Every page is pre-rendered once per language; the proxy picks which one a visitor gets. */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const t = getDictionary(isLocale(lang) ? lang : "en");
  const title = `Supabox — ${t.common.tagline}`;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: "%s · Supabox" },
    description: t.meta.description,
    applicationName: "Supabox",
    openGraph: {
      type: "website",
      siteName: "Supabox",
      title,
      description: t.meta.description,
      locale: lang === "pt-BR" ? "pt_BR" : "en_US",
      images: [{ url: "/brand/supabox-icon-1024.png", width: 1024, height: 1024, alt: "Supabox" }],
    },
    twitter: { card: "summary", images: ["/brand/supabox-icon-1024.png"] },
    // Pre-launch: keep the site out of search results until NEXT_PUBLIC_ALLOW_INDEXING=true.
    robots: ALLOW_INDEXING ? undefined : { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#101214",
  colorScheme: "dark",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <html lang={lang} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-bg text-fg">
        {/* Pages are pre-rendered for visitors; hide visitor-only parts right away when a session cookie exists. */}
        <Script id="auth-hint" strategy="beforeInteractive">
          {`try{if(/(^|; )sb-[^=]*-auth-token/.test(document.cookie))document.documentElement.dataset.auth="1"}catch(e){}`}
        </Script>
        <LocaleProvider locale={lang}>
          <a
            href="#main"
            className="sr-only z-50 rounded-md bg-accent px-3 py-2 text-accent-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            {t.common.skipToContent}
          </a>
          <StoreStarter />
          <SiteHeader />
          <VerifyEmailBanner />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <MobileTabBar />
          <Toaster />
          <SignInPrompt />
          <ReviewPrompt />
          <QuickAddDialog />
        </LocaleProvider>
      </body>
    </html>
  );
}
