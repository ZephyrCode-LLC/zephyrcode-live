"use client";

import { useState } from "react";

/**
 * The consequence engine. A deep-work block's value is max(0, len - RAMP):
 * an interruption severs the block and forces a fresh ramp, so four "quick
 * syncs" cost the afternoon. Tap/keyboard/+ adds a cut; everything is derived
 * from the cuts list. Copy + params (RAMP, TOTAL, verdicts) come from the DB.
 */

type Verdict = [number, string];

export function InterruptionTax({
  k,
  sub,
  labStart,
  labMid,
  labEnd,
  hint,
  addLabel,
  resetLabel,
  total,
  ramp,
  deepLabel,
  fragLabel,
  taxLabel,
  verdicts,
}: {
  k: string;
  sub: string;
  labStart: string;
  labMid: string;
  labEnd: string;
  hint: string;
  addLabel: string;
  resetLabel: string;
  total: number;
  ramp: number;
  deepLabel: string;
  fragLabel: string;
  taxLabel: string;
  verdicts: Verdict[];
}) {
  const [cuts, setCuts] = useState<number[]>([]);
  const FULL = total - ramp;

  const sorted = [0, ...[...cuts].sort((a, b) => a - b), total];
  const segs: Array<[number, number]> = [];
  for (let i = 0; i < sorted.length - 1; i++) segs.push([sorted[i], sorted[i + 1]]);
  let deep = 0;
  segs.forEach((s) => (deep += Math.max(0, s[1] - s[0] - ramp)));
  const taxMin = Math.round(FULL - deep);
  const ratio = deep / FULL;
  const verdict = verdicts.find((v) => ratio > v[0])?.[1] ?? verdicts[verdicts.length - 1][1];

  function addCut(min: number) {
    setCuts((c) => (c.length >= 8 ? c : [...c, Math.max(8, Math.min(total - 8, min))]));
  }
  function onTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    addCut(((e.clientX - r.left) / r.width) * total);
  }
  function onKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      addCut(60 + cuts.length * 45);
    }
  }

  const taxText = taxMin <= 0 ? "0 min" : taxMin >= 60 ? `${(taxMin / 60).toFixed(1)} hrs` : `${taxMin} min`;

  return (
    <div className="engine rv">
      <p className="k">{k}</p>
      <p className="sub" dangerouslySetInnerHTML={{ __html: sub }} />
      <div className="toy">
        <div className="lab">
          <span>{labStart}</span>
          <span>{labMid}</span>
          <span>{labEnd}</span>
        </div>
        <div
          className="track"
          role="button"
          tabIndex={0}
          aria-label="Tap to add an interruption"
          onClick={onTrackClick}
          onKeyDown={onKey}
        >
          {segs.map((s, i) => {
            const x0 = (s[0] / total) * 100;
            const w = ((s[1] - s[0]) / total) * 100;
            const rw = (Math.min(s[1] - s[0], ramp) / total) * 100;
            return (
              <span key={`seg-${i}`}>
                <span className="seg ramp" style={{ left: `${x0}%`, width: `${rw}%` }} />
                {w - rw > 0 && (
                  <span className="seg deep" style={{ left: `${x0 + rw}%`, width: `${w - rw}%` }} />
                )}
              </span>
            );
          })}
          {cuts.map((c, i) => (
            <span key={`cut-${i}`} className="cut" style={{ left: `${(c / total) * 100}%` }} />
          ))}
          {cuts.length === 0 && <div className="hint">{hint}</div>}
        </div>
        <div className="ctrls">
          <button type="button" onClick={() => addCut(45 + cuts.length * 42 + 20)}>
            {addLabel}
          </button>
          <button type="button" onClick={() => setCuts([])}>
            {resetLabel}
          </button>
          <span className="tag">
            {cuts.length} {cuts.length === 1 ? "interruption" : "interruptions"}
          </span>
        </div>
        <div className="readout">
          <span>
            <span className="l">{deepLabel}</span>
            <span className="v">{(deep / 60).toFixed(1)} hrs</span>
          </span>
          <span>
            <span className="l">{fragLabel}</span>
            <span className="v">{segs.length}</span>
          </span>
          <span className="tax">
            <span className="l">{taxLabel}</span>
            <span className="v">{taxText}</span>
          </span>
        </div>
        <p className="eng-verdict">{verdict}</p>
      </div>
    </div>
  );
}
