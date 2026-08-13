import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export type Actor = {
  id: string;
  role: Role;
};

/**
 * Every query that reads or writes a student's data (courses, assignments,
 * grades, calendar events) must go through this check. It is the one place
 * that encodes who is allowed to see a given student's records, so it is the
 * only place that needs updating as roles/relations evolve.
 */
export async function canAccessStudentData(
  actor: Actor,
  targetStudentId: string,
): Promise<boolean> {
  if (actor.role === "ADMIN") return true;

  if (actor.role === "STUDENT") {
    return actor.id === targetStudentId;
  }

  if (actor.role === "PARENT") {
    const guardianship = await prisma.guardianship.findUnique({
      where: {
        parentId_studentId: {
          parentId: actor.id,
          studentId: targetStudentId,
        },
      },
    });
    return guardianship?.status === "ACCEPTED";
  }

  // TEACHER: no course-ownership relation exists in the schema yet
  // (Phase 0 only models Student/Parent paths). Deny until that relation
  // is added — never grant access speculatively.
  return false;
}
