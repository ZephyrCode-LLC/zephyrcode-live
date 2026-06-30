import { NextRequest, NextResponse } from "next/server";

/**
 * Host → site slug. One app, many hosts (BRIEF §2). `audits` is special — a
 * standalone static landing (public/audits.html), not a CMS-driven room.
 * Local dev: `home.localhost:3000`-style hosts AND a `?site=` fallback.
 * Unknown hosts → home. `/_sites` URLs are never exposed publicly.
 */
const HOSTS: Record<string, string> = {
  "zephyrcode.live": "home",
  "www.zephyrcode.live": "home",
  "antyodaya.zephyrcode.live": "antyodaya",
  "stories.zephyrcode.live": "stories",
  "operator.zephyrcode.live": "operator",
  "temper.zephyrcode.live": "temper",
  "arcade.zephyrcode.live": "arcade",
  "read.zephyrcode.live": "read",
  "watch.zephyrcode.live": "watch",
  "listen.zephyrcode.live": "listen",
  "audits.zephyrcode.live": "audits",
};

const SLUGS = new Set(Object.values(HOSTS));

function slugForHost(host: string, url: URL): string {
  const bare = host.split(":")[0].toLowerCase();
  if (HOSTS[bare]) return HOSTS[bare];
  // dev: home.localhost / read.localhost …
  const sub = bare.endsWith(".localhost") ? bare.replace(/\.localhost$/, "") : null;
  if (sub && SLUGS.has(sub)) return sub;
  // dev fallback: ?site=read
  const q = url.searchParams.get("site");
  if (q && SLUGS.has(q)) return q;
  // Netlify previews / unknown hosts
  return "home";
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host") ?? "";

  // Never expose /sites publicly: bounce to the canonical host's root.
  if (url.pathname.startsWith("/sites")) {
    const slug = url.pathname.split("/")[2] ?? "home";
    const canonical =
      Object.entries(HOSTS).find(([h, s]) => s === slug && !h.startsWith("www."))?.[0] ??
      "zephyrcode.live";
    if (!host.includes("localhost")) {
      return NextResponse.redirect(`https://${canonical}/`, 308);
    }
  }

  if (url.pathname === "/") {
    const slug = slugForHost(host, url);
    const rewritten = url.clone();
    // audits is a standalone landing served from a route handler (src/app/audits),
    // not a CMS room — rewriting to the public/*.html file 404s on Amplify.
    rewritten.pathname = slug === "audits" ? "/audits" : `/sites/${slug}`;
    return NextResponse.rewrite(rewritten);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/sites/:path*"],
};
