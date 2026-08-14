import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";
import { NotificationPreferencesForm } from "@/components/notification-preferences-form";
import { DateOfBirthSetting } from "@/components/date-of-birth-setting";
import { ManageAccountButton, DeleteAccountButton } from "@/components/account-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Settings",
  description: "Profile, notification preferences, appearance, and account.",
};

const ROLE_LABELS: Record<string, string> = {
  STUDENT: "Student",
  PARENT: "Parent / guardian",
  TEACHER: "Teacher",
  ADMIN: "Admin",
};

export default async function SettingsPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant="secondary" className="mt-1.5">
                {ROLE_LABELS[user.role] ?? user.role}
              </Badge>
            </div>
            <ManageAccountButton />

            {user.role === "STUDENT" && (
              <div>
                <p className="text-sm font-medium">Date of birth</p>
                <p className="mb-1.5 text-xs text-muted-foreground">
                  Used only to tailor the experience for younger students — see our approach to
                  student privacy for accounts under 13.
                </p>
                {/* toISOString, not date-fns format -- dateOfBirth is a bare
                    calendar date stored as UTC midnight (see coppa.ts), and
                    format() reads local getters, which silently shifts the
                    day back on any server west of UTC. */}
                <DateOfBirthSetting initial={user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : null} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationPreferencesForm
              initial={{
                notifyOnMessage: user.notifyOnMessage,
                notifyOnGuardianship: user.notifyOnGuardianship,
                notifyOnSchoolInvite: user.notifyOnSchoolInvite,
                notifyOnBroadcast: user.notifyOnBroadcast,
              }}
            />
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </CardContent>
        </Card>

        <Card className="mt-4 border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base">Danger zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and every record tied to it — assignments, grades,
              messages, guardian links, and more. This can&apos;t be undone.
            </p>
            <DeleteAccountButton />
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
