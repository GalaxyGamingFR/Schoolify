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

## Phase 0 — Foundation (Week 1)
Goal: a deployed, logged-in, empty app.

- [x] Initialize Next.js 15 + TypeScript + Tailwind + App Router
- [x] Install shadcn/ui + Lucide icons
- [x] Local dev Postgres via Docker Compose (`docker-compose.yml`) — swap `DATABASE_URL` for
      Neon/Supabase when ready to deploy — **managed DB still requires user account**
- [x] Prisma schema: User, Guardianship, School, Term, Course, Enrollment, Assignment,
      GradeCategory, GradeEntry, CalendarEvent — migrated and verified against local Postgres
      (pinned to Prisma 6.19.3; Prisma 7's new `prisma.config.ts` datasource format is too new/
      undocumented to build the learning-friendly path the plan called for)
- [x] Integrate Clerk auth code (proxy/middleware, sign-in/sign-up pages, webhook → Prisma sync)
      — **needs a Clerk account + API keys in `.env` before it runs for real**
- [x] Write `canAccessStudentData(actor, studentId)` permission helper (`src/lib/permissions.ts`)
- [ ] Init git repo, first commit
- [ ] GitHub Actions CI: typecheck, lint, test on push
- [ ] Deploy to Vercel — **requires user account**

**Exit criteria:** sign up at a public URL, land on an empty dashboard, role stored in Postgres.

## Phase 1 — Task & Calendar Core (Weeks 2–5) — *Module A*
The MVP. Proves the "makes school easier" premise.

- [ ] Course CRUD (manual entry)
- [ ] Assignment CRUD (type, due date, priority, estimated time)
- [ ] Calendar: month / week / day views
- [ ] "Today" dashboard (default landing view)
- [ ] Quick-add flow — log a task in under 3 clicks
- [ ] Mobile-first pass (test at 375px before desktop)

**Exit criteria:** you personally track your own coursework with it for a full week.

## Phase 2 — Gradebook & GPA (Weeks 6–8) — *Module B*
- [ ] Grade categories with custom weighting, live computed course grade
- [ ] GPA calculation (configurable scale)
- [ ] What-if scenario tester, drop-lowest-N, extra credit, curve adjustment
- [ ] (Degree/prerequisite blueprint deferred to Phase 9)

## Phase 3 — Polish & First Real Users (Weeks 9–10)
- [ ] Onboarding flow, empty states, dark mode + themes
- [ ] Due-date email digests (Resend)
- [ ] Get 10–20 real students using it — reprioritize everything below based on their feedback

## Phase 4 — Gamification (Weeks 11–12) — *Module H*
- [ ] XP & level progression
- [ ] Badges, unlockable themes
- [ ] Streaks

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
