import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// Vercel Blob's client-upload flow: the browser never sees a storage
// credential, only a short-lived signed token this route issues. The type
// and size caps below are enforced by Blob itself when the client tries to
// use that token, not just checked here -- a tampered client request can't
// skip them. Files land on Blob's CDN as static assets, never executable.
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const user = await currentUser();
        if (!user) throw new Error("Not signed in");

        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_ATTACHMENT_BYTES,
          addRandomSuffix: true,
        };
      },
      // No onUploadCompleted -- there's nothing to do server-side once the
      // upload lands (the uploading client attaches the resulting URL to a
      // real message via sendMessage, which is itself auth- and
      // conversation-membership-checked). Omitting it also avoids Blob
      // trying to call back a URL it can't resolve on localhost.
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
