import { ImageResponse } from "next/og";

export const alt = "Zero to App — AI-first starters for Web and Mobile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#111311",
          color: "white",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px 80px",
          width: "100%",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 24 }}>
          <div
            style={{
              alignItems: "center",
              background: "#c7ff4a",
              borderRadius: 22,
              boxShadow: "9px 9px 0 #ff684d",
              color: "#111311",
              display: "flex",
              fontFamily: "monospace",
              fontSize: 48,
              fontWeight: 900,
              height: 104,
              justifyContent: "center",
              letterSpacing: -6,
              width: 104,
            }}
          >
            0→
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 34, fontWeight: 800 }}>
            ZERO → APP
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ color: "#c7ff4a", fontSize: 76, fontWeight: 900, letterSpacing: -4 }}>
            Start closer to launch.
          </div>
          <div style={{ color: "#b8bdb8", fontFamily: "monospace", fontSize: 30 }}>
            AI-FIRST STARTERS · WEB + MOBILE
          </div>
        </div>
      </div>
    ),
    size,
  );
}
