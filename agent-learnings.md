# Agent Learnings — matteOS Audit (2026-07-13)

Companion to `AUDIT.md`. What the audit process itself taught us, and what the next agent needs to know before touching this codebase.

## Issue categories found, and why they occurred

1. **Hosting config gap (bug 1).** `vercel.json` was written when the serverless function was added, from the API's point of view. The SPA fallback was never needed in local dev (Vite's dev server handles it), so the gap only manifests in production reloads — the classic "works on my machine" SPA deployment failure.
2. **Auth resolution race (bug 2).** The auth context models a multi-stage async process (session → profile) with a single boolean that only transitions once. Every downstream consumer that branches on "auth is done" inherits the race. The lesson: async state with multiple stages needs multiple flags or a status enum, and flags must reset when the process restarts (re-sign-in).
3. **Schema drift.** The migration file was written once (Phase 0) and the wardrobe tables were later created in the Supabase dashboard directly. Nothing forces migrations to stay authoritative, so they silently stopped being so. Hand-written `db.ts` types drift the same way for the same reason.
4. **Deferred-typing debt.** `createClient<any>` was marked temporary in a comment. Every query written since then added `as` casts to compensate — the debt grew linearly with feature work (~89 casts) because the "one command" fix was never prioritized.
5. **Finished-but-unwired features.** MealPrepPage and WeeklyReviewPage were built to completion and never routed. Likely built ahead of the plan, then the wiring step fell between commits.

## Patterns to watch for in future phases

- **"Temporary" comments are the highest-yield audit target.** Every deliberate shortcut in this codebase (`<any>` client, hand-written types, console.log, stub endpoint) was honestly labeled — and none were revisited. Grep for temporary/replace/TODO markers at the start of each phase.
- **Dashboard/module query-key divergence.** Any new module that the dashboard mirrors will silently repeat the D2/D4 pattern (duplicate queries, no invalidation) unless the invalidation contract is established first.
- **Client-only enforcement creep.** Signup lockout and MFA are both client-side today. RLS is the actual security boundary; any new "restriction" added in React should be assumed bypassable and mirrored server-side (Supabase settings or RLS) if it matters.
- **Migrations must stay authoritative.** Any schema change made in the dashboard needs a same-day `supabase db dump` → migration commit, or the drift returns.

## What a Sonnet 4.6 implementation agent should know before touching this codebase

- **Don't add abstraction layers.** Module isolation is genuinely good (2 cross-module imports total, both justified). The audit explicitly recommends AGAINST a shared table component for SleepTable/BodyTable/CalorieTable. Prefer deletion and consolidation into existing `lib/` files over new structure.
- **Fix the Supabase types before touching queries.** Until `createClient<Database>` lands, every query edit risks a silent runtime break — the ~89 `as` casts will not catch column renames. Generate types first, then refactor.
- **Test auth changes with two consecutive sign-ins**, not one. Bug 2 only reproduces on sign-in after the initial session resolution; a single fresh-login test passes misleadingly. Also test the MFA verify → redirect path (same race, different page).
- **Verify routing changes with `npm run build && npm run preview` and a hard reload on a deep link.** The Vite dev server masks SPA fallback problems; only a production-style serve reproduces bug 1.
- **The style system is strict:** flat dark, JetBrains Mono only, accent `#3760f2`, hairline dividers, no card borders. All Tailwind classes are static strings — keep it that way (dynamic class construction breaks Tailwind v4 scanning).
- **Do not "fix" the pessimistic mutations into optimistic ones** unprompted — pessimistic-only is a deliberate, safe choice at single-user scale.
- **`api/agent.ts` is an intentional stub** (Phase 11). If you implement it: verify the Supabase JWT server-side before any work, enforce `agent_rate_limits`, and treat user data fed to the LLM as prompt-injection surface.

## Follow-up issues discovered during the audit itself

- **Subagent severity inflation is real.** Two security findings arrived rated CRITICAL (client-side MFA gate, Supabase-provided QR SVG via `dangerouslySetInnerHTML`) and were downgraded on review — the first because RLS already bounds the blast radius, the second because it's the documented first-party pattern. Findings from parallel auditors need a calibration pass by whoever compiles them.
- **One factual error caught by cheap verification:** an agent claimed `App.css` was imported in `main.tsx`; a 5-second grep showed it's imported nowhere (which made the finding *stronger* — fully dead file). Verify one-line claims before publishing them; the check costs less than the correction.
- **Two agents disagreed** (architecture: "only weekly is unrouted" vs code quality: "mealprep AND weekly are unrouted") until resolved against a direct read of `App.tsx` — code quality was right. Cross-agent disagreement is a signal to check the primary source, not to average the claims.
- **The wardrobe schema gap was reported as "wardrobe is broken"** by the data-layer agent; compilation reframed it as "migration is out of sync with the live DB" since the feature shipped. Raw findings sometimes need the deployment context the auditing agent lacks — but the reframe still needs confirming against the live DB (open question 2).
