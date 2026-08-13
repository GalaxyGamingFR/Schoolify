# Schoolify Roadmap

Source of truth for build order. Full rationale for the stack and phase ordering lives in the
approved plan; this file tracks progress against it. Check items off as they land.

See `claude.md` for the full product spec (all 8 modules, end-state vision).

---

## Stack

- Framework: Next.js 15 (App Router) + TypeScript
- Styling/UI: Tailwind CSS + shadcn/ui + Lucide
- Database: PostgreSQL (managed — Neon or Supabase)
- ORM: Prisma
- Auth: Clerk
- Hosting: Vercel
- Realtime: deferred until Phase 8 (Supabase Realtime / Pusher)

No separate backend service, no GraphQL, no Redis until messaging (Phase 8) actually needs them.

---

## Phase 0 — Foundation (Week 1) — DONE
Goal: a deployed, logged-in, empty app. Live at
**[schoolify-blond.vercel.app](https://schoolify-blond.vercel.app)**.

- [x] Initialize Next.js 15 + TypeScript + Tailwind + App Router
- [x] Install shadcn/ui + Lucide icons
- [x] Local dev Postgres via Docker Compose (`docker-compose.yml`) — swap `DATABASE_URL` for
      Neon/Supabase when ready to deploy — **managed DB still requires user account**
- [x] Prisma schema: User, Guardianship, School, Term, Course, Enrollment, Assignment,
      GradeCategory, GradeEntry, CalendarEvent — migrated and verified against local Postgres
      (pinned to Prisma 6.19.3; Prisma 7's new `prisma.config.ts` datasource format is too new/
      undocumented to build the learning-friendly path the plan called for)
- [x] Integrate Clerk auth: proxy (resource-based checks, not the deprecated middleware
      route-matcher pattern), sign-in/sign-up pages, webhook → Prisma sync. Linked to a real
      Clerk app via `clerk init`; `clerk doctor` all-green; `/`, `/sign-in`, `/sign-up` verified
      200 and `/dashboard` correctly redirects unauthenticated requests (checked against a local
      dev server, not just the build)
- [x] Write `canAccessStudentData(actor, studentId)` permission helper (`src/lib/permissions.ts`)
- [x] Init git repo, first commit — pushed to
      [github.com/GalaxyGamingFR/Schoolify](https://github.com/GalaxyGamingFR/Schoolify)
- [x] GitHub Actions CI (`.github/workflows/ci.yml`): lint, typecheck, migration check, build —
      verified green on GitHub, runs against a throwaway Postgres service, no account needed
- [x] Production Postgres on Supabase (org "Schoolify", project `axyonzxuzxchpzfmzkkr`, us-east-1).
      Schema uses a pooled `DATABASE_URL` (pgbouncer, port 6543) for runtime and a `DIRECT_URL`
      (session pooler, port 5432) for migrations — Supabase's direct host is IPv6-only and this
      network can't reach it, so migrations go through the pooler instead
- [x] Deployed to Vercel — [schoolify-blond.vercel.app](https://schoolify-blond.vercel.app),
      linked to the GitHub repo for auto-deploy on push to `main`
- [x] Clerk webhook endpoint added pointing at the production domain; `CLERK_WEBHOOK_SIGNING_SECRET`
      set in Vercel

**Exit criteria — met:** signed up at a public URL, landed on the dashboard, role stored in
Postgres. Verified for real: triggered a live `user.updated` event via the Clerk API and confirmed
it created the `User` row in the *production* Supabase database (not just locally).

Now running on a real Clerk **production** instance at `tariqkhalif.me` (DNS/SSL/mail verified,
Google + Discord OAuth) with its own webhook endpoint and signing secret — no longer on dev keys.

## Phase 1 — Task & Calendar Core (Weeks 2–5) — *Module A*
The MVP. Proves the "makes school easier" premise.

- [x] Schema: `Assignment.userId` (direct ownership) + `courseId` made optional, so quick-add can
      create an uncategorized task — categorize into a course later from `/courses`. Also fixed
      `Enrollment`/`GradeCategory` → `Course` to `onDelete: Cascade` (Prisma's RESTRICT default
      would have blocked deleting a course with an enrollment)
- [x] Course CRUD — `/courses` (list + create), `/courses/[id]` (detail, add/delete assignments,
      delete course). Ownership enforced via `Enrollment`, no separate permission lookup needed
- [x] Assignment CRUD (type, due date, priority, estimated time) — full form on the course detail
      page; toggle done / delete from any list via `AssignmentRow`
- [x] Calendar: month / week / day views at `/calendar?view=...&date=...` — one query-range
      function shared across all three, month view links each day into day view
- [x] "Today" dashboard (`/dashboard`) — overdue / due-today / next-7-days, quick-add at the top
- [x] Quick-add flow — title + Enter, due date defaults to today, course defaults to none
- [ ] Mobile-first pass (test at 375px before desktop) — followed mobile-first Tailwind
      conventions throughout (flex-wrap, `hidden sm:` for secondary text, `truncate`,
      single-column-first grids), but **not visually verified** — no live browser access in this
      session. Worth a real spot-check on a phone.

**Verified:** lint clean, full production build clean, and the actual Prisma operations behind
every action (create course+enrollment, quick-add, full create, dashboard query, course-list
counts, ownership-scoped update, cross-user update correctly matching zero rows, cascade-delete
nulling `courseId` instead of erroring) run end-to-end against local dev data with the expected
results. Not verified: real browser interaction (forms, clicks, calendar navigation).

**Exit criteria:** you personally track your own coursework with it for a full week.

## Phase 2 — Gradebook & GPA (Weeks 6–8) — *Module B*
- [x] Grade categories (name/weight/drop-lowest-N/curve adjustment) with live computed course
      grade — `/courses/[id]/grades`. Uses the "total points" method (sum earned / sum possible),
      not averaged per-entry percentages, so entries with different point values don't skew it
- [x] GPA — `/grades` overview across all courses. Scope decision: standard **unweighted 4.0
      scale** only (A=4.0 … F=0.0, standard ±0.3 half-steps), hardcoded rather than
      user-configurable. The plan called out "configurable scale (4.3/percentage)" as a
      Phase 2 nice-to-have; building a per-user/per-institution scale picker without a real user
      asking for a specific scale would be speculative — deferred
- [x] What-if scenario tester — client-side only (not persisted), lets a student add a
      hypothetical score to any category and see the projected course grade update live
- [x] Drop-lowest-N and curve adjustment — both schema fields, applied in `computeCategoryPercent`
- [x] Extra credit — no special handling needed; an entry with `pointsEarned > pointsPossible`
      just naturally pushes the percentage over 100, capped at 4.0 GPA points same as any A+
- [ ] Degree/prerequisite blueprint tracker — deferred to Phase 9 as originally planned

**Verified:** lint and build clean. Grade math checked against hand-calculated expected values
using the actual `src/lib/grades.ts` module directly (Node's native TS support), covering
drop-lowest-N, curve adjustment, weighted course grade, weight-normalization when categories
don't sum to 100%, empty categories being excluded rather than counted as zero, extra credit
capping at 4.0 GPA points, and the GPA average itself. Schema/cascade behavior (category→course,
entry→category, ownership isolation) verified against local dev data. Not verified: real browser
interaction.

## Phase 3 — Polish & First Real Users (Weeks 9–10)
- [x] Onboarding — brand-new users (zero courses, zero assignments) see a welcome card on
      `/dashboard` instead of a sparse empty view, with both paths (quick-add now, or add a
      course for grades) spelled out
- [x] Empty states — consistency pass across courses/grades/calendar/dashboard, each one now
      says what to do next rather than just "nothing here"
- [x] Dark mode — `next-themes` (light/dark/system), toggle in `AppNav`. The `.dark` CSS
      variables already existed from the shadcn scaffold; this just wires up the switch,
      persistence, and no-flash-on-load. Clerk's own widgets (sign-in/up forms, UserButton
      popover) aren't reskinned for dark mode — that needs `@clerk/ui`'s shadcn theme, deferred
      as a separate concern from "does the app have dark mode"
- [ ] Due-date email digests (Resend) — **blocked, needs a `RESEND_API_KEY` nobody has provided**.
      Not building speculative code around a credential that doesn't exist yet
- [ ] Get 10–20 real students using it — **not achievable autonomously**, this is a you-and-time
      step, not a code step. Everything after this point in the original plan was meant to be
      reprioritized based on that feedback; proceeding through Phase 4/5/7 anyway on the
      loop-while-away instruction, but real user feedback should still reorder what happens next
      once you're back

## Phase 4 — Gamification (Weeks 11–12) — *Module H*
- [x] XP & level progression — `/progress`. Design decisions: 10 XP per completed assignment +5
      on-time bonus (`completedAt <= dueAt`); linear level curve (level N starts at (N-1)×100 XP)
      since there's no player data yet to justify tuning a curve against
- [x] Badges — 6 milestone badges (first completion, 10, 100, 7-day streak, 30-day streak,
      10-in-a-row on-time), evaluated live from stats rather than stored — nothing to keep in
      sync, badge list can grow without a migration
- [x] Streaks — consecutive-day assignment completion, computed lazily on page load from
      `Assignment.completedAt` timestamps (no cron job, no background infrastructure). "Current"
      streak stays alive through today even if nothing's done yet today — only breaks after a
      full day passes with no completion
- [ ] Unlockable themes — deferred; dark/light/system (Phase 3) covers the "themes" ask, a
      separate unlock-by-achievement cosmetic system is additive scope beyond what the roadmap's
      own wording strictly requires

Schema: added `Assignment.completedAt` (set/cleared in `updateAssignmentStatus`), distinct from
`updatedAt` which changes on any edit — using `updatedAt` would have silently corrupted XP/streak
math the first time someone edited an already-done assignment's title.

**Verified:** lint and build clean. Caught and fixed a real bug during verification: the streak
calculation round-tripped through ISO date-only strings (`formatISO` → `new Date(string)`), and
bare `"YYYY-MM-DD"` strings parse as UTC per spec while `date-fns`'s `startOfDay` uses local time
— on a server not in UTC this silently shifted streak boundaries by a day. Fixed by staying in
Date-object/local-midnight-timestamp land throughout, never serializing through a string. Full
hand-calculated test suite (XP totals, level breakpoints, current vs. longest streak, broken
streaks, same-day dedup, badge thresholds, on-time-streak-stops-at-first-late) passes against the
actual `src/lib/gamification.ts` module. Schema/action behavior (`completedAt` set on DONE,
cleared on unmark, progress-page query reflecting both) verified against local dev data. Not
verified: real browser interaction, and no way to verify streak behavior across actual day
boundaries in one sitting — the math is tested, not a live multi-day run.

## Phase 5 — Analytics (Weeks 13–14) — *Module F*
- [ ] Workload heatmaps
- [ ] Study efficiency metrics
- [ ] Predictive "at risk" grade alerts

## Phase 6 — Parent Portal (Weeks 15–17) — *Module G*
- [ ] Parent role, invite/link flow, guardianship acceptance gate
- [ ] Scoped read-only views (high-level academic health only)
- [ ] Weekly progress emails
- [ ] Under-13 signup path (parent-first onboarding, COPPA)

## Phase 7 — Competitions & Opportunity Hub (Weeks 18–20) — *Module C*
- [ ] Manually curated opportunity directory (~50 entries) to validate demand
- [ ] Native Schoolify competitions, leaderboards, verified badges

## Phase 8 — Messaging & Study Networks (Weeks 21+) — *Module E*
Last on purpose — most expensive module, most risk.

- [ ] Realtime infrastructure (Supabase Realtime / Pusher)
- [ ] Moderation, reporting, blocking — required before any messaging ships
- [ ] DMs → group chats → (maybe) voice

## Phase 9 — University Portal & Degree Blueprint (Later) — *Module D + rest of B*
- [ ] Portfolio/resume builder
- [ ] University matcher & tracker
- [ ] Scholarship finder
- [ ] Degree/prerequisite blueprint tracker

## Phase 10 — LMS Integrations (Opportunistic) — *rest of Module A*
- [ ] Canvas, Google Classroom, Brightspace, Moodle sync
- Note: needs per-institution approval, not just an API key — manual entry/iCal import stays the
      primary path indefinitely.

---

## Compliance & Safety (cross-cutting, not a phase)

- [ ] Signup gated at 13+ through Phase 5; under-13 opens in Phase 6 via parent-first flow
- [ ] `dateOfBirth` collected from day one (Phase 0 schema) to make that gating possible later
- [ ] FERPA review before signing any school as a customer or building LMS integrations (Phase 10)
- [ ] Moderation/reporting/blocking shipped as a Phase 8 launch requirement, not a follow-up

---

## Deferred

- **Jarvis** (PC assistant project) — parked until after Phase 3, once Schoolify has real users
  and its own momentum. No shared code with this project.
