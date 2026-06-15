# Author Agent — publishing a new short to stories.zephyrcode.live

**Goal:** turn a finished short story into one Supabase row so it appears everywhere
automatically — the stories index gallery card, the interactive fridge "exhibit"
board it themes when selected, and the full `/story/<slug>` reader. **No code change
and no redeploy are required**; the pages are ISR (`revalidate` ~5 min) and read from
the `story_shorts` table at runtime.

The site is pure tech; **all story content lives in Supabase**. You are filling one row.

---

## The data model (one row in `public.story_shorts`)

Project: `zephyrcode` (`iafmiiuxygvsulohmrqz`). Columns:

| column | type | what to put |
|---|---|---|
| `title` | text | The story title, exactly. |
| `slug` | text | URL slug, kebab-case, unique. The reader lives at `/story/<slug>`. |
| `status` | text \| null | **`null` = published** (shows in the gallery + reader). A non-null string (e.g. `"OUTLINE · …"`) keeps it in the "Still in the dishwasher" list and it does NOT get a reader. |
| `featured` | boolean | `true` only for the one default-open card (currently Purple Cow). New stories: `false`. |
| `position` | int | Sort order. Published render in ascending `position`; pick `max(position)+1`. |
| `markdown` | text | The **full story prose** (see Markdown rules). Only the reader loads this. |
| `body` | jsonb | Everything the card + fridge board need (see below). |

### `body` jsonb shape (all fields required for a published story)

```json
{
  "accent": "#RRGGBB",                       // the story's own theme color — pick one DISTINCT from existing (see palette)
  "dek": "Register · runtime",               // short caption: collapsed gallery row + reader subtitle, e.g. "Courtroom comedy · one bedtime"
  "k": "FEATURED SHORT · REGISTER · RUNTIME LONG",   // card eyebrow, uppercase
  "pullquote": "\"A real line from the story.\" …",  // one quotable line; straight quotes, escape inner \" in JSON
  "paragraphs": [                            // 1–2 paragraphs: the BRIEF (not the story). funny-on-the-surface / true-underneath.
    "First paragraph … <b>one bold phrase</b> … .",  // <b>…</b> allowed for emphasis
    "Second paragraph … <b>the turn</b> … ."
  ],
  "chips": [                                 // exactly 3, uppercase, "LABEL · VALUE"
    "REGISTER · …", "RUNTIME · …", "HAZARD · …"
  ],
  "exhibit": {                               // a small inline evidence note inside the card
    "k": "EXHIBIT <LETTER> · <SHORT TITLE>",  // next free letter: A, B, C, D, …
    "line": "A terse piece of in-world evidence in the story's voice."
  },
  "board": {                                 // the interactive fridge board this story themes when selected
    "k": "EXHIBIT <LETTER> · <BOARD TITLE> · <VERB> REARRANGE(S) …",  // same LETTER as exhibit.k
    "sentences": [                           // 4–6 short magnet "lines"; ALL-CAPS words; mark exactly ONE word per line with a trailing "*" (the accent magnet)
      ["FOUR", "TO", "SEVEN*", "WORDS"],
      ["KEEP", "THEM", "PUNCHY*"]
    ],
    "notes": [                               // one wry footnote per sentence (same length as sentences[])
      "footnote for line 1.",
      "footnote for line 2."
    ],
    "button": "Rearrange the evidence"       // the shuffle CTA; vary it in-voice (e.g. "Re-file the motion")
  }
}
```

**Consistency rules**
- `exhibit.k` and `board.k` share the **same EXHIBIT letter** (the next unused one).
- `board.sentences.length === board.notes.length`.
- Each `board.sentences` line marks **exactly one** word with a trailing `*` (it renders in the story's accent). Apostrophes are fine (`DRAGON'S*`).
- `accent` should be visually distinct from the others. Current palette: Purple Cow `#8B7FD4` (iris), Last Boring Sunday `#6FA8A0` (sage), Negotiator `#E0A263` (amber). Good next picks: a muted teal `#5FA8C9`, a clay rose `#C98594`, a moss `#8FA65C`.

### Markdown rules (the `markdown` column)
- Sections start with `## ` (rendered as headings). Separate blocks with a blank line.
- Use `---` on its own line for a section break (renders as a rule).
- Inline marks: `**bold**` and `*italic*` only.
- End with a dedication line that begins `*—` and ends with `*`, e.g. `*— for X.*`.
- The prose is **sacred / verbatim** — never paraphrase the author's text.

---

## How to publish (apply to the DB)

Use the Supabase MCP `execute_sql` against project `iafmiiuxygvsulohmrqz`. **Dollar-quote**
every text/JSON value with `$zc$ … $zc$` so no escaping is needed and the paste stays
faithful (the JSON inside still uses normal `"` and `\"`).

```sql
insert into story_shorts (title, slug, status, featured, body, markdown, position) values (
  $zc$<TITLE>$zc$,
  $zc$<slug>$zc$,
  null,
  false,
  $zc$<the body JSON exactly as above>$zc$::jsonb,
  $zc$<the full markdown, multi-line, verbatim>$zc$,
  <position>
);
-- verify the prose landed byte-exact (compare to the source you were given)
select slug, length(markdown) as len, md5(markdown) as md5 from story_shorts where slug = $zc$<slug>$zc$;
```

**Always verify**: compute `md5` + length of the source markdown locally and confirm the
`select` matches. A trailing character (often the dedication's closing `*`) is the usual
drift; if `right(markdown,1)` isn't `*`, append it:
`update story_shorts set markdown = markdown || $zc$*$zc$ where slug = $zc$<slug>$zc$;`

Then trigger revalidation (or just wait ~5 min): `POST https://stories.zephyrcode.live/api/revalidate`
with the `REVALIDATE_SECRET` if you want it live immediately.

## Keep the repo canonical (recommended, optional)

The DB is runtime; `scripts/content/stories.ts` is the seed source of truth. A full
reseed (`scripts/seed.ts`) would overwrite DB-only rows. So also append the new story to
`storyShorts` in `scripts/content/stories.ts` using the same `pub(...)` helper, with its
verbatim prose either inlined or in a `src/content/<slug>.ts` module. This keeps a clean
git history of the prose and makes the row reproducible.

## Definition of done
- `/?site=stories` (or stories.zephyrcode.live) shows the new card; selecting it re-themes
  and rearranges the fridge to its board.
- `/story/<slug>` renders the full prose in the story's accent.
- `md5(markdown)` in the DB equals the source.
