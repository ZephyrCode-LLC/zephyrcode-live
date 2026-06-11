import { ImageResponse } from "next/og";
import { getSims } from "@/lib/content";

/**
 * Per-machine OG image in the cabinet art style (ink/bone/ember/brass,
 * brass cabinet frame, grammar coin). Rendered by next/og — one stable
 * image URL per machine, so shared links unfurl with the right card.
 */

export const revalidate = 3600;
export const alt = "THE ARCADE — playable arguments";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0D0B09";
const BONE = "#ECE2D3";
const EMBER = "#E85D2A";
const BRASS = "#C9A45C";

export default async function Image({ params }: { params: Promise<{ machine: string }> }) {
  const { machine } = await params;
  const sims = await getSims("arcade");
  const sim = sims.find((s) => s.slug === machine);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
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
            border: `3px solid ${BRASS}`,
            borderRadius: 18,
            padding: "56px 64px",
            background: "linear-gradient(180deg, #14110D 0%, #0D0B09 70%)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: EMBER,
              fontSize: 26,
              letterSpacing: 8,
            }}
          >
            <span>THE ARCADE</span>
            <span style={{ color: BRASS, fontSize: 22 }}>PLAYABLE ARGUMENTS</span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 26,
            }}
          >
            <div style={{ color: BONE, fontSize: 92, fontWeight: 700, letterSpacing: 2 }}>
              {sim?.name ?? "THE ARCADE"}
            </div>
            <div style={{ color: "rgba(236,226,211,0.62)", fontSize: 32, lineHeight: 1.4, maxWidth: 900 }}>
              {sim?.blurb ?? ""}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: INK,
                background: BRASS,
                borderRadius: 999,
                padding: "10px 26px",
                fontSize: 24,
                letterSpacing: 3,
              }}
            >
              {sim?.grammar ?? ""}
            </span>
            <span style={{ color: "rgba(236,226,211,0.5)", fontSize: 24, letterSpacing: 4 }}>
              arcade.zephyrcode.live/m/{machine}
            </span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
