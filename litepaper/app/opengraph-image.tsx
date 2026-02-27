import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Pump or Rug Arena — The degen prediction arena";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#050709",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Subtle gradient orbs */}
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(35,242,139,0.08) 0%, transparent 70%)",
            top: -100,
            right: -100,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,77,109,0.06) 0%, transparent 70%)",
            bottom: -80,
            left: -80,
          }}
        />

        {/* Title */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "#23F28B",
              letterSpacing: -2,
            }}
          >
            PUMP
          </span>
          <span
            style={{
              fontSize: 48,
              fontWeight: 400,
              color: "#7A8BA8",
            }}
          >
            or
          </span>
          <span
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "#FF4D6D",
              letterSpacing: -2,
            }}
          >
            RUG
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: "#7A8BA8",
            marginTop: 20,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          The Degen Prediction Arena
        </div>

        {/* Divider */}
        <div
          style={{
            width: 120,
            height: 2,
            background: "linear-gradient(90deg, #23F28B, #FF4D6D)",
            marginTop: 28,
            borderRadius: 1,
          }}
        />

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 48,
            marginTop: 32,
          }}
        >
          {[
            { val: "Every 1h", label: "New rounds" },
            { val: "10 min", label: "Predict window" },
            { val: "6h", label: "Settlement" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 700, color: "#F0F2F5" }}>
                {s.val}
              </span>
              <span style={{ fontSize: 13, color: "#7A8BA8", marginTop: 4 }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            fontSize: 14,
            color: "#7A8BA855",
            letterSpacing: 2,
          }}
        >
          LITEPAPER
        </div>
      </div>
    ),
    { ...size },
  );
}
