/**
 * Root sitemap index for the whole zephyrcode.live domain.
 *
 * A sitemap can only list URLs from its own host, so each subdomain serves its own
 * /sitemap.xml (see sitemap.ts). This index ties them together: submit THIS file
 * once in a Search Console **Domain property** (`zephyrcode.live`, DNS-verified —
 * which covers the apex and every subdomain) and Google fans out to each host's
 * sitemap. Cross-host entries are only honoured under a Domain property; that's the
 * one prerequisite.
 *
 * HOSTS lists every host on the domain that currently serves a sitemap and resolves
 * in DNS. `temper.zephyrcode.live` and `book.zephyrcode.live` are intentionally
 * omitted — they are NXDOMAIN today (DNS not pointed); add them here once live so
 * the index never references a host Google can't fetch.
 */

export const dynamic = "force-static";
export const revalidate = 86400;

const HOSTS = [
  "zephyrcode.live", // hub
  "antyodaya.zephyrcode.live",
  "stories.zephyrcode.live",
  "operator.zephyrcode.live",
  "arcade.zephyrcode.live",
  "read.zephyrcode.live",
  "watch.zephyrcode.live",
  "listen.zephyrcode.live",
  "arena.zephyrcode.live", // separate app, same root domain
];

export function GET() {
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    HOSTS.map((h) => `  <sitemap><loc>https://${h}/sitemap.xml</loc></sitemap>`).join("\n") +
    `\n</sitemapindex>\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
