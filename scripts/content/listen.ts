import type { SiteSeed } from "./types";

/**
 * listen.zephyrcode.live — every string below is extracted VERBATIM from
 * /_reference/listen.html (prime directive: the copy is sacred).
 * `voices` are the oscilloscope voice params, copied value-for-value from the
 * source PROOFS array (`burst:!0` is stored as boolean true).
 */
export const listenSeed: SiteSeed = {
  site: {
    slug: "listen",
    host: "listen.zephyrcode.live",
    title: "LISTEN — the listening room · ZephyrCode",
    description:
      "Five things a rig must prove — weight, stage, breath, detail, dynamics — and the tracks that interrogate each one. Reference chain: HD 660S2 into a FiiO K11 R2R, balanced, high gain.",
    accent: "#E85D2A",
    og_image: null,
    nav_order: 8,
  },
  blocks: [
    {
      section: "hero",
      kind: "hero",
      position: 1,
      data: {
        eyebrow: "listen.zephyrcode.live",
        h1: "Five things a rig <em>must prove.</em>",
        lede: "Specifications are testimony; <b>music is cross-examination.</b> Below: the five proofs every chain in this house has to pass, the tracks that interrogate each one, and the scope showing what you should be hearing. No burn-in ritual required — <b>your ears do the burning-in.</b>",
      },
    },
    {
      section: "scope",
      kind: "kv",
      position: 2,
      data: {
        labPrefix: "PROOF ",
        hzLine: "REFERENCE TRACE · NOT TO SCALE · OBVIOUSLY",
        aria: "The five proofs",
      },
    },
    {
      section: "ignition",
      kind: "kv",
      position: 3,
      data: {
        k: "BONUS PROOF · IGNITION",
        t: "DIVINE · Seedhe Maut · gym volume",
        s: "THE IEM DEPARTMENT (ZERO:RED) HANDLES GLOVES-ON HOURS. THE HEADPHONES STAY HOME AND JUDGE.",
      },
    },
    {
      section: "rig",
      kind: "kv",
      position: 4,
      data: {
        k: "THE RIG OF RECORD",
        chain: [
          "SOURCE · LOSSLESS",
          "FiiO K11 R2R",
          "4.4mm BALANCED",
          "SENNHEISER HD 660S2",
          "STERNUM",
        ],
        note: "High gain, volume at \"respectful.\" R2R because numbers should pass through a ladder of actual resistors before becoming feelings. The truth-teller screen reads 44.1 when the stream behaves, and you check it the way other people check the weather. <b>Mobile detachment:</b> ZERO:RED IEMs off a ddHiFi dongle — the away kit for a rig that took the home game seriously.",
      },
    },
    {
      section: "crumb",
      kind: "label",
      position: 5,
      data: { text: "LISTEN · THE LISTENING ROOM" },
    },
  ],
  listenProofs: [
    {
      n: "01",
      name: "WEIGHT",
      claim:
        "Bass you feel in the sternum, not the eardrum. If the room doesn't get heavier, return the cable.",
      voices: [{ c: "#E85D2A", w: 2.5, f: 1.6, a: 52, sp: 0.9, sub: 0.5 }],
      position: 1,
      tracks: [
        {
          title: "Why So Serious?",
          artist: "Hans Zimmer",
          why: "The famous low-end descent — a structural inspection for your floor, your seal, your resolve.",
          position: 1,
        },
        {
          title: "Angel",
          artist: "Massive Attack",
          why: "A bassline with a predator's patience. Texture down where most rigs only rumble.",
          position: 2,
        },
      ],
    },
    {
      n: "02",
      name: "STAGE",
      claim:
        "Close your eyes; the band should have coordinates. Width is easy — depth is the tell.",
      voices: [
        { c: "#E85D2A", w: 2, f: 2.4, a: 34, sp: 1.1, ph: 0, off: -22 },
        { c: "#C9A45C", w: 2, f: 2.4, a: 34, sp: 1.1, ph: 2.1, off: 22 },
      ],
      position: 2,
      tracks: [
        {
          title: "Bubbles",
          artist: "Yosi Horikawa",
          why: "Field recordings that place each droplet at an address. Imaging's party trick, performed straight-faced.",
          position: 1,
        },
        {
          title: "Time",
          artist: "Hans Zimmer",
          why: "One phrase, twelve entrances. Count the layers arriving; lose count on purpose.",
          position: 2,
        },
      ],
    },
    {
      n: "03",
      name: "BREATH",
      claim:
        "The air between notes — decay, room, the intake before the line. Intimacy is a resolution problem.",
      voices: [{ c: "#C9A45C", w: 2, f: 3.2, a: 22, sp: 0.7, noise: 9 }],
      position: 3,
      tracks: [
        {
          title: "Apocalypse",
          artist: "Cigarettes After Sex",
          why: "Reverb tails you could sleep in. The vocal sits close enough to be a confession.",
          position: 1,
        },
        {
          title: "Riverside",
          artist: "Agnes Obel",
          why: "Felt on hammers, floorboards under pedals. You can hear the room thinking.",
          position: 2,
        },
      ],
    },
    {
      n: "04",
      name: "DETAIL",
      claim:
        "What survives at low volume is the truth of a chain. Texture at the edge of silence.",
      voices: [{ c: "#E85D2A", w: 1.6, f: 2, a: 26, sp: 0.8, ripF: 22, ripA: 7 }],
      position: 4,
      tracks: [
        {
          title: "Hand Covers Bruise",
          artist: "Trent Reznor & Atticus Ross",
          why: "A piano decaying over a noise floor that slowly tells the truth about your DAC.",
          position: 1,
        },
        {
          title: "Says",
          artist: "Nils Frahm",
          why: "One arpeggio, ten patient minutes, the swell of the decade. Detail becomes weather.",
          position: 2,
        },
      ],
    },
    {
      n: "05",
      name: "DYNAMICS",
      claim:
        "The quiet must be honest so the loud can be violent. Warn the household; apologize to no one.",
      voices: [{ c: "#E85D2A", w: 2.2, f: 5, a: 7, sp: 1.4, burst: true }],
      position: 5,
      tracks: [
        {
          title: "No Time for Caution",
          artist: "Hans Zimmer",
          why: "The docking scene. Organ at full sail. The dynamic swing other tracks gossip about.",
          position: 1,
        },
        {
          title: "Mars, the Bringer of War",
          artist: "Gustav Holst",
          why: "The orchestra as a weapons system — col legno strings like knuckles on wood.",
          position: 2,
        },
      ],
    },
  ],
};
