"use client";

import { useEffect, useState } from "react";

/**
 * The FORGE uptime line, ported exactly from the source page:
 * days since Date.UTC(epoch) → `${prefix}${days}${suffix}`.
 * Server-renders the fallback text (hydration-safe), then swaps in the
 * computed day count on mount. All copy arrives as props from the DB.
 */
export function UptimeCounter({
  prefix,
  suffix,
  epoch,
  fallback,
}: {
  prefix: string;
  suffix: string;
  epoch: { y: number; m: number; d: number };
  fallback: string;
}) {
  const [text, setText] = useState(fallback);
  useEffect(() => {
    const days = Math.max(
      0,
      Math.floor((Date.now() - Date.UTC(epoch.y, epoch.m, epoch.d)) / 86400000)
    );
    setText(`${prefix}${days}${suffix}`);
  }, [prefix, suffix, epoch.y, epoch.m, epoch.d]);
  return <p className="up">{text}</p>;
}
