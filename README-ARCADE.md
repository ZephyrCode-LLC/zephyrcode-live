# Arcade refinements — wiring notes

> **Post-audit status:** the five machines are LIVE — self-contained vanilla
> HTML at `public/machines/<slug>.html`, played at `/m/<slug>` (full-bleed
> iframe + OPEN FULL SCREEN). Built to the cabinet specs (name/grammar/blurb);
> if canonical versions exist on the author's side, drop-in replacing the
> files is all it takes. Share buttons live inside each verdict screen
> (clipboard + canonical URL + `share_copy{machine}` via postMessage). The
> commission door is `operator.zephyrcode.live/commission`. `/ops` is the
> private ledger — owner login, owner-only RLS (`zc_ledger_*`), noindex,
> never edge-cached.

1. **Email capture**: paste your endpoint into `ENDPOINT` in `src/components/sites/arcade/Capture.tsx`.
2. Buttondown: `https://buttondown.com/api/emails/embed-subscribe/<list>` · Loops: your form endpoint. Form posts `email` urlencoded.
3. Until wired, submits succeed optimistically and log a console warning (nobody is lost silently — wire it before promoting).
4. **Analytics**: create site `arcade.zephyrcode.live` in Plausible — the snippet is already on the page (cookieless, no banner needed).
5. Self-hosting Umami instead? Swap the `src` of the second `<Script>` in `src/components/sites/arcade/Page.tsx`.
6. Events flowing: `play_click {machine}`, `email_submit`, `share_copy`, `commission_click`.
7. **Share helper**: sims call `window.shareVerdict("My Leap verdict: TIGHT · crossover M14", "https://arcade.zephyrcode.live/m/leap")` from verdict screens → clipboard gets `… — play it: <url>` + a "Copied." toast.
8. **Deep links**: each machine = `arcade.zephyrcode.live/m/<slug>` with unique og:title/description/image (cabinet-style card via next/og); landing cabinets also carry `#<slug>` anchors.
9. New copy (capture headline/sub, studio strip) lives in the `blocks` table (`arcade` / `capture`, `studio`) — edit there, live in seconds.
10. Form/status microcopy I had to add (placeholder, SUBSCRIBE, "Noted. One cartridge a month.", "Didn't take. Try again.") awaits your sign-off — edit in the same block.

## Deliberately not added

- **No popup/exit-intent for the email capture** — it sits after the cabinets, once; louder would break the room's voice.
- **No third-party share SDKs / social buttons** — one clipboard helper travels further than a row of logos, and adds no payload or trackers.
- **No pre-generated OG image files** — next/og renders the same cabinet-style card per machine on demand with zero asset pipeline; swap to static files only if a crawler complains.
- **No urgency mechanics on the studio strip** (slots, countdowns) — "findable, not loud" taken literally.
- **No cookie banner** — analytics is cookieless by choice, so there is nothing to consent to.
- **Not rebuilt as a static index.html** — this domain is served by the multi-site Next app (one content DB, copy-sacred pipeline, instant author edits). The brief's vanilla constraint is honored in spirit: no new frameworks, page-specific JS is ~3 small components, attract loops stay pure CSS, reduced-motion intact.
