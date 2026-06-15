/**
 * The verbatim story modules carry the sacred prose (markdown) plus title/slug/
 * accent/dek. They are the SEED source for the `story_shorts` table — at RUNTIME
 * the reader (/story/[slug]) and the stories index read from Supabase, not from
 * here. Adding a new story is an INSERT into story_shorts (see docs/AUTHOR_AGENT.md);
 * no new module is required for it to appear.
 */
export type Story = { slug: string; title: string; dek: string; accent: string; markdown: string };
