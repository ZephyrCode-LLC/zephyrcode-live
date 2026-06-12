"use client";

import { useEffect } from "react";

/**
 * Per-machine page runtime: cookieless events.
 *  - machine_play{machine} once on mount (the user is inside the machine)
 *  - share_copy{machine} relayed from the iframed simulator via postMessage
 *    ({type:'zc-share', machine}) — the sims are standalone files and carry
 *    their own share button on the verdict screen.
 */

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, unknown> }) => void;
  }
}

export function MachineRuntime({ machine }: { machine: string }) {
  useEffect(() => {
    window.plausible?.("machine_play", { props: { machine } });
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "zc-share") {
        window.plausible?.("share_copy", { props: { machine: e.data.machine ?? machine } });
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [machine]);
  return null;
}
