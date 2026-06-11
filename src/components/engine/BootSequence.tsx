"use client";

import { useEffect, useState } from "react";

/**
 * The operator typed boot sequence, ported exactly from the source page:
 * 14ms per character, 170ms between lines (250ms before the last), then a
 * blinking caret. Each line is a [text, tailHtml] pair from the DB — the
 * tail (the <span class="ok">/<span class="warn"> markup) is appended via
 * dangerouslySetInnerHTML once the line finishes typing.
 * Reduced motion: all lines render instantly, joined with newlines.
 * No content strings live here — lines and the aria-label arrive as props.
 */
export function BootSequence({
  lines,
  ariaLabel,
}: {
  lines: [string, string][];
  ariaLabel: string;
}) {
  const [reduced, setReduced] = useState(false);
  const [rows, setRows] = useState<string[]>([]);
  const [typing, setTyping] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      return;
    }
    let cancelled = false;
    const timers: number[] = [];
    let li = 0;
    function nextLine() {
      if (cancelled) return;
      if (li >= lines.length) {
        setDone(true);
        return;
      }
      const [text, tail] = lines[li];
      let ci = 0;
      (function type() {
        if (cancelled) return;
        ci += 1;
        setTyping(text.slice(0, ci));
        if (ci < text.length) {
          timers.push(window.setTimeout(type, 14));
        } else {
          setTyping("");
          setRows((r) => [...r, text + tail]);
          li += 1;
          timers.push(window.setTimeout(nextLine, li === lines.length ? 250 : 170));
        }
      })();
    }
    nextLine();
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [lines]);

  if (reduced) {
    return (
      <pre
        className="boot"
        aria-label={ariaLabel}
        dangerouslySetInnerHTML={{ __html: lines.map((l) => l[0] + l[1]).join("\n") }}
      />
    );
  }
  return (
    <pre className="boot" aria-label={ariaLabel}>
      {rows.map((html, i) => (
        <div key={i} dangerouslySetInnerHTML={{ __html: html }} />
      ))}
      {typing ? <div>{typing}</div> : null}
      {done ? <span className="caret" /> : null}
    </pre>
  );
}
