"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { regenerateJoinCode } from "@/lib/actions/school";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClassChatButton } from "@/components/class-chat-button";
import { RefreshCw } from "lucide-react";

type SchoolCourse = {
  id: string;
  name: string;
  joinCode: string | null;
  teacherName: string;
  studentCount: number;
};

export function SchoolCourseCard({ course }: { course: SchoolCourse }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-3">
        <div>
          <p className="font-medium">{course.name}</p>
          <p className="text-sm text-muted-foreground">
            {course.teacherName} · {course.studentCount} student{course.studentCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ClassChatButton courseId={course.id} />
          <code className="rounded bg-muted px-2 py-1 text-sm font-semibold tracking-wider">
            {course.joinCode}
          </code>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Generate a new join code"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await regenerateJoinCode(course.id);
                router.refresh();
              })
            }
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
