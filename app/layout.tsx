import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit, Rubik, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
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
      className={`${plusJakartaSans.variable} ${outfit.variable} ${rubik.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
