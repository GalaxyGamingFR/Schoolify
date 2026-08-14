"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Only fires if the root layout itself throws (rare -- error.tsx above
// handles everything else). Has to render its own <html>/<body> since
// there's no layout left to inherit from at that point, so this
// deliberately doesn't pull in the app's normal component library.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "1rem",
          fontFamily: "system-ui, sans-serif",
          background: "#09090b",
          color: "#f4f4f5",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Something went wrong</h1>
        <p style={{ marginTop: "0.5rem", color: "#a1a1aa", fontSize: "0.875rem" }}>
          We&apos;ve been notified and are looking into it.
        </p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: "1.5rem",
            padding: "0.5rem 1.25rem",
            borderRadius: "0.5rem",
            background: "#4f46e5",
            color: "white",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
            border: "none",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
