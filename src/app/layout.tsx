import type { Metadata } from "next";
import { Fraunces, Spectral, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});
// The hub's literary serif (Constellation Review). Scoped to [data-site="home"] via --serif.
const spectral = Spectral({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
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
  // Google Search Console: the tag is served on the apex AND every subdomain (one
  // app, many hosts), so it verifies each as a URL-prefix property via meta-tag.
  // (A Domain property still uses the DNS TXT with this same token.)
  verification: { google: "nvvu1A3gCs5B51M4DSihe8w5OeuWF0M0XKSGiXy6LFA" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${spectral.variable} ${jbmono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
