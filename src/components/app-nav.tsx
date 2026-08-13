import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { CalendarDays, ListChecks, Home, GraduationCap } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Today", icon: Home },
  { href: "/courses", label: "Courses", icon: ListChecks },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/grades", label: "Grades", icon: GraduationCap },
];

export function AppNav() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          Schoolify
        </Link>
        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          <div className="ml-2">
            <UserButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
