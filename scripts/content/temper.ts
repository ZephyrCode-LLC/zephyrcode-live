import type { SiteSeed } from "./types";

/**
 * temper.zephyrcode.live — OS 02, the mind. DOM mirrors /_reference/temper.html.
 * Copy is sacred: every string here is verbatim from the source page; the
 * components render these rows and hold zero content of their own.
 */

export const temperSeed: SiteSeed = {
  site: {
    slug: "temper",
    host: "temper.zephyrcode.live",
    title: "TEMPER — the mind OS · ZephyrCode",
    description:
      "OS 02 from the ZephyrCode studio. An operating system for attention — the edge that holds under load. Temper the blade, break a maker's afternoon, and watch one tempered year of output.",
    accent: "#8B7FD4",
    og_image: null,
    nav_order: 4,
  },
  blocks: [
    { section: "crumb", kind: "crumb", position: 0, data: { text: "TEMPER · OS 02 · THE MIND" } },

    {
      section: "hero",
      kind: "hero",
      position: 1,
      data: {
        eyebrow: "operator.zephyrcode.live / temper — operating system 02",
        h1: "TEMPER",
        thesis: "Forge the body. Temper the mind.",
        // blade colour stops: heat 0..1 → rgb (cold steel → straw → bronze → purple → blue → soft)
        stops: [
          { h: 0, rgb: [125, 129, 134] },
          { h: 0.3, rgb: [201, 164, 92] },
          { h: 0.5, rgb: [181, 101, 29] },
          { h: 0.72, rgb: [139, 127, 212] },
          { h: 0.9, rgb: [94, 123, 176] },
          { h: 1, rgb: [69, 80, 107] },
        ],
        // gauge readout grades: slider value ≤ max → {hex, label, desc}
        grades: [
          { max: 8, hex: "#7d8186", label: "COLD STEEL", desc: "a forged edge, not yet set. brittle until it's tempered." },
          { max: 34, hex: "#C9A45C", label: "STRAW", desc: "hardest, keenest — and one bad week from a chip. razors live here." },
          { max: 56, hex: "#b5651d", label: "BRONZE", desc: "the working temper. sharp enough, durable enough. the honest default." },
          { max: 80, hex: "#8B7FD4", label: "PURPLE", desc: "holds focus and still takes a hit. this is where TEMPER aims you." },
          { max: 101, hex: "#5E7BB0", label: "BLUE", desc: "springy, resilient — bends under load and returns to true." },
        ],
        hint: "drag to temper the blade — this is the only paragraph you have to read",
        ctas: [
          { label: "Break a maker's afternoon →", href: "#engine" },
          { label: "See one tempered year", href: "#proof" },
        ],
      },
    },

    {
      section: "premise",
      kind: "premise",
      position: 2,
      data: {
        lead: "Hardness is not the goal. A blade at maximum hardness <b>shatters</b> on first contact.",
        small:
          "More hours, zero slack, willpower as the only tool — that's a brittle edge, and the calendar always swings back. We call the crack <b>burnout</b> and pretend it was bad luck. TEMPER aims for the working edge instead: focus that holds <b>and</b> flexes.",
      },
    },

    {
      section: "layers",
      kind: "tiles",
      position: 3,
      data: {
        tag: "three layers · tap to open · same shape as FORGE",
        tiles: [
          {
            nm: "/KNOWLEDGE",
            pr: "the science, hammered flat",
            bullets: [
              { b: "Attention residue", text: " — switch tasks and part of your mind stays snagged on the last one." },
              { b: "The refocus tax", text: " — a \"quick question\" bills the whole climb back to depth, not its own two minutes." },
              { b: "Chronotype is biology", text: " — put the hard thing at your peak; stop apologizing for the trough." },
            ],
          },
          {
            nm: "/PROTOCOL",
            pr: "the system, runnable",
            bullets: [
              { b: "The interruption budget", text: " — N a day, like a spend limit. Everything else waits for a window." },
              { b: "The defensible block", text: " — one walled deep-work window at your peak. One screen, phone in another room." },
              { b: "The shutdown ritual", text: " — a hard close so attention recovers. The tempering cool that sets the edge." },
            ],
          },
          {
            nm: "/GAME",
            pr: "the consequences, simulated",
            bullets: [
              { b: "The temper gauge", text: " — rises with depth, falls with fragmentation. Straw to blue, scored daily." },
              { b: "The Interruption Tax", text: " — every context-switch deducts real minutes and bends your output curve." },
              { b: "Streaks with teeth", text: " — not a flame emoji for showing up; the output you bought, or lost." },
            ],
          },
        ],
      },
    },

    {
      section: "engine",
      kind: "interruption-tax",
      position: 4,
      data: {
        k: "the consequence engine · play it",
        sub: "A deep-work block isn't worth its raw minutes — you only reach depth after a <b>ramp</b>. An interruption doesn't cost five minutes; it <b>severs the block and forces a fresh climb</b>. Four \"quick syncs\" cost the afternoon. Tap the track.",
        labStart: "1:00 PM",
        labMid: "A MAKER'S AFTERNOON · 5 HOURS",
        labEnd: "6:00 PM",
        hint: 'tap anywhere to drop a "quick interruption"',
        addLabel: '+ Add a "quick sync"',
        resetLabel: "Reset the day",
        total: 300,
        ramp: 23,
        deepLabel: "DEEP-WORK EQUIVALENT",
        fragLabel: "FRAGMENTS",
        taxLabel: "TAX PAID TODAY",
        verdicts: [
          [0.92, "one clean block. this is the entire game — protect it."],
          [0.72, "still a real afternoon. one break is survivable; the edge holds."],
          [0.5, "the ramps are eating you. each return costs more than the interruption did."],
          [0.28, "fragments, not focus. you were available all day and built almost nothing."],
          [-1, "you attended a day of meetings and called it deep work. the museum of busy is open."],
        ],
      },
    },

    {
      section: "cz",
      kind: "customer-zero",
      position: 5,
      data: {
        eyebrow: "customer zero · the receipts",
        h2: "This OS managed one stubborn engineer <em>before it asked for you.</em>",
        who: "SAME PERSON · EIGHT WEEKS APART · REAL RESTRUCTURES, NOT A MOCKUP",
        week0Label: "Week 0",
        week8Label: "Week 8",
        hours: ["6a", "9a", "12p", "3p", "6p", "9p", "12a", "2a"],
        // window: 06:00 (360) → 02:00 (1560); blocks are {s,e,cls,label}
        week0: [
          { s: 360, e: 540, cls: "b-frag", label: "slow start" },
          { s: 540, e: 780, cls: "b-frag", label: "reactive inbox" },
          { s: 780, e: 1080, cls: "b-frag", label: "scattered work" },
          { s: 1080, e: 1200, cls: "b-frag", label: "more reacting" },
          { s: 1200, e: 1260, cls: "b-leisure", label: "friend chat" },
          { s: 1260, e: 1410, cls: "b-leisure", label: "Call of Duty" },
          { s: 1410, e: 1560, cls: "b-sync", label: "US sync — drifting to 2am" },
        ],
        week8: [
          { s: 360, e: 480, cls: "b-recover", label: "wake · mobility" },
          { s: 480, e: 540, cls: "b-train", label: "HIIT" },
          { s: 570, e: 660, cls: "b-deep", label: "deep block" },
          { s: 660, e: 720, cls: "b-train", label: "Muay Thai" },
          { s: 720, e: 840, cls: "b-family", label: "lunch" },
          { s: 840, e: 1050, cls: "b-deep", label: "deep block" },
          { s: 1080, e: 1140, cls: "b-train", label: "strength" },
          { s: 1170, e: 1260, cls: "b-family", label: "dinner · walk" },
          { s: 1260, e: 1410, cls: "b-sync boxed", label: "US sync — boxed" },
          { s: 1410, e: 1560, cls: "b-recover", label: "11:30 · sleep" },
        ],
        cap0: "<b>2:00am bedtimes.</b> Weeknight gaming, a sprawling US sync, and a day made of reactions. The edge never sets because the cool never comes.",
        cap8: "<b>11:30pm, lights out.</b> Two protected deep blocks at peak, training walled off, the sync boxed to 2.5 hours. Same person — re-architected, not white-knuckled.",
        moved: [
          ["BEDTIME", "2:00 AM", "11:30 PM"],
          ["NIGHTLY SLEEP", "~5 hrs", "~7.5 hrs"],
          ["WEEKNIGHT GAMING", "every night", "weekends only"],
          ["EVENING SYNC", "open-ended", "boxed · 2.5 hrs"],
          ["PROTECTED DEEP BLOCKS", "0 / day", "2 / day"],
        ],
        shippedK: "and the output · the part you can actually click",
        shippedH: "One tempered year shipped this.",
        output: [
          { u: "antyodaya.", h4: "A novel, Part I live", p: "A near-future political thriller with an interactive reader. Written in the protected evenings.", href: "https://antyodaya.zephyrcode.live" },
          { u: "operator. + arcade.", h4: "A studio, five simulators", p: "Personal Operating Systems with consequence engines. FORGE is OS 01; you're reading OS 02.", href: "https://operator.zephyrcode.live" },
          { u: "read. watch. listen.", h4: "A whole library, indexed", p: "Books, screen and sound — sorted by state of mind, scored, and built by hand.", href: "https://read.zephyrcode.live" },
        ],
        punch: "You're not reading a pitch. You're standing <b>inside the output.</b>",
      },
    },

    {
      section: "build",
      kind: "build",
      position: 6,
      data: {
        eyebrow: "the build plan",
        h2: "How it ships — <em>and how it's allowed to fail.</em>",
        split: [
          { k: "The split", b: "You build TEMPER.", p: "Product, protocol, engine — the maker's seat, full attention on OS 02." },
          { k: "The other bag", b: "The cofounder carries FORGE.", p: "Distribution as an owner, measured on real numbers. Nobody quietly only building." },
        ],
        steps: [
          { n: "STEP 01", b: "Build the wedge, not the OS.", p: "The <b>Interruption Tax</b> already lives in the Arcade — a free, playable argument. Ship the wedge; let demand pull the OS into existence." },
          { n: "STEP 02", b: "Ship the minimum honest OS.", p: "Knowledge distilled, protocol tuned to one chronotype, engine live. One real cohort, one real price." },
          { n: "STEP 03", b: "Tune on the cohort, then widen.", p: "Fit the protocol to the people running it — the way FORGE tuned on its own biology first." },
        ],
        kill: "KILL CRITERIA — a real paying-customer threshold by a real date, published either way. An attention OS that can't hold its own deadline has refuted its central claim. We don't get to exempt ourselves from the engine. Consequence engines that exempt their maker are called marketing.",
        ctas: [
          { label: "Request the TEMPER pilot →", href: "mailto:hello@zephyrcode.live?subject=TEMPER%20pilot" },
          { label: "Play the Interruption Tax", href: "https://arcade.zephyrcode.live" },
        ],
      },
    },
  ],
};
