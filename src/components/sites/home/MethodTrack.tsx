"use client";

import { useEffect, useRef } from "react";

/**
 * The Method — animated. A faithful port of the designer's "each card performs its
 * verb" section (The Method - Animated Section): Descend falls in on a gravity
 * curve with ember dust; Compress starts loose and crushes to a dense block as two
 * brackets close; Animate springs a dead flat line into a living waveform and wakes
 * the text line by line; Ship assembles, fires a launch streak, lifts off, and types
 * its own live address. The row performs the pipeline as a relay when the section
 * scrolls in (progress thread fills, each move lights as the wave reaches it); click
 * any card to replay just that move. prefers-reduced-motion → settled, static.
 *
 * CMS-driven: titles (h3) + eyebrows (k) come straight from the `method.moves`
 * blocks; the line-cards split their body into sentence-lines for the reveal, the
 * compress card crushes its whole body. Motion is the only thing this layer adds.
 */

type Move = { k: string; h3: string; p: string };

const SETTLE = [0.16, 1, 0.3, 1];
const GRAV = [0.3, 0.9, 0.4, 1.05];
const cssBez = (p: number[]) => `cubic-bezier(${p.join(",")})`;
const SHIP_ADDR = "antyodaya.zephyrcode.live";

const sentences = (p: string): string[] =>
  p
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

function bez(u: number, a: number, b: number) {
  const m = 1 - u;
  return 3 * m * m * u * a + 3 * m * u * u * b + u * u * u;
}
function easeY(t: number, p: number[]) {
  let u = t;
  for (let i = 0; i < 8; i++) {
    const x = bez(u, p[0], p[2]);
    const dx = 3 * (1 - u) * (1 - u) * p[0] + 6 * (1 - u) * u * (p[2] - p[0]) + 3 * u * u * (1 - p[2]);
    if (Math.abs(dx) < 1e-6) break;
    u = Math.max(0, Math.min(1, u - (x - t) / dx));
  }
  return bez(u, p[1], p[3]);
}

export function MethodTrack({ moves }: { moves: Move[] }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const timers: ReturnType<typeof setTimeout>[] = [];
    let dustRaf = 0;
    let waveRaf = 0;
    let animOn = false;
    const after = (ms: number, fn: () => void) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };
    const clearTimers = () => {
      timers.forEach(clearTimeout);
      timers.length = 0;
    };

    const card = (i: number) => el.querySelector<HTMLElement>(`[data-move="${i}"]`);
    const progress = el.querySelector<HTMLElement>("[data-progress]");
    const allCards = [0, 1, 2, 3].map(card);

    // ---- baseline visible (settled) state ----
    const resetChip = () => {
      const c3 = card(3);
      if (!c3) return;
      const chip = c3.querySelector<HTMLElement>("[data-chip]");
      const addr = c3.querySelector<HTMLElement>("[data-addr]");
      const dot = c3.querySelector<HTMLElement>("[data-dot]");
      const live = c3.querySelector<HTMLElement>("[data-live]");
      const streak = c3.querySelector<HTMLElement>("[data-streak]");
      if (chip) { chip.style.transition = "none"; chip.style.opacity = "0"; chip.style.transform = "translateY(4px)"; }
      if (addr) addr.textContent = "";
      if (dot) dot.style.background = "var(--bone-faint, #5f574d)";
      if (live) { live.style.opacity = "0"; live.style.animation = "none"; }
      if (streak) { streak.style.transition = "none"; streak.style.transform = "scaleX(0)"; streak.style.opacity = "0"; }
    };
    const drawWave = (amp: number, t: number) => {
      const path = card(2)?.querySelector<SVGPathElement>("[data-wave]");
      if (!path) return;
      const W = 210, N = 42;
      let d = "";
      for (let i = 0; i <= N; i++) {
        const x = (i / N) * W;
        const y = 11 + Math.sin(i * 0.5 - t * 5) * amp * Math.sin((i / N) * Math.PI);
        d += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1) + " ";
      }
      path.setAttribute("d", d.trim());
    };
    const setStatic = () => {
      allCards.forEach((c) => { if (c) c.style.opacity = "1"; });
      const c3 = card(3);
      if (c3) { c3.style.transform = "translateY(0)"; c3.style.boxShadow = "none"; }
      card(0)?.querySelectorAll<HTMLElement>("[data-fall]").forEach((n) => { n.style.transition = "none"; n.style.transform = "translateY(0)"; n.style.opacity = "1"; });
      const body = card(1)?.querySelector<HTMLElement>("[data-body]");
      if (body) { body.style.transition = "none"; body.style.letterSpacing = "0"; body.style.lineHeight = "1.62"; body.style.opacity = "1"; }
      card(1)?.querySelectorAll<HTMLElement>("[data-bracket]").forEach((b) => (b.style.opacity = "0"));
      card(2)?.querySelectorAll<HTMLElement>("[data-ln]").forEach((n) => { n.style.transition = "none"; n.style.opacity = "1"; n.style.color = "var(--bone)"; });
      animOn = false; cancelAnimationFrame(waveRaf);
      drawWave(0, 0);
      card(3)?.querySelectorAll<HTMLElement>("[data-ln]").forEach((n) => { n.style.transition = "none"; n.style.transform = "translateY(0)"; n.style.opacity = "1"; });
      resetChip();
    };

    const dim = (except: number | null) => {
      allCards.forEach((c, i) => { if (c) { c.style.transition = "opacity .5s " + cssBez(SETTLE); c.style.opacity = except == null || i === except ? "1" : ".32"; } });
    };
    const undim = () => {
      allCards.forEach((c) => { if (c) { c.style.transition = "opacity .6s " + cssBez(SETTLE); c.style.opacity = "1"; } });
    };

    // ---- descend ambient dust ----
    let dctx: CanvasRenderingContext2D | null = null;
    let dw = 0, dh = 0;
    const initDust = () => {
      const c = card(0)?.querySelector<HTMLCanvasElement>("canvas");
      if (!c) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      dw = c.clientWidth || 250; dh = c.clientHeight || 330;
      c.width = dw * dpr; c.height = dh * dpr;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr); dctx = ctx;
    };
    const rainDust = () => {
      if (!dctx) return;
      const ctx = dctx, w = dw, h = dh;
      const drops = Array.from({ length: 46 }, () => ({ x: Math.random() * w, y: -Math.random() * h * 0.6, vy: 0.6 + Math.random() * 1.6, r: 0.6 + Math.random() * 1.4, rest: h * (0.55 + Math.random() * 0.4), done: false }));
      const start = performance.now();
      cancelAnimationFrame(dustRaf);
      const frame = (now: number) => {
        ctx.clearRect(0, 0, w, h);
        let alive = false;
        for (const d of drops) {
          if (!d.done) { d.y += d.vy; d.vy += 0.06; if (d.y >= d.rest) { d.y = d.rest; d.done = true; } else alive = true; }
          ctx.beginPath(); ctx.fillStyle = "rgba(224,103,58," + (d.done ? 0.5 : 0.8) + ")"; ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
        }
        if (alive && now - start < 3000) dustRaf = requestAnimationFrame(frame);
        else after(1400, () => ctx.clearRect(0, 0, w, h));
      };
      dustRaf = requestAnimationFrame(frame);
    };

    // ============ MOVE 1 — DESCEND ============
    const play0 = () => {
      const c = card(0); if (!c) return;
      const items = [...c.querySelectorAll<HTMLElement>("[data-fall]")];
      if (REDUCED) { items.forEach((n) => { n.style.transform = "translateY(0)"; n.style.opacity = "1"; }); return; }
      items.forEach((n) => { n.style.transition = "none"; n.style.transform = "translateY(-26px)"; n.style.opacity = "0"; });
      void c.offsetWidth;
      items.forEach((n, i) => after(i * 80, () => { n.style.transition = "transform 720ms " + cssBez(GRAV) + ", opacity 460ms ease-out"; n.style.transform = "translateY(0)"; n.style.opacity = "1"; }));
      rainDust();
    };

    // ============ MOVE 2 — COMPRESS ============
    const play1 = () => {
      const c = card(1); if (!c) return;
      const body = c.querySelector<HTMLElement>("[data-body]");
      const [bl, br] = [...c.querySelectorAll<HTMLElement>("[data-bracket]")];
      if (!body) return;
      if (REDUCED) { body.style.letterSpacing = "0"; body.style.lineHeight = "1.62"; body.style.opacity = "1"; return; }
      body.style.transition = "none"; body.style.letterSpacing = ".34em"; body.style.lineHeight = "2.5"; body.style.opacity = ".35";
      [bl, br].forEach((b) => { if (b) { b.style.transition = "none"; b.style.opacity = "0"; } });
      if (bl) bl.style.left = "-4px"; if (br) br.style.right = "-4px";
      void body.offsetWidth;
      after(40, () => {
        [bl, br].forEach((b) => { if (b) { b.style.transition = "left 780ms " + cssBez(SETTLE) + ", right 780ms " + cssBez(SETTLE) + ", opacity 200ms ease"; b.style.opacity = ".9"; } });
        if (bl) bl.style.left = "4px"; if (br) br.style.right = "4px";
        body.style.transition = "letter-spacing 820ms " + cssBez(SETTLE) + ", line-height 820ms " + cssBez(SETTLE) + ", opacity 600ms ease-out";
        body.style.letterSpacing = "0"; body.style.lineHeight = "1.62"; body.style.opacity = "1";
      });
      after(1180, () => { [bl, br].forEach((b) => { if (b) { b.style.transition = "opacity 500ms ease"; b.style.opacity = "0"; } }); });
    };

    // ============ MOVE 3 — ANIMATE ============
    const startWave = (instant: boolean) => {
      cancelAnimationFrame(waveRaf);
      if (instant || REDUCED) { drawWave(6, 0); return; }
      const start = performance.now(); animOn = true;
      const frame = (now: number) => {
        const t = now / 1000; const ramp = Math.min(1, (now - start) / 700); const amp = easeY(ramp, SETTLE) * 6.5;
        drawWave(amp, t);
        if (animOn) waveRaf = requestAnimationFrame(frame);
      };
      waveRaf = requestAnimationFrame(frame);
    };
    const play2 = () => {
      const c = card(2); if (!c) return;
      const lines = [...c.querySelectorAll<HTMLElement>("[data-ln]")];
      if (REDUCED) { lines.forEach((n) => { n.style.opacity = "1"; n.style.color = "var(--bone)"; }); startWave(true); return; }
      lines.forEach((n) => { n.style.transition = "none"; n.style.opacity = ".32"; n.style.color = "var(--bone-dim)"; });
      void c.offsetWidth;
      lines.forEach((n, i) => after(220 + i * 120, () => { n.style.transition = "opacity 520ms ease-out, color 520ms ease-out"; n.style.opacity = "1"; n.style.color = "var(--bone)"; }));
      startWave(false);
    };

    // ============ MOVE 4 — SHIP ============
    const shipChip = (instant: boolean) => {
      const c3 = card(3); if (!c3) return;
      const chip = c3.querySelector<HTMLElement>("[data-chip]");
      const addr = c3.querySelector<HTMLElement>("[data-addr]");
      const dot = c3.querySelector<HTMLElement>("[data-dot]");
      const live = c3.querySelector<HTMLElement>("[data-live]");
      if (chip) { chip.style.transition = instant ? "none" : "opacity 380ms ease, transform 480ms " + cssBez(SETTLE); chip.style.opacity = "1"; chip.style.transform = "translateY(0)"; }
      if (instant) { if (addr) addr.textContent = SHIP_ADDR; if (dot) dot.style.background = "var(--live, #6FCF97)"; if (live) live.style.opacity = "1"; return; }
      if (addr) {
        addr.textContent = ""; let i = 0;
        const type = () => {
          if (i <= SHIP_ADDR.length) { addr.textContent = SHIP_ADDR.slice(0, i); i++; after(26, type); }
          else { if (dot) { dot.style.transition = "background 300ms ease"; dot.style.background = "var(--live, #6FCF97)"; } if (live) { live.style.transition = "opacity 300ms ease"; live.style.opacity = "1"; live.style.animation = "ma-blink 1.4s step-end infinite"; } }
        };
        type();
      }
    };
    const play3 = () => {
      const c = card(3); if (!c) return;
      const lines = [...c.querySelectorAll<HTMLElement>("[data-ln]")];
      resetChip();
      if (REDUCED) { lines.forEach((n) => { n.style.opacity = "1"; n.style.transform = "translateY(0)"; }); shipChip(true); return; }
      lines.forEach((n) => { n.style.transition = "none"; n.style.opacity = ".32"; n.style.transform = "translateY(6px)"; });
      void c.offsetWidth;
      lines.forEach((n, i) => after(i * 70, () => { n.style.transition = "transform 520ms " + cssBez(SETTLE) + ", opacity 400ms ease-out"; n.style.opacity = "1"; n.style.transform = "translateY(0)"; }));
      after(360, () => {
        const s = c.querySelector<HTMLElement>("[data-streak]");
        if (s) { s.style.transition = "none"; s.style.transform = "scaleX(0)"; s.style.opacity = "1"; void s.offsetWidth; s.style.transition = "transform 420ms " + cssBez([0.4, 0, 0.2, 1]); s.style.transform = "scaleX(1)"; }
        after(420, () => { if (s) { s.style.transition = "transform 360ms ease-in, opacity 360ms ease-in"; s.style.transformOrigin = "right"; s.style.transform = "scaleX(0)"; s.style.opacity = "0"; } });
        c.style.transform = "translateY(-6px)"; c.style.boxShadow = "0 18px 40px -20px rgba(0,0,0,.7)";
      });
      after(560, () => shipChip(false));
    };

    const plays = [play0, play1, play2, play3];

    // ============ THE WHOLE METHOD (relay) ============
    const runMethod = () => {
      clearTimers(); setStatic();
      if (REDUCED) { plays.forEach((p) => p()); if (progress) progress.style.width = "100%"; return; }
      if (progress) { progress.style.transition = "none"; progress.style.width = "0%"; void progress.offsetWidth; progress.style.transition = "width 3600ms linear"; progress.style.width = "100%"; }
      dim(0); play0();
      after(900, () => { dim(1); play1(); });
      after(1800, () => { dim(2); play2(); });
      after(2700, () => { dim(3); play3(); });
      after(3700, () => undim());
    };

    // click (or Enter/Space) any card → replay just that move
    const listeners: Array<[HTMLElement, "click" | "keydown", EventListener]> = [];
    allCards.forEach((c, i) => {
      if (!c) return;
      const replay = () => { clearTimers(); plays[i](); };
      const onClick: EventListener = () => replay();
      const onKey: EventListener = (ev) => {
        const k = (ev as KeyboardEvent).key;
        if (k === "Enter" || k === " ") { ev.preventDefault(); replay(); }
      };
      c.addEventListener("click", onClick);
      c.addEventListener("keydown", onKey);
      listeners.push([c, "click", onClick], [c, "keydown", onKey]);
    });

    setStatic();
    initDust();

    // Fire the relay once, when the section enters view. IntersectionObserver is the
    // primary trigger; a passive scroll listener + initial check are the fallback,
    // because IO is suspended in a backgrounded/hidden tab (the same reason
    // RevealManager guards the hero against a slow/suspended observer).
    //
    // Fire the relay each time the row (re-)enters the viewport, re-arming once it fully
    // leaves — so scrolling BACK to the section replays it, instead of a single one-time
    // fire that leaves it sitting settled forever after the first (often fast) pass.
    // `threshold: 0` + a bottom rootMargin makes the trigger height-independent (a high
    // ratio threshold is unreachable when the row is taller than the viewport) and roots at
    // the viewport, so it works even if an ancestor — not window — is the scroll container.
    let armed = true;
    let lastRun = -1e9;
    const runOnce = () => {
      if (!armed) return;
      // Cooldown: never restart the relay mid-play. When a door-jump parks the row
      // straddling the observer boundary it can oscillate isIntersecting; without this
      // guard runMethod re-fires every ~1s and the cards flicker forever.
      const now = performance.now();
      if (now - lastRun < 4500) return;
      armed = false;
      lastRun = now;
      clearTimers();
      after(140, runMethod);
    };
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) runOnce();
          else {
            // Re-arm (to replay on a later scroll-back) ONLY once the row is fully out of
            // view — not merely past the -22% margin — so a partially-visible section can't
            // ping-pong the observer and re-trigger the relay in a loop.
            const vh = window.innerHeight || document.documentElement.clientHeight;
            if (e.boundingClientRect.bottom <= 0 || e.boundingClientRect.top >= vh) armed = true;
          }
        }),
      { threshold: 0, rootMargin: "0px 0px -22% 0px" }
    );
    io.observe(el);

    return () => {
      clearTimers();
      cancelAnimationFrame(dustRaf);
      cancelAnimationFrame(waveRaf);
      io.disconnect();
      listeners.forEach(([c, type, fn]) => c.removeEventListener(type, fn));
    };
  }, []);

  const m = (i: number): Move => moves[i] ?? { k: "", h3: "", p: "" };

  return (
    <div className="ma-track" ref={root}>
      <div className="ma-progress-track" aria-hidden="true">
        <div className="ma-progress" data-progress />
      </div>

      <div className="ma-grid">
        {/* MOVE 1 — DESCEND */}
        <div className="ma-card" data-move="0" role="button" tabIndex={0} aria-label={`Replay ${m(0).h3}`}>
          <canvas className="ma-dust" aria-hidden="true" />
          <div className="ma-inner">
            <div className="ma-eyebrow" data-fall>{m(0).k}</div>
            <div className="ma-title" data-fall>{m(0).h3}</div>
            <div className="ma-body-lines">
              {sentences(m(0).p).map((ln, i) => (
                <div className="ma-ln" data-fall data-ln key={i}>{ln}</div>
              ))}
            </div>
          </div>
        </div>

        {/* MOVE 2 — COMPRESS */}
        <div className="ma-card" data-move="1" role="button" tabIndex={0} aria-label={`Replay ${m(1).h3}`}>
          <div className="ma-bracket ma-bracket-l" data-bracket aria-hidden="true" />
          <div className="ma-bracket ma-bracket-r" data-bracket aria-hidden="true" />
          <div className="ma-inner">
            <div className="ma-eyebrow">{m(1).k}</div>
            <div className="ma-title">{m(1).h3}</div>
            <div className="ma-body" data-body>{m(1).p}</div>
          </div>
        </div>

        {/* MOVE 3 — ANIMATE */}
        <div className="ma-card" data-move="2" role="button" tabIndex={0} aria-label={`Replay ${m(2).h3}`}>
          <div className="ma-inner">
            <div className="ma-eyebrow">{m(2).k}</div>
            <div className="ma-title ma-title-tight">{m(2).h3}</div>
            <svg className="ma-wave" viewBox="0 0 210 22" aria-hidden="true">
              <path data-wave d="M0,11 L210,11" fill="none" stroke="#E0673A" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="ma-body-lines">
              {sentences(m(2).p).map((ln, i) => (
                <div className="ma-ln" data-ln key={i}>{ln}</div>
              ))}
            </div>
          </div>
        </div>

        {/* MOVE 4 — SHIP */}
        <div className="ma-card ma-card-ship" data-move="3" role="button" tabIndex={0} aria-label={`Replay ${m(3).h3}`}>
          <div className="ma-streak" data-streak aria-hidden="true" />
          <div className="ma-inner">
            <div className="ma-eyebrow">{m(3).k}</div>
            <div className="ma-title">{m(3).h3}</div>
            <div className="ma-chip" data-chip aria-hidden="true">
              <span className="ma-dot" data-dot />
              <span className="ma-addr mono" data-addr />
              <span className="ma-live mono" data-live>LIVE</span>
            </div>
            <div className="ma-body-lines">
              {sentences(m(3).p).map((ln, i) => (
                <div className="ma-ln" data-ln key={i}>{ln}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
