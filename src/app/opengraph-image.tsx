import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoDataUri = `data:image/png;base64,${readFileSync(join(process.cwd(), "src/app/icon.png")).toString("base64")}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
          fontFamily: "sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoDataUri} width={120} height={120} alt="" style={{ marginBottom: 24 }} />
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700, color: "#f4f4f5" }}>
          Schoolify
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#a1a1aa", marginTop: 16 }}>
          Make school easier, organized, and genuinely engaging.
        </div>
      </div>
    ),
    { ...size },
  );
}
