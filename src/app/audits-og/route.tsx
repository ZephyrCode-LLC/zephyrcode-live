import { ImageResponse } from "next/og";

/**
 * OG card for the standalone Engineering Audits landing (audits.zephyrcode.live).
 * audits.html is a hand-rolled document with its own <head>, so it can't use the
 * file-based opengraph-image convention — its og:image points here at a fixed URL
 * (/audits-og). Diagnostic-instrument palette: graphite ground, one cyan signal.
 */

export const revalidate = 300;

const INK = "#0A0C0F";
const SIGNAL = "#3DE1E6";
const PAPER = "#EEF2F6";
const size = { width: 1200, height: 630 };

export function GET() {
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
            border: `3px solid ${SIGNAL}`,
            borderRadius: 18,
            padding: "56px 64px",
            background: "linear-gradient(180deg, #14181F 0%, #0A0C0F 70%)",
          }}
        >
          <div style={{ display: "flex", color: SIGNAL, fontSize: 26, letterSpacing: 8 }}>
            ZEPHYRCODE
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ color: PAPER, fontSize: 84, fontWeight: 700, letterSpacing: 1, lineHeight: 1.1 }}>
              Engineering Audits
            </div>
            <div style={{ color: "rgba(238,242,246,0.66)", fontSize: 32, lineHeight: 1.45, maxWidth: 920 }}>
              Fixed-scope · fixed-price · the price on the door
            </div>
          </div>
          <div style={{ display: "flex", color: "rgba(238,242,246,0.5)", fontSize: 22, letterSpacing: 6 }}>
            audits.zephyrcode.live
          </div>
        </div>
      </div>
    ),
    size
  );
}
