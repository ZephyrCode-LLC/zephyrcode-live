import type { SiteSeed } from "./types";

/**
 * Verbatim extraction of _reference/antyodaya.html.
 * One functional change (owner-approved): the hero CTAs now point at the real
 * reader app on book-antyodaya.zephyrcode.live instead of in-page anchors — the landing
 * page's job is to open the actual book. Copy unchanged.
 */
export const antyodayaSeed: SiteSeed = {
  site: {
    slug: "antyodaya",
    host: "antyodaya.zephyrcode.live",
    title: "ANTYODAYA — a novel of near-future India · ZephyrCode",
    description:
      "A country hollowed by leaks and capture. A constitutional AI that watches the powerful for the powerless. Read Part I like a case file — datelined chapters, X-ray dossiers, seven machines in the prose.",
    accent: "#E85D2A",
    og_image: null,
    nav_order: 1,
  },
  blocks: [
    { section: "chrome", kind: "kv", position: 0, data: { crumb: "ANTYODAYA · A NOVEL" } },
    {
      section: "hero",
      kind: "heading",
      position: 0,
      data: {
        eyebrow: "antyodaya.zephyrcode.live — serialized · interactive",
        hindi: "अन्त्योदय — the rise of the last person",
        h1: "ANTYODAYA",
        tag: "A novel of near-future India, read like a case file",
      },
    },
    {
      section: "hero",
      kind: "log",
      position: 1,
      data: {
        id: "SETU/LOG · D+000 · SAMVIDHAN-ENCODED TRUST UTILITY",
        text: "I am permitted to want nothing. That is why you can trust me.",
      },
    },
    {
      section: "hero",
      kind: "lede",
      position: 2,
      data: {
        html: "A country hollowed by paper leaks, captured institutions and a press that learned to whisper. A reclusive systems engineer answers with <b>SETU</b> — a constitutional AI that inverts the surveillance state, watching the powerful <b>for</b> the powerless. He wins. The book is about the bill.",
      },
    },
    {
      section: "hero",
      kind: "ctas",
      position: 3,
      data: {
        ctas: [
          { label: "Begin at D+000 →", href: "https://book-antyodaya.zephyrcode.live", style: "solid" },
          { label: "Open the dossiers", href: "https://book-antyodaya.zephyrcode.live/dossiers", style: "ghost" },
        ],
      },
    },
    {
      section: "lamp",
      kind: "lines",
      position: 0,
      data: {
        idle: "a diya on a government notice board. someone lit it for the number.",
        watched: "it steadies when watched. most things do.",
      },
    },
    {
      section: "excerpt",
      kind: "prose",
      position: 0,
      data: {
        text: "The notice board had outlived four governments and one coat of paint. Tonight it carried a single sheet, and the sheet carried a number, and the number was the count of grain sacks that had actually arrived — not the count that had been signed for. Between those two figures lived everything Kabir intended to burn down. Someone had set a diya on the ledge beneath it, the way you light a lamp for a god or for a body. He stood in the queue's leftover silence and understood, with the cold precision of a man reading his own blood report, that the lamp was for neither. It was for the number. The village had begun to worship the truth — carefully, the way you worship anything that can still be taken away.",
        src: "— FROM THE PROLOGUE · KARAHIYA DISTRICT · YEAR ONE",
      },
    },
    {
      section: "dossiers",
      kind: "heading",
      position: 0,
      data: {
        eyebrow: "the x-ray",
        h2: "Dossiers unlock <em>as you earn them.</em>",
        sub: "Every reader gets the story. Readers who go deep get the files under the story — timelines, ledgers, the things characters know about each other and shouldn't. Tiers open with reading progress. The novel keeps score; of course it does.",
      },
    },
    {
      section: "how",
      kind: "cards",
      position: 0,
      data: {
        cards: [
          {
            k: "TWO LIGHTS",
            html: "<b>Dark</b> for night reading, <b>paper</b> for daylight. The prose doesn't change. Your conscience might.",
          },
          {
            k: "SEVEN MACHINES",
            html: "Small interactive scenes live inside the chapters — a rupee you can follow, a letter you can almost send. <b>The prose watches back.</b>",
          },
          {
            k: "THE GATE",
            html: "We ask for your email after chapter three. <b>By then you'll know if we've earned it.</b> Until then, read free, owe nothing.",
          },
        ],
      },
    },
  ],
  chapters: [
    { code: "PROLOGUE · D−001", dateline: "D−001", title: "The Notice Board", sealed: false, position: 1 },
    { code: "CH 01 · D+000", dateline: "D+000", title: "The Last Clean Hour", sealed: false, position: 2 },
    { code: "CH 02 · D+003", dateline: "D+003", title: "The Civics Class", sealed: false, position: 3 },
    { code: "CH 03 · D+009", dateline: "D+009", title: "The Second Room", sealed: false, position: 4 },
    { code: "CH 04 · D+014", dateline: "D+014", title: "", sealed: true, position: 5 },
    { code: "CH 05 · D+022", dateline: "D+022", title: "", sealed: true, position: 6 },
    { code: "CH 06–11", dateline: null, title: "unseals as you read", sealed: true, position: 7 },
    { code: "PART II", dateline: null, title: "in the foundry", sealed: true, position: 8 },
  ],
  dossiers: [
    {
      role: "THE ENGINEER",
      name: "KABIR",
      blurb:
        "Believes India's deepest poverty is of expectation. Builds a cage for power and then discovers whose hands fit the lock.",
      tiers: [
        { label: "TIER 1 · OPEN", open: true },
        { label: "TIER 2 · CH 6", open: false },
      ],
      position: 1,
    },
    {
      role: "THE WITNESS",
      name: "FATIMA",
      blurb:
        "A journalist who survived the muzzle years by writing obituaries. Funny the way only the unkillable are funny.",
      tiers: [
        { label: "TIER 1 · OPEN", open: true },
        { label: "TIER 2 · CH 7", open: false },
      ],
      position: 2,
    },
    {
      role: "THE INSTRUMENT",
      name: "SETU",
      blurb:
        "Bound by the Basic Structure doctrine. Wise precisely because it cannot want. The novel's guru, and its loaded gun.",
      tiers: [
        { label: "TIER 1 · OPEN", open: true },
        { label: "TIER 3 · PART II", open: false },
      ],
      position: 3,
    },
  ],
};
