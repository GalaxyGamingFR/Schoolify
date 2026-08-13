import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { PublicFooter } from "@/components/public-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about Schoolify.",
};

const FAQS = [
  {
    q: "Is Schoolify free?",
    a: "Yes — every feature described here is free to use right now. There's no paywall or paid tier anywhere in the app.",
  },
  {
    q: "Who can see my grades and assignments?",
    a: "Only you, by default. If you link a parent/guardian, they see a high-level summary — GPA, per-course grades, upcoming deadlines, and your streak — not your individual assignments. See the Privacy Policy for the full breakdown of who sees what.",
  },
  {
    q: "I'm under 13 — why can't I use the app right away?",
    a: "Students under 13 need a parent or guardian's account linked before getting full access. From the \"Parent or guardian needed\" screen, you can invite a parent who already has a Schoolify account, or ask them to sign up first.",
  },
  {
    q: "Do I need my school to be on Schoolify to use it?",
    a: "No — you can track your own courses, assignments, and grades entirely on your own, with no school involved. Joining a school-managed class (via a join code from a teacher) is optional and adds a class chat and roster on top of what you'd have anyway.",
  },
  {
    q: "How do I delete my account and data?",
    a: "From your account menu → Manage account → Security → Delete account. This permanently removes your personal data — assignments, grades, messages, guardian links, and everything else tied to your account.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function FaqPage() {
  return (
    <div className="flex flex-1 flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Logo />
            Schoolify
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Frequently asked questions</h1>

        <div className="mt-6 space-y-3">
          {FAQS.map((item) => (
            <Card key={item.q}>
              <CardHeader>
                <CardTitle className="text-base">{item.q}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{item.a}</CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Still have a question?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>
              Email{" "}
              <a href="mailto:therealtariqkhalif@gmail.com" className="underline">
                therealtariqkhalif@gmail.com
              </a>
              .
            </p>
            <p>We aim to respond to every support email within 1–2 business days.</p>
          </CardContent>
        </Card>
      </main>

      <PublicFooter />
    </div>
  );
}
