"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The stories.zephyrcode.live fridge-magnet board, a faithful port of the
 * imperative engine in /_reference/stories.html: staggered out/in tile
 * animation (60ms*i+40 in, 30ms*i out, 260ms swap), random rotations,
 * aria-live board, busy lock. A trailing "*" on a word marks the purple
 * magnet (the star is stripped before display). Zero content strings live
 * here — sentences, notes and the button label arrive as props.
 * Reduced motion: the global CSS guard kills the transitions; the logic
 * stays identical, as in the source.
 */

type Mag = {
  word: string;
  purple: boolean;
  out: boolean;
  transform: string;
};

export function MagnetBoard({
  sentences,
  notes,
  buttonLabel,
}: {
  sentences: string[][];
  notes: string[];
  buttonLabel: string;
}) {
  const [idx, setIdx] = useState(0);
  const [mags, setMags] = useState<Mag[]>([]);
  const busy = useRef(false);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  /** Source `render(words)`: tiles enter "out", then flip in at 60ms*i+40. */
  const render = useCallback(
    (words: string[]) => {
      setMags(
        words.map((w) => ({
          word: w.replace("*", ""),
          purple: w.indexOf("*") > -1,
          out: true,
          transform: `translateY(-14px) rotate(${Math.random() * 10 - 5}deg)`,
        }))
      );
      words.forEach((_, i) => {
        later(() => {
          setMags((cur) =>
            cur.map((m, j) =>
              j === i ? { ...m, out: false, transform: `rotate(${Math.random() * 6 - 3}deg)` } : m
            )
          );
        }, 60 * i + 40);
      });
    },
    [later]
  );

  useEffect(() => {
    render(sentences[0] ?? []);
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, [render, sentences]);

  const shuffle = () => {
    if (busy.current) return;
    busy.current = true;
    const count = mags.length;
    mags.forEach((_, i) => {
      later(() => {
        setMags((cur) => cur.map((m, j) => (j === i ? { ...m, out: true } : m)));
      }, 30 * i);
    });
    const next = (idx + 1) % sentences.length;
    later(() => {
      setIdx(next);
      render(sentences[next] ?? []);
      busy.current = false;
    }, 30 * count + 260);
  };

  return (
    <>
      <div className="board" aria-live="polite">
        {mags.map((m, i) => (
          <span
            key={`${idx}-${i}`}
            className={`mag${m.out ? " out" : ""}${m.purple ? " purple" : ""}`}
            style={{ transform: m.transform }}
          >
            {m.word}
          </span>
        ))}
      </div>
      <div className="shuffle">
        <button type="button" onClick={shuffle}>
          {buttonLabel}
        </button>
        <span className="note">{notes[idx]}</span>
      </div>
    </>
  );
}
