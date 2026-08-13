import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
        <div
          style={{
            display: "flex",
            width: 96,
            height: 96,
            alignItems: "center",
            justifyContent: "center",
            background: "#4f46e5",
            borderRadius: 22,
            color: "white",
            fontSize: 56,
            fontWeight: 700,
            marginBottom: 32,
          }}
        >
          S
        </div>
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
