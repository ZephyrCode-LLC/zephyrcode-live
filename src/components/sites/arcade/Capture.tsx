"use client";

import { useState } from "react";
import { track } from "@/lib/posthog";

/**
 * Email capture — "one new machine a month". All copy arrives as props from
 * the blocks table (zero content strings here, §9.6).
 *
 * TODO(author): paste the real endpoint below — Buttondown
 * (https://buttondown.com/api/emails/embed-subscribe/<list>) or a Loops
 * form endpoint — and the form posts to it as application/x-www-form-urlencoded.
 * Until then submissions succeed optimistically and log a console warning.
 */
const ENDPOINT = ""; // TODO: Buttondown / Loops endpoint

export function Capture({
  k,
  sub,
  placeholder,
  button,
  ok,
  err,
}: {
  k: string;
  sub: string;
  placeholder: string;
  button: string;
  ok: string;
  err: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "busy" || !email.includes("@")) return;
    setState("busy");
    track("email_submit", { source: "arcade" });
    try {
      if (!ENDPOINT) {
        console.warn("[arcade] email capture endpoint not wired yet (see Capture.tsx TODO)");
        setState("ok");
        return;
      }
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email }),
      });
      setState(res.ok ? "ok" : "err");
    } catch {
      setState("err");
    }
  };

  return (
    <section className="capture rv" id="cartridge" aria-label={k}>
      <p className="k">{k}</p>
      <p className="s">{sub}</p>
      {state === "ok" ? (
        <p className="done" role="status">
          {ok}
        </p>
      ) : (
        <form className="cform" onSubmit={submit}>
          <input
            type="email"
            required
            value={email}
            placeholder={placeholder}
            aria-label={placeholder}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" disabled={state === "busy"}>
            {button}
          </button>
          {state === "err" && (
            <p className="fail" role="alert">
              {err}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
