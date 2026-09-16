import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#c7ff4a",
          color: "#111311",
          display: "flex",
          fontFamily: "monospace",
          fontSize: 72,
          fontWeight: 900,
          height: "100%",
          justifyContent: "center",
          letterSpacing: -8,
          width: "100%",
        }}
      >
        0→
      </div>
    ),
    size,
  );
}
