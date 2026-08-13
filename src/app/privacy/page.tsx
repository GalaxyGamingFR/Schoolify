import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { PublicFooter } from "@/components/public-footer";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Schoolify collects, uses, and protects your data.",
};

const LAST_UPDATED = "August 13, 2026";

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Logo />
            Schoolify
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated {LAST_UPDATED}</p>

        <Card className="mt-6 border-destructive/50">
          <CardContent className="py-4 text-sm">
            <strong>Draft, not legal advice.</strong> This accurately describes what the product
            currently does and what data it currently stores, but it has not been reviewed by a
            lawyer, and Schoolify does not yet have a real COPPA Verifiable Parental Consent
            mechanism for under-13 users — see `roadmap.md`&apos;s Compliance &amp; Safety section.
            Don&apos;t treat this page as sufficient for a real launch to real under-13 users until
            that&apos;s resolved.
          </CardContent>
        </Card>

        <div className="mt-6 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold">1. What we collect</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Account info: name, email address, and role (student/parent), from Clerk</li>
              <li>Date of birth (students only) — used only to gate under-13 accounts behind a guardian link</li>
              <li>
                Academic data you enter: courses, assignments, grades, calendar events, portfolio
                entries, degree plan, university application tracker
              </li>
              <li>Guardianship links between parent and student accounts, and their status</li>
              <li>School affiliations: schools you register or join, staff roles, class rosters</li>
              <li>Messages you send, and reports/blocks you file against other users</li>
              <li>Basic usage data needed to run the product (timestamps, streaks, XP)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. How we use it</h2>
            <p className="mt-2 text-muted-foreground">
              To run the features you use — showing your assignments, computing grades, syncing
              guardian views, delivering messages to people you&apos;re actually eligible to
              message, and enforcing the access rules described below. We don&apos;t sell your data
              or use it for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. Who can see what</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Your assignments, grades, and calendar are visible only to you</li>
              <li>
                A linked parent/guardian (only after you accept the link, or after you invite them
                yourself) sees a high-level summary: GPA, per-course grades, upcoming deadlines,
                streak — not your individual assignment-by-assignment activity
              </li>
              <li>
                A teacher at a school-managed class you join can see your enrollment in that class;
                they do not automatically see your grades in that class (grading by teachers isn&apos;t built yet — see roadmap.md)
              </li>
              <li>Messages are visible to the people in that conversation, plus a platform admin if the message is reported</li>
              <li>A platform admin can review reported messages to enforce the Terms of Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Third parties we use to run Schoolify</h2>
            <p className="mt-2 text-muted-foreground">
              We use a small number of infrastructure providers to operate the service, each under
              their own privacy terms:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <strong>Clerk</strong> — authentication (sign-up, sign-in, session management)
              </li>
              <li>
                <strong>Supabase</strong> — our database (Postgres), where your academic data lives
              </li>
              <li>
                <strong>Vercel</strong> — hosting for the application itself
              </li>
              <li>
                <strong>Upstash</strong> — short-lived rate-limiting data (to prevent abuse; not
                your academic content)
              </li>
            </ul>
            <p className="mt-2 text-muted-foreground">
              We don&apos;t sell data to these providers or anyone else — they process it strictly
              to provide their service to us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Children&apos;s privacy (COPPA)</h2>
            <p className="mt-2 text-muted-foreground">
              We ask for date of birth from student accounts specifically to identify accounts
              under 13 and require a linked parent/guardian before full access — see the disclaimer
              above for why this is a UI safeguard, not certified Verifiable Parental Consent yet.
              A parent can review and request deletion of their linked child&apos;s data by
              contacting us (below) or by deleting the linked account directly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Data retention &amp; deletion</h2>
            <p className="mt-2 text-muted-foreground">
              You can delete your account at any time (Account → Security → Delete account). This
              permanently removes your personal data — assignments, enrollments, calendar events,
              activities, degree/application records, sent messages, guardian links, and block
              lists. Some structures you merely had a role in (like a class you taught) stay intact
              for other users, with your association to them removed rather than the whole record
              being destroyed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Security</h2>
            <p className="mt-2 text-muted-foreground">
              We use industry-standard practices (encrypted connections, provider-managed
              authentication, access controls enforced on every request) but no system is
              perfectly secure. If you believe your account has been compromised, contact us
              immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Changes</h2>
            <p className="mt-2 text-muted-foreground">
              We may update this policy as the product changes. Material changes will be reflected
              by updating the date at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">9. Contact</h2>
            <p className="mt-2 text-muted-foreground">
              Questions, data requests, or to report a concern:{" "}
              <a href="mailto:therealtariqkhalif@gmail.com" className="underline">
                therealtariqkhalif@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
