import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
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
  title: {
    default: "Rajalakshmi Fireworks | Premium Crackers & Fireworks",
    template: "%s | Rajalakshmi Fireworks",
  },
  description:
    "Shop premium quality fireworks and crackers online. Wide selection of sparklers, flower pots, rockets, chakras, fountains, and gift boxes. Direct from Sivakasi.",
  keywords: [
    "fireworks",
    "crackers",
    "sparklers",
    "Diwali crackers",
    "Sivakasi fireworks",
    "buy crackers online",
    "flower pots",
    "rockets",
    "gift boxes",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Rajalakshmi Fireworks",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
