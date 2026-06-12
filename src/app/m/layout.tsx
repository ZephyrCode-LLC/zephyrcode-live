import type { Metadata } from "next";

/**
 * P0-2: machines canonically live on arcade.zephyrcode.live — without this,
 * og:image/canonical resolved against the deploy host (localhost in dev,
 * whatever host served the request in prod) and every shared link unfurled
 * broken. All /m/* relative metadata URLs now resolve to the arcade domain.
 */
export const metadata: Metadata = {
  metadataBase: new URL("https://arcade.zephyrcode.live"),
};

export default function MachineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
