import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Decode slug for display
  const displayTitle = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0A0A0A",
          color: "#E8E8E8",
          fontFamily: "Noto Serif",
          padding: "64px",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "Space Grotesk",
              fontSize: "16px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#93d5b0",
            }}
          >
            Liceu Underground
          </div>
          <div
            style={{
              width: "48px",
              height: "1px",
              backgroundColor: "#404943",
            }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: "bold",
            lineHeight: "1.2",
            letterSpacing: "-0.02em",
            maxWidth: "90%",
            marginBottom: "32px",
          }}
        >
          {displayTitle}
        </div>

        {/* Divider */}
        <div
          style={{
            width: "64px",
            height: "4px",
            backgroundColor: "#93d5b0",
            marginBottom: "24px",
          }}
        />

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "Space Grotesk",
            fontSize: "14px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#89938C",
          }}
        >
          <span>Ensaios sobre retórica e comunicação</span>
          <span>oliceu.com</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
