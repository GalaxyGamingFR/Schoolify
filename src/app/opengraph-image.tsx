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
            alignItems: "flex-end",
            justifyContent: "center",
            gap: "10%",
            background: "#4f46e5",
            borderRadius: 22,
            padding: "18% 18% 14%",
            marginBottom: 32,
          }}
        >
          <div style={{ width: "20%", height: "38%", borderRadius: 999, background: "white" }} />
          <div style={{ width: "20%", height: "64%", borderRadius: 999, background: "white" }} />
          <div style={{ width: "20%", height: "90%", borderRadius: 999, background: "white" }} />
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
