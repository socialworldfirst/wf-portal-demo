# 🔒 LOCKED BENCHMARK — WorldFirst KOL portal demo

`index.html` in this folder is the **canonical, pixel-faithful benchmark** clone of the real 万里汇 / WorldFirst portal (portal.worldfirst.com). It is the reference look + the template for all per-influencer variants.

## Rules for any Claude session

1. **Do NOT modify `index.html`** unless Steven, in the current session, explicitly asks to change the benchmark itself. It is not to be "improved", refactored, restyled, or re-tailored by passing sessions. Treat it as frozen.
2. To make an influencer/KOL demo account, **use the `/wf_demo` skill** — it runs `build_variant.js`, which reads the benchmark and writes a self-contained gated copy under `u/<slug>/`. The benchmark file is never written.
3. **Never commit plaintext configs** (`profiles/*.json`). They're gitignored; keeping them out is what makes the password gate meaningful (otherwise anyone could read the account data on GitHub Pages and bypass the password).
4. Fake data only. No real person's real financials.

## What's here

- `index.html` — the locked benchmark (single-file SPA). Has two dormant variant hooks (`/*__VARIANT_SHIM__*/`, `<!--__VARIANT_GATE__-->`) and reads `window.WF_VARIANT` for data overrides; renders identically when no variant is present.
- `build_variant.js` — stamps out a per-influencer gated variant (AES-GCM config behind a WorldFirst password gate) under `u/<slug>/`.
- `assets/` — real portal assets (logo, app icon, card, flags, icon sprites, provider logos, 1688/TaoWorld/88 logos).
- `u/<slug>/` — generated variants (encrypted; safe to deploy).
- `profiles/<slug>.json` — plaintext configs, **gitignored**, local only.

## Live

- Benchmark: https://socialworldfirst.github.io/wf-portal-demo/
- Each variant: https://socialworldfirst.github.io/wf-portal-demo/u/<slug>/ (+ its password)

## URL params (benchmark)
`?skiplogin=1` straight to dashboard · `?todo=1` show 待办事项 · `?demo=1` show DEMO tag · `?company=` / `?name=` quick override · `?view=<route>` deep-link a page.
