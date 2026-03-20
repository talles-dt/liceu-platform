import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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
        className={`${uiSans.variable} ${uiMono.variable} antialiased`}
      >
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
