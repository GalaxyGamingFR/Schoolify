# Schoolify

Make school easier, organized, and genuinely engaging. See `claude.md` for the full product spec
and `roadmap.md` for the phased build order and progress.

## Stack

Next.js 15 (App Router) + TypeScript, Tailwind + shadcn/ui, PostgreSQL via Prisma, Clerk for
auth, deployed on Vercel.

## Local development

Prerequisites: Node 22+, Docker Desktop (for local Postgres).

```bash
docker compose up -d      # starts local Postgres on localhost:5432
npm install
npx prisma migrate dev    # applies the schema
npm run dev                # http://localhost:3000
```

The app will build and the database will work locally without any external accounts. Auth
(Clerk) requires the account setup below before sign-in/sign-up actually function.

## One-time account setup

Three external services need accounts before the app is fully functional. None of this can be
done by an agent — each requires signing in as you.

### 1. Clerk (auth) — required to sign in locally or in production

1. Create a free app at [dashboard.clerk.com](https://dashboard.clerk.com).
2. Copy the **Publishable key** and **Secret key** into `.env`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
   CLERK_SECRET_KEY="sk_..."
   ```
3. In the Clerk dashboard, add a webhook endpoint pointing at
   `https://<your-deployed-domain>/api/webhooks/clerk` (once deployed — see below), subscribed to
   `user.created`, `user.updated`, `user.deleted`. Copy the **Signing secret** into `.env` as
   `CLERK_WEBHOOK_SIGNING_SECRET`. This is what keeps our `User` table in sync with Clerk;
   without it, the dashboard will show "waiting on the Clerk webhook to sync."

   To test this locally before deploying, use the Clerk CLI's tunnel instead of a real domain:
   ```
   clerk webhooks listen --forward-to http://localhost:3000/api/webhooks/clerk
   ```
   It prints a `https://webhooks.clerk.com/in/c_.../` relay URL — add *that* as the dashboard
   endpoint (steps above) to get a local signing secret.

### 2. Managed Postgres — required before deploying (local dev uses Docker instead)

1. Create a free database at [neon.com](https://neon.com) or [supabase.com](https://supabase.com).
2. Copy the connection string into `DATABASE_URL` (in Vercel's environment variables when you
   deploy — see below).
3. Run `npx prisma migrate deploy` against it once, to create the schema.

### 3. Vercel — deployment

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Add the environment variables from `.env` (Clerk keys + webhook secret, and the managed
   `DATABASE_URL` from step 2) in the Vercel project settings.
4. Deploy. Update the Clerk webhook URL (step 1.3) to point at the real deployed domain.

## CI

`.github/workflows/ci.yml` runs lint, typecheck, a Prisma migration check, and a production
build against a throwaway Postgres service on every push — no account setup needed for CI itself.
