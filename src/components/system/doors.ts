/** Door → scenes map — the single source of truth, shared by the server Page
 *  (renders data-doors attrs) and the client DoorGate (applies the filter) and
 *  the inline boot script (inlines the same accents). NOT in the CMS, so a
 *  content edit can never desync the gate. */

export const DOORS: Record<string, { label: string; accent: string; scenes: string[] }> = {
  engineers: { label: "Engineers", accent: "#c6ff45", scenes: ["method", "arena", "library"] },
  teams: { label: "Teams & CTOs", accent: "#3DE1E6", scenes: ["method", "audits", "operator"] },
  creators: { label: "Creators", accent: "#8fd694", scenes: ["sage", "samhita"] },
  body: { label: "Body & mind", accent: "#e85d2a", scenes: ["systems"] },
  readers: { label: "Readers", accent: "#7fd6a8", scenes: ["stories", "library"] },
};
export const ALWAYS = ["signal", "doors", "operator"];
export const HUB_ACCENT = "#e85d2a";

/** The data-doors token value for a scene/rail id ("*" = always shown). */
export function doorsFor(id: string): string {
  if (ALWAYS.includes(id)) return "*";
  const keys = Object.keys(DOORS).filter((k) => DOORS[k].scenes.includes(id));
  return keys.length ? keys.join(" ") : "*";
}

export type GateCard = { key: string; who: string; vibe: string; accent: string; scenes: number };
