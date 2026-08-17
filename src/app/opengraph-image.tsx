import { ImageResponse } from "next/og";

export const alt = "TemuClient — Verified B2B Opportunity Network";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#111827", color: "white", padding: "72px", fontFamily: "sans-serif" }}><div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: 30, fontWeight: 700 }}><span style={{ display: "flex", width: 54, height: 54, alignItems: "center", justifyContent: "center", borderRadius: 10, background: "#3730A3" }}>✓</span>TemuClient</div><div style={{ display: "flex", flexDirection: "column" }}><div style={{ color: "#A5B4FC", fontSize: 22, letterSpacing: 3, textTransform: "uppercase" }}>Verified B2B Opportunity Network</div><div style={{ marginTop: 26, maxWidth: 980, fontSize: 62, fontWeight: 700, lineHeight: 1.08 }}>Need → Qualification → Match → Introduction → Meeting → Deal</div></div><div style={{ color: "#D0D5DD", fontSize: 22 }}>B2B Indonesia</div></div>, size);
}
