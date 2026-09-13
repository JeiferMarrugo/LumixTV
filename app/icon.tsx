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
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          borderRadius: 8,
          border: "2px solid rgba(212,160,23,0.45)",
        }}
      >
        <div
          style={{
            color: "#d4a017",
            fontSize: 20,
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
