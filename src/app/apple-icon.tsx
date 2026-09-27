import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Home-screen icon. iOS rounds the corners itself, so this stays square.
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
          background: "#121413",
        }}
      >
        <svg width="116" height="116" viewBox="0 0 64 64">
          <path
            d="M32 13.5 18 19v11.3c0 9.4 6 17.2 14 20.2 8-3 14-10.8 14-20.2V19l-14-5.5Z"
            fill="none"
            stroke="#f6f5f1"
            strokeWidth="3.6"
            strokeLinejoin="round"
          />
          <path
            d="m25.5 31.5 4.6 4.6 8.4-9"
            fill="none"
            stroke="#f6f5f1"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
