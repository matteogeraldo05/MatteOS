# matteOS Codebase Audit

Audited 2026-07-13 by 7 parallel read-only agents (routing/hosting, auth/onboarding, architecture, data layer, performance, code quality, security), with every CRITICAL/HIGH claim independently re-verified against source before inclusion. No code was modified.

---

## 1. Executive summary

**Overall health grade: B-.** The architecture is genuinely good — clean module isolation (only 2 cross-module imports, both justified hub-page usage), exemplary RLS (19/19 tables plus the storage bucket, all `auth.uid()`-scoped), disciplined UI-primitive reuse, and hand-rolled memoized SVG charts instead of a heavy library. It is undermined by two shipping bugs whose fixes are one line to one afternoon, and by an untyped Supabase client (`createClient<any>`) that has metastasized into ~89 `as` casts across ~31 files. Both known bugs were confirmed with exact root causes: the Vercel config lacks an SPA fallback rewrite, and the auth provider's single `loading` flag never re-trues after initial resolution, so the onboarding check races the profile fetch and loses every time. The most concerning structural risk is that the repo's migration file no longer describes the live database — the wardrobe module queries three tables that exist in no migration. Top 3 risks: (1) schema drift makes the DB unreproducible from the repo and leaves wardrobe RLS unverifiable, (2) signup is disabled only in the UI and may be open at the Supabase API level, (3) the untyped client makes every query refactor a runtime gamble. Top 3 opportunities: (1) generate DB types — one CLI command that unlocks removal of ~89 casts, (2) route-level code splitting — 709 KB single chunk → est. ~350 KB initial, (3) dashboard invalidation wiring so the hub reflects mutations instantly instead of after a 30s stale window.

---

## 2. Repo map

**What it is:** a single-user personal dashboard SPA. React 19 + TypeScript, Vite 8 (rolldown), Tailwind v4 (vite plugin), React Router v6 (`BrowserRouter`), TanStack Query 5, Supabase (auth + Postgres + storage), deployed on Vercel with one serverless function.

**Structure:**

- Root: `vercel.json` (api rewrite + function config only), `api/agent.ts` (AI agent endpoint — currently a 503 stub), `supabase/migrations/0001_initial_schema.sql` (the only migration), `.env` (not committed), `plan.md` (phase plan), `docs/superpowers/`.
- `src/App.tsx` — public routes `/login`, `/login/mfa`, `/onboarding`; everything else under `/*` wrapped in `RequireAuth` + `AppShell` with nested routes for 11 pages; `/library` → `/journal?tab=library`; catch-all → `/`.
- `src/auth/` — AuthProvider (session + profile context), RequireAuth (session → MFA AAL → onboarding gate), LoginPage, MFASetupPage, OnboardingPage.
- `src/modules/` × 12 — dashboard, sleep, todo, journal, finance, body, food, mealprep, workouts, wardrobe, weekly, settings; each follows a consistent `queries.ts` + Page + components pattern.
- `src/lib/` (supabase client, queryClient, dates, money, recurrence, workoutRotation, useMediaQuery), `src/ui/` (~25 shared primitives, heavily reused), `src/charts/` (hand-rolled SVG), `src/types/` (db.ts hand-written schema types, app.ts domain types), `src/shell/`, `src/agent/`.

**What surprised us:**

- Module isolation is unusually clean for a project of this size — feature modules import from each other exactly twice (dashboard → todo, dashboard → workouts), both deliberate hub-page composition.
- Two fully implemented pages (`MealPrepPage`, `WeeklyReviewPage`) are unreachable — never routed in App.tsx, never linked in the sidebar.
- The migration file and the live database have diverged: three wardrobe tables are queried by shipping code but appear in no migration.
- Security posture is stronger than typical hobby projects: `.env` never committed, open-redirect guard on login, no `dangerouslySetInnerHTML` on user content, no dynamic Tailwind classes.

---

## 3. Findings by dimension

Severity ordering per dimension: CRITICAL → HIGH → MEDIUM → LOW. Effort: S/M/L/XL. Confidence: HIGH/MEDIUM/LOW.

### 3.1 Routing & hosting

| # | Sev | Finding | Fix | Effort | Conf |
|---|-----|---------|-----|--------|------|
| R1 | CRITICAL | `vercel.json:2-4` — rewrites contain only `/api/(.*)`; no SPA fallback, so reloading any deep link (`/sleep`, `/todo`, …) 404s on Vercel. **Known bug 1, root cause confirmed.** | Append `{ "source": "/(.*)", "destination": "/index.html" }` after the api rule (order matters — api must match first). | S | HIGH |

Verified clean: React Router structure (public/protected split, catch-all), all navigation via `NavLink`/`useNavigate` (no `<a href>`, no `window.location`), open-redirect guard in `LoginPage.tsx:10,18`, `dist/` gitignored (`.gitignore:11`), Vite defaults (`base`, `outDir`) correct, query-string tab pattern (`Sidebar.tsx:47-48,85-95`) correct.

### 3.2 Auth & onboarding

| # | Sev | Finding | Fix | Effort | Conf |
|---|-----|---------|-----|--------|------|
| A1 | CRITICAL | **Known bug 2, root cause confirmed.** `src/auth/AuthProvider.tsx:45-55` — `handleSession()` sets `session` synchronously but `profile` only after an awaited network fetch, and `loading` is never reset to `true` on subsequent auth events. On sign-in, LoginPage navigates immediately; RequireAuth mounts with `loading=false`, `session` set, `profile=null`; the local AAL check (`RequireAuth.tsx:16-29`) settles before the profile fetch, so `RequireAuth.tsx:47` redirects to `/onboarding` deterministically on every sign-in. | Track profile resolution separately (a `profileLoading` flag or a status enum); RequireAuth shows the spinner while `session && profileLoading`. | M | HIGH |
| A2 | HIGH | `fetchProfile` is awaited inside the `onAuthStateChange` callback (`AuthProvider.tsx:62-64` → `45-55`) — documented supabase-js hazard: the callback holds an internal lock, and awaiting other supabase calls inside it can deadlock. | Defer async work out of the callback (set session state synchronously; fetch profile in an effect keyed on the user id). | S | MEDIUM |
| A3 | MEDIUM | `MFASetupPage.tsx:61` decides its post-verify redirect from a possibly-stale `profile` in context — same class of bug as A1, can land on onboarding after MFA. | Covered by the A1 fix (wait for profile resolution). | S | MEDIUM |
| A4 | MEDIUM | Onboarding completion is implicit — inferred from `user_profile.display_name` being non-empty (`RequireAuth.tsx:47`). Works, but clearing the name would force re-onboarding. | Optional explicit flag = schema migration; likely not worth it single-user. See open question 5. | L | MEDIUM |
| A5 | LOW | Debug `console.log` in `fetchProfile` (`AuthProvider.tsx:35`) logs profile data to console on every fetch. | Delete the line. | S | HIGH |

Verified clean: all 19 tables have RLS enabled with `auth.uid()`-scoped SELECT/INSERT/UPDATE/DELETE policies, plus folder-scoped receipts storage policies (`supabase/migrations/0001_initial_schema.sql:434-585`); signOut clears query cache + `matteos:*` localStorage; onboarding upsert + `refreshProfile()` correct; session config (`persistSession`, `autoRefreshToken`) correct.

Not verifiable from the repo: Supabase dashboard settings (email confirmation, open signup, MFA enforcement, token expiry) — see open questions.

### 3.3 Architecture

| # | Sev | Finding | Fix | Effort | Conf |
|---|-----|---------|-----|--------|------|
| C1 | HIGH | `AgentRequest`/`AgentResult` defined identically in BOTH `src/types/app.ts:10-22` and `src/agent/types.ts:1-12` — divergence risk. | Delete `src/agent/types.ts`; import from `types/app.ts`. | S | HIGH |
| C2 | HIGH | `src/modules/weekly/WeeklyReviewPage.tsx` is fully implemented but imported/routed nowhere (verified against App.tsx) — dead code. | Route it or delete it — user decision (open question 1). | S | HIGH |
| C3 | MEDIUM | `src/lib/workoutRotation.ts:1` imports `WorkoutSplit` from `modules/workouts/exercisePresets` — the shared lib layer depending on a feature module. | Move the type to `src/types/app.ts`. | S | HIGH |
| C4 | MEDIUM | Duplicated micro-helpers: `dayLetter()` ×4 (`body/BmiChart.tsx`, `body/TdeeChart.tsx`, `body/WeightChart.tsx`, `sleep/SleepChart.tsx`), `fmt()` ×2 (`body/BodyTable.tsx:9`, `body/RecentWeightsList.tsx:9`). | Consolidate into `lib/dates.ts` / a small `lib/format.ts`. | S | HIGH |
| C5 | LOW | Dashboard hub imports from todo (`TodayTodoPreview.tsx:5-6`) and workouts (`TodayWorkout.tsx:4-5`). Acceptable for a hub page. | Keep; hold the line at types/constants as the only cross-module import surface. | — | HIGH |
| C6 | LOW | `AgentButton` is a thin wrapper over `Button`; settings is a monolithic single file. | Optional inline / leave until it grows. | S | MEDIUM |

**Explicit non-recommendation:** do NOT build a shared table abstraction for SleepTable/BodyTable/CalorieTable. They are pattern-similar but column-logic-different; the indirection would cost more than the ~70 lines of duplication it removes.

Largest files (all judged domain-necessary, no refactor recommended): `todo/TaskListView.tsx` 461, `workouts/WorkoutsPage.tsx` 350, `sleep/SleepChart.tsx` 328, `sleep/SleepLogForm.tsx` 327, `sleep/CycleCalculator.tsx` 318.

### 3.4 Data layer

| # | Sev | Finding | Fix | Effort | Conf |
|---|-----|---------|-----|--------|------|
| D1 | HIGH | `src/modules/wardrobe/queries.ts:89-132,206-264` queries `wardrobe_items`, `outfits`, `outfit_items` — none exist in any migration (verified: single migration file, zero matches). Since wardrobe shipped, the migration file is almost certainly **out of sync with the live DB** (tables created via dashboard). RLS state of those tables is unverifiable from the repo. | `supabase db dump` the live schema; commit a `0002_wardrobe.sql` migration including RLS policies. | M | HIGH |
| D2 | HIGH | Dashboard queries are never invalidated by module mutations — sleep/food/finance/workouts/body mutations invalidate only their own keys (`sleep/queries.ts:70,89`, `food/queries.ts:134-135`, `finance/queries.ts:125`, `workouts/queries.ts:167-168`, `body/queries.ts:92-93`), so the dashboard shows stale metrics for up to the 30s staleTime. | Have module mutations also invalidate the `['dashboard…']` prefix, or unify key prefixes so one invalidation covers both. | M | HIGH |
| D3 | HIGH | No component handles query `error` — pages destructure only `data`/`isLoading` (e.g. `BodyPage.tsx:44`); failures render as empty states silently. | Global query error toast (queryClient already has the mutation equivalent at `queryClient.ts:18-26`) or minimal per-page error rendering. | M | HIGH |
| D4 | MEDIUM | Duplicate query logic under different keys: TDEE (`dashboard/queries.ts:101` vs `food/queries.ts:214` — same table, same filter, different keys) and latest-weight (dashboard vs body). Double fetch + possible display skew. | Shared hook/key. | S | HIGH |
| D5 | MEDIUM | mealprep `ensurePlanId` check-then-insert (`mealprep/queries.ts:48-66`) races the `unique (user_id, week_start_date)` constraint on rapid edits. | Upsert with `onConflict`. | S | MEDIUM |
| D6 | MEDIUM | Timezone inconsistency — dashboard uses `todayInTz(tz)` but some modules derive "today" from local `new Date()`. Metrics can disagree about what day it is. | Audit ~10 call sites; standardize on the profile-timezone helper. | M | MEDIUM |
| D7 | MEDIUM | Unbounded fetches: `useMonthTransactions` (`finance/queries.ts:71-87`) `select('*')` with no limit; journal list capped at 50 with no pagination. Fine today, single-user. | Add limits/pagination opportunistically. | S | MEDIUM |
| D8 | LOW | `['book_detail', id]` key omits user id (`journal/queries.ts:150-164`); workout invalidation broader than needed (`workouts/queries.ts:167-168`); `sort_order` max+1 not atomic (`journal/queries.ts:214-227`) — all harmless single-user. | One-line fixes when touching these files. | S | LOW |

Verified clean: every query gated on `!!user`; schema indexes match the main query filter patterns; no optimistic updates anywhere (pessimistic-only is a valid, safe choice at this scale).

### 3.5 Performance

Measured from local `dist/`: single JS chunk **709 KB**, CSS 65 KB, fonts ~230 KB across 24 files (all language subsets, both woff and woff2) ≈ 1 MB total.

| # | Sev | Finding | Fix | Effort | Conf |
|---|-----|---------|-----|--------|------|
| P1 | HIGH | No route-level code splitting — all pages statically imported (`App.tsx:9-25`); everything ships in one 709 KB chunk. | `React.lazy` + one `Suspense` for low-traffic pages → est. ~300–350 KB initial. | M | HIGH |
| P2 | MEDIUM | Context values recreated every render: `AuthProvider.tsx:88` (wraps the whole app) and `Toast.tsx:81` — all consumers re-render on every provider render. | Wrap both in `useMemo`. | S | HIGH |
| P3 | MEDIUM | Font payload: `@fontsource/jetbrains-mono` default import ships Cyrillic/Greek/Vietnamese subsets and legacy woff; the app renders Latin only. | Import latin-only 400/500/700 woff2 (or switch to `@fontsource-variable/jetbrains-mono`). ~100 KB saved. | S | HIGH |
| P4 | MEDIUM | `TaskListView.tsx:361-391,407-430` — inline callbacks per row inside `.map()` while drag state churns → every row re-renders during drag; jank risk on long lists. | `React.memo(TaskRow)` + stable callbacks. Low priority at current list sizes. | M | MEDIUM |
| P5 | LOW | `src/assets/hero.png` (13 KB) referenced nowhere. Not bundled (Vite only bundles imports) — hygiene only. | Delete. | S | HIGH |

Verified clean: phosphor icons imported as named imports (tree-shakeable); hand-rolled SVG charts properly `useMemo`'d, no chart library; `Promise.all` used where fetches are parallel; no localStorage in render paths; zero dynamic Tailwind class construction (no purge gaps); dist/ not committed.

### 3.6 Code quality

| # | Sev | Finding | Fix | Effort | Conf |
|---|-----|---------|-----|--------|------|
| Q1 | HIGH | `src/lib/supabase.ts:7` — `createClient<any>` (with an eslint-disable) → ~89 `as` casts across ~31 files (e.g. `food/queries.ts:56,183-186`, `dashboard/queries.ts:92,110,127,142,168`). `src/types/db.ts` is hand-written and self-labeled temporary. The single biggest type-safety lever in the codebase. | `supabase gen types typescript` → `createClient<Database>`; remove casts as they surface. | M | HIGH |
| Q2 | HIGH | BOTH `modules/mealprep/MealPrepPage.tsx` AND `modules/weekly/WeeklyReviewPage.tsx` are fully implemented but unrouted and unlinked (verified against App.tsx routes and Sidebar). | Route them or delete them — user decision (open question 1). | S | HIGH |
| Q3 | MEDIUM | Debug `console.log` in `AuthProvider.tsx:35` (same as A5). | Delete. | S | HIGH |
| Q4 | LOW | Dead files verified by grep: `src/App.css` (imported nowhere), `src/assets/react.svg`, `src/assets/vite.svg` (Vite template leftovers). | Delete all three. | S | HIGH |
| Q5 | LOW | `Sidebar.tsx:81` accepts a `currentPath` prop it never uses (computes from `useLocation()` instead). | Remove the prop and its call-site argument. | S | HIGH |
| Q6 | LOW | Magic 30-day window in `food/queries.ts:193` (`i = 29`); `react-hooks/exhaustive-deps` left at the recommended config's `warn` rather than `error`. | Named constant; optional eslint rule bump. | S | MEDIUM |

Verified clean: no index-as-key, no dead imports, no commented-out code blocks, no TODO/FIXME rot beyond the intentional "replace with generated types" markers, consistent naming and query patterns across all modules, modern flat eslint config.

### 3.7 Security

Overall posture: **strong**. Two agent-reported "CRITICAL" findings were downgraded during compilation with reasoning noted below — flagging severity inflation rather than hiding it.

| # | Sev | Finding | Fix | Effort | Conf |
|---|-----|---------|-----|--------|------|
| S1 | MEDIUM | Signup is disabled only in the UI ("Contact admin" on LoginPage); nothing in the repo prevents calling `supabase.auth.signUp()` directly against the project. If dashboard signup is on, a stranger gets a working authenticated account (RLS still isolates their data, but they consume your project). Unverifiable from the repo. | Verify "Allow new users to sign up" is OFF in the Supabase dashboard. | S | HIGH |
| S2 | MEDIUM | MFA is enforced client-side only (RequireAuth AAL check). Not a data-breach vector — RLS scopes everything to `auth.uid()`, and an aal1 session already belongs to the credential holder — but MFA is currently UX, not a security boundary. *(Agent rated CRITICAL; downgraded for that reason.)* | If MFA should be load-bearing: add `(select auth.jwt()->>'aal') = 'aal2'` to RLS policies or enforce at the Supabase project level. | M | MEDIUM |
| S3 | LOW | `MFASetupPage.tsx:95-101` uses `dangerouslySetInnerHTML` for the Supabase-returned TOTP QR SVG. This is the documented Supabase pattern with first-party content. *(Agent rated CRITICAL; downgraded.)* | Optional: render the QR client-side from the secret. | S | HIGH |
| S4 | LOW | Session tokens in localStorage — standard SPA practice, acceptable. | None. | — | HIGH |

Verified clean: `.env` never committed (`git ls-files .env` empty); only `VITE_SUPABASE_URL` + anon key client-exposed, no server secrets `VITE_`-prefixed; open-redirect guard on login; no eval/innerHTML on user content (journal renders plain text); receipts bucket `public = false` (migration line 431); `api/agent.ts` is a 503 stub — no live attack surface today.

**For when `api/agent.ts` goes live:** verify the Supabase JWT server-side before any work; enforce the `agent_rate_limits` table (exists, currently unenforced); treat user data fed to an LLM as a prompt-injection surface; service-role key lives only in Vercel env vars.

---

## 4. Root cause themes

1. **Auth state is consumed before it resolves.** A single `loading` flag conflates session resolution and profile resolution, and never re-trues on later auth events. This one design choice produces bug 2, the MFA redirect variant (A3), and the deadlock hazard (A2).
2. **Hosting config was written for the API, not the SPA.** `vercel.json` was set up to serve the serverless function; nobody added the SPA fallback the client router depends on. Bug 1 in one sentence.
3. **The schema evolved in the dashboard, not in migrations.** Wardrobe tables exist only in the live DB; `db.ts` types are hand-written; both drift silently. "Run `supabase gen types` later" was deferred and the debt compounded into ~89 casts.
4. **The dashboard is a read-only mirror with no invalidation contract.** Hub queries duplicate module queries under different keys and never hear about mutations — staleness and double-fetching follow directly.
5. **"Temporary" markers became permanent.** The `<any>` client, hand-written types, two finished-but-unrouted pages, and a debug console.log are all flagged as temporary in comments; none were circled back on.

---

## 5. Quick wins (< 30 minutes each)

1. **vercel.json SPA fallback rewrite — fixes bug 1.** One line. (R1)
2. Delete the `console.log` in `AuthProvider.tsx:35`. (A5)
3. Delete dead files: `src/App.css`, `src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png`. (Q4, P5)
4. Delete `src/agent/types.ts`; import agent types from `types/app.ts`. (C1)
5. `useMemo` the two context values in AuthProvider and Toast. (P2)
6. Remove the unused `currentPath` prop from Sidebar. (Q5)
7. Supabase dashboard: confirm signups are OFF — a toggle, not code. (S1)
8. mealprep `ensurePlanId` → upsert with `onConflict`. (D5)

---

## 6. Task plan

### Milestone 0 — Safety net
- Verify Supabase signup toggle is OFF (S1).
- `supabase db dump` the live schema so the wardrobe tables (and any other drift) are captured before anything else touches the DB (D1 prerequisite).
- Confirm `npm run build` is green on the current branch; work on a feature branch off `master`.

### Milestone 1 — Bug fixes (both known bugs confirmed)
- **Bug 1:** add the SPA fallback rewrite to `vercel.json` (R1). Verify: `npm run build && npm run preview`, navigate to `/sleep`, hard reload — no 404.
- **Bug 2:** split profile resolution from `loading` in AuthProvider; RequireAuth waits while `session && profileLoading` (A1). This also fixes the MFA redirect variant (A3). While in the file: move `fetchProfile` out of the `onAuthStateChange` callback body (A2) and drop the console.log (A5). Verify: sign out and sign in twice in a row — lands on the dashboard both times; complete an MFA verify — lands on the dashboard.

### Milestone 2 — High-leverage improvements
- Generate DB types → `createClient<Database>`; remove casts as they surface (Q1).
- Commit the `0002` wardrobe migration from the live dump; confirm RLS on those tables (D1).
- Dashboard invalidation wiring or shared query keys for TDEE/weight (D2, D4).
- Query error surfacing — global toast or per-page (D3).
- Route-level code splitting (P1) and font subsetting (P3).

### Milestone 3 — Everything else
- Route-or-delete mealprep + weekly pages, per user decision (Q2/C2).
- Dedupe `dayLetter()`/`fmt()` into lib (C4); move `WorkoutSplit` into `types/app.ts` (C3).
- TaskListView callback memoization (P4).
- Timezone audit of "today" computations (D6); pagination limits on transactions/journal (D7).
- Optional hardening: aal2 checks in RLS if MFA should be load-bearing (S2); `exhaustive-deps` to error (Q6).

---

## 7. Open questions

1. **Mealprep + Weekly pages:** both are finished and unreachable. Route them, or delete them?
2. **Wardrobe schema:** confirm the three wardrobe tables exist in the live DB with RLS enabled (expected), then dump into a migration — or is wardrobe actually broken in production?
3. **Supabase dashboard settings** (unverifiable from the repo): is signup disabled? Is MFA required at the project level? Is there a redirect URL allowlist?
4. **The AI agent feature** (`api/agent.ts` stub, "Phase 11"): still planned? Determines whether the `agent/` scaffolding and duplicate types stay or go.
5. **Onboarding flag:** keep the `display_name` heuristic, or add an explicit `onboarding_completed_at` column (schema migration)?
