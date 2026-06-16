import type { SiteSeed } from "./types";

/**
 * watch.zephyrcode.live — every string below is extracted VERBATIM from
 * /_reference/watch.html (prime directive: the copy is sacred).
 * Channel 07 is stored DECODED ("Prestige & Page") — the source markup holds
 * "Prestige &amp; Page" and decodes it at render time via innerHTML.
 */
export const watchSeed: SiteSeed = {
  site: {
    slug: "watch",
    host: "watch.zephyrcode.live",
    title: "WATCH — eight mood channels · ZephyrCode",
    description:
      "Series and films sorted by state of mind, not genre — from Brain on Fire to Decompress. Scored against one viewer's taste profile, ranked without mercy.",
    accent: "#C9A45C",
    og_image: null,
    nav_order: 7,
  },
  blocks: [
    {
      section: "hero",
      kind: "hero",
      position: 1,
      data: {
        eyebrow: "watch.zephyrcode.live",
        h1: "Eight channels. <em>Zero browsing.</em>",
        lede: "Streaming menus answer \"what exists.\" This answers <b>\"what is tonight for?\"</b> Every title is scored against one viewer's taste profile — cerebral mystery, hard SF with a pulse, crime with a conscience — and ranked without mercy. <b>Dark</b> is the north star. It was always going to be.",
      },
    },
    {
      section: "np",
      kind: "kv",
      position: 2,
      data: {
        tunedPrefix: "NOW TUNED · CH",
        footnote:
          "MATCH % = FIT TO THE HOUSE TASTE PROFILE, NOT QUALITY. QUALITY IS ASSUMED; WE DON'T SHELVE FILLER.",
        aria: "Mood channels",
      },
    },
    {
      section: "crumb",
      kind: "label",
      position: 3,
      data: { text: "WATCH · EIGHT MOOD CHANNELS" },
    },
  ],
  watch: [
    {
      n: "01",
      name: "Brain on Fire",
      tagline: "for when the day didn't use all of you",
      position: 1,
      titles: [
        {
          title: "Dark",
          match: 99,
          platform: "NETFLIX",
          why: "Three generations, one cave, zero wasted scenes. The reference standard — watched five times in this house, still undefeated.",
          position: 1,
        },
        {
          title: "Bodies",
          match: 94,
          platform: "NETFLIX",
          why: "One corpse, four detectives, four timelines. A loop that actually closes.",
          position: 2,
        },
        {
          title: "3 Body Problem",
          match: 92,
          platform: "NETFLIX",
          why: "Physics breaks first; people follow. Read the trilogy and feel superior, gently.",
          position: 3,
        },
      ],
    },
    {
      n: "02",
      name: "Pure Puzzle",
      tagline: "fair clues, no hand-holding",
      position: 2,
      titles: [
        {
          title: "Dept. Q",
          match: 93,
          platform: "NETFLIX",
          why: "Cold cases, colder detective. Procedural craft with actual procedure.",
          position: 1,
        },
        {
          title: "Dark Matter",
          match: 90,
          platform: "ATV+",
          why: "One choice, infinite Jasons. Crouch's box, opened properly.",
          position: 2,
        },
        {
          title: "Sherlock",
          match: 87,
          platform: "NETFLIX",
          why: "The deduction-as-spectacle blueprint. Seasons one and two, then leave the table.",
          position: 3,
        },
      ],
    },
    {
      n: "03",
      name: "Adrenaline",
      tagline: "gloves on, brain still invited",
      position: 3,
      titles: [
        {
          title: "My Name",
          match: 91,
          platform: "NETFLIX",
          why: "Revenge with footwork. The fight choreography respects your training eye.",
          position: 1,
        },
        {
          title: "The Night Comes for Us",
          match: 88,
          platform: "NETFLIX",
          why: "Indonesian action at maximum honesty. Stretch first.",
          position: 2,
        },
        {
          title: "Extraction",
          match: 84,
          platform: "NETFLIX",
          why: "One-take logistics. Cardio for the camera operator.",
          position: 3,
        },
      ],
    },
    {
      n: "04",
      name: "Shadow Games",
      tagline: "spies, leaks, long knives",
      position: 4,
      titles: [
        {
          title: "The Family Man",
          match: 95,
          platform: "PRIME",
          why: "Middle management versus national security. The most honest job description on television.",
          position: 1,
        },
        {
          title: "Slow Horses",
          match: 93,
          platform: "ATV+",
          why: "Failed spies, magnificent spite. Lamb is a one-man counterargument to LinkedIn.",
          position: 2,
        },
        {
          title: "The Night Manager",
          match: 87,
          platform: "JIO",
          why: "Le Carré with better hotels. Treachery, beautifully lit.",
          position: 3,
        },
      ],
    },
    {
      n: "05",
      name: "Statecraft",
      tagline: "power, watched closely",
      position: 5,
      titles: [
        {
          title: "Scam 1992",
          match: 94,
          platform: "SONY",
          why: "A market, a man, a margin call on an entire system. Rewatch material for systems thinkers.",
          position: 1,
        },
        {
          title: "The Diplomat",
          match: 88,
          platform: "NETFLIX",
          why: "Crisis management as bloodsport. Dialogue with elbows.",
          position: 2,
        },
        {
          title: "House of Cards",
          match: 85,
          platform: "NETFLIX",
          why: "The machinery of ambition, fourth wall optional. Early seasons, then exit clean.",
          position: 3,
        },
      ],
    },
    {
      n: "06",
      name: "Slow Descent",
      tagline: "beautiful unravelings",
      position: 6,
      titles: [
        {
          title: "Severance",
          match: 96,
          platform: "ATV+",
          why: "Work-life balance, surgically enforced. The most elegant horror premise of the decade.",
          position: 1,
        },
        {
          title: "Mr. Robot",
          match: 93,
          platform: "PRIME",
          why: "An unreliable narrator with root access. Society gets debugged; so does he.",
          position: 2,
        },
        {
          title: "The OA",
          match: 90,
          platform: "NETFLIX",
          why: "Faith, movement, and a swing for the fences that connects. Yes, even the ending.",
          position: 3,
        },
      ],
    },
    {
      n: "07",
      name: "Prestige & Page",
      tagline: "novels that learned to act",
      position: 7,
      titles: [
        {
          title: "Shōgun",
          match: 96,
          platform: "JIO",
          why: "Power as language lesson. Every silence is load-bearing.",
          position: 1,
        },
        {
          title: "Pachinko",
          match: 95,
          platform: "ATV+",
          why: "Four generations carried across water. Television that earns the word literature.",
          position: 2,
        },
        {
          title: "The Queen's Gambit",
          match: 91,
          platform: "NETFLIX",
          why: "Genius as addiction with better lighting. The ceiling scene alone.",
          position: 3,
        },
      ],
    },
    {
      n: "08",
      name: "Decompress",
      tagline: "low stakes, high craft",
      position: 8,
      titles: [
        {
          title: "Our Planet",
          match: 86,
          platform: "NETFLIX",
          why: "Attenborough administers perspective. The only feed worth doomscrolling.",
          position: 1,
        },
        {
          title: "Chef's Table",
          match: 84,
          platform: "NETFLIX",
          why: "Obsession, plated. Watch a master descend, compress, animate, ship — sound familiar?",
          position: 2,
        },
        {
          title: "Ted Lasso",
          match: 88,
          platform: "ATV+",
          why: "Sincerity played as a power move. Recovery content for cynics.",
          position: 3,
        },
      ],
    },
  ],
};
