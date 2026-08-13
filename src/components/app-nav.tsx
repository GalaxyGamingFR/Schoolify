import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  CalendarDays,
  ListChecks,
  Home,
  GraduationCap,
  Trophy,
  LineChart,
  Compass,
  MoreHorizontal,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const primaryLinks = [
  { href: "/dashboard", label: "Today", icon: Home },
  { href: "/courses", label: "Courses", icon: ListChecks },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/grades", label: "Grades", icon: GraduationCap },
];

// Grouped into "More" once the primary set filled the header — see
// roadmap.md Phase 5/7 notes on nav crowding.
const moreLinks = [
  { href: "/progress", label: "Progress", icon: Trophy },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/opportunities", label: "Opportunities", icon: Compass },
];

export function AppNav() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          Schoolify
        </Link>
        <nav className="flex items-center gap-1">
          {primaryLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="sm" aria-label="More">
                  <MoreHorizontal className="size-4" />
                  <span className="hidden sm:inline">More</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              {moreLinks.map(({ href, label, icon: Icon }) => (
                <DropdownMenuItem key={href} render={<Link href={href} />}>
                  <Icon className="size-4" /> {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-2 flex items-center gap-1">
            <ThemeToggle />
            <UserButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
