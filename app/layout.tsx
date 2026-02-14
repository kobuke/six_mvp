import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "SIX",
  description: "読んだら6分で消えるメッセージ。6時間後に部屋は閉じる。痕跡を残さない、二人だけの特別な空間。",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
  keywords: ["chat", "ephemeral", "privacy", "secure messaging", "SiX", "SIX"],
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-dvh">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased h-dvh overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
