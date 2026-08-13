import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { PublicFooter } from "@/components/public-footer";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of Schoolify.",
};

const LAST_UPDATED = "August 13, 2026";

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated {LAST_UPDATED}</p>

        <Card className="mt-6 border-destructive/50">
          <CardContent className="py-4 text-sm">
            <strong>Draft, not legal advice.</strong> This page is a reasonable starting template,
            not a document reviewed by a lawyer. Before relying on it with real users — especially
            given that Schoolify is built to be usable by students under 13 — have it reviewed by
            counsel familiar with COPPA, FERPA, and your jurisdiction&apos;s requirements. See
            `roadmap.md`&apos;s Compliance &amp; Safety section for the specific gaps already
            identified (Verifiable Parental Consent, FERPA review, school-registration
            verification).
          </CardContent>
        </Card>

        <div className="mt-6 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold">1. Acceptance of terms</h2>
            <p className="mt-2 text-muted-foreground">
              By creating an account or using Schoolify, you agree to these Terms of Service. If
              you are under 18, a parent or legal guardian must agree to these terms on your
              behalf and is responsible for your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. What Schoolify is</h2>
            <p className="mt-2 text-muted-foreground">
              Schoolify is an academic organization tool: task and calendar tracking, a gradebook,
              a school/class roster system, messaging between classmates and linked guardians, and
              related features. It is not a school system of record, not a substitute for your
              institution&apos;s official records, and not a guarantee of any particular academic
              outcome.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. Accounts</h2>
            <p className="mt-2 text-muted-foreground">
              You&apos;re responsible for the accuracy of the information you provide and for
              keeping your account credentials secure. One person, one account — don&apos;t share
              login credentials or create an account on someone else&apos;s behalf without their
              knowledge (guardianship links go through explicit invite/accept, not this).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Acceptable use</h2>
            <p className="mt-2 text-muted-foreground">Don&apos;t use Schoolify to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Harass, bully, or send abusive messages to other users</li>
              <li>Impersonate another person or misrepresent your affiliation with a school</li>
              <li>
                Attempt to access another user&apos;s data, brute-force a class join code, or
                otherwise bypass access controls
              </li>
              <li>Upload or send unlawful, defamatory, or infringing content</li>
              <li>Interfere with the normal operation of the service (spam, abuse, scraping)</li>
            </ul>
            <p className="mt-2 text-muted-foreground">
              Messages can be reported; reported content is reviewed and may be removed. See our{" "}
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>{" "}
              for how reports are handled.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. School accounts</h2>
            <p className="mt-2 text-muted-foreground">
              Registering a school on Schoolify requires an account email on that school&apos;s
              domain — this proves you control an inbox at that domain, not that you are formally
              authorized to represent the institution. Don&apos;t register a school you&apos;re not
              actually authorized to administer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Your content</h2>
            <p className="mt-2 text-muted-foreground">
              You keep ownership of what you create (assignments, grades, portfolio entries,
              messages, etc.). You&apos;re responsible for it. We store and process it to run the
              service, as described in the{" "}
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Termination</h2>
            <p className="mt-2 text-muted-foreground">
              You can delete your account at any time from Account settings, which removes your
              personal data (see Privacy Policy). We may suspend or terminate accounts that violate
              these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Disclaimer &amp; limitation of liability</h2>
            <p className="mt-2 text-muted-foreground">
              Schoolify is provided &quot;as is,&quot; without warranties of any kind. We&apos;re
              not liable for indirect, incidental, or consequential damages arising from your use
              of the service, to the maximum extent permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">9. Changes</h2>
            <p className="mt-2 text-muted-foreground">
              We may update these terms as the product changes. Material changes will be reflected
              by updating the date at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">10. Contact</h2>
            <p className="mt-2 text-muted-foreground">
              Questions about these terms:{" "}
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
