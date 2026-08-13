import { headers } from "next/headers";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Verifies and handles Clerk's user.created/user.updated/user.deleted events
// so our User table stays in sync without the client ever writing it directly.
// Configure this URL (https://<domain>/api/webhooks/clerk) in the Clerk
// dashboard once deployed, and copy the signing secret into
// CLERK_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("CLERK_WEBHOOK_SECRET is not configured", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();

  let event: WebhookEvent;
  try {
    event = new Webhook(webhookSecret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
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
