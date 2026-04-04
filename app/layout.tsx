import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Serif, Work_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

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
  weight: ["400", "700"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Liceu",
  description: "Escola de pensamento aplicado à fala.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${uiSans.variable} ${uiMono.variable} ${notoSerif.variable} ${workSans.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-[var(--liceu-primary)] focus:text-[var(--liceu-text)] focus:px-4 focus:py-2"
        >
          Pular para o conteúdo
        </a>
        <SiteHeader />
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
