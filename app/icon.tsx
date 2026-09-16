import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#c7ff4a",
          color: "#111311",
          display: "flex",
          fontFamily: "monospace",
          fontSize: 25,
          fontWeight: 900,
          height: "100%",
          justifyContent: "center",
          letterSpacing: -3,
          width: "100%",
        }}
      >
        0→
      </div>
    ),
    size,
  );
}
