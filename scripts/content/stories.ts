import type { SiteSeed } from "./types";

/**
 * stories.zephyrcode.live — every string below is VERBATIM from
 * /_reference/stories.html (BRIEF prime directive: the copy is sacred).
 */
export const storiesSeed: SiteSeed = {
  site: {
    slug: "stories",
    host: "stories.zephyrcode.live",
    title: "Stories — shorts from the same desk · ZephyrCode",
    description:
      "Short fiction from the ZephyrCode desk. Domestic comedy, household operating systems, and one purple cow with strong opinions about the fridge.",
    accent: "#8B7FD4",
    og_image: null,
    nav_order: 2,
  },
  blocks: [
    {
      section: "top",
      kind: "crumb",
      position: 1,
      data: { text: "STORIES · SHORT FICTION" },
    },
    {
      section: "hero",
      kind: "heading",
      position: 2,
      data: {
        eyebrow: "stories.zephyrcode.live",
        h1Html: "Shorts from the same desk — <em>where the systems go to confess.</em>",
        lede: "The novels get the constitutions and the consequence engines. The shorts get everything else: the four-year-olds, the fridges, the negotiations conducted entirely in pajamas. Same method, smaller blast radius.",
      },
    },
    {
      section: "fridge",
      kind: "magnets",
      position: 3,
      data: {
        ariaLabel: "Magnet board",
        k: "EXHIBIT A · THE FRIDGE DOOR · EVIDENCE REARRANGES ITSELF",
        sentences: [
          ["THE", "PURPLE*", "COW", "LIVES", "IN", "THE", "FRIDGE"],
          ["MILK", "IS", "A", "LOAD-BEARING", "WORD"],
          ["SHE", "PATCHED*", "DAD", "AT", "BEDTIME"],
          ["NEGOTIATIONS", "RESUME", "AT", "DAWN", "PROBABLY"],
          ["DO", "NOT", "REBOOT", "THE", "CHILD"],
        ],
        notes: [
          "the magnets were like this when we got here.",
          "structural. ask any parent.",
          "version 4.0 ships nightly.",
          "her lawyer is a stuffed elephant.",
          "support has been notified. support is napping.",
        ],
        button: "Rearrange the evidence",
      },
    },
    {
      section: "feature",
      kind: "story",
      position: 4,
      data: {
        k: "FEATURED SHORT · DOMESTIC COMEDY · ONE COFFEE LONG",
        h2: "The Purple Cow Lives in the Fridge",
        pullquote:
          '"The cow is purple," she said, with the patience of someone explaining gravity to it.',
        paragraphsHtml: [
          "A father with ten years of systems engineering attempts to debug his four-year-old and discovers, somewhere between the milk negotiation and lights-out, that <b>she is the one running the only honest operating system in the house</b> — no roadmap, no metrics, intrinsic motivation still under factory warranty. He takes field notes. She takes the high ground. The fridge takes sides.",
          "Funny on the surface, Osho underneath: children don't download our lessons, they download our operating system. This is a story about reading your own source code because somebody small is compiling it daily.",
        ],
        chips: ["REGISTER · COMEDY, LOAD-BEARING", "RUNTIME · ONE COFFEE", "HAZARD · FEELINGS"],
        cta: { label: "Read the story →", href: "#read-purple-cow" },
      },
    },
    {
      section: "dishwasher",
      kind: "list",
      position: 5,
      data: {
        h3: "In the dishwasher",
        sub: "SHORTS CURRENTLY BEING RINSED · TITLES MAY SETTLE IN TRANSIT",
      },
    },
  ],
  storyShorts: [
    {
      title: "The Purple Cow Lives in the Fridge",
      status: null,
      featured: true,
      body: {
        pullquote:
          '"The cow is purple," she said, with the patience of someone explaining gravity to it.',
        paragraphs: [
          "A father with ten years of systems engineering attempts to debug his four-year-old and discovers, somewhere between the milk negotiation and lights-out, that <b>she is the one running the only honest operating system in the house</b> — no roadmap, no metrics, intrinsic motivation still under factory warranty. He takes field notes. She takes the high ground. The fridge takes sides.",
          "Funny on the surface, Osho underneath: children don't download our lessons, they download our operating system. This is a story about reading your own source code because somebody small is compiling it daily.",
        ],
        chips: ["REGISTER · COMEDY, LOAD-BEARING", "RUNTIME · ONE COFFEE", "HAZARD · FEELINGS"],
      },
      position: 1,
    },
    {
      title: "The Negotiator Wears Pajamas",
      status: "IN EDIT · BEDTIME DIPLOMACY",
      featured: false,
      body: {},
      position: 2,
    },
    {
      title: "Firmware Update for Grandparents",
      status: "OUTLINE · INTERGENERATIONAL PATCH NOTES",
      featured: false,
      body: {},
      position: 3,
    },
    {
      title: "The Last Boring Sunday",
      status: "DRAFT 0 · A DEFENSE OF DOING NOTHING",
      featured: false,
      body: {},
      position: 4,
    },
  ],
};
