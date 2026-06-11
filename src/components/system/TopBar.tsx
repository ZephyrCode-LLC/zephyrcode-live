import type { ReactNode } from "react";

/** Shared top bar: mono wordmark with the ember dot + a right slot (crumb or CTA). */
export function TopBar({
  crumb,
  cta,
  home = "https://zephyrcode.live",
}: {
  crumb?: string;
  cta?: ReactNode;
  home?: string;
}) {
  return (
    <header className="top">
      <a className="wm" href={home}>
        ZEPHYR<i>·</i>CODE
      </a>
      {cta ?? <span className="crumb">{crumb}</span>}
    </header>
  );
}
