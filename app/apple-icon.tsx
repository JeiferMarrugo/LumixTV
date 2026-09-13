import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          borderRadius: 36,
          border: "4px solid rgba(212,160,23,0.5)",
        }}
      >
        <div
          style={{
            color: "#d4a017",
            fontSize: 96,
            fontWeight: 800,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "-0.04em",
          }}
        >
          L
        </div>
      </div>
    ),
    { ...size },
  );
}
