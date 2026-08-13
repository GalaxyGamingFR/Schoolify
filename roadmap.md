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
- [x] Workload heatmap — `/analytics`, next 4 weeks, assignment count per day by `dueAt`. No
      schema change needed
- [x] "Study efficiency metrics" — scope decision: **not** actual-vs-estimated time, because
      there's no time-tracking in this app (a timer/start-stop UI is a real separate feature, not
      implied by "Analytics" alone — adding `actualMinutes` without a way to record it would be a
      dead field). Instead: on-time completion rate and completion pace (trailing 4-week
      average/week), both derivable from data that already exists
- [x] Predictive "at risk" alerts — three simple, explainable rules, no ML: (1) course grade below
      70% (the C-/D boundary already in `grades.ts`), (2) course grade computed from just the last
      14 days of entries has dropped 5+ points vs. the overall grade — reuses `computeCourseGrade`
      on two filtered entry sets rather than inventing separate trend math, so it can never
      disagree with the grade shown on the course page, (3) next week's estimated workload exceeds
      1.5× the trailing 4-week average

No schema changes this phase — everything reads existing `Assignment`/`GradeEntry` data.

**Verified:** lint and build clean. Hand-calculated test suite (heatmap day-bucketing, on-time
rate, velocity with an out-of-window exclusion, grade trend matching a manually-computed 70%
overall / 60% recent / -10 delta, and all three risk-alert types firing correctly while a healthy
course stays silent) passes against the actual `src/lib/analytics.ts` module — verified once with
an explicit `.ts` import extension to satisfy Node's standalone ESM resolver (TypeScript's
`bundler` moduleResolution rejects that in real source, so the source import stayed the normal
`@/lib/grades` form; the math doesn't change based on import syntax). Query shapes checked against
local dev data. Not verified: real browser interaction.

The nav bar was flagged here as getting crowded (6 items) — addressed in Phase 7 below once a 7th
item made it actually necessary, not preemptively.

## Phase 6 — Parent Portal (Weeks 15–17) — *Module G*
- [x] Onboarding step — `/onboarding`, gated at the one universal post-signup landing point
      (`/dashboard`, since Clerk's fallback redirect always sends new users there regardless of
      eventual role). Role picker (Student/Parent) plus date-of-birth for students only — a
      parent's own age isn't what COPPA cares about, nothing to gate on for them. Sets
      `User.onboardingCompletedAt`; no other route re-checks it, matching the "one choke point"
      approach used for auth elsewhere in this app
- [x] Parent role, invite/link flow, guardianship acceptance gate — reuses the `Guardianship`
      model from Phase 0 as-is (no schema change beyond `onboardingCompletedAt`). Acceptance
      authority always sits with the student, regardless of who initiated the link, since it's
      their data being shared — a parent-initiated request (`requestStudentLink`) stays `PENDING`
      until the student accepts/declines it; a student-initiated invite (`inviteGuardian`)
      auto-accepts, since inviting *is* the consent in that direction. Both actions look the
      target up by email (`findUserByEmail`) — there's no invite-a-not-yet-registered-email flow,
      matching the "don't build speculative infra" pattern; the error message says so plainly
- [x] Scoped read-only views — `/parent` (linked students, pending requests, link-a-student form)
      and `/parent/[studentId]` (GPA, per-course grades, next-7-days deadlines, streak/level,
      low-grade/trending-down risk alerts). Deliberately excludes: individual grade entries,
      full assignment list/detail, quick-add, what-if calculator, and the "heavy week" workload
      alert — those are the "invading student study privacy" side of Module G's own framing,
      not the "transparent grade/due-date updates" side. Enforced via the existing
      `canAccessStudentData` permission check (unchanged from Phase 0), re-verified against local
      dev data this phase
- [ ] Weekly progress emails — **blocked, same as Phase 3's due-date digests**: still no
      `RESEND_API_KEY`. Not building speculative code around a credential that doesn't exist yet
- [x]/[ ] Under-13 signup path — **the technical gate is built, real COPPA compliance is not.**
      `src/lib/coppa.ts` computes age and blocks a `STUDENT` account under 13 from the normal
      dashboard until an `ACCEPTED` guardianship exists, showing a "link a parent" screen instead
      (`needsGuardianVerification`). This is a UI speed bump, **not Verifiable Parental Consent**
      under the FTC's COPPA Rule — an accepted Guardianship only proves some adult clicked
      "accept," not that they're the child's actual parent, and the gate only guards the
      `/dashboard` entry point, not every route a determined user could type in directly (a real
      defense-in-depth version would need every self-access query routed through a permission
      check the way parent-access queries already are — a bigger refactor than this phase's
      scope). Real VPC (credit card charge, signed form, ID verification service) is a legal/
      business decision nobody has made yet — see Compliance & Safety below

Nav: `AppNav` became a self-contained async server component (fetches its own current user) so
existing `<AppNav />` call sites in every page didn't need to start threading role through props;
it now renders a minimal "Your students" link instead of the student nav when `role === "PARENT"`.

**Verified:** lint and build clean. Hand-calculated test suite for `coppa.ts` (age at/before/after
a birthday, the under-13 gate's four branches) passes against the actual module — caught a real
bug during verification: `calculateAge` originally compared `now.getMonth()`/`getDate()` (local
time) against a bare `"YYYY-MM-DD"` date-of-birth string parsed as UTC midnight (per spec), which
on a server west of UTC reads back one calendar day earlier than intended — the same class of bug
already hit once in Phase 4's streak math. Fixed by using UTC accessors consistently on both sides
instead of mixing local/UTC reads. Guardianship flow (PENDING blocks access, ACCEPTED grants it,
an unrelated parent stays denied, the `@@unique([parentId, studentId])` constraint rejects a
duplicate invite) verified end-to-end against local dev data via real Prisma operations. Not
verified: real browser interaction.

## Phase 6.5 — School Accounts: Principal/Teacher/Roster (added, not in the original plan)
Not one of the original Module A–H phases — added mid-stream so a school can actually onboard
onto Schoolify as an institution: a principal registers the school, invites teachers, teachers
run classes, students join with their school email.

- [x] School registration — `/school`. Any signed-in user can register a `School{name, domain}`;
      the registrant becomes its `PRINCIPAL`. Gate: their own account email's domain must match
      the domain being registered. **Scope decision:** this is deliberately not a new
      email-verification subsystem — it reuses the fact that `User.email` already went through
      Clerk's own sign-up verification (OTP/magic-link) before the row was ever created, the same
      insight that avoids re-hitting Phase 3's "blocked on `RESEND_API_KEY`" wall. It proves the
      registrant controls *an* inbox at that domain, not that they're formally authorized to
      represent the institution — see Compliance & Safety below
- [x] Principal manages teachers — `/school/[id]`. Invite by email (must match the school's
      domain); if that email already has a Schoolify account the `SchoolStaff` row is `ACTIVE`
      immediately, otherwise it sits `INVITED` (`userId` null) until claimed. `claimSchoolInvites`
      runs on every `/school` load and reconciles any `INVITED` row matching the current user's
      email — so an invite sent before someone signs up still resolves the first time they show
      up. Principal can remove staff; blocked from removing the last active principal so a school
      can't end up orphaned
- [x] Teachers create classes with a join code — `createSchoolCourse` makes a normal `Course` row
      (schema: `Course.teacherId`, `Course.joinCode`) rather than a parallel model, so every
      existing course-detail/assignment/grade page works on a school-managed course for free. Join
      code is 6 characters from an ambiguity-free alphabet (no `0/O/1/I`), regenerable by the
      teacher or a principal
- [x] Students join with their school email — `joinCourseByCode` on `/courses` checks the
      student's own account-email domain against the course's school domain
      (`matchesSchoolDomain`) before creating the `Enrollment`; same Clerk-verification reuse as
      registration, "actually verified" without new email infra
- [x] **Real bug caught and fixed while building this:** `renameCourse`/`deleteCourse`
      (`src/lib/actions/courses.ts`) originally granted ownership to *any* enrolled student — fine
      when every course was self-tracked (the enrolled student was definitionally the only owner),
      but wrong the moment a teacher-owned course with multiple enrolled students existed: any
      classmate could have renamed or deleted the whole class's course out from under everyone
      else. Fixed with a shared `ownershipWhere()` that only grants a school-managed course
      (`teacherId` set) to its teacher, while self-tracked courses (`teacherId` null) keep the
      original any-enrolled-student rule
- [ ] Teacher-authored gradebook entry — **not built.** A school-managed course a student joins
      still uses the same self-tracked `GradeCategory`/`GradeEntry` flow as before — the student
      enters their own scores, same as any personal course. Real teacher-entered grading is a
      separate ownership model (who can write a `GradeEntry` for *someone else's* `Assignment`)
      big enough to be its own pass, not a corner to cut into this one. The course page says so
      explicitly so a parent viewing it isn't misled into thinking it's official school data yet

**Verified:** lint and build clean. Hand-calculated suite for `src/lib/school.ts` (domain
normalization/matching including case-insensitivity and a same-suffix-different-domain
false-positive check, join-code alphabet/length, and a 1000-draw uniqueness sanity check) passes.
End-to-end Prisma verification against local dev data: duplicate school domain rejected, a teacher
invite auto-claims on matching email, duplicate join codes and duplicate enrollments rejected by
their unique constraints, an in-domain student's join succeeds — and, specifically re-testing the
bug above, an enrolled-but-not-teaching classmate is denied a rename while the actual teacher and
a self-tracked course's own student both still succeed. Not verified: real browser interaction.

## Phase 7 — Competitions & Opportunity Hub (Weeks 18–20) — *Module C*
- [x] Manually curated opportunity directory — `/opportunities`, 47 entries (target was ~50;
      stopped adding once the confidently-real list ran out rather than padding to hit a round
      number) across STEM, math, engineering, computer science, business, writing, debate, arts.
      Filterable by subject, grade, and free-text search
- [ ] Native Schoolify competitions, leaderboards, verified badges — **not built**. This needs
      real product/business decisions (what to run, prize funding, moderation for
      student-submitted content) that shouldn't get invented unsupervised overnight — see
      `roadmap.md`'s original framing of Phase 7 for why this half was always going to need you

**Accuracy policy (the load-bearing decision this phase):** rather than inventing specific
deadlines or prize amounts, every entry's `deadlineNote`/`prizeNote` is either (a) marked
`[verified Aug 2026]` with a real date/figure checked via live web search at write time — Regeneron
STS, Regeneron ISEF, FIRST Robotics, Congressional App Challenge, Technovation Girls, Conrad
Challenge, John Locke Institute, Diamond Challenge, and Scholastic Art & Writing all got checked
this way — or (b) describes the well-established general pattern (organization, subject, typical
season) and explicitly says to check the official site for exact current dates. **Google Science
Fair was checked and confirmed defunct (ended 2018) — excluded entirely** rather than included
from stale memory. Schema stores `typicalDeadlineMonth` (a rough integer 1-12) rather than a real
`DateTime` deadline specifically to avoid the schema itself implying false precision.

Schema: new `Opportunity` model, read-only reference data, no relation to `User` — seeded via
`prisma/seed.mts` (`node prisma/seed.mts`, not run through `prisma db seed` tooling — kept simple
since this seeds once, it isn't part of the regular dev-reset flow other models don't need either).

Nav: grouped `Progress`/`Analytics`/`Opportunities` into a "More" dropdown (reusing the
`DropdownMenu` component already proven in `ThemeToggle`) rather than adding a 7th top-level item
— `Today`/`Courses`/`Calendar`/`Grades` stay as direct links since they're the highest-frequency
pages.

**Verified:** lint and build clean. Query-shape checks against real seeded local data — subject
filter, grade-range filter (confirmed MATHCOUNTS shows for grade 7 while Regeneron STS, grades-12-
only, correctly doesn't), text search, and a data-integrity check that no entry has an empty
title/URL. Production migrated and seeded, count confirmed at 47. Not verified: real browser
interaction — in particular, the filter UI's `Select`-plus-`router.push` pattern (chosen over a
riskier `Select`-wrapping-`Link` composition that was drafted first and reverted once it became
clear that couldn't be trusted without visual testing) hasn't been clicked through for real.

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

- [x] Signup gated at 13+ through Phase 5 (no DOB was ever collected, so there was no way to
      onboard as under-13 in the first place — the gate was implicit); Phase 6 adds the explicit
      DOB-based gate described above
- [x] `dateOfBirth` collected from day one (Phase 0 schema); now actually gathered via the Phase 6
      onboarding step
- [ ] **Real COPPA Verifiable Parental Consent — not done, needs a human decision.** Phase 6's
      guardian-link gate (`src/lib/coppa.ts`) is a UI speed bump modeled on the FTC's requirement,
      not a certified VPC method. Before any real under-13 user is allowed to actually use the
      app (as opposed to a developer testing the flow), someone needs to pick a real VPC method
      (credit card charge, signed consent form, ID verification service, etc.) and that's a
      legal/business decision, not a code change — same category as Phase 7's "native
      competitions need real product decisions"
- [ ] FERPA review before signing any school as a customer or building LMS integrations (Phase 10)
- [ ] **School-registration domain check is not institutional verification.** Phase 6.5's "your
      account email must match the domain you're registering" gate proves the registrant controls
      one inbox at that domain — it does not confirm they're actually the principal, or that
      Schoolify has any agreement with the institution. Anyone with an `@theirschool.edu`-style
      address (a teacher, a student, an ex-employee with a still-active account) could technically
      register the school first. A real launch to actual schools needs a manual verification/sales
      process before this gate is treated as sufficient, same category as the COPPA item above
- [ ] Moderation/reporting/blocking shipped as a Phase 8 launch requirement, not a follow-up

---

## Deferred

- **Jarvis** (PC assistant project) — parked until after Phase 3, once Schoolify has real users
  and its own momentum. No shared code with this project.
