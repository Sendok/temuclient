import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<div style={{ alignItems: "center", background: "#D83267", display: "flex", height: "100%", justifyContent: "center", position: "relative", width: "100%" }}><div style={{ background: "#FFF1F5", borderRadius: 8, height: 12, left: 45, position: "absolute", top: 48, width: 90 }} /><div style={{ background: "#FFF1F5", borderRadius: 8, height: 84, left: 84, position: "absolute", top: 48, width: 12 }} /><div style={{ background: "#FFF1F5", borderRadius: 8, height: 12, left: 45, position: "absolute", top: 84, width: 45 }} />{[[45,48],[135,48],[45,90],[90,132]].map(([left,top])=><div key={`${left}-${top}`} style={{ background: "#FFD5E3", borderRadius: 99, height: 22, left: left-11, position: "absolute", top: top-11, width: 22 }} />)}<div style={{ background: "white", borderRadius: 99, height: 34, left: 73, position: "absolute", top: 31, width: 34 }} /></div>, size);
}
