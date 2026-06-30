"use client";

import { useEffect } from "react";
import { track } from "@/lib/posthog";

/**
 * Per-machine page runtime: events.
 *  - machine_play{machine} once on mount (the user is inside the machine)
 *  - share_copy{machine} relayed from the iframed simulator via postMessage
 *    ({type:'zc-share', machine}) — the sims are standalone files and carry
 *    their own share button on the verdict screen.
 */

export function MachineRuntime({ machine }: { machine: string }) {
  useEffect(() => {
    track("machine_play", { machine });
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "zc-share") {
        track("share_copy", { machine: e.data.machine ?? machine });
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [machine]);
  return null;
}
