import { ImageResponse } from "next/og";
import { getSite } from "@/lib/content";

/**
 * P0-2: default OG card per site (the arcade landing previously had no
 * og:image at all). Ink ground, site-accent frame, title + description —
 * one stable URL per site, resolved absolute via the root metadataBase.
 */

export const revalidate = 300;
export const alt = "ZephyrCode";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0D0B09";
const BONE = "#ECE2D3";

export default async function Image({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  const row = await getSite(site).catch(() => null);
  const accent = row?.accent ?? "#E85D2A";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: INK,
          padding: 48,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: `3px solid ${accent}`,
            borderRadius: 18,
            padding: "56px 64px",
            background: "linear-gradient(180deg, #14110D 0%, #0D0B09 70%)",
          }}
        >
          <div style={{ display: "flex", color: accent, fontSize: 26, letterSpacing: 8 }}>
            {(row?.host ?? "zephyrcode.live").toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ color: BONE, fontSize: 76, fontWeight: 700, letterSpacing: 1, lineHeight: 1.1 }}>
              {row?.title?.split("—")[0]?.trim() ?? "ZEPHYRCODE"}
            </div>
            <div style={{ color: "rgba(236,226,211,0.66)", fontSize: 30, lineHeight: 1.45, maxWidth: 920 }}>
              {row?.description ?? ""}
            </div>
          </div>
          <div style={{ display: "flex", color: "rgba(236,226,211,0.5)", fontSize: 22, letterSpacing: 6 }}>
            ZEPHYR·CODE
          </div>
        </div>
      </div>
    ),
    size
  );
}
