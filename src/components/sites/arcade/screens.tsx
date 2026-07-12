import type { ReactNode } from "react";
import { CascadeDelays } from "@/components/engine/CascadeDelays";

/**
 * Per-cabinet attract-loop screens, verbatim from /_reference/arcade.html
 * (design markup, not copy). Shared by the arcade landing and the
 * per-machine deep-link pages (/m/[machine]).
 */
export const SCREENS: Record<string, ReactNode> = {
  leap: (
    <div className="screen s-leap">
      <svg viewBox="0 0 250 130" preserveAspectRatio="none">
        <path
          d="M0,40 C60,40 80,95 125,95 C170,95 190,30 250,30"
          fill="none"
          stroke="rgba(201,164,92,.7)"
          strokeWidth="2"
        />
        <circle className="dot" r="5" fill="#E85D2A" />
      </svg>
    </div>
  ),
  bedtime: (
    <div className="screen s-bed">
      <div className="card3">
        <i className="a">✓</i>
        <i className="b">✕</i>
      </div>
      <div className="meters">
        <b />
        <b />
        <b />
        <b />
      </div>
    </div>
  ),
  plate: (
    <div className="screen s-plate">
      <svg viewBox="0 0 250 130" preserveAspectRatio="none">
        <path
          className="p1"
          d="M10,95 C70,90 110,84 240,80"
          fill="none"
          stroke="rgba(201,164,92,.8)"
          strokeWidth="2"
        />
        <path
          className="p2"
          d="M10,95 C60,30 95,18 130,55 C165,92 200,88 240,84"
          fill="none"
          stroke="#E85D2A"
          strokeWidth="2"
        />
      </svg>
    </div>
  ),
  cascade: (
    <div className="screen s-casc">
      <CascadeDelays />
    </div>
  ),
  tax: (
    <div className="screen s-tax">
      <b />
      <b />
      <b />
      <b />
      <b />
      <b />
    </div>
  ),
  rupee: (
    <div className="screen s-rupee">
      <svg viewBox="0 0 250 130" preserveAspectRatio="none">
        {/* assets left, goals right, ribbons carry the money across */}
        <rect x="22" y="18" width="7" height="30" rx="1.5" fill="#5be39a" />
        <rect x="22" y="56" width="7" height="22" rx="1.5" fill="#8B7FD4" />
        <rect x="22" y="86" width="7" height="26" rx="1.5" fill="#e85bc4" />
        <rect x="221" y="24" width="7" height="40" rx="1.5" fill="#5be39a" opacity=".9" />
        <rect
          x="221"
          y="74"
          width="7"
          height="32"
          rx="1.5"
          fill="none"
          stroke="#D85C4A"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <path
          className="r1"
          d="M29,33 C120,33 140,44 221,44"
          fill="none"
          stroke="#5be39a"
          strokeWidth="7"
          opacity=".45"
        />
        <path
          className="r2"
          d="M29,67 C120,67 140,55 221,55"
          fill="none"
          stroke="#8B7FD4"
          strokeWidth="6"
          opacity=".45"
        />
        <path
          className="r3"
          d="M29,99 C120,99 140,84 221,84"
          fill="none"
          stroke="#e85bc4"
          strokeWidth="6"
          opacity=".45"
        />
      </svg>
    </div>
  ),
};
