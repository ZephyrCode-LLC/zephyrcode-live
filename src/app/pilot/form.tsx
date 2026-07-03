"use client";

import { useState } from "react";

/** The pilot intake — hub-dark, cyan telemetry accent, one column, no fluff. */
export function PilotForm({
  products,
  initial,
}: {
  products: Record<string, { name: string; blurb: string }>;
  initial: string;
}) {
  const [p, setP] = useState(initial);
  const [state, setState] = useState<"idle" | "busy" | "done" | "err">("idle");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("busy");
    setErr("");
    try {
      const res = await fetch("/api/audit-booking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          email: f.get("email"),
          company: f.get("company"),
          audit_sku: `PILOT-${p.toUpperCase()}`,
          audit_title: `Pilot request — ${products[p].name}`,
          message: `${f.get("message") ?? ""}\n\ntimeline: ${f.get("timeline") ?? "-"}`,
          source: "pilot-page",
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "failed");
      setState("done");
    } catch (e) {
      setState("err");
      setErr(e instanceof Error ? e.message : "Could not send. Try again.");
    }
  }

  return (
    <main className="pw">
      <style>{`
        .pw { min-height: 100vh; background: radial-gradient(70% 50% at 50% 0%, rgba(61,225,230,.05), transparent 60%), #0b0908; color: #ece5da; font-family: var(--font-jbmono), ui-monospace, monospace; display: grid; place-items: center; padding: 48px 20px; }
        .pw-card { width: 100%; max-width: 560px; }
        .pw-eyebrow { font-size: 11px; letter-spacing: .28em; color: #3DE1E6; text-transform: uppercase; margin: 0 0 14px; }
        .pw h1 { font-family: var(--font-fraunces), serif; font-weight: 700; font-size: clamp(1.6rem, 4vw, 2.2rem); margin: 0 0 8px; letter-spacing: -.01em; }
        .pw-sub { color: #9b908a; color: #9b938a; font-size: 13px; line-height: 1.6; margin: 0 0 26px; font-family: system-ui, sans-serif; }
        .pw-picks { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 22px; }
        .pw-pick { border: 1px solid #2a2320; border-radius: 999px; background: transparent; color: #9b938a; padding: 8px 14px; font: inherit; font-size: 11.5px; letter-spacing: .08em; cursor: pointer; transition: all .25s ease; }
        .pw-pick.on { border-color: #3DE1E6; color: #3DE1E6; background: rgba(61,225,230,.07); box-shadow: 0 0 18px -8px #3DE1E6; }
        .pw-blurb { font-size: 12px; color: #9b938a; margin: 0 0 22px; font-family: system-ui, sans-serif; line-height: 1.6; border-left: 2px solid #3DE1E6; padding-left: 12px; }
        .pw form { display: grid; gap: 12px; }
        .pw-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 540px) { .pw-row { grid-template-columns: 1fr; } }
        .pw label { display: grid; gap: 6px; font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: #6f675f; }
        .pw input, .pw textarea, .pw select { background: #120f0d; border: 1px solid #2a2320; border-radius: 10px; color: #ece5da; padding: 12px 14px; font-family: system-ui, sans-serif; font-size: 14px; }
        .pw input:focus, .pw textarea:focus { outline: none; border-color: #3DE1E6; }
        .pw textarea { min-height: 110px; resize: vertical; }
        .pw-btn { margin-top: 6px; background: #3DE1E6; color: #08181a; border: 0; border-radius: 10px; padding: 14px; font: inherit; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; font-size: 12px; cursor: pointer; transition: transform .15s ease, box-shadow .3s ease; }
        .pw-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 34px -12px #3DE1E6; }
        .pw-btn:disabled { opacity: .5; cursor: default; transform: none; }
        .pw-done { border: 1px solid rgba(61,225,230,.4); border-radius: 12px; padding: 26px; text-align: center; color: #3DE1E6; font-size: 14px; line-height: 1.7; font-family: system-ui, sans-serif; }
        .pw-err { color: #ff5d6e; font-size: 12px; font-family: system-ui, sans-serif; }
        .pw-back { display: inline-block; margin-top: 22px; color: #6f675f; font-size: 11px; letter-spacing: .12em; text-decoration: none; }
        .pw-back:hover { color: #3DE1E6; }
      `}</style>
      <div className="pw-card">
        <p className="pw-eyebrow">zephyrcode · pilot intake</p>
        <h1>Request a pilot.</h1>
        <p className="pw-sub">
          Short form, real reply — typically within a day, from the operator himself.
          No newsletter, no drip sequence.
        </p>

        <div className="pw-picks" role="tablist">
          {Object.entries(products).map(([k, v]) => (
            <button key={k} type="button" className={`pw-pick${p === k ? " on" : ""}`} onClick={() => setP(k)}>
              {v.name}
            </button>
          ))}
        </div>
        <p className="pw-blurb">{products[p].blurb}</p>

        {state === "done" ? (
          <div className="pw-done">
            Received. You&apos;ll hear back at the address you gave — usually same-day IST.
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="pw-row">
              <label>name<input name="name" required maxLength={200} /></label>
              <label>email<input name="email" type="email" required maxLength={320} /></label>
            </div>
            <div className="pw-row">
              <label>company / context<input name="company" maxLength={200} placeholder="optional" /></label>
              <label>timeline
                <select name="timeline" defaultValue="exploring">
                  <option value="asap">ASAP</option>
                  <option value="this-quarter">this quarter</option>
                  <option value="exploring">just exploring</option>
                </select>
              </label>
            </div>
            <label>what are you hoping the pilot does for you?
              <textarea name="message" maxLength={5000} placeholder="A few honest lines beat a brief." />
            </label>
            {err && <p className="pw-err">{err}</p>}
            <button className="pw-btn" disabled={state === "busy"}>
              {state === "busy" ? "sending…" : "send the request"}
            </button>
          </form>
        )}
        <a className="pw-back" href="https://zephyrcode.live">← zephyrcode.live</a>
      </div>
    </main>
  );
}
