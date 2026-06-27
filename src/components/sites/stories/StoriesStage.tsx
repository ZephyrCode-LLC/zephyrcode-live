"use client";

import { useState, type CSSProperties } from "react";
import { MagnetBoard } from "@/components/engine/MagnetBoard";

/**
 * stories.zephyrcode.live — the published shorts as one interactive stage.
 *
 * A single selection drives BOTH the fridge evidence board and the accordion
 * below it: pick a story and the fridge re-themes to that story's accent and
 * rearranges to its own evidence (the magnet board remounts on slug, so it
 * re-animates), while the card expands into the full featured treatment —
 * pullquote, brief, an exhibit, chips, READ CTA. Purple Cow is open by default;
 * one card is always open.
 *
 * Zero content strings live here — every story (card + board + reader) is one
 * Supabase story_shorts row. Motion is CSS-only and reduced-motion guarded.
 */

export type GalleryStory = {
  title: string;
  slug: string;
  accent: string;
  accent2?: string; // secondary highlight; falls back to accent
  k: string;
  dek: string;
  pullquote: string;
  paragraphs: string[]; // HTML (allows <b>)
  chips: string[];
  exhibit: { k: string; line: string };
  board: { k: string; sentences: string[][]; notes: string[]; button: string };
};

export function StoriesStage({ stories }: { stories: GalleryStory[] }) {
  const [sel, setSel] = useState(0);
  const active = stories[sel];
  if (!active) return null;

  return (
    <>
      {/* The fridge is the selected story's live exhibit: it re-themes + rearranges. */}
      <section
        className="fridge rv"
        aria-label="Evidence board"
        style={{ "--iris": active.accent, ...(active.accent2 ? { "--iris2": active.accent2 } : {}) } as CSSProperties}
      >
        <p className="k" style={{ color: active.accent }}>
          {active.board.k}
        </p>
        <MagnetBoard
          key={active.slug}
          sentences={active.board.sentences}
          notes={active.board.notes}
          buttonLabel={active.board.button}
        />
      </section>

      <section className="gallery rv" aria-label="Published shorts">
        <p className="gk">Out of the dishwasher · poured, served, still warm</p>
        <div className="stack">
          {stories.map((s, i) => {
            const open = i === sel;
            return (
              <article
                key={s.slug}
                className={`scard${open ? " open" : ""}`}
                style={{ "--sel": s.accent, ...(s.accent2 ? { "--sel2": s.accent2 } : {}) } as CSSProperties}
              >
                <button
                  type="button"
                  className="shead"
                  aria-expanded={open}
                  aria-controls={`detail-${s.slug}`}
                  onClick={() => setSel(i)}
                >
                  <span className="dot" aria-hidden />
                  <span className="shx">
                    <span className="stitle">{s.title}</span>
                    <span className="sdek">{s.dek}</span>
                  </span>
                  <span className="schev" aria-hidden>
                    {open ? "–" : "+"}
                  </span>
                </button>

                <div id={`detail-${s.slug}`} className="detail" aria-hidden={!open} inert={!open}>
                  <div className="detail-inner">
                    <span className="k">{s.k}</span>
                    <p className="pq">{s.pullquote}</p>
                    {s.paragraphs.map((html, j) => (
                      <p
                        key={j}
                        className="body"
                        style={j > 0 ? { marginTop: 14 } : undefined}
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                    ))}

                    <div className="exhibit">
                      <span className="ek">{s.exhibit.k}</span>
                      <span className="el">{s.exhibit.line}</span>
                    </div>

                    <div className="meta">
                      {s.chips.map((chip) => (
                        <span key={chip} className="mchip">
                          {chip}
                        </span>
                      ))}
                    </div>

                    <a className="btn solid read" href={`/story/${s.slug}`}>
                      Read the story &rarr;
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
