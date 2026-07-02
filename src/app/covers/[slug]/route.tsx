import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { COVERS, DEFAULT_BYLINE } from "@/lib/cover-specs";

/**
 * Spec-driven post covers (Substack/social). 2400×1260 output (2× of 1200×630)
 * so type stays retina-sharp when platforms recompress. Only slugs in the
 * versioned spec sheet render — no arbitrary-text generation with our branding.
 *
 * Teardown-brand composition: graphite ground, JetBrains Mono eyebrow, Fraunces
 * title with an italic cyan accent tail, chip row, byline rail, and the audits
 * signal-trace as the signature.
 */

export const revalidate = 3600;

const INK = "#0A0C0F";
const PAPER = "#EEF2F6";
const DIM = "#AEB8C4";
const FAINT = "#8593A2";
const SIGNAL = "#3DE1E6";

// 1200×630 design units, rendered at 2×.
const S = 2;
const size = { width: 1200 * S, height: 630 * S };

// Colocated static TTFs (satori needs static weights, not variable fonts).
// fs-read lazily inside GET — `fetch(new URL(...))` resolves to file:// under
// turbopack, which undici refuses, and a module-scope throw kills the server.
const FONT_DIR = path.join(process.cwd(), "src/app/covers/fonts");
let fontCache: Promise<Buffer[]> | null = null;
function loadFonts() {
  fontCache ??= Promise.all(
    ["Fraunces-600.ttf", "Fraunces-600i.ttf", "JetBrainsMono-500.ttf"].map((f) =>
      readFile(path.join(FONT_DIR, f))
    )
  );
  return fontCache;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const spec = COVERS[slug];
  if (!spec) return new Response("unknown cover slug", { status: 404 });

  // Fonts are a hard requirement for the brand — but never 500 a live route
  // over a font read; satori falls back to its default face.
  let fonts: NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"];
  try {
    const [f, fi, m] = await loadFonts();
    fonts = [
      { name: "Fraunces", data: f, weight: 600 as const, style: "normal" as const },
      { name: "Fraunces", data: fi, weight: 600 as const, style: "italic" as const },
      { name: "JBMono", data: m, weight: 500 as const, style: "normal" as const },
    ];
  } catch {
    fontCache = null; // don't cache a rejection
    fonts = undefined;
  }

  const byline = spec.byline ?? DEFAULT_BYLINE;
  const domain = spec.domain ?? "audits.zephyrcode.live";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: `linear-gradient(180deg, #12161D 0%, ${INK} 58%)`,
          padding: `${64 * S}px ${84 * S}px ${56 * S}px`,
          position: "relative",
        }}
      >
        {/* signal trace — the audits signature, drawn low and quiet */}
        <svg
          width={1200 * S}
          height={150 * S}
          viewBox="0 0 1200 150"
          style={{ position: "absolute", left: 0, bottom: 92 * S, opacity: 0.22 }}
        >
          <polyline
            points="0,110 210,110 250,110 268,34 286,132 304,74 322,110 560,110 600,110 618,52 636,120 654,110 1040,110 1200,110"
            fill="none"
            stroke={SIGNAL}
            strokeWidth={2.5}
          />
        </svg>
        {/* top hairline in cyan */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200 * S,
            height: 3 * S,
            background: `linear-gradient(90deg, ${SIGNAL} 0%, rgba(61,225,230,0.05) 70%)`,
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14 * S,
            color: SIGNAL,
            fontFamily: "JBMono",
            fontSize: 19 * S,
            letterSpacing: 6 * S,
          }}
        >
          <div style={{ width: 34 * S, height: 2 * S, background: SIGNAL, display: "flex" }} />
          {spec.eyebrow}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 30 * S }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "Fraunces",
              fontSize: 86 * S,
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: -1 * S,
              maxWidth: 1010 * S,
            }}
          >
            <div style={{ color: PAPER }}>{spec.title}</div>
            {spec.accent ? (
              <div style={{ color: SIGNAL, fontStyle: "italic" }}>{spec.accent}</div>
            ) : null}
          </div>
          {spec.chips && spec.chips.length > 0 ? (
            <div style={{ display: "flex", gap: 12 * S }}>
              {spec.chips.map((c) => (
                <div
                  key={c}
                  style={{
                    display: "flex",
                    fontFamily: "JBMono",
                    fontSize: 17 * S,
                    color: DIM,
                    letterSpacing: 1.2 * S,
                    padding: `${9 * S}px ${16 * S}px`,
                    border: `1px solid rgba(150,172,190,0.28)`,
                    borderRadius: 6 * S,
                    background: "rgba(23,28,36,0.6)",
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `1px solid rgba(150,172,190,0.2)`,
            paddingTop: 26 * S,
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "JBMono",
              fontSize: 17 * S,
              color: FAINT,
              letterSpacing: 0.8 * S,
            }}
          >
            {byline}
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "JBMono",
              fontSize: 17 * S,
              color: SIGNAL,
              letterSpacing: 2.4 * S,
            }}
          >
            {domain}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
