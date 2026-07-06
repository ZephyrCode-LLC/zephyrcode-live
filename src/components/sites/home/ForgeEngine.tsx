"use client";

import { useState } from "react";

/**
 * FORGE's live artifact — the ENGINE panel, but running. Tap the days you keep
 * your protocol and everything responds in real time: adherence fills, skipped
 * days accrue debt, and the SAVE-FILE readout flips between "leveling" (goal
 * date pulls closer) and "corrupting" (it slips). This IS the FORGE idea — an OS
 * that simulates the consequences of your adherence — made touchable.
 */

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function ForgeEngine() {
  const [on, setOn] = useState<boolean[]>([true, true, true, false, true, true, false]);
  const kept = on.filter(Boolean).length;
  const pct = Math.round((kept / 7) * 100);
  const debt = 7 - kept;
  // each kept day pulls the goal ~1.4d closer; each skip pushes it ~2.4d out (the tax).
  const move = Math.round(kept * 1.4 - debt * 2.4);
  const leveling = move >= 0;
  const n = Math.abs(move);
  const toggle = (i: number) => setOn((a) => a.map((v, j) => (j === i ? !v : v)));

  return (
    <div className={`forge-engine live ${leveling ? "lvl" : "crp"}`} role="group" aria-label="FORGE engine — tap the days you kept your protocol">
      <div className="fe-head mono">
        ENGINE <span className="fe-hint">tap a day ↓</span>
      </div>
      <div className="fe-week">
        {DAYS.map((d, i) => (
          <button
            key={i}
            type="button"
            className={`fe-day${on[i] ? " kept" : ""}`}
            aria-pressed={on[i]}
            aria-label={`Day ${i + 1}: ${on[i] ? "kept" : "skipped"}`}
            onClick={() => toggle(i)}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="fe-row">
        <span className="fe-label mono">ADHERENCE</span>
        <span className="fe-track"><i className="fe-fill up" style={{ width: `${pct}%` }} /></span>
        <span className="fe-num mono up">{pct}%</span>
      </div>
      <div className="fe-row">
        <span className="fe-label mono">SKIPPED DEBT</span>
        <span className="fe-track"><i className="fe-fill down" style={{ width: `${(debt / 7) * 100}%` }} /></span>
        <span className="fe-num mono down">{debt ? `−${debt}d` : "0"}</span>
      </div>
      <p className="fe-note mono" aria-live="polite">
        SAVE-FILE: <b>{leveling ? "leveling" : "corrupting"}</b> · goal date{" "}
        {leveling ? `moved up ${n} day${n === 1 ? "" : "s"}` : `slipped ${n} day${n === 1 ? "" : "s"}`}
      </p>
    </div>
  );
}
