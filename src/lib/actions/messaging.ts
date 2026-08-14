"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";
import { canMessageDirectly } from "@/lib/messaging";
import { enforceRateLimit, messageLimiter, sensitiveActionLimiter } from "@/lib/rate-limit";
import { notifyMany } from "@/lib/notify";

const NOTIFICATION_PREVIEW_LENGTH = 140;

async function courseIdsFor(userId: string): Promise<string[]> {
  const [enrolled, taught] = await Promise.all([
    prisma.enrollment.findMany({ where: { studentId: userId }, select: { courseId: true } }),
    prisma.course.findMany({ where: { teacherId: userId }, select: { id: true } }),
  ]);
  return [...enrolled.map((e) => e.courseId), ...taught.map((c) => c.id)];
}

async function isBlockedEitherDirection(userAId: string, userBId: string): Promise<boolean> {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userAId, blockedId: userBId },
        { blockerId: userBId, blockedId: userAId },
      ],
    },
  });
  return block !== null;
}

async function isGuardianLinked(userAId: string, userBId: string): Promise<boolean> {
  const guardianship = await prisma.guardianship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { parentId: userAId, studentId: userBId },
        { parentId: userBId, studentId: userAId },
      ],
    },
  });
  return guardianship !== null;
}

/** Everyone on a course's roster (teacher + enrolled students) except the given user -- COURSE conversations have no participant rows. */
async function courseRecipientIds(courseId: string, excludeUserId: string): Promise<string[]> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { enrollments: { select: { studentId: true } } },
  });
  if (!course) return [];
  const ids = [course.teacherId, ...course.enrollments.map((e) => e.studentId)];
  return ids.filter((id): id is string => id !== null && id !== excludeUserId);
}

/** Access check for DIRECT/GROUP conversations (participant-based) and COURSE ones (roster-derived). */
async function assertConversationAccess(userId: string, conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { course: true },
  });
  if (!conversation) throw new Error("Conversation not found");

  if (conversation.type === "COURSE") {
    if (!conversation.course) throw new Error("Conversation not found");
    const hasAccess =
      conversation.course.teacherId === userId ||
      (await prisma.enrollment.findFirst({
        where: { courseId: conversation.course.id, studentId: userId },
      })) !== null;
    if (!hasAccess) throw new Error("You don't have access to this class chat");
  } else {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new Error("You're not part of this conversation");
  }

  return conversation;
}

export async function startDirectConversation(otherUserId: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (otherUserId === user.id) throw new Error("Can't message yourself");

  const [myCourseIds, theirCourseIds, blocked, guardianLinked] = await Promise.all([
    courseIdsFor(user.id),
    courseIdsFor(otherUserId),
    isBlockedEitherDirection(user.id, otherUserId),
    isGuardianLinked(user.id, otherUserId),
  ]);

  if (
    !canMessageDirectly({
      userACourseIds: myCourseIds,
      userBCourseIds: theirCourseIds,
      isGuardianLinked: guardianLinked,
      blockedEitherDirection: blocked,
    })
  ) {
    throw new Error(
      blocked ? "You can't message this person" : "You can only message classmates, your teacher, or a linked guardian",
    );
  }

  // Reuse an existing DIRECT conversation between exactly these two people instead of duplicating.
  const existing = await prisma.conversation.findFirst({
    where: {
      type: "DIRECT",
      AND: [
        { participants: { some: { userId: user.id } } },
        { participants: { some: { userId: otherUserId } } },
      ],
    },
  });
  if (existing) return existing;

  const conversation = await prisma.conversation.create({
    data: {
      type: "DIRECT",
      participants: { create: [{ userId: user.id }, { userId: otherUserId }] },
    },
  });

  revalidatePath("/messages");
  return conversation;
}

export async function startGroupConversation(input: { name: string; participantIds: string[] }) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");

  const uniqueParticipantIds = [...new Set(input.participantIds)].filter((id) => id !== user.id);
  if (uniqueParticipantIds.length === 0) throw new Error("Add at least one other person");

  const myCourseIds = await courseIdsFor(user.id);
  for (const participantId of uniqueParticipantIds) {
    const [theirCourseIds, blocked, guardianLinked] = await Promise.all([
      courseIdsFor(participantId),
      isBlockedEitherDirection(user.id, participantId),
      isGuardianLinked(user.id, participantId),
    ]);
    if (
      !canMessageDirectly({
        userACourseIds: myCourseIds,
        userBCourseIds: theirCourseIds,
        isGuardianLinked: guardianLinked,
        blockedEitherDirection: blocked,
      })
    ) {
      throw new Error("Everyone in the group must be a classmate, your student/teacher, or a linked guardian");
    }
  }

  const conversation = await prisma.conversation.create({
    data: {
      type: "GROUP",
      name: input.name.trim() || "Group chat",
      participants: { create: [user.id, ...uniqueParticipantIds].map((userId) => ({ userId })) },
    },
  });

  revalidatePath("/messages");
  return conversation;
}

/** Course chat is created lazily on first visit — most courses (personal, single-student) never need one. */
export async function getOrCreateCourseConversation(courseId: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error("Course not found");
  if (!course.teacherId) throw new Error("Class chat is only available for school-managed classes");

  const hasAccess =
    course.teacherId === user.id ||
    (await prisma.enrollment.findFirst({ where: { courseId, studentId: user.id } })) !== null;
  if (!hasAccess) throw new Error("You don't have access to this class");

  const existing = await prisma.conversation.findUnique({ where: { courseId } });
  if (existing) return existing;

  const conversation = await prisma.conversation.create({ data: { type: "COURSE", courseId } });
  revalidatePath("/messages");
  return conversation;
}

const MAX_MESSAGE_LENGTH = 4000;
// Only a URL Vercel Blob itself issued should ever be attachable to a
// message -- without this check, sendMessage would happily accept any
// external URL as an "attachment" (a spoofed tracking pixel or phishing
// image), completely bypassing the type/size validation the upload route
// enforces.
const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

export async function sendMessage(input: {
  conversationId: string;
  body: string;
  attachmentUrl?: string;
  attachmentType?: string;
}) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  await enforceRateLimit(messageLimiter, user.id);

  const body = input.body.trim();
  if (!body && !input.attachmentUrl) throw new Error("Message can't be empty");
  if (body.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message is too long (max ${MAX_MESSAGE_LENGTH} characters)`);
  }
  if (input.attachmentUrl) {
    let hostname: string;
    try {
      hostname = new URL(input.attachmentUrl).hostname;
    } catch {
      throw new Error("Invalid attachment");
    }
    if (!hostname.endsWith(BLOB_HOST_SUFFIX)) throw new Error("Invalid attachment");
  }

  const conversation = await assertConversationAccess(user.id, input.conversationId);

  const message = await prisma.message.create({
    data: {
      conversationId: input.conversationId,
      senderId: user.id,
      body,
      attachmentUrl: input.attachmentUrl,
      attachmentType: input.attachmentType,
    },
  });

  const recipientIds =
    conversation.type === "COURSE"
      ? await courseRecipientIds(conversation.course!.id, user.id)
      : await prisma.conversationParticipant
          .findMany({ where: { conversationId: input.conversationId }, select: { userId: true } })
          .then((rows) => rows.map((r) => r.userId).filter((id) => id !== user.id));

  const preview =
    input.body.trim().length > NOTIFICATION_PREVIEW_LENGTH
      ? `${input.body.trim().slice(0, NOTIFICATION_PREVIEW_LENGTH)}…`
      : input.body.trim();
  await notifyMany(
    recipientIds,
    "MESSAGE",
    `New message from ${user.name}`,
    `/messages/${input.conversationId}`,
    preview,
  );

  revalidatePath(`/messages/${input.conversationId}`);
  revalidatePath("/messages");
  return message;
}

/** Polling endpoint: messages after `since` (or the most recent 50, if `since` is null), blocked senders already excluded. */
export async function getMessagesSince(conversationId: string, since: string | null) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");

  await assertConversationAccess(user.id, conversationId);

  const blocks = await prisma.block.findMany({ where: { blockerId: user.id }, select: { blockedId: true } });
  const blockedIds = blocks.map((b) => b.blockedId);

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      deletedAt: null,
      senderId: { notIn: blockedIds },
      ...(since ? { createdAt: { gt: new Date(since) } } : {}),
    },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
    ...(since ? {} : { take: 50 }),
  });

  return since ? messages : messages.slice(-50);
}

export async function markConversationRead(conversationId: string) {
  const user = await getCurrentDbUser();
  if (!user) return;

  // COURSE conversations have no participant row (membership is roster-derived) — nothing to mark.
  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: user.id },
    data: { lastReadAt: new Date() },
  });
}

export async function blockUser(userId: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (userId === user.id) throw new Error("Can't block yourself");

  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId: userId } },
    create: { blockerId: user.id, blockedId: userId },
    update: {},
  });

  revalidatePath("/messages");
}

export async function unblockUser(userId: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");

  await prisma.block.deleteMany({ where: { blockerId: user.id, blockedId: userId } });
  revalidatePath("/messages");
}

export async function reportMessage(input: { messageId: string; reason: string }) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  await enforceRateLimit(sensitiveActionLimiter, user.id);
  if (!input.reason.trim()) throw new Error("Say what's wrong with this message");

  const message = await prisma.message.findUnique({ where: { id: input.messageId } });
  if (!message) throw new Error("Message not found");
  await assertConversationAccess(user.id, message.conversationId);

  await prisma.report.create({
    data: { messageId: input.messageId, reporterId: user.id, reason: input.reason.trim() },
  });
}
