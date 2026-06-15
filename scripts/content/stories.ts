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
      section: "dishwasher",
      kind: "list",
      position: 4,
      data: {
        h3: "Still in the dishwasher",
        sub: "SHORTS CURRENTLY BEING RINSED · TITLES MAY SETTLE IN TRANSIT",
      },
    },
  ],
  // A short with status === null is published: it carries its full featured-card
  // payload here and renders in the accordion gallery (ordered by position; the
  // first is open by default). Anything with a status stays in the dishwasher.
  storyShorts: [
    {
      title: "The Purple Cow Lives in the Fridge",
      status: null,
      featured: true,
      position: 1,
      body: {
        slug: "the-purple-cow-lives-in-the-fridge",
        accent: "#8B7FD4",
        k: "FEATURED SHORT · DOMESTIC COMEDY · ONE COFFEE LONG",
        dek: "Domestic comedy · one coffee",
        pullquote:
          '"The cow is purple," she said, with the patience of someone explaining gravity to it.',
        paragraphs: [
          "A father with ten years of systems engineering attempts to debug his four-year-old and discovers, somewhere between the milk negotiation and lights-out, that <b>she is the one running the only honest operating system in the house</b> — no roadmap, no metrics, intrinsic motivation still under factory warranty. He takes field notes. She takes the high ground. The fridge takes sides.",
          "Funny on the surface, Osho underneath: children don't download our lessons, they download our operating system. This is a story about reading your own source code because somebody small is compiling it daily.",
        ],
        chips: ["REGISTER · COMEDY, LOAD-BEARING", "RUNTIME · ONE COFFEE", "HAZARD · FEELINGS"],
        exhibit: {
          k: "EXHIBIT A · STATE OF THE FRIDGE",
          line: "MILK is a load-bearing word; remove it and the sentence collapses. The purple magnet was here when we arrived. Under no circumstances reboot the child.",
        },
      },
    },
    {
      title: "The Last Boring Sunday",
      status: null,
      featured: false,
      position: 2,
      body: {
        slug: "the-last-boring-sunday",
        accent: "#6FA8A0",
        k: "FEATURED SHORT · SUNDAY COMEDY · ONE KETTLE LONG",
        dek: "Sunday comedy · one kettle",
        pullquote:
          '"You don\'t know how to be bored anymore," she said — in the tone she reserves for true things.',
        paragraphs: [
          "A Head of Engineering who strip-mines every ninety-second gap is accused, one Sunday, of having forgotten how to be bored — and, being who he is, immediately <b>makes boredom a project</b>: three principles, one of them with a sub-bullet. Then his four-year-old commandeers the afternoon. The sofa becomes a boat, the dog becomes a confused dragon, and time goes soft and wide.",
          "Funny on the surface, still underneath: a child doesn't kill time, because time isn't yet the enemy. He spends an afternoon producing nothing — no funnel, no verdict, no optimum — and comes home with the only thing he's made all year that <b>isn't for anything</b>: a dragon named Brian.",
        ],
        chips: ["REGISTER · SUNDAY COMEDY", "RUNTIME · ONE KETTLE", "HAZARD · LETTING GO"],
        exhibit: {
          k: "EXHIBIT C · MANIFEST, S.S. SOFA",
          line: "Cargo: two unmatched socks (tickets). Crew: one captain, one dragon (formerly dog; nice, but confused). Heading: the boat goes where the boat goes. Do not ask where the boat goes.",
        },
      },
    },
    {
      title: "The Negotiator Wears Pajamas",
      status: null,
      featured: false,
      position: 3,
      body: {
        slug: "the-negotiator-wears-pajamas",
        accent: "#E0A263",
        k: "FEATURED SHORT · COURTROOM COMEDY · ONE BEDTIME LONG",
        dek: "Courtroom comedy · one bedtime",
        pullquote: '"One more story," she says. It is never one more story.',
        paragraphs: [
          "A father with a 9am negotiates bedtime against a four-year-old litigator who has reviewed the case law, knows her rights, and <b>has nowhere to be tomorrow</b>. He files for adjournment; she files for the water, the monster, the cosmos — every motion the same question in a different hat. Opposing counsel isn't trying to win. She's trying to extend. Those are different objectives, and hers is the easier one.",
          "Funny on the surface, tender underneath: a stall is a vigil. The child isn't keeping him up — she's keeping him <b>here</b>, making sure the world will still be on the far side of the dark. The fastest way to lose bedtime, he learns, is to try to win it.",
        ],
        chips: ["REGISTER · COURTROOM COMEDY", "RUNTIME · ONE BEDTIME", "HAZARD · BILLABLE FEELINGS"],
        exhibit: {
          k: "EXHIBIT B · THE BEDSIDE DOCKET",
          line: "Motion for water — denied as moot (she won't drink it; she wants the return). Motion re: the monster — no-monster jurisdiction, curtain personally reviewed. Motion to adjourn until dawn — granted, the author present.",
        },
      },
    },
    {
      title: "Firmware Update for Grandparents",
      status: "OUTLINE · INTERGENERATIONAL PATCH NOTES",
      featured: false,
      position: 4,
      body: {},
    },
  ],
};
