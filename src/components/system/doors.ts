/** Door → scenes map — the single source of truth, shared by the server Page
 *  (renders data-doors attrs) and the client DoorGate (applies the filter) and
 *  the inline boot script (inlines the same accents). NOT in the CMS, so a
 *  content edit can never desync the gate.
 *
 *  The ESSENTIALS (signal welcome, doors picker, method, library, operator) are
 *  ALWAYS shown — a first-time visitor must be able to understand the studio
 *  before (and without) picking a door. A door only *adds* its audience-specific
 *  product rooms on top of that always-on spine; picking one hides the OTHER
 *  doors' product rooms so the page focuses. Default (no pick) shows everything. */

export const DOORS: Record<string, { label: string; short: string; accent: string; scenes: string[] }> = {
  engineers: { label: "Engineers", short: "an engineer", accent: "#c6ff45", scenes: ["arena"] },
  teams: { label: "Teams & CTOs", short: "a team", accent: "#3DE1E6", scenes: ["audits"] },
  creators: { label: "Creators", short: "a creator", accent: "#8fd694", scenes: ["sage", "samhita"] },
  body: { label: "Body & mind", short: "body & mind", accent: "#e85d2a", scenes: ["systems"] },
  readers: { label: "Readers", short: "a reader", accent: "#7fd6a8", scenes: ["stories"] },
};
/** Always visible, every door + the unpicked default — the studio's universal spine. */
export const ALWAYS = ["signal", "doors", "method", "library", "operator"];
export const HUB_ACCENT = "#e85d2a";

/** The data-doors token value for a scene/rail id ("*" = always shown). */
export function doorsFor(id: string): string {
  if (ALWAYS.includes(id)) return "*";
  const keys = Object.keys(DOORS).filter((k) => DOORS[k].scenes.includes(id));
  return keys.length ? keys.join(" ") : "*";
}
