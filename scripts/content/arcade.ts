import type { SiteSeed } from "./types";

/**
 * arcade.zephyrcode.live — every string below is VERBATIM from
 * /_reference/arcade.html (BRIEF prime directive: the copy is sacred).
 * HTML entities are decoded ("SWIPE &amp; SUFFER" → "SWIPE & SUFFER").
 */
export const arcadeSeed: SiteSeed = {
  site: {
    slug: "arcade",
    host: "arcade.zephyrcode.live",
    title: "THE ARCADE — playable arguments · ZephyrCode",
    description:
      "Five simulators you play with your hands and lose to with your habits. Insert intention.",
    accent: "#E85D2A",
    og_image: null,
    nav_order: 4,
  },
  blocks: [
    {
      section: "crumb",
      kind: "kv",
      position: 0,
      data: { text: "THE ARCADE · PLAYABLE ARGUMENTS" },
    },
    {
      section: "marquee",
      kind: "hero",
      position: 1,
      data: {
        ey: "arcade.zephyrcode.live",
        h1: "THE ARCADE",
        sub: "PLAYABLE ARGUMENTS · <b>INSERT INTENTION</b>",
      },
    },
    {
      section: "lede",
      kind: "lede",
      position: 2,
      data: {
        html: "Five machines, five interaction grammars, zero loot boxes. Each one makes a claim about how your life actually works — then hands you the controls and lets you <b>lose to your own habits</b> in a safe, well-lit room. Cheaper than the real-world version. Significantly faster feedback.",
      },
    },
    {
      section: "play",
      kind: "kv",
      position: 3,
      data: {
        label: "PLAY →",
        hrefs: {
          leap: "#leap",
          bedtime: "#bedtime",
          plate: "#plate",
          cascade: "#cascade",
          tax: "#tax",
        },
      },
    },
    {
      section: "scores",
      kind: "kv",
      position: 4,
      data: {
        k: "TODAY'S HIGH SCORES",
        rows: [
          ["PEOPLE WHO BEAT THE GLUCOSE CURVE", "3"],
          ["PEOPLE WHO QUIT IN MONTH ONE (SIMULATED)", "412"],
          ["PEOPLE WHO QUIT IN MONTH ONE (REAL)", "0 — THAT'S THE POINT"],
          ["MEETINGS DECLINED AFTER PLAYING THE TAX", "COUNTING"],
        ],
      },
    },
  ],
  sims: [
    {
      slug: "leap",
      name: "THE LEAP",
      grammar: "GRAMMAR · DRAG THE FUTURE",
      blurb:
        "Drag the month you quit your job. Watch the valley floor rise — or not — to meet you.",
      position: 1,
    },
    {
      slug: "bedtime",
      name: "BEDTIME",
      grammar: "GRAMMAR · SWIPE & SUFFER",
      blurb:
        "A dilemma deck with four meters that remember exactly what you chose at 9:47pm.",
      position: 2,
    },
    {
      slug: "plate",
      name: "THE PLATE",
      grammar: "GRAMMAR · DIRECT MANIPULATION",
      blurb:
        "Build the meal with your hands; the glucose curve answers in real time. The curve is honest. Brutally.",
      position: 3,
    },
    {
      slug: "cascade",
      name: "CASCADE",
      grammar: "GRAMMAR · AGENTS, RELEASED",
      blurb:
        "How ideas actually spread — simple contagion versus the complex kind that needs three friends and a nudge.",
      position: 4,
    },
    {
      slug: "tax",
      name: "THE INTERRUPTION TAX",
      grammar: "GRAMMAR · THE LEDGER",
      blurb:
        "What one \"quick meeting\" really costs a maker's afternoon. Bring a strong stomach.",
      position: 5,
    },
  ],
};
