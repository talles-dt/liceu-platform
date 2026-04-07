import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Serif, Work_Sans, Space_Grotesk, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { Analytics } from "@/components/Analytics";
import * as Sentry from "@sentry/nextjs";

const uiSans = Inter({
  variable: "--font-liceu-sans",
  subsets: ["latin"],
});

const uiMono = JetBrains_Mono({
  variable: "--font-liceu-mono",
  subsets: ["latin"],
});

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Liceu Underground — Escola de pensamento aplicado à fala",
    template: "%s | Liceu Underground",
  },
  description:
    "Uma escola de pensamento aplicado à fala. Fundada na retórica clássica. Construída para quem colapsa onde mais importa.",
  keywords: ["retórica", "oratória", "pensamento crítico", "comunicação", "Liceu"],
  authors: [{ name: "Liceu Underground" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://www.oliceu.com",
    siteName: "Liceu Underground",
    title: "Liceu Underground — Escola de pensamento aplicado à fala",
    description:
      "Fundada na retórica clássica. Construída para quem colapsa onde mais importa.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Liceu Underground",
    description: "Escola de pensamento aplicado à fala.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Sentry.ErrorBoundary
      fallback={
        <div className="min-h-screen bg-[var(--liceu-bg)] text-[var(--liceu-text)] flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-critical)]">
              Something went wrong
            </div>
            <p className="mt-4 font-[var(--font-work-sans)] text-sm text-[var(--liceu-muted)]">
              The application encountered an unexpected error. Please try refreshing the page.
            </p>
          </div>
        </div>
      }
    >
      <html lang="pt-BR">
        <body
          className={`${uiSans.variable} ${uiMono.variable} ${notoSerif.variable} ${workSans.variable} ${spaceGrotesk.variable} ${robotoMono.variable} antialiased`}
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-[var(--liceu-primary)] focus:text-[var(--liceu-text)] focus:px-4 focus:py-2"
          >
            Pular para o conteúdo
          </a>
          <SiteHeader />
          <Analytics />
          <main id="main-content">{children}</main>
        </body>
      </html>
    </Sentry.ErrorBoundary>
  );
}
