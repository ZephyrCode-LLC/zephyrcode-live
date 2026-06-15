import "@/styles/sites/stories.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/system/TopBar";
import { Vignette } from "@/components/system/Vignette";
import { STORIES } from "@/content/the-purple-cow";

export const dynamicParams = false; // only the known shorts; anything else 404s

export function generateStaticParams() {
  return Object.keys(STORIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = STORIES[slug];
  if (!story) return {};
  const url = `https://stories.zephyrcode.live/story/${slug}`;
  const description = "A short from the ZephyrCode desk — domestic comedy, household operating systems, and one purple cow with strong opinions about the fridge.";
  return {
    title: `${story.title} — Stories · ZephyrCode`,
    description,
    alternates: { canonical: url },
    openGraph: { title: story.title, description, url, type: "article" },
    twitter: { card: "summary_large_image", title: story.title, description },
  };
}

/** Escape, then the only two inline marks the prose uses: **bold** and *italic*. */
function inline(s: string): string {
  const esc = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*([^*]+?)\*/g, "<em>$1</em>");
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = STORIES[slug];
  if (!story) notFound();

  const blocks = story.markdown.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  return (
    <div data-site="stories">
      <Vignette />
      <TopBar crumb="STORIES · SHORT FICTION" />
      <main>
        <article className="story" style={{ marginTop: 8 }}>
          <a className="k" href="/" style={{ textDecoration: "none" }}>
            ← all stories
          </a>
          <h2 style={{ marginTop: 10 }}>{story.title}</h2>
          <p className="pq" style={{ fontStyle: "italic" }}>{story.dek}</p>

          {blocks.map((b, i) => {
            if (b === "---") return <hr key={i} style={{ border: 0, borderTop: "1px solid var(--line, #2a2a32)", margin: "26px 0", opacity: 0.5 }} />;
            if (b.startsWith("## ")) return <h3 key={i} style={{ marginTop: 26 }} dangerouslySetInnerHTML={{ __html: inline(b.slice(3)) }} />;
            if (b.startsWith("*—")) return <p key={i} className="body" style={{ marginTop: 28, textAlign: "center", opacity: 0.7 }} dangerouslySetInnerHTML={{ __html: inline(b) }} />;
            return <p key={i} className="body" style={{ marginTop: 14 }} dangerouslySetInnerHTML={{ __html: inline(b) }} />;
          })}

          <a className="btn solid" href="/" style={{ marginTop: 32, display: "inline-block" }}>
            ← Back to stories
          </a>
        </article>
      </main>
    </div>
  );
}
