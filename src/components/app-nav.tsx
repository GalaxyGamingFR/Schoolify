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
  Users,
  FileUser,
  ClipboardList,
  Milestone,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentDbUser } from "@/lib/current-user";

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
  { href: "/portfolio", label: "Portfolio", icon: FileUser },
  { href: "/applications", label: "Applications", icon: ClipboardList },
  { href: "/degree", label: "Degree plan", icon: Milestone },
];

// Fetches its own current-user row rather than taking a prop — every page
// that renders AppNav already resolves the user independently for its own
// data needs, so this keeps every `<AppNav />` call site untouched instead
// of threading role through each page (see roadmap.md Phase 6).
export async function AppNav() {
  const user = await getCurrentDbUser();
  const isParent = user?.role === "PARENT";

  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link
          href={isParent ? "/parent" : "/dashboard"}
          className="text-lg font-semibold tracking-tight"
        >
          Schoolify
        </Link>
        <nav className="flex items-center gap-1">
          {isParent ? (
            <Link
              href="/parent"
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Users className="size-4" />
              <span className="hidden sm:inline">Your students</span>
            </Link>
          ) : (
            <>
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
            </>
          )}

          <div className="ml-2 flex items-center gap-1">
            <ThemeToggle />
            <UserButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
