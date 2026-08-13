import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { NewConversationForm } from "@/components/new-conversation-form";

export const metadata: Metadata = {
  title: "New Message",
  description: "Start a conversation with a classmate, teacher, or guardian.",
};

export default async function NewConversationPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const [enrolledCourses, taughtCourses, guardianships] = await Promise.all([
    prisma.course.findMany({
      where: { enrollments: { some: { studentId: user.id } } },
      include: {
        teacher: { select: { id: true, name: true } },
        enrollments: { include: { student: { select: { id: true, name: true } } } },
      },
    }),
    prisma.course.findMany({
      where: { teacherId: user.id },
      include: { enrollments: { include: { student: { select: { id: true, name: true } } } } },
    }),
    // Guardian links are the most-trusted relationship on the platform (the
    // student explicitly accepted it, or invited it themselves — see Phase
    // 6) — they belong in the contact list same as classmates, not left out.
    prisma.guardianship.findMany({
      where: { status: "ACCEPTED", OR: [{ parentId: user.id }, { studentId: user.id }] },
      include: {
        parent: { select: { id: true, name: true } },
        student: { select: { id: true, name: true } },
      },
    }),
  ]);

  const contacts = new Map<string, { name: string; relation: string }>();
  for (const c of enrolledCourses) {
    if (c.teacher) contacts.set(c.teacher.id, { name: c.teacher.name, relation: "Teacher" });
    for (const e of c.enrollments) {
      if (e.student.id !== user.id) {
        contacts.set(e.student.id, { name: e.student.name, relation: "Classmate" });
      }
    }
  }
  for (const c of taughtCourses) {
    for (const e of c.enrollments) {
      contacts.set(e.student.id, { name: e.student.name, relation: "Your student" });
    }
  }
  for (const g of guardianships) {
    const other = g.parentId === user.id ? g.student : g.parent;
    contacts.set(other.id, { name: other.name, relation: "Guardian" });
  }

  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: user.id }, { blockedId: user.id }] },
  });
  for (const b of blocks) {
    contacts.delete(b.blockerId === user.id ? b.blockedId : b.blockerId);
  }

  const contactList = Array.from(contacts, ([id, c]) => ({ id, ...c })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">New message</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick one person for a direct message, or several for a group chat.
        </p>

        <div className="mt-6">
          {contactList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You don&apos;t share a class with anyone yet — join or teach a class first.
            </p>
          ) : (
            <NewConversationForm contacts={contactList} />
          )}
        </div>
      </main>
    </div>
  );
}
