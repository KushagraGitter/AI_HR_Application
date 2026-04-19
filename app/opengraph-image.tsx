import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Siftly — Your HR team, on autopilot"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: 80,
        }}
      >
        {/* Glow ring background */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(108,92,231,0.35) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 48,
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "rgba(108,92,231,0.25)",
              border: "2px solid rgba(108,92,231,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#a78bfa",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            S
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "#e2e8f0", fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em" }}>Siftly</span>
            <span style={{ color: "#94a3b8", fontSize: 16 }}>Autonomous hiring platform</span>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            Your HR team,
          </div>
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              background: "linear-gradient(90deg, #6c5ce7, #a78bfa, #2dd4bf)",
              backgroundClip: "text",
              color: "transparent",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            on autopilot.
          </div>
        </div>

        {/* Subhead */}
        <div
          style={{
            marginTop: 40,
            fontSize: 22,
            color: "#cbd5e1",
            textAlign: "center",
            maxWidth: 900,
            zIndex: 1,
            lineHeight: 1.4,
          }}
        >
          Autonomous AI agents that score resumes, send outreach, and schedule interviews. Zero manual clicks.
        </div>

        {/* Bottom pills */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 56,
            zIndex: 1,
          }}
        >
          {["Screening", "Outreach", "Scheduling"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 999,
                border: "1px solid rgba(108,92,231,0.3)",
                background: "rgba(108,92,231,0.1)",
                color: "#a78bfa",
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#34d399",
                }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
