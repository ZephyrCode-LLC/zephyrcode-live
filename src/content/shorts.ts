import { PURPLE_COW } from "./the-purple-cow";
import { LAST_BORING_SUNDAY } from "./the-last-boring-sunday";
import { NEGOTIATOR_PAJAMAS } from "./the-negotiator-wears-pajamas";

/**
 * The shorts. Each long-form story is its own content module with its own theme
 * accent; the reader at /story/[slug] renders it. Add a new short by creating its
 * module and registering it here.
 */
export type Story = { slug: string; title: string; dek: string; accent: string; markdown: string };

export const STORIES: Record<string, Story> = {
  [PURPLE_COW.slug]: PURPLE_COW,
  [LAST_BORING_SUNDAY.slug]: LAST_BORING_SUNDAY,
  [NEGOTIATOR_PAJAMAS.slug]: NEGOTIATOR_PAJAMAS,
};
