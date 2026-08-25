import { ImageResponse } from "next/og";

export const alt = "TemuClient — Verified B2B Opportunity Network";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ background: "#071518", color: "white", display: "flex", flexDirection: "column", fontFamily: "sans-serif", height: "100%", justifyContent: "space-between", overflow: "hidden", padding: "72px", position: "relative", width: "100%" }}>
    <div style={{ border: "2px solid rgba(255,255,255,0.10)", borderRadius: 999, height: 420, position: "absolute", right: -80, top: -170, width: 420 }} />
    <div style={{ border: "2px solid rgba(216,50,103,0.45)", borderRadius: 999, height: 300, position: "absolute", right: 30, top: -60, width: 300 }} />
    <div style={{ alignItems: "center", display: "flex", fontSize: 30, fontWeight: 700, gap: "18px" }}><span style={{ alignItems: "center", background: "#D83267", borderRadius: 12, display: "flex", fontSize: 32, height: 56, justifyContent: "center", width: 56 }}>T</span><span>Temu<span style={{ color: "#FF8BB2" }}>Client</span></span></div>
    <div style={{ display: "flex", flexDirection: "column" }}><div style={{ color: "#FF8BB2", fontSize: 21, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>Verified B2B Opportunity Network</div><div style={{ fontSize: 66, fontWeight: 600, lineHeight: 1.05, marginTop: 26, maxWidth: 980 }}>Kebutuhan bisnis yang nyata. Keahlian yang tepat.</div></div>
    <div style={{ alignItems: "center", color: "rgba(255,255,255,0.55)", display: "flex", fontSize: 21, justifyContent: "space-between" }}><span>Need → Match → Introduction → Deal</span><span>B2B Indonesia</span></div>
  </div>, size);
}
