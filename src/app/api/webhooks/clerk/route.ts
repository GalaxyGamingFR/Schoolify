import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Verifies and handles Clerk's user.created/user.updated/user.deleted events
// so our User table stays in sync without the client ever writing it directly.
// Configure this URL (https://<domain>/api/webhooks/clerk) as a webhook
// endpoint in the Clerk dashboard, and copy its signing secret into
// CLERK_WEBHOOK_SIGNING_SECRET.
export async function POST(req: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(req);
  } catch {
    return new Response("Verification failed", { status: 400 });
  }

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const { id, email_addresses, first_name, last_name } = event.data;
      const email = email_addresses[0]?.email_address;
      if (!email) break;

      const name = [first_name, last_name].filter(Boolean).join(" ") || email;

      // Clerk doesn't collect date of birth by default — it's gathered via a
      // dedicated onboarding step (Phase 6, ahead of COPPA gating) and never
      // synced from here.
      await prisma.user.upsert({
        where: { clerkId: id },
        update: { email, name },
        create: { clerkId: id, email, name },
      });
      break;
    }
    case "user.deleted": {
      if (event.data.id) {
        await prisma.user.deleteMany({ where: { clerkId: event.data.id } });
      }
      break;
    }
  }

  return new Response("ok", { status: 200 });
}
