import type { SiteSeed } from "./types";

/**
 * operator.zephyrcode.live — every string below is VERBATIM from
 * /_reference/operator.html (BRIEF prime directive: the copy is sacred).
 */
export const operatorSeed: SiteSeed = {
  site: {
    slug: "operator",
    host: "operator.zephyrcode.live",
    title: "OPERATOR — Personal Operating Systems · ZephyrCode",
    description:
      "Install a life protocol the way you install software — except this one ships with consequences. Personal Operating Systems: knowledge, protocol, and a game layer that keeps score on reality.",
    accent: "#E85D2A",
    og_image: null,
    nav_order: 3,
  },
  blocks: [
    {
      section: "crumb",
      kind: "kv",
      position: 0,
      data: { text: "OPERATOR · PERSONAL OS STUDIO" },
    },
    {
      section: "boot",
      kind: "lines",
      position: 1,
      data: {
        aria: "Boot sequence",
        lines: [
          ["ZEPHYR/OS v1.0 — bootloader", ""],
          ["▸ mounting /protocols", " <span class=\"ok\">ok</span>"],
          ["▸ loading consequence_engine", " <span class=\"ok\">ok</span>"],
          ["▸ checking founder.vitals", " <span class=\"ok\">within spec</span>"],
          [
            "▸ locating motivation",
            " <span class=\"warn\">not found — proceeding anyway (by design)</span>",
          ],
          ["READY.", ""],
        ],
      },
    },
    {
      section: "hero",
      kind: "hero",
      position: 2,
      data: {
        eyebrow: "operator.zephyrcode.live",
        h1: "Install a life protocol like software — <em>this one ships with consequences.</em>",
        lede:
          "Not courses <b>(passive)</b>. Not templates <b>(dead tables)</b>. Not habit apps <b>(checkbox theatre)</b>. A <b>Personal Operating System</b> carries the research, runs the protocol, and simulates what your adherence is actually buying you — like a save-file you're either leveling or corrupting.",
        ctas: [
          {
            label: "Request the pilot →",
            href: "mailto:hello@zephyrcode.live?subject=FORGE%20OS%20pilot",
          },
          { label: "Play the demos first", href: "https://arcade.zephyrcode.live" },
        ],
      },
    },
    {
      section: "layers",
      kind: "windows",
      position: 3,
      data: {
        windows: [
          {
            bar: "LAYER 01 · /KNOWLEDGE",
            h3: "The research, compressed",
            p: "Mechanisms, dosages, doctrine, sources — <b>a hundred hours of homework distilled</b> until only the load-bearing sentences remain. You get the why, minus the wandering.",
          },
          {
            bar: "LAYER 02 · /PROTOCOL",
            h3: "The system, runnable",
            p: "Daily and weekly blocks tuned to <b>your</b> constraints — schedule, biology, equipment. Not advice. An executable.",
          },
          {
            bar: "LAYER 03 · /GAME",
            h3: "The consequences, simulated",
            p: "Progression, streaks, deltas — and a curve that <b>bends when you skip</b>. Habitica gamifies checkboxes. We gamify outcomes. Different species.",
          },
        ],
      },
    },
    {
      section: "engine",
      kind: "engine",
      position: 4,
      data: {
        k: "THE CONSEQUENCE ENGINE · A MONTH IN YOUR HANDS",
        sub: "Twenty-eight days. Tap to skip a few — everyone does. The dotted line is the trajectory you bought. The solid one is the trajectory you're earning. The gap between them has a name, and the OS will say it to your face.",
        monthAria: "Toggle adherence for 28 days",
        verdicts: [
          [97, "pristine. suspiciously pristine."],
          [88, "strong. the curve believes you."],
          [75, "human. the curve is negotiating."],
          [60, "the gap now has a name. it's yours."],
          [0, "the museum called. it wants its exhibit."],
        ],
        integrityLabel: "SAVE-FILE INTEGRITY · ",
        verdictLabel: "VERDICT · ",
        preloadedMisses: [6, 13],
        seriesParams: { start: 18, hit: 3.4, miss: -5.2 },
      },
    },
    {
      section: "flagships",
      kind: "cards",
      position: 5,
      data: {
        eyebrow: "flagships",
        h2: "Two OSes ship first. <em>One is already running.</em>",
        cards: [
          {
            k: "OS 01 · THE BODY",
            h3: "FORGE",
            p: "The founder's own 26-week system — three sessions a day, tuned to his genetics, audited by bloodwork that moved. The first customer was his own biology. It paid in full.",
            up: {
              uptimePrefix: "UPTIME · DAY ",
              uptimeSuffix: " · IN PRODUCTION SINCE APR 2026",
              epoch: { y: 2026, m: 3, d: 1 },
              fallback: "UPTIME · IN PRODUCTION SINCE APR 2026",
            },
          },
          {
            k: "OS 02 · THE MIND",
            h3: "TEMPER",
            p: "Attention as the edge that holds under load — interruption budgets, a maker-schedule kernel, and a consequence engine that bills every context-switch. For people whose calendar is the malware.",
            up: "STATUS · NOW BUILDING · temper.zephyrcode.live",
          },
        ],
      },
    },
    {
      section: "roadmap",
      kind: "acts",
      position: 6,
      data: {
        eyebrow: "the roadmap",
        h2: "Three acts. <em>No epilogue without earning it.</em>",
        acts: [
          {
            n: "ACT I",
            h3: "Ship the flagships",
            p: "FORGE and TEMPER as standalone, installable OSes. Real buyers, real adherence data, real curves bending.",
          },
          {
            n: "ACT II",
            h3: "Extract the runtime",
            p: "The engine beneath both — plus an AI interview layer that tunes any OS to the human installing it. The product becomes a platform, quietly.",
          },
          {
            n: "ACT III",
            h3: "Open the foundry",
            p: "A creator marketplace: experts bring the knowledge, the runtime brings the consequences. Their audience, our engine, everyone's curve.",
          },
        ],
        kill: "KILL CRITERIA — forty paying humans by the end of month four, or this page becomes a museum with excellent lighting. We publish the number either way. Consequence engines that exempt their maker are called marketing.",
      },
    },
    // creator-facing commission page (operator.zephyrcode.live/commission) —
    // the arcade's Rail-1 door; copy verbatim from the production-audit directive
    {
      section: "commission",
      kind: "kv",
      position: 50,
      data: {
        ey: "COMMISSION A MACHINE",
        h1: "Your idea, playable.",
        body: "I turn your course/book's core idea into a machine your audience can play. Founding rate $1,500, two weeks, white-label, first three clients only.",
        cta: {
          label: "COMMISSION A MACHINE →",
          href: "mailto:hello@zephyrcode.live?subject=Commission%20a%20machine%20%E2%80%94%20%5Byour%20name%5D",
        },
        proof: { label: "SEE THE MACHINES FIRST →", href: "https://arcade.zephyrcode.live" },
      },
    },
  ],
};
