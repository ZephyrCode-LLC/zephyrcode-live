import type { Site } from "@/lib/content";

/** The footer constellation row shared by the seven subdomain pages. */
export function Constellation({ sites, current }: { sites: Site[]; current: string }) {
  return (
    <footer>
      {sites.map((s) =>
        s.slug === current ? (
          <a key={s.slug} className="here" href="#">
            {label(s)}
          </a>
        ) : (
          <a key={s.slug} href={`https://${s.host}`}>
            {label(s)}
          </a>
        )
      )}
    </footer>
  );
}

function label(s: Site): string {
  return s.slug === "home" ? s.host : `${s.host.split(".")[0]}.`;
}
