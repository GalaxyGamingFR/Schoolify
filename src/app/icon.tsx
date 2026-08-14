import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: "10%",
          background: "#4f46e5",
          borderRadius: 7,
          padding: "18% 18% 14%",
        }}
      >
        <div style={{ width: "20%", height: "38%", borderRadius: 999, background: "white" }} />
        <div style={{ width: "20%", height: "64%", borderRadius: 999, background: "white" }} />
        <div style={{ width: "20%", height: "90%", borderRadius: 999, background: "white" }} />
      </div>
    ),
    { ...size },
  );
}
