import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link href="/faq" className="hover:text-foreground">
          FAQ
        </Link>
        <Link href="/terms" className="hover:text-foreground">
          Terms of Service
        </Link>
        <Link href="/privacy" className="hover:text-foreground">
          Privacy Policy
        </Link>
      </nav>
    </footer>
  );
}
