import type { SiteSeed } from "./types";

/** Verbatim extraction of _reference/zephyrcode_home.html. */
export const homeSeed: SiteSeed = {
  site: {
    slug: "home",
    host: "zephyrcode.live",
    title: "ZephyrCode — Stories with engines. Systems with souls.",
    description:
      "ZephyrCode is a one-operator studio in Bengaluru. A novel with an interactive reader, Personal Operating Systems with consequence engines, and a library of taste indexed by mood. One method: descend, compress, animate, ship.",
    accent: "#E85D2A",
    og_image: null,
    nav_order: 0,
  },
  blocks: [
    {
      section: "chrome",
      kind: "kv",
      position: 0,
      data: {
        ogDescription:
          "A one-operator studio. Fiction that watches you back, protocols that fight back, taste indexed by mood.",
        topCta: { label: "Work with the studio", href: "#operator" },
        rail: [
          { href: "#signal", t: "00 SIGNAL" },
          { href: "#method", t: "01 METHOD" },
          { href: "#stories", t: "02 STORIES" },
          { href: "#systems", t: "03 SYSTEMS" },
          { href: "#library", t: "04 LIBRARY" },
          { href: "#operator", t: "05 OPERATOR" },
        ],
      },
    },
    {
      section: "signal",
      kind: "hero",
      position: 0,
      data: {
        eyebrowHtml: 'zephyrcode.live <span class="n">— a one-operator studio · Bengaluru</span>',
        h1Html: "Stories with engines. <em>Systems with souls.</em>",
        ledeHtml:
          "One method, six rooms. <b>Descend</b> into the research. <b>Compress</b> it to what bears load. Build it so it <b>breathes</b>. A novel that watches you back, protocols that fight back, taste indexed by mood — and the background of this page is performing the method right now.",
        scrollcue: "SCROLL · 00 → 05",
      },
    },
    {
      section: "method",
      kind: "section",
      position: 0,
      data: {
        eyebrowHtml: '<span class="n">01 ·</span> The method',
        h2Html: "Everything here is built <em>the same way.</em>",
        sub: "Four moves, in order. They are the studio. The projects below are just the rooms they get performed in.",
        moves: [
          {
            k: "MOVE 1",
            h3: "Descend",
            p: "Primary sources or nothing. Constitutional doctrine for a thriller. Nine blood panels for a training block. Frequency plots for a pair of headphones. The depth is non-negotiable; it's where the interesting things live.",
          },
          {
            k: "MOVE 2",
            h3: "Compress",
            p: "Most research dies of obesity. Strip it to the load-bearing ideas — the sentence the whole artifact can stand on. If it can't be compressed, it isn't understood yet.",
          },
          {
            k: "MOVE 3",
            h3: "Animate",
            p: "A document tells you what it knows. An artifact asks what you'll do about it. Everything ships interactive — dossiers, toggles, engines, consequence. Nothing is allowed to just sit there.",
          },
          {
            k: "MOVE 4",
            h3: "Ship",
            p: "Living things go outside. Each project gets its own address on this domain and keeps being maintained like software — because it is software, even the fiction.",
          },
        ],
        lawsHtml: [
          "<b>LAW 1</b> — NOTHING STATIC",
          "<b>LAW 2</b> — CONSEQUENCE &gt; CHECKBOX",
          "<b>LAW 3</b> — FIRE AND STILLNESS, BOTH",
        ],
        asideHtml:
          '( the particles behind this section just went from <span>weather</span> to <span>architecture</span>. that\'s the job. )',
      },
    },
    {
      section: "stories",
      kind: "section",
      position: 0,
      data: {
        eyebrowHtml: '<span class="n">02 ·</span> Stories',
        h2Html: "Fiction, engineered to be <em>entered</em> — not just read.",
        feature: {
          hindi: "अन्त्योदय — the rise of the last person",
          h3: "ANTYODAYA",
          tag: "A novel of near-future India · serialized · interactive",
          logId: "SETU/LOG · D+000 · SAMVIDHAN-ENCODED TRUST UTILITY",
          logText: "I am permitted to want nothing. That is why you can trust me.",
          blurbHtml:
            "A country hollowed by paper leaks, captured institutions and a muzzled press. A reclusive systems engineer builds <b>SETU</b> — a constitutional AI that inverts the surveillance model, watching the powerful <b>for</b> the powerless. He wins. The novel is about everything that winning costs. Read it like a case file: datelined chapters, X-ray dossiers that unlock as you go, and seven small machines embedded in the prose itself.",
          chips: [
            { label: "Part I — Live", live: true },
            { label: "Prologue + 11 chapters", live: false },
            { label: "X-ray dossiers", live: false },
            { label: "Dark / paper themes", live: false },
            { label: "7 interactive scenes", live: false },
          ],
          ctas: [
            { label: "Enter the reader →", href: "https://book.zephyrcode.live", style: "solid" },
            { label: "Open the dossiers", href: "https://book.zephyrcode.live/dossiers", style: "ghost" },
          ],
        },
        shorts: {
          k: "Shorts · from the same desk",
          h4: "The Purple Cow Lives in the Fridge",
          p: "A comedy about a four-year-old running the only honest operating system in the house — and the father reverse-engineering it before she patches him out.",
          link: { label: "stories.zephyrcode.live →", href: "https://stories.zephyrcode.live" },
        },
      },
    },
    {
      section: "systems",
      kind: "section",
      position: 0,
      data: {
        eyebrowHtml: '<span class="n">03 ·</span> Systems',
        h2Html: "OPERATOR — <em>Personal Operating Systems.</em>",
        subHtml:
          "Not courses <b>(passive)</b>. Not templates <b>(dead tables)</b>. Not habit apps <b>(checkbox theatre)</b>. An OS carries the knowledge, runs the protocol, and — the part nobody else ships — <b>simulates the consequences of your adherence</b>, like a save-file you're either leveling or corrupting.",
        proofHtml:
          "<b>ORIGIN: FORGE.</b> The founder's own 26-week system — three sessions a day, tuned to his genetics, audited by bloodwork that moved. The first customer was his own biology. It paid in full.",
        toy: {
          k: "The difference, in one toy — tap your week",
          dayLabels: ["M", "T", "W", "T", "F", "S", "S"],
          seriesParams: { start: 22, hit: 9, miss: -13 },
          capHtml:
            "dotted = the trajectory you bought. <b>solid = the one you're earning.</b> every OS ships with one of these, grown up.",
        },
        sims: [
          { n: "THE LEAP", p: "Drag the month you quit your job; watch the valley floor rise to meet you." },
          { n: "BEDTIME", p: "A dilemma deck with four meters that remember what you chose at 9:47pm." },
          { n: "THE PLATE", p: "Build the meal with your hands; the glucose curve answers in real time." },
          { n: "CASCADE", p: "How ideas actually spread — simple contagion vs. the complex kind that needs friends." },
          { n: "THE INTERRUPTION TAX", p: 'What one "quick meeting" really costs a maker\'s afternoon. Bring a strong stomach.' },
        ],
        ctas: [
          { label: "Visit the studio →", href: "https://operator.zephyrcode.live", style: "solid" },
          { label: "Play the arcade", href: "https://arcade.zephyrcode.live", style: "ghost" },
        ],
      },
    },
    {
      section: "library",
      kind: "section",
      position: 0,
      data: {
        eyebrowHtml: '<span class="n">04 ·</span> The library',
        h2Html: "Taste is a system too — <em>indexed by state of mind,</em> not genre.",
        sub: "Three shelves. Each one answers the only question that matters at 9pm: what is the day asking for?",
        shelves: [
          {
            cls: "read",
            h3: "Read",
            axis: "axis · fire → stillness",
            pHtml:
              "Fourteen books on a single heat gradient — from Dinkar's war drums and Musashi's blade to the Gita's bridge and the dissolving quiet of <em>The Book of Mirdad</em>. Pick by the day you're having, not the canon you're told.",
            link: { label: "read.zephyrcode.live →", href: "https://read.zephyrcode.live" },
          },
          {
            cls: "watch",
            h3: "Watch",
            axis: "axis · eight mood channels",
            pHtml:
              "From <em>Brain on Fire</em> to <em>Decompress</em> — series and films scored against one viewer's taste profile and ranked on a leaderboard, with platform availability for India. Dark is the north star. Obviously.",
            link: { label: "watch.zephyrcode.live →", href: "https://watch.zephyrcode.live" },
          },
          {
            cls: "listen",
            h3: "Listen",
            axis: "axis · what a rig must prove",
            pHtml:
              "Tracks chosen to demonstrate five things — weight, stage, breath, detail, dynamics. Tuned on an HD 660S2 run balanced through R2R glass; honest on whatever you own.",
            link: { label: "listen.zephyrcode.live →", href: "https://listen.zephyrcode.live" },
          },
        ],
      },
    },
    {
      section: "operator",
      kind: "section",
      position: 0,
      data: {
        eyebrowHtml: '<span class="n">05 ·</span> The operator',
        h2Html: "One person. <em>The discipline is the production schedule.</em>",
        blurbHtml: [
          "ZephyrCode is run by one operator: <b>Priyanshu</b> — head of engineering at a health-tech startup by day, ten years across backend systems and applied AI (formerly Alexa AI), fighter by morning, father always, studio after the house sleeps.",
          "The throughline isn't a brand pose. It's a wager: that <em>raudra</em> and stillness belong in the same person, that rigor makes art sharper and story makes systems humane — and that the proof should be public, interactive, and slightly fun to poke at.",
        ],
        timetable: [
          { h: "08:00", w: "ZONE 4 · HIIT" },
          { h: "11:00", w: "MUAY THAI / BOXING" },
          { h: "18:00", w: "IRON · PPL" },
          { h: "21:30", w: "STUDIO · THIS" },
        ],
        client: {
          k: "The studio also ships for clients",
          pHtml:
            "Backend systems, applied AI/NLP, and interactive product — engagements run through <b>ZephyCode FZ-LLC</b>, the company behind the domain. If your problem needs both an engineer and a storyteller, it's a fit.",
          cta: { label: "hello@zephyrcode.live", href: "mailto:hello@zephyrcode.live" },
        },
      },
    },
    {
      section: "constel",
      kind: "footer",
      position: 0,
      data: {
        k: "The constellation — every project, its own address",
        map: [
          { u: "zephyrcode.live", what: "you are here", href: "https://zephyrcode.live" },
          { u: "antyodaya.", what: "the novel", href: "https://antyodaya.zephyrcode.live" },
          { u: "stories.", what: "short fiction", href: "https://stories.zephyrcode.live" },
          { u: "operator.", what: "personal OS studio", href: "https://operator.zephyrcode.live" },
          { u: "arcade.", what: "playable simulators", href: "https://arcade.zephyrcode.live" },
          { u: "read.", what: "fire → stillness", href: "https://read.zephyrcode.live" },
          { u: "watch.", what: "eight moods", href: "https://watch.zephyrcode.live" },
          { u: "listen.", what: "the listening room", href: "https://listen.zephyrcode.live" },
        ],
        legal: ["© 2026 ZEPHYCODE FZ-LLC · ZEPHYRCODE.LIVE", "BUILT BY HAND IN BENGALURU · NO TEMPLATE WAS HARMED"],
      },
    },
    {
      section: "field",
      kind: "engine-params",
      position: 0,
      data: {
        // per-scene grading: [colA, colB, gradientAmount] — content-ish engine params (BRIEF §3 golden rule)
        grades: [
          [[0.91, 0.365, 0.165], [0.788, 0.643, 0.361], 0.0],
          [[0.47, 0.43, 0.37], [0.91, 0.365, 0.165], 0.85],
          [[1.0, 0.47, 0.22], [0.788, 0.643, 0.361], 1.0],
          [[0.788, 0.643, 0.361], [0.89, 0.85, 0.78], 0.0],
          [[0.91, 0.365, 0.165], [0.545, 0.498, 0.831], 1.0],
          [[0.91, 0.365, 0.165], [1.0, 0.478, 0.24], 0.0],
        ],
      },
    },
  ],
};
