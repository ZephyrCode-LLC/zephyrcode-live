"use client";

import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { opsSupabase } from "@/lib/ops-supabase";

/**
 * THE OPERATOR'S LEDGER v0 — the author's standalone HTML ported intact
 * (markup + styles verbatim below), with the in-memory state replaced by
 * three owner-only tables: zc_ledger_pipeline, zc_ledger_quests,
 * zc_ledger_settings. Auth: Supabase password sign-in (magic link offered;
 * needs the project Site URL set before the emailed link lands here).
 * RLS allowlists the owner's email server-side regardless of what the UI does.
 */

const OWNER = "pri.patra@gmail.com";

/* ---------- author CSS, verbatim (minus --serif/--mono, inherited from globals) ---------- */
const LEDGER_CSS = `
.ops-root{--ink:#0D0B09;--ink2:#14110D;--ink3:#1B1712;--bone:#ECE2D3;--dim:rgba(236,226,211,.6);
--faint:rgba(236,226,211,.38);--ember:#E85D2A;--hot:#FF7A3D;--brass:#C9A45C;--iris:#8B7FD4;
--line:rgba(236,226,211,.13);--soft:rgba(236,226,211,.07);--green:#9CB86F;--red:#D85C4A;
background:var(--ink);color:var(--bone);font-family:var(--serif);font-weight:300;font-size:16.5px;line-height:1.68;-webkit-font-smoothing:antialiased}
.ops-root ::selection{background:var(--ember);color:var(--ink)}
.ops-root .shell{display:grid;grid-template-columns:225px 1fr;max-width:1240px;margin:0 auto}
.ops-root nav{position:sticky;top:0;height:100vh;padding:40px 0 40px 26px;border-right:1px solid var(--soft);display:flex;flex-direction:column;gap:5px}
.ops-root nav .wm{font-family:var(--mono);font-size:12px;letter-spacing:.3em;font-weight:700;margin-bottom:4px}
.ops-root nav .wm i{color:var(--ember);font-style:normal}
.ops-root nav .sub{font-family:var(--mono);font-size:9px;letter-spacing:.18em;color:var(--faint);margin-bottom:30px}
.ops-root nav a{display:flex;gap:10px;align-items:baseline;padding:7px 12px 7px 0;color:var(--dim);text-decoration:none;font-family:var(--mono);font-size:11px;letter-spacing:.08em;border-right:2px solid transparent;margin-right:-1px}
.ops-root nav a .n{font-size:9px;color:var(--faint);width:20px}
.ops-root nav a:hover{color:var(--bone)} .ops-root nav a.on{color:var(--ember);border-right-color:var(--ember)}
.ops-root nav .foot{margin-top:auto;font-family:var(--mono);font-size:9px;color:var(--faint);line-height:1.9;padding-right:18px}
.ops-root main{padding:0 50px 120px;min-width:0}
.ops-root .ey{font-family:var(--mono);font-size:10.5px;letter-spacing:.3em;color:var(--ember);text-transform:uppercase;margin-bottom:12px}
.ops-root h1{font-size:clamp(36px,4.6vw,54px);font-weight:600;line-height:1.06;letter-spacing:.01em}
.ops-root h2{font-size:clamp(24px,2.8vw,31px);font-weight:600;margin-bottom:14px}
.ops-root h3{font-family:var(--mono);font-size:11px;letter-spacing:.16em;font-weight:700;color:var(--brass);text-transform:uppercase;margin-bottom:8px}
.ops-root p{color:var(--dim);max-width:68ch}
.ops-root p b,.ops-root li b{color:var(--bone);font-weight:600}
.ops-root em{color:var(--brass)}
.ops-root section{padding-top:88px;margin-top:88px;border-top:1px solid var(--soft)}
.ops-root section:first-of-type{border:none;margin-top:0;padding-top:64px}
.ops-root .mono{font-family:var(--mono)}
.ops-root .lede{font-size:18px;color:var(--bone);max-width:62ch}
.ops-root .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:26px}
.ops-root .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:26px}
.ops-root .card{background:var(--ink2);border:1px solid var(--line);border-radius:6px;padding:22px}
.ops-root .card .k{font-family:var(--mono);font-size:9.5px;letter-spacing:.2em;color:var(--ember);text-transform:uppercase;margin-bottom:9px}
.ops-root .card p{font-size:14px}
.ops-root .rate{margin-top:26px;border:1px solid var(--line);border-radius:6px;overflow:hidden}
.ops-root .rrow{display:grid;grid-template-columns:200px 110px 1fr;border-bottom:1px solid var(--soft);background:var(--ink2)}
.ops-root .rrow:last-child{border:none}
.ops-root .rrow>div{padding:15px 18px;font-size:13.5px}
.ops-root .rrow .n{font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;color:var(--brass)}
.ops-root .rrow .p{font-family:var(--mono);font-size:13px;color:var(--ember);font-weight:700}
.ops-root .rrow .d{color:var(--dim)}
.ops-root .rrow.hd{background:var(--ink3)}
.ops-root .rrow.hd>div{font-family:var(--mono);font-size:9px;letter-spacing:.2em;color:var(--faint);padding:10px 18px}
.ops-root .dm{background:var(--ink2);border:1px solid var(--line);border-left:3px solid var(--ember);border-radius:0 6px 6px 0;padding:18px 22px;margin-top:16px}
.ops-root .dm .k{font-family:var(--mono);font-size:9.5px;letter-spacing:.2em;color:var(--ember);text-transform:uppercase;margin-bottom:8px}
.ops-root .dm pre{font-family:var(--mono);font-size:12px;line-height:1.75;color:var(--dim);white-space:pre-wrap}
.ops-root .dm pre b{color:var(--bone)}
.ops-root .pipehead{display:flex;gap:26px;flex-wrap:wrap;margin:24px 0 6px;font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;color:var(--faint)}
.ops-root .pipehead b{color:var(--ember);font-size:15px}
.ops-root .pipe{margin-top:12px;border:1px solid var(--line);border-radius:6px;overflow:hidden}
.ops-root .prow{display:grid;grid-template-columns:34px 1.2fr 1fr 130px;border-bottom:1px solid var(--soft);background:var(--ink2);align-items:center}
.ops-root .prow:last-child{border:none}
.ops-root .prow.hd{background:var(--ink3)}
.ops-root .prow.hd>div{font-family:var(--mono);font-size:9px;letter-spacing:.18em;color:var(--faint);padding:9px 12px}
.ops-root .prow>div{padding:8px 12px}
.ops-root .prow .ix{font-family:var(--mono);font-size:10px;color:var(--faint);text-align:right}
.ops-root .prow input{width:100%;background:transparent;border:none;border-bottom:1px dashed transparent;color:var(--bone);font-family:var(--serif);font-size:14px;padding:4px 0;outline:none}
.ops-root .prow input::placeholder{color:var(--faint);font-style:italic}
.ops-root .prow input:focus{border-bottom-color:var(--line)}
.ops-root .status{font-family:var(--mono);font-size:9px;letter-spacing:.12em;padding:6px 0;width:100%;border-radius:3px;border:1px solid var(--line);background:none;cursor:pointer;text-align:center}
.ops-root .s0{color:var(--faint)} .ops-root .s1{color:var(--brass);border-color:rgba(201,164,92,.45)}
.ops-root .s2{color:var(--iris);border-color:rgba(139,127,212,.45)} .ops-root .s3{color:var(--hot);border-color:rgba(255,122,61,.5)}
.ops-root .s4{color:var(--green);border-color:rgba(156,184,111,.5);font-weight:700} .ops-root .s5{color:var(--red);border-color:rgba(216,92,74,.4);text-decoration:line-through}
.ops-root .pnote{font-family:var(--mono);font-size:9.5px;color:var(--faint);margin-top:10px}
.ops-root .phase{display:grid;grid-template-columns:160px 1fr;gap:26px;padding:30px 0;border-bottom:1px solid var(--soft)}
.ops-root .phase:last-child{border:none}
.ops-root .lvl{font-family:var(--mono);font-size:9.5px;letter-spacing:.2em;color:var(--ember)}
.ops-root .phase .t{font-size:21px;font-weight:600;margin:5px 0 2px}
.ops-root .phase .w{font-family:var(--mono);font-size:9.5px;color:var(--faint)}
.ops-root .task{display:flex;gap:13px;align-items:flex-start;padding:12px 15px;margin-top:9px;background:var(--ink2);border:1px solid var(--line);border-radius:5px;cursor:pointer}
.ops-root .task:hover{border-color:rgba(236,226,211,.25)}
.ops-root .task.done .tt{color:var(--faint);text-decoration:line-through}
.ops-root .task .box{width:17px;height:17px;border:1.5px solid var(--line);border-radius:3px;flex:none;margin-top:3px;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--ink)}
.ops-root .task.done .box{background:var(--ember);border-color:var(--ember)}
.ops-root .task .tt{font-size:14px;color:var(--bone);font-weight:400}
.ops-root .task .tt b{font-weight:600}
.ops-root .task .dd{font-size:12px;color:var(--faint);margin-top:2px;font-style:italic}
.ops-root .task .xp{margin-left:auto;font-family:var(--mono);font-size:9.5px;color:var(--ember);white-space:nowrap;padding-top:4px}
.ops-root .xpbar{display:flex;align-items:center;gap:18px;background:var(--ink2);border:1px solid var(--line);border-radius:6px;padding:16px 22px;margin:24px 0 6px}
.ops-root .xpbar .rank{font-size:17px;color:var(--ember);white-space:nowrap;min-width:200px}
.ops-root .xpbar .track{flex:1;height:8px;background:var(--ink3);border:1px solid var(--soft);border-radius:5px;overflow:hidden}
.ops-root .xpbar .fill{height:100%;width:0%;background:linear-gradient(90deg,#A8431C,var(--ember));transition:width .4s}
.ops-root .xpbar .pct{font-family:var(--mono);font-size:10px;color:var(--dim);min-width:90px;text-align:right}
.ops-root .calc{display:grid;grid-template-columns:300px 1fr;gap:28px;margin-top:26px;align-items:start}
.ops-root .ctl label{display:flex;justify-content:space-between;font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;color:var(--dim);text-transform:uppercase;margin:17px 0 7px}
.ops-root .ctl label output{color:var(--ember);font-weight:700;font-size:11.5px}
.ops-root input[type=range]{width:100%;appearance:none;height:3px;border-radius:2px;background:rgba(236,226,211,.2);outline:none}
.ops-root input[type=range]::-webkit-slider-thumb{appearance:none;width:16px;height:16px;border-radius:50%;background:var(--ember);border:3px solid var(--ink);cursor:pointer;box-shadow:0 0 0 1px var(--ember)}
.ops-root input[type=range]::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:var(--ember);border:3px solid var(--ink);cursor:pointer}
.ops-root .stats{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.ops-root .stat{background:var(--ink2);border:1px solid var(--line);border-radius:6px;padding:18px 20px}
.ops-root .stat .k{font-family:var(--mono);font-size:9px;letter-spacing:.18em;color:var(--faint);text-transform:uppercase}
.ops-root .stat .v{font-size:30px;font-weight:600;margin-top:5px}
.ops-root .stat .v.em{color:var(--ember)} .ops-root .stat .v.br{color:var(--brass)} .ops-root .stat .v.gr{color:var(--green)}
.ops-root .stat .nn{font-family:var(--mono);font-size:9.5px;color:var(--faint);margin-top:3px}
.ops-root .goal{grid-column:1/-1;background:var(--ink2);border:1px solid var(--line);border-radius:6px;padding:17px 20px}
.ops-root .goal .lbl{display:flex;justify-content:space-between;font-family:var(--mono);font-size:9px;letter-spacing:.16em;color:var(--faint);margin-bottom:8px}
.ops-root .goal .track{height:8px;background:var(--ink3);border:1px solid var(--soft);border-radius:5px;overflow:hidden;margin-bottom:14px}
.ops-root .goal .fill{height:100%;border-radius:5px;transition:width .35s}
.ops-root .f1{background:linear-gradient(90deg,#7E9456,var(--green))} .ops-root .f2{background:linear-gradient(90deg,#A8431C,var(--ember))}
.ops-root .week{margin-top:26px;border:1px solid var(--line);border-radius:6px;overflow:hidden}
.ops-root .wrow{display:grid;grid-template-columns:140px 1fr;border-bottom:1px solid var(--soft);background:var(--ink2)}
.ops-root .wrow:last-child{border:none}
.ops-root .wrow .d{padding:14px 18px;font-family:var(--mono);font-size:10px;letter-spacing:.14em;color:var(--ember);border-right:1px solid var(--soft);text-transform:uppercase}
.ops-root .wrow .a{padding:14px 18px;font-size:13.5px;color:var(--dim)}
.ops-root .wrow .a b{color:var(--bone)}
.ops-root .trip{display:grid;grid-template-columns:108px 1fr;gap:20px;padding:20px 0;border-bottom:1px dashed var(--soft)}
.ops-root .trip:last-child{border:none}
.ops-root .sev{font-family:var(--mono);font-size:9px;letter-spacing:.14em;padding:5px 0;text-align:center;border-radius:3px;height:fit-content}
.ops-root .sev.hi{color:var(--red);border:1px solid rgba(216,92,74,.45)}
.ops-root .sev.md{color:var(--brass);border:1px solid rgba(201,164,92,.45)}
.ops-root .trip h4{font-size:16px;font-weight:600;margin-bottom:3px}
.ops-root .trip p{font-size:13.5px}
.ops-root .trip .c{font-size:13px;color:var(--iris);margin-top:5px}
.ops-root .kill{margin-top:28px;border:1px solid rgba(216,92,74,.5);border-radius:6px;padding:20px 24px;background:rgba(216,92,74,.05)}
.ops-root .kill h4{color:var(--red);font-family:var(--mono);font-size:10.5px;letter-spacing:.2em;margin-bottom:8px}
.ops-root .kill p{font-size:13.5px}
.ops-root footer{margin-top:100px;border-top:1px solid var(--soft);padding-top:24px;font-family:var(--mono);font-size:9.5px;color:var(--faint);line-height:2}
.ops-root footer b{color:var(--ember)}
.ops-root .savedot{font-family:var(--mono);font-size:8.5px;letter-spacing:.16em;color:var(--green);opacity:0;transition:opacity .3s}
.ops-root .savedot.on{opacity:1}
.ops-root .signout{margin-top:8px;font-family:var(--mono);font-size:9px;letter-spacing:.14em;color:var(--faint);background:none;border:1px solid var(--line);border-radius:2px;padding:5px 10px;cursor:pointer;width:fit-content}
.ops-root .signout:hover{color:var(--red);border-color:var(--red)}
@media(max-width:980px){.ops-root .shell{grid-template-columns:1fr}.ops-root nav{position:relative;height:auto;flex-direction:row;flex-wrap:wrap;border:none;border-bottom:1px solid var(--soft);padding:20px;align-items:center;gap:2px 12px}
.ops-root nav .wm{width:100%}.ops-root nav .sub{width:100%;margin-bottom:8px}.ops-root nav .foot{display:none}.ops-root nav a{border:none;padding:4px 0}
.ops-root main{padding:0 20px 90px}.ops-root .grid2,.ops-root .grid3,.ops-root .calc,.ops-root .stats{grid-template-columns:1fr}
.ops-root .phase{grid-template-columns:1fr;gap:8px}.ops-root .rrow{grid-template-columns:1fr}.ops-root .rrow.hd{display:none}
.ops-root .prow{grid-template-columns:28px 1fr 100px}.ops-root .prow .who2{display:none}
.ops-root section{padding-top:60px;margin-top:60px}}
/* auth gate */
.ops-gate{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0D0B09;padding:20px}
.ops-gate .card{width:min(92vw,400px);background:#14110D;border:1px solid rgba(236,226,211,.13);border-radius:6px;padding:30px 28px;color:#ECE2D3;font-family:var(--serif)}
.ops-gate .k{font-family:var(--mono);font-size:10px;letter-spacing:.3em;color:#E85D2A;margin-bottom:6px}
.ops-gate .t{font-size:22px;font-weight:600;margin-bottom:18px}
.ops-gate label{display:block;font-family:var(--mono);font-size:9px;letter-spacing:.18em;color:rgba(236,226,211,.6);margin:14px 0 6px;text-transform:uppercase}
.ops-gate input{width:100%;background:#0D0B09;border:1px solid rgba(236,226,211,.13);border-radius:2px;color:#ECE2D3;font-family:var(--mono);font-size:13px;padding:11px 12px;outline:none}
.ops-gate input:focus{border-color:#C9A45C}
.ops-gate .row{display:flex;gap:10px;margin-top:20px}
.ops-gate button{font-family:var(--mono);font-size:10px;letter-spacing:.18em;padding:12px 18px;border-radius:2px;cursor:pointer;background:none}
.ops-gate .go{border:1px solid #E85D2A;color:#E85D2A}
.ops-gate .go:hover{background:#E85D2A;color:#0D0B09}
.ops-gate .alt{border:1px solid rgba(236,226,211,.13);color:rgba(236,226,211,.6)}
.ops-gate .msg{font-family:var(--mono);font-size:10px;color:#C9A45C;margin-top:14px;min-height:14px;line-height:1.6}
`;

/* ---------- author markup, verbatim (script removed; pipeline rows render from DB) ---------- */
const LEDGER_HTML = `
<nav id="nav">
  <div class="wm">ZEPHYR<i>·</i>CODE</div>
  <div class="sub">THE OPERATOR'S LEDGER · MASTER PLAN v1</div>
  <a href="#doctrine"><span class="n">00</span>DOCTRINE</a>
  <a href="#offer"><span class="n">01</span>THE OFFER</a>
  <a href="#pipeline"><span class="n">02</span>THE PIPELINE</a>
  <a href="#campaign"><span class="n">03</span>90 DAYS</a>
  <a href="#math"><span class="n">04</span>THE MATH</a>
  <a href="#cadence"><span class="n">05</span>THE WEEK</a>
  <a href="#tripwires"><span class="n">06</span>TRIPWIRES</a>
  <a href="#later"><span class="n">07</span>PARKED</a>
  <div class="foot">BLR · ZEPHYCODE FZ-LLC<br>DRAFTED JUN 2026<br>STATUS: DAY ZERO<br><span class="savedot" id="saved">SYNCED ✓</span></div>
  <button class="signout" id="signout">SIGN OUT</button>
</nav>
<main>
<section id="doctrine">
  <div class="ey">00 · Doctrine</div>
  <h1>Sell machines.<br>Floor with retainers.<br><em>Outreach before build.</em></h1>
  <p class="lede" style="margin-top:22px">ZephyrCode is a one-engineer studio that turns big ideas into machines people can play. Bespoke builds are the <b>lumpy money</b>. Retainers and Arcade sales are the <b>floor</b>. The business works the day the floor alone clears $1k/mo — everything above that is BespokeLabs replacement.</p>
  <div class="grid3">
    <div class="card"><div class="k">Ammo already live</div><p>7 machines · 5 interaction grammars · a branded arcade on its own subdomain · a story (Purple Cow) · a full domain ecosystem. <b>Supply is solved.</b> Nothing new gets built for strangers.</p></div>
    <div class="card"><div class="k">The actual constraint</div><p><b>Pipeline.</b> Historically the weakest muscle and the graveyard of every prior plan. So this plan hard-codes it: outreach owns the first slot of every week, with dated tripwires and a pre-agreed fallback.</p></div>
    <div class="card"><div class="k">The market proof</div><p>Creators pay monthly for <b>quizzes</b> (ScoreApp economics: interactive magnets convert 30–50% vs 3–10% for PDFs). Courses complete at 3–15%. A simulator is a quiz with a soul, sold into a known wound.</p></div>
  </div>
</section>
<section id="offer">
  <div class="ey">01 · The Offer</div>
  <h2>The rate card, decided now — not on the call</h2>
  <p>Pricing decided in advance is pricing you'll actually say out loud. Founding tier exists for exactly three clients, then dies.</p>
  <div class="rate">
    <div class="rrow hd"><div>PRODUCT</div><div>PRICE</div><div>WHAT THEY GET</div></div>
    <div class="rrow"><div class="n">FOUNDING MACHINE<br><span style="color:var(--faint);font-size:9px">first 3 only</span></div><div class="p">$1,500</div><div class="d">One playable of their flagship idea, white-label on their domain, 2-week turnaround, result-card share loop. Price buys a testimonial + public case study rights. 50% upfront, always.</div></div>
    <div class="rrow"><div class="n">STANDARD MACHINE</div><div class="p">$3,500</div><div class="d">Same scope, post-proof pricing. Grammar chosen to fit the idea's shape — parametric, cards, manipulation, living system. One revision round.</div></div>
    <div class="rrow"><div class="n">CATALOG DEAL</div><div class="p">$9,000</div><div class="d">Three machines across their course/book — the "playable layer." This is the deal Rail 1 matures into.</div></div>
    <div class="rrow"><div class="n">CARE RETAINER</div><div class="p">$149/mo</div><div class="d">Hosting, updates, engine improvements, share-card analytics. The floor. Offered at every delivery; businesses expense infrastructure without resentment.</div></div>
    <div class="rrow"><div class="n">ARCADE CARTRIDGE</div><div class="p">$9–19</div><div class="d">Own-shelf paid playables (Leap full version first). One-time, own-forever — the anti-subscription stance, consumer-side only.</div></div>
  </div>
  <h3 style="margin-top:36px">The three messages — written once, sent twenty times</h3>
  <div class="dm"><div class="k">DM 01 · THE COLD OPEN (sent with a 60-sec custom demo)</div>
  <pre>Hi [name] — I turned the core idea of [their flagship thing] into a 60-second
playable: [link]. No signup, just drag it.

Your audience has read that idea a hundred times. This is the first time
they'd <b>feel</b> it. I build these as white-label machines for courses and
books — if it lands, I'd love to show you what your whole catalog looks
like playable. Either way, the demo's yours to keep.</pre></div>
  <div class="dm"><div class="k">DM 02 · THE FOLLOW-UP (day 5, one only, then dead)</div>
  <pre>Quick nudge on the [idea] machine — 40+ people played the public version
this week and the average session was 3 minutes. That's 3 minutes inside
<b>your</b> idea. Worth 20 minutes on a call?</pre></div>
  <div class="dm"><div class="k">DM 03 · THE PILOT CLOSE (on the call, verbatim if needed)</div>
  <pre>Founding rate is $1,500 — half upfront — for one machine on your domain
in two weeks, in exchange for a testimonial and case-study rights.
After the first three clients it's $3,500, so the discount is real and
it expires. Most clients add the $149/mo care retainer at delivery —
hosting, updates, and the share-analytics dashboard.</pre></div>
</section>
<section id="pipeline">
  <div class="ey">02 · The Pipeline</div>
  <h2>Twenty names. The whole game is this table.</h2>
  <p>Tiering: <b>5 dream</b> (huge audience, long shot), <b>10 mid</b> (10k–200k audience, course/book sellers — the actual market), <b>5 peers</b> (reachable operators who'll reply this week and sharpen the pitch). Click a status to advance it. Fill five rows <em>tonight</em>.</p>
  <div class="pipehead"><span>SENT <b id="cSent">0</b></span><span>REPLIES <b id="cRep">0</b></span><span>CALLS <b id="cCall">0</b></span><span>WON <b id="cWon">0</b></span><span style="margin-left:auto">TARGET BY DAY 30: 20 SENT · 4 REPLIES · 1 WON</span></div>
  <div class="pipe" id="pipe">
    <div class="prow hd"><div></div><div>NAME / NICHE</div><div class="who2">FLAGSHIP IDEA → MACHINE CONCEPT</div><div>STATUS</div></div>
  </div>
  <p class="pnote">// synced to the ledger tables — every keystroke lands in the account, every device sees it. Statuses: TODO → DEMO BUILT → SENT → REPLY → WON / DEAD.</p>
</section>
<section id="campaign">
  <div class="ey">03 · The 90 Days</div>
  <h2>Three acts, dated, with definitions of done</h2>
  <div class="xpbar"><div class="rank" id="rank">RANK: DAY ZERO</div><div class="track"><div class="fill" id="xpf"></div></div><div class="pct" id="xpp">0 / 1000 XP</div></div>
  <div class="phase">
    <div><div class="lvl">ACT I · DAYS 1–30</div><div class="t">First Blood</div><div class="w">Build nothing new. Sell what exists.</div></div>
    <div>
      <div class="task" data-xp="80"><div class="box">✓</div><div><div class="tt"><b>Ship the landing fixes</b> (email capture, studio strip, OG, share helper)</div><div class="dd">Done = a stranger can join the list AND find "commission a machine" in under 10 seconds.</div></div><div class="xp">+80</div></div>
      <div class="task" data-xp="120"><div class="box">✓</div><div><div class="tt"><b>Fill all 20 pipeline rows</b>, tiered 5/10/5</div><div class="dd">Done = every row has a name and a one-line machine concept. Tonight for the first five.</div></div><div class="xp">+120</div></div>
      <div class="task" data-xp="150"><div class="box">✓</div><div><div class="tt"><b>Send 5 custom-demo DMs per week</b> — 20 by day 30</div><div class="dd">Each demo = a 90-minute reskin of an existing machine, timeboxed. Done = sent, logged, follow-up scheduled.</div></div><div class="xp">+150</div></div>
      <div class="task" data-xp="60"><div class="box">✓</div><div><div class="tt"><b>Publish the Purple Cow</b> on stories. + 4 build-log posts</div><div class="dd">The story is the taste-proof; the logs are the work narrated. Batched Sundays, 60 minutes.</div></div><div class="xp">+60</div></div>
      <div class="task" data-xp="120"><div class="box">✓</div><div><div class="tt"><b>Close 1 founding pilot</b> at $1,500, 50% upfront</div><div class="dd">ACT CLEAR. The wire transfer is the validation — nothing else counts.</div></div><div class="xp">+120</div></div>
    </div>
  </div>
  <div class="phase">
    <div><div class="lvl">ACT II · DAYS 31–60</div><div class="t">Proof &amp; Price</div><div class="w">Deliver, document, raise.</div></div>
    <div>
      <div class="task" data-xp="100"><div class="box">✓</div><div><div class="tt"><b>Deliver the pilot in 14 days</b>, retainer offered at handover</div><div class="dd">Done = live on their domain + $149/mo accepted or explicitly declined.</div></div><div class="xp">+100</div></div>
      <div class="task" data-xp="80"><div class="box">✓</div><div><div class="tt"><b>Publish the case study</b> — their numbers, your build, 1 page</div><div class="dd">Plays, email conversion, session time. This artifact replaces cold DMs with warm ones.</div></div><div class="xp">+80</div></div>
      <div class="task" data-xp="100"><div class="box">✓</div><div><div class="tt"><b>Raise to $3,500 · close pilots 2 and 3</b></div><div class="dd">Founding tier dies at three. Done = two more 50% deposits in the ZephyCode account.</div></div><div class="xp">+100</div></div>
      <div class="task" data-xp="60"><div class="box">✓</div><div><div class="tt"><b>Turn one Arcade gate paid</b> — Leap full at $9</div><div class="dd">Done = first stranger-dollar through the shelf. Watch what share-cards do to traffic.</div></div><div class="xp">+60</div></div>
    </div>
  </div>
  <div class="phase">
    <div><div class="lvl">ACT III · DAYS 61–90</div><div class="t">The Engine Decision</div><div class="w">Extract only what repeated.</div></div>
    <div>
      <div class="task" data-xp="60"><div class="box">✓</div><div><div class="tt"><b>Write the skeleton doc</b> — what repeated across 3 paid builds</div><div class="dd">Grammar templates, gating, share-cards, analytics. This doc IS the engine spec; no code yet.</div></div><div class="xp">+60</div></div>
      <div class="task" data-xp="40"><div class="box">✓</div><div><div class="tt"><b>Decide: productized service vs engine SaaS</b> — from evidence</div><div class="dd">If clients ask "can I edit it myself" twice → SaaS path. If they ask "build me three more" → studio path. Let them vote.</div></div><div class="xp">+40</div></div>
      <div class="task" data-xp="30"><div class="box">✓</div><div><div class="tt"><b>Day-90 ledger review</b> against the math below</div><div class="dd">Run-rate, recurring floor, pipeline health. Then — and only then — re-plan.</div></div><div class="xp">+30</div></div>
    </div>
  </div>
</section>
<section id="math">
  <div class="ey">04 · The Math</div>
  <h2>Run-rate, honest and adjustable</h2>
  <p>Two lines matter: the <b>recurring floor</b> against $1k, and the <b>total</b> against your replacement target. Builds are lumpy — never count them as floor.</p>
  <div class="calc">
    <div class="card ctl">
      <h3>Levers</h3>
      <label>Builds / month <output id="bO">1</output></label><input type="range" id="b" min="0" max="3" step="1" value="1">
      <label>Avg build price <output id="bpO">$2.5k</output></label><input type="range" id="bp" min="1500" max="6000" step="500" value="2500">
      <label>Active retainers <output id="rO">2</output></label><input type="range" id="r" min="0" max="12" step="1" value="2">
      <label>Arcade sales / mo <output id="aO">10</output></label><input type="range" id="a" min="0" max="100" step="5" value="10">
      <label>Replacement target / mo <output id="tO">$4k</output></label><input type="range" id="t" min="1000" max="10000" step="500" value="4000">
    </div>
    <div class="stats">
      <div class="stat"><div class="k">Total run-rate</div><div class="v em" id="tot">—</div><div class="nn" id="totN"></div></div>
      <div class="stat"><div class="k">Recurring floor</div><div class="v gr" id="flr">—</div><div class="nn">retainers + arcade only</div></div>
      <div class="stat"><div class="k">Lumpy share</div><div class="v br" id="lmp">—</div><div class="nn">build revenue % — keep falling</div></div>
      <div class="stat"><div class="k">Retainers to $1k floor</div><div class="v" id="need">—</div><div class="nn">at $149 + current arcade</div></div>
      <div class="goal">
        <div class="lbl"><span>RECURRING FLOOR vs $1,000</span><span id="g1p">0%</span></div>
        <div class="track"><div class="fill f1" id="g1"></div></div>
        <div class="lbl"><span>TOTAL vs REPLACEMENT TARGET</span><span id="g2p">0%</span></div>
        <div class="track"><div class="fill f2" id="g2"></div></div>
      </div>
    </div>
  </div>
</section>
<section id="cadence">
  <div class="ey">05 · The Week</div>
  <h2>Seven hours, pre-spent</h2>
  <p>The budget is a ceiling. The order is the discipline: <b>the market gets your freshest hour, the code gets the rest.</b></p>
  <div class="week">
    <div class="wrow"><div class="d">SUN · 0900–1030</div><div class="a"><b>Outreach block, first and sacred.</b> 5 demo DMs prepped/sent, follow-ups cleared, pipeline statuses updated. Nothing builds until this is done.</div></div>
    <div class="wrow"><div class="d">SUN · 1030–1130</div><div class="a"><b>Content batch.</b> One build-log post + one proof post, scheduled. The work narrated, never performed.</div></div>
    <div class="wrow"><div class="d">MON · 2130–2300</div><div class="a"><b>Build slot 1.</b> Client work first; demo reskins second; Arcade polish last.</div></div>
    <div class="wrow"><div class="d">WED · 2130–2200</div><div class="a"><b>Pipeline pulse.</b> Replies answered same-week, day-5 follow-ups fired, dead rows marked dead without mourning.</div></div>
    <div class="wrow"><div class="d">THU · 2130–2300</div><div class="a"><b>Build slot 2.</b> Same priority order. If a pilot is live, both slots are theirs — the 14-day promise outranks everything.</div></div>
    <div class="wrow"><div class="d">EVERYTHING ELSE</div><div class="a"><b>Untouched.</b> FORGE, training, family, SETU, the Mirror page on the fridge. The business fits the life; never the reverse.</div></div>
  </div>
</section>
<section id="tripwires">
  <div class="ey">06 · Tripwires</div>
  <h2>Named traps, dated exits</h2>
  <div class="trip"><div class="sev hi">SEV·HIGH</div><div><h4>The ghost pipeline</h4><p>Twenty rows filled, four DMs sent. The table becomes decoration and the plan dies politely. This is YOUR historical failure mode — building is comfort, asking is exposure.</p><div class="c">COUNTER → The Sunday block is first, timed, and logged in this page. A week with fewer than 5 sends is a red week, no exceptions, no "but I built something great."</div></div></div>
  <div class="trip"><div class="sev hi">SEV·HIGH</div><div><h4>Engine-first creep</h4><p>Act III is the fun problem and you will ache to start it in week 2. An engine with no clients is a monument.</p><div class="c">COUNTER → Hard gate: no engine code before 3 paid builds. The skeleton doc is the only permitted outlet.</div></div></div>
  <div class="trip"><div class="sev md">SEV·MED</div><div><h4>The polish spiral</h4><p>Demo reskins ballooning from 90 minutes to 9 hours because the gradient wasn't right. Perfection is procrastination wearing your own craft as a mask.</p><div class="c">COUNTER → Demos are timeboxed at 90 min, sent at 80% quality. The paid build is where craft lives; the demo only has to make them feel it once.</div></div></div>
  <div class="trip"><div class="sev md">SEV·MED</div><div><h4>Scope leak on pilots</h4><p>"Can it also…" turns $1,500 into $400/hour-equivalent misery and a 6-week delivery.</p><div class="c">COUNTER → One machine, one grammar, one revision round — in the written scope, 50% upfront. Everything else is quoted as machine #2.</div></div></div>
  <div class="trip"><div class="sev md">SEV·MED</div><div><h4>Energy collision</h4><p>Lokam crunch + a pilot deadline + week 12 of FORGE in the same fortnight.</p><div class="c">COUNTER → Sell 14-day delivery, plan for 10. The buffer is for life, and life always shows up.</div></div></div>
  <div class="kill"><h4>KILL CRITERIA — SIGNED WHILE SOBER</h4><p><b>Day 30:</b> 20 demo-DMs sent and fewer than 2 real conversations → the offer or the targeting is wrong, not the format. Run 5 debrief calls, re-aim once at a single vertical (health creators is the obvious one — it's your native tongue), run one more 30-day cycle. <b>Day 60:</b> still no paid pilot → park the studio without shame and execute Plan B (the cross-border finance toolkit — the market loves it even if you don't; a money engine is allowed to be unloved). The Arcade stays live either way; it costs nothing and keeps compounding.</p></div>
</section>
<section id="later">
  <div class="ey">07 · Parked, with unlock conditions</div>
  <h2>Everything else we built, in its right place</h2>
  <div class="grid2">
    <div class="card"><div class="k">The Engine / SaaS (Rail 3)</div><p>Unlocks at 3 paid builds + the skeleton doc. The AI compiler — interview the creator, draft the machine — is the long-term moat and your Alexa years cashing in. Not before.</p></div>
    <div class="card"><div class="k">Operator OS / FORGE cartridges</div><p>Unlock when the Arcade has 500+ emails: Peak Performance OS becomes the shelf's first premium cartridge — sold to an audience, not to silence.</p></div>
    <div class="card"><div class="k">The warrior-scholar voice + SETU</div><p>Permanent love projects, brand soul, zero income pressure. Purple Cow publishes now as taste-proof; the rest rides the engine, never pulls it.</p></div>
    <div class="card"><div class="k">The Mirror Protocol</div><p>Stays on the fridge. Not for sale — possibly ever. Some machines are for an audience of one.</p></div>
  </div>
  <footer><b>THE OPERATOR'S LEDGER · v1.0</b> · ZephyrCode · drafted June 2026, Bengaluru<br>
  Doctrine: outreach before build · floor before ceiling · timeboxes before taste · the wire transfer is the only validation.<br>
  Day 1 begins when pipeline rows 1–5 have names in them. The bar is watching.</footer>
</section>
</main>`;

const STATES: [string, string][] = [
  ["TODO", "s0"], ["DEMO BUILT", "s1"], ["SENT", "s2"], ["REPLY", "s3"], ["WON", "s4"], ["DEAD", "s5"],
];
const TIERS: [string, string][] = [
  ["D1", "dream"], ["D2", "dream"], ["D3", "dream"], ["D4", "dream"], ["D5", "dream"],
  ["M1", "mid"], ["M2", "mid"], ["M3", "mid"], ["M4", "mid"], ["M5", "mid"],
  ["M6", "mid"], ["M7", "mid"], ["M8", "mid"], ["M9", "mid"], ["M10", "mid"],
  ["P1", "peer"], ["P2", "peer"], ["P3", "peer"], ["P4", "peer"], ["P5", "peer"],
];
const RANKS: [number, string][] = [
  [0, "DAY ZERO"], [150, "OPERATOR"], [400, "CLOSER"], [650, "STUDIO"], [900, "ENGINE-READY"], [1000, "LEDGER CLEAR"],
];

type PipeRow = { id: string; tier: string; name: string; concept: string; status: number };

export function OpsApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = opsSupabase();
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="ops-gate"><style>{LEDGER_CSS}</style></div>;
  if (!session) return <Gate />;
  if (session.user.email !== OWNER) return <WrongReader email={session.user.email ?? ""} />;
  return <Ledger />;
}

function Gate() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    if (busy) return;
    setBusy(true);
    setMsg("");
    const { error } = await opsSupabase().auth.signInWithPassword({ email: email.trim(), password });
    if (error) setMsg(error.message);
    setBusy(false);
  };
  const magic = async () => {
    if (busy) return;
    setBusy(true);
    const { error } = await opsSupabase().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: "https://zephyrcode.live/ops" },
    });
    setMsg(error ? error.message : "Link sent — check the inbox.");
    setBusy(false);
  };

  return (
    <div className="ops-gate">
      <style>{LEDGER_CSS}</style>
      <div className="card">
        <div className="k">ZEPHYR·CODE / OPS</div>
        <div className="t">The ledger has one reader.</div>
        <label>Email</label>
        <input type="email" value={email} autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
        <label>Password</label>
        <input
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && signIn()}
        />
        <div className="row">
          <button className="go" disabled={busy} onClick={signIn}>OPEN THE LEDGER</button>
          <button className="alt" disabled={busy} onClick={magic}>EMAIL ME A LINK</button>
        </div>
        <div className="msg" aria-live="polite">{msg}</div>
      </div>
    </div>
  );
}

function WrongReader({ email }: { email: string }) {
  return (
    <div className="ops-gate">
      <style>{LEDGER_CSS}</style>
      <div className="card">
        <div className="k">ZEPHYR·CODE / OPS</div>
        <div className="t">Not this account.</div>
        <div className="msg">{email} is signed in, but the ledger has one reader.</div>
        <div className="row">
          <button className="alt" onClick={() => opsSupabase().auth.signOut()}>SIGN OUT</button>
        </div>
      </div>
    </div>
  );
}

function Ledger() {
  const rootRef = useRef<HTMLDivElement>(null);
  const enhanced = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || enhanced.current) return;
    enhanced.current = true;
    const sb = opsSupabase();
    const $ = (id: string) => root.querySelector<HTMLElement>("#" + id)!;
    const savedDot = $("saved");
    let savedT: ReturnType<typeof setTimeout>;
    const flashSaved = () => {
      savedDot.classList.add("on");
      clearTimeout(savedT);
      savedT = setTimeout(() => savedDot.classList.remove("on"), 1400);
    };
    const debounce = <A extends unknown[]>(fn: (...a: A) => void, ms: number) => {
      let h: ReturnType<typeof setTimeout>;
      return (...a: A) => {
        clearTimeout(h);
        h = setTimeout(() => fn(...a), ms);
      };
    };

    (async () => {
      const [{ data: pipeRows }, { data: questRows }, { data: settingsRows }] = await Promise.all([
        sb.from("zc_ledger_pipeline").select("*"),
        sb.from("zc_ledger_quests").select("*"),
        sb.from("zc_ledger_settings").select("*").eq("key", "calc"),
      ]);
      const byId = new Map((pipeRows ?? []).map((r: PipeRow) => [r.id, r]));

      /* ---- pipeline ---- */
      const pstate = TIERS.map(([id]) => byId.get(id)?.status ?? 0);
      const P = $("pipe");
      TIERS.forEach(([id, tier], i) => {
        const row = byId.get(id);
        const r = document.createElement("div");
        r.className = "prow";
        const ph = tier === "dream" ? "dream creator…" : tier === "mid" ? "mid-tier (10k–200k)…" : "reachable peer…";
        r.innerHTML = `<div class="ix">${id}</div>
          <div><input data-f="name" data-id="${id}" placeholder="${ph}"></div>
          <div class="who2"><input data-f="concept" data-id="${id}" placeholder="their idea → machine concept"></div>
          <div><button class="status ${STATES[pstate[i]][1]}" data-i="${i}" data-id="${id}">${STATES[pstate[i]][0]}</button></div>`;
        (r.querySelector('[data-f="name"]') as HTMLInputElement).value = row?.name ?? "";
        (r.querySelector('[data-f="concept"]') as HTMLInputElement).value = row?.concept ?? "";
        P.appendChild(r);
      });
      const savePipe = async (id: string) => {
        const i = TIERS.findIndex(([x]) => x === id);
        const name = (P.querySelector(`input[data-f="name"][data-id="${id}"]`) as HTMLInputElement).value;
        const concept = (P.querySelector(`input[data-f="concept"][data-id="${id}"]`) as HTMLInputElement).value;
        await sb.from("zc_ledger_pipeline").upsert({
          id, tier: TIERS[i][1], name, concept, status: pstate[i], updated_at: new Date().toISOString(),
        });
        flashSaved();
      };
      const savePipeDebounced = debounce(savePipe, 700);
      const counts = () => {
        const c = (s: number) => pstate.filter((x) => x >= s && x !== 5).length;
        $("cSent").textContent = String(c(2));
        $("cRep").textContent = String(c(3));
        $("cCall").textContent = String(c(3));
        $("cWon").textContent = String(pstate.filter((x) => x === 4).length);
      };
      P.addEventListener("input", (e) => {
        const t = e.target as HTMLInputElement;
        if (t.dataset.id) savePipeDebounced(t.dataset.id);
      });
      P.addEventListener("click", (e) => {
        const b = (e.target as HTMLElement).closest<HTMLElement>(".status");
        if (!b) return;
        const i = +b.dataset.i!;
        pstate[i] = (pstate[i] + 1) % STATES.length;
        b.textContent = STATES[pstate[i]][0];
        b.className = "status " + STATES[pstate[i]][1];
        counts();
        savePipe(b.dataset.id!);
      });
      counts();

      /* ---- quests / XP ---- */
      const tasks = [...root.querySelectorAll<HTMLElement>(".task")];
      const doneById = new Map((questRows ?? []).map((q: { id: string; done: boolean }) => [q.id, q.done]));
      const TOT = tasks.reduce((s, t) => s + +(t.dataset.xp ?? 0), 0);
      const xp = () => {
        const v = tasks.filter((t) => t.classList.contains("done")).reduce((s, t) => s + +(t.dataset.xp ?? 0), 0);
        ($("xpf") as HTMLElement).style.width = (v / TOT) * 100 + "%";
        $("xpp").textContent = `${v} / ${TOT} XP`;
        let r = RANKS[0][1];
        RANKS.forEach(([th, n]) => { if (v >= th) r = n; });
        $("rank").textContent = "RANK: " + r;
      };
      tasks.forEach((t, i) => {
        const id = "q" + i;
        if (doneById.get(id)) t.classList.add("done");
        t.addEventListener("click", async () => {
          t.classList.toggle("done");
          xp();
          const act = t.closest(".phase")?.querySelector(".lvl")?.textContent ?? "";
          const label = t.querySelector(".tt")?.textContent ?? "";
          await sb.from("zc_ledger_quests").upsert({
            id, act, label, xp: +(t.dataset.xp ?? 0), done: t.classList.contains("done"),
            updated_at: new Date().toISOString(),
          });
          flashSaved();
        });
      });
      xp();

      /* ---- calculator ---- */
      const fm = (n: number) => "$" + (n >= 1000 ? (n / 1000).toFixed(n % 1000 ? 1 : 0) + "k" : n);
      const ids = ["b", "bp", "r", "a", "t"] as const;
      const saved = (settingsRows?.[0]?.data ?? {}) as Record<string, number>;
      ids.forEach((i) => {
        if (saved[i] !== undefined) ($(i) as HTMLInputElement).value = String(saved[i]);
      });
      const calc = () => {
        const v = Object.fromEntries(ids.map((i) => [i, +($(i) as HTMLInputElement).value])) as Record<string, number>;
        $("bO").textContent = String(v.b);
        $("bpO").textContent = fm(v.bp);
        $("rO").textContent = String(v.r);
        $("aO").textContent = String(v.a);
        $("tO").textContent = fm(v.t);
        const lump = v.b * v.bp, floor = v.r * 149 + v.a * 9, tot = lump + floor;
        $("tot").textContent = fm(tot);
        $("totN").textContent = "≈ ₹" + ((tot * 83.5) / 100000).toFixed(1) + "L / mo, pre-fees";
        $("flr").textContent = fm(floor);
        $("lmp").textContent = tot ? Math.round((lump / tot) * 100) + "%" : "0%";
        $("need").textContent = String(Math.max(0, Math.ceil((1000 - v.a * 9) / 149)));
        ($("g1") as HTMLElement).style.width = Math.min(100, (floor / 1000) * 100) + "%";
        $("g1p").textContent = Math.round((floor / 1000) * 100) + "%";
        ($("g2") as HTMLElement).style.width = Math.min(100, (tot / v.t) * 100) + "%";
        $("g2p").textContent = Math.round((tot / v.t) * 100) + "%";
        return v;
      };
      const saveCalc = debounce(async (v: Record<string, number>) => {
        await sb.from("zc_ledger_settings").upsert({ key: "calc", data: v, updated_at: new Date().toISOString() });
        flashSaved();
      }, 800);
      ids.forEach((i) => $(i).addEventListener("input", () => saveCalc(calc())));
      calc();

      /* ---- nav highlight + sign out ---- */
      const links = [...root.querySelectorAll<HTMLAnchorElement>("nav a")];
      const io = new IntersectionObserver(
        (es) => es.forEach((e) => {
          if (e.isIntersecting)
            links.forEach((l) => l.classList.toggle("on", l.getAttribute("href") === "#" + e.target.id));
        }),
        { rootMargin: "-25% 0px -65% 0px" }
      );
      links.forEach((l) => {
        const s = root.querySelector(l.getAttribute("href")!);
        if (s) io.observe(s);
      });
      $("signout").addEventListener("click", () => opsSupabase().auth.signOut());
    })();
  }, []);

  return (
    <div className="ops-root" ref={rootRef}>
      <style>{LEDGER_CSS}</style>
      <div className="shell" dangerouslySetInnerHTML={{ __html: LEDGER_HTML }} />
    </div>
  );
}
