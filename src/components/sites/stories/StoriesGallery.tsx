"use client";

import { useState, type CSSProperties } from "react";

/**
 * stories.zephyrcode.live — the published shorts, as a single-open accordion.
 * The selected story expands into the full featured treatment (pullquote, brief,
 * an "exhibit" of evidence, chips, READ CTA) and the whole card re-themes to that
 * story's own accent — the same accent its /story/[slug] reader uses. Purple Cow
 * is open by default; the others sit collapsed below it. One card is always open.
 *
 * Zero content strings live here — every story arrives from Supabase via props.
 * Motion is CSS-only (max-height + opacity + a transitioning --sel accent); the
 * global prefers-reduced-motion guard plus the rule in stories.css make it instant.
 */

export type DoneStory = {
  title: string;
  slug: string;
  accent: string;
  k: string; // "FEATURED SHORT · COURTROOM COMEDY · ONE BEDTIME LONG"
  dek: string; // collapsed-row caption
  pullquote: string;
  paragraphs: string[]; // HTML (allows <b>)
  chips: string[];
  exhibit: { k: string; line: string };
};

export function StoriesGallery({ stories }: { stories: DoneStory[] }) {
  const [sel, setSel] = useState(0);

  return (
    <section className="gallery rv" aria-label="Published shorts">
      <p className="gk">Out of the dishwasher · poured, served, still warm</p>
      <div className="stack">
        {stories.map((s, i) => {
          const open = i === sel;
          return (
            <article
              key={s.slug}
              className={`scard${open ? " open" : ""}`}
              style={{ "--sel": s.accent } as CSSProperties}
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

              <div
                id={`detail-${s.slug}`}
                className="detail"
                aria-hidden={!open}
                inert={!open}
              >
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
  );
}
