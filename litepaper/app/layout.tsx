import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pump or Rug Arena | Litepaper",
  description:
    "Two launchpads. Four predictions every hour. One leaderboard. The degen prediction arena.",
  icons: {
    icon: "/favicon.svg",
  },
  metadataBase: new URL("https://pumporrug.com"),
  openGraph: {
    title: "Pump or Rug Arena",
    description:
      "Two launchpads. Four predictions every hour. One leaderboard. The degen prediction arena.",
    siteName: "Pump or Rug",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pump or Rug Arena",
    description:
      "Two launchpads. Four predictions every hour. One leaderboard. The degen prediction arena.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
