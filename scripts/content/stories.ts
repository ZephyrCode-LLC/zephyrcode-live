import type { SiteSeed } from "./types";
import { PURPLE_COW } from "../../src/content/the-purple-cow";
import { LAST_BORING_SUNDAY } from "../../src/content/the-last-boring-sunday";
import { NEGOTIATOR_PAJAMAS } from "../../src/content/the-negotiator-wears-pajamas";

/**
 * stories.zephyrcode.live. Tech lives in components; CONTENT lives in Supabase.
 * Each published short is ONE story_shorts row that carries everything the site
 * needs — the gallery card (k/dek/pullquote/paragraphs/chips/exhibit), the
 * interactive fridge board it themes when selected, and the full reader markdown.
 * A new story = one more INSERT (see docs/AUTHOR_AGENT.md); no code change.
 *
 * The three launch shorts reuse their verbatim prose modules for slug/title/
 * accent/markdown; the rest of each row's artifacts are authored below.
 */

type Body = {
  dek: string;
  k: string;
  pullquote: string;
  paragraphs: string[];
  chips: string[];
  exhibit: { k: string; line: string };
  board: { k: string; sentences: string[][]; notes: string[]; button: string };
};

const pub = (
  mod: { slug: string; title: string; accent: string; markdown: string },
  position: number,
  featured: boolean,
  body: Body
) => ({
  title: mod.title,
  slug: mod.slug,
  status: null,
  featured,
  position,
  markdown: mod.markdown,
  body: { accent: mod.accent, ...body },
});

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
      section: "dishwasher",
      kind: "list",
      position: 3,
      data: {
        h3: "Still in the dishwasher",
        sub: "SHORTS CURRENTLY BEING RINSED · TITLES MAY SETTLE IN TRANSIT",
      },
    },
  ],
  storyShorts: [
    pub(PURPLE_COW, 1, true, {
      dek: "Domestic comedy · one coffee",
      k: "FEATURED SHORT · DOMESTIC COMEDY · ONE COFFEE LONG",
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
      board: {
        k: "EXHIBIT A · THE FRIDGE DOOR · EVIDENCE REARRANGES ITSELF",
        sentences: [
          ["THE", "PURPLE*", "COW", "LIVES", "IN", "THE", "FRIDGE"],
          ["MILK", "IS", "A", "LOAD-BEARING*", "WORD"],
          ["KIDS", "RUN", "YOUR", "OS*", "NOT", "YOUR", "APPS"],
          ["THE", "MIRROR*", "HAS", "NO", "SETTINGS", "MENU"],
          ["INVOICE*", "HER", "PAID", "IN", "BISCUIT"],
        ],
        notes: [
          "the magnets were like this when we got here.",
          "structural. ask any parent.",
          "she downloads the operating system, not the apps.",
          "it records the boxing and the bong alike.",
          "best deal closed all year. paid pre-licked.",
        ],
        button: "Rearrange the evidence",
      },
    }),
    pub(LAST_BORING_SUNDAY, 2, false, {
      dek: "Sunday comedy · one kettle",
      k: "FEATURED SHORT · SUNDAY COMEDY · ONE KETTLE LONG",
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
      board: {
        k: "EXHIBIT C · THE SHIP'S LOG · CARGO REARRANGES ITSELF",
        sentences: [
          ["THE", "DRAGON'S*", "NAME", "IS", "BRIAN"],
          ["THE", "SOFA", "IS", "A", "BOAT*"],
          ["TWO", "SOCKS", "ARE", "THE", "TICKETS*"],
          ["DELETE*", "THE", "FRAMEWORK"],
          ["ONE", "VERY", "BORING*", "CROW"],
        ],
        notes: [
          "nice, but confused.",
          "do not ask where the boat goes.",
          "they do not match. they do not need to.",
          "moved to a folder called LATER instead.",
          "the best crow I have ever seen.",
        ],
        button: "Re-sail the manifest",
      },
    }),
    pub(NEGOTIATOR_PAJAMAS, 3, false, {
      dek: "Courtroom comedy · one bedtime",
      k: "FEATURED SHORT · COURTROOM COMEDY · ONE BEDTIME LONG",
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
      board: {
        k: "EXHIBIT B · THE BEDSIDE DOCKET · MOTIONS REARRANGE THEMSELVES",
        sentences: [
          ["ONE", "MORE*", "STORY", "SHE", "SAYS"],
          ["A", "STALL", "IS", "A", "VIGIL*"],
          ["A", "NO-MONSTER*", "JURISDICTION"],
          ["SHE", "ONLY", "WANTED", "THE", "AUTHOR*"],
          ["ADJOURNED*", "UNTIL", "DAWN"],
        ],
        notes: [
          "it is never one more story.",
          "she is keeping you here, not up.",
          "curtain personally reviewed.",
          "not the water. the author.",
          "granted — the author present.",
        ],
        button: "Re-file the motion",
      },
    }),
    {
      title: "Firmware Update for Grandparents",
      slug: null,
      status: "OUTLINE · INTERGENERATIONAL PATCH NOTES",
      featured: false,
      position: 4,
      markdown: null,
      body: {},
    },
  ],
};
