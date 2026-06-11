"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * The read.zephyrcode.live mood dial + heat shelf, a faithful port of the
 * imperative engine in /_reference/read.html. The range input (0–100,
 * default 12) drives three things, exactly as in the source:
 *   1. the ambient `--glow` rgb triplet, set on documentElement, feeding
 *      the fixed .amb layer rendered by this component;
 *   2. book dimming — `.dim` is toggled when |pos − v| > 0.26 (via
 *      classList so the RevealManager's `.in` class survives re-renders);
 *   3. the ask line, picked from the [threshold, text] table.
 * heatColor is the source's exact two-segment lerp ember→brass→iris.
 * Zero content strings live here — labels, ask lines and books are props.
 */

export type ShelfBook = {
  title: string;
  author: string;
  pos: number;
  register: string;
  lang: string;
  note: string;
};

const EMBER = [232, 93, 42];
const BRASS = [201, 164, 92];
const IRIS = [139, 127, 212];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** 0..1 along ember→brass→iris (verbatim from the source). */
function heatColor(p: number): number[] {
  const c =
    p < 0.5
      ? [
          lerp(EMBER[0], BRASS[0], p * 2),
          lerp(EMBER[1], BRASS[1], p * 2),
          lerp(EMBER[2], BRASS[2], p * 2),
        ]
      : [
          lerp(BRASS[0], IRIS[0], (p - 0.5) * 2),
          lerp(BRASS[1], IRIS[1], (p - 0.5) * 2),
          lerp(BRASS[2], IRIS[2], (p - 0.5) * 2),
        ];
  return c.map(Math.round);
}

export function MoodDial({
  fireLabel,
  stillLabel,
  ariaLabel,
  askLines,
  books,
}: {
  fireLabel: string;
  stillLabel: string;
  ariaLabel: string;
  askLines: [number, string][];
  books: ShelfBook[];
}) {
  const [value, setValue] = useState(12);
  const shelfRef = useRef<HTMLElement>(null);

  /* Source `apply()`: glow triplet on documentElement + dim toggles. */
  useEffect(() => {
    const v = value / 100;
    document.documentElement.style.setProperty("--glow", heatColor(v).join(","));
    shelfRef.current?.querySelectorAll<HTMLElement>(".book").forEach((el) => {
      el.classList.toggle("dim", Math.abs(parseFloat(el.dataset.pos ?? "0") - v) > 0.26);
    });
  }, [value]);

  let ask = "";
  for (let i = 0; i < askLines.length - 1; i++) {
    if (value >= askLines[i][0] && value < askLines[i + 1][0]) {
      ask = askLines[i][1];
      break;
    }
  }

  return (
    <>
      <div className="amb" aria-hidden="true" />
      <section className="dial rv">
        <p className="k">
          <span className="f">{fireLabel}</span>
          <span className="s">{stillLabel}</span>
        </p>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          aria-label={ariaLabel}
          onChange={(e) => setValue(Number(e.target.value))}
        />
        <p className="ask">{ask}</p>
      </section>
      <section className="shelf" ref={shelfRef}>
        {books.map((b, i) => (
          <article
            key={b.title}
            className="book rv"
            data-pos={b.pos}
            style={{ "--c": `rgb(${heatColor(b.pos).join(",")})` } as CSSProperties}
          >
            <span className="no">
              {String(i + 1).padStart(2, "0")} / {books.length}
            </span>
            <h3>{b.title}</h3>
            <p className="by">{b.author}</p>
            <p>{b.note}</p>
            <div className="chips">
              <span className="bchip">{b.register}</span>
              <span className="bchip">{b.lang}</span>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
