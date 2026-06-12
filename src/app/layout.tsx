import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});
const jbmono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-jbmono",
  display: "swap",
});

export const metadata: Metadata = {
  // P0-2: relative og:image/canonical URLs must resolve to a real domain,
  // never the serving host (which is a rewrite target on subdomains)
  metadataBase: new URL("https://zephyrcode.live"),
  title: "ZephyrCode",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jbmono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
