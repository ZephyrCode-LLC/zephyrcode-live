import "@/styles/sites/wisp.css";
import { getSites, type Site } from "@/lib/content";
import { TopBar } from "@/components/system/TopBar";
import { Vignette } from "@/components/system/Vignette";
import { Constellation } from "@/components/system/Constellation";
import { RevealManager } from "@/components/system/Reveal";

/**
 * wisp.zephyrcode.live — the featherweight macOS browser.
 * Copy is intentionally inline (this is a download page, not DB-managed editorial).
 * Everything else — tokens, system chrome, reveal, per-site accent — comes from the
 * shared design system, so it wears the constellation's look automatically.
 */

const STATS = [
  { v: "29 MB", k: "idle shell" },
  { v: "~61 MB", k: "whole browser, one page" },
  { v: "0", k: "trackers · telemetry" },
];

const FEATURES = [
  { n: "01", h: "A native shell", p: "A native AppKit app — not a second browser engine bundled inside a wrapper. The window itself barely registers." },
  { n: "02", h: "Real tab suspension", p: "Idle background tabs are torn down to free their memory, then rebuilt instantly with scroll position and form state intact." },
  { n: "03", h: "Blocking by default", p: "Ad and tracker requests are stopped inside WebKit, so less JavaScript is ever fetched, parsed, or run." },
  { n: "04", h: "Zero telemetry", p: "No analytics, no phone-home, no remote safe-browsing lookups. What you browse stays on your Mac." },
  { n: "05", h: "The same engine", p: "Built on WKWebView — the engine behind Safari — so pages render exactly as they should, just with far less around them." },
  { n: "06", h: "Lighter on battery", p: "Fewer live processes and less background JavaScript mean less CPU churn, and more hours away from the charger." },
];

// Whole-browser memory on one light page. Wisp is measured; the others are typical
// fresh-launch figures and vary by machine and page.
const BARS = [
  { name: "Wisp", mb: 61, me: true },
  { name: "Safari", mb: 250, me: false },
  { name: "Chrome", mb: 420, me: false },
];
const MAX = Math.max(...BARS.map((b) => b.mb));

const SOURCE_URL = "https://github.com/zephyrcode/wisp";
// GitHub Releases "latest" — serves the newest release's Wisp.dmg asset automatically.
// Replace `zephyrcode/wisp` with the real repo, then `make dist` + attach Wisp.dmg to a release.
const DOWNLOAD_URL = `${SOURCE_URL}/releases/latest/download/Wisp.dmg`;

export default async function WispPage() {
  let sites: Site[] = [];
  try {
    sites = await getSites("wisp");
  } catch {
    sites = [];
  }
  const wispSite: Site = {
    slug: "wisp",
    host: "wisp.zephyrcode.live",
    title: "Wisp",
    description: "",
    accent: "#7cc7e8",
    og_image: null,
    nav_order: 99,
  };
  const constellation = sites.some((s) => s.slug === "wisp") ? sites : [...sites, wispSite];

  return (
    <>
      <Vignette />
      <TopBar crumb="WISP" />

      <main>
        {/* hero */}
        <section className="hero">
          <p className="eyebrow rv">Native · Private · macOS</p>
          <h1 className="rv">
            Wisp — the <em>featherweight</em> browser.
          </h1>
          <p className="lede rv">
            Same WebKit engine as Safari, a fraction of the footprint. Idle tabs are{" "}
            <b>suspended to give your memory back</b>. Trackers are blocked by default.
            Nothing phones home.
          </p>

          <div className="stats rv">
            {STATS.map((s) => (
              <div className="stat" key={s.k}>
                <b>{s.v}</b>
                <span>{s.k}</span>
              </div>
            ))}
          </div>
        </section>

        {/* features */}
        <section className="features">
          <p className="eyebrow rv">Less, on purpose</p>
          <h2 className="rv">What makes it light</h2>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <article className="feature-card rv" key={f.n}>
                <span className="no">{f.n}</span>
                <h3>{f.h}</h3>
                <p>{f.p}</p>
              </article>
            ))}
          </div>
        </section>

        {/* footprint comparison */}
        <section className="fp">
          <p className="eyebrow rv">Footprint, not bloat</p>
          <h2 className="rv">See the difference</h2>
          <div className="fp-card rv">
            {BARS.map((b) => (
              <div className="fp-row" key={b.name}>
                <span className="fp-name">{b.name}</span>
                <div className="fp-track">
                  <div
                    className={`fp-fill${b.me ? " me" : ""}`}
                    style={{ width: `${(b.mb / MAX) * 100}%` }}
                  >
                    <span className="fp-val">{b.mb} MB</span>
                  </div>
                </div>
              </div>
            ))}
            <p className="fp-note">
              Whole-browser memory on one light page (app + WebKit helper processes).
              Wisp measured on macOS 27 / Apple Silicon; Safari &amp; Chrome are typical
              fresh-launch figures and vary by machine and page.
            </p>
          </div>
        </section>

        {/* download */}
        <section className="download">
          <p className="eyebrow rv">Get Wisp</p>
          <h2 className="rv">A browser that gets out of your way — and out of your RAM.</h2>
          <p className="sub rv">
            Requires macOS 14+ · Apple Silicon. A notarized download is on the way — or
            build it yourself in one command.
          </p>
          <div className="btnrow rv">
            <a className="btn solid" href={DOWNLOAD_URL}>
              Download for macOS
            </a>
            <a className="btn ghost" href={SOURCE_URL} target="_blank" rel="noreferrer">
              Build from source
            </a>
          </div>
          <pre className="code rv">
{`git clone ${SOURCE_URL}.git
cd wisp
make run   # build → bundle → sign → launch`}
          </pre>
        </section>
      </main>

      <RevealManager />
      <Constellation sites={constellation} current="wisp" />
    </>
  );
}
