import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 200,
            fontWeight: 900,
            fontFamily: "sans-serif",
            letterSpacing: "-0.04em",
          }}
        >
          AI
        </div>
      </div>
    ),
    { ...size }
  );
}
