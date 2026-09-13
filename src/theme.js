// OceanEmbed shared theme — Phase 1 of the UI overhaul.
//
// Replaces the four copy-pasted `pal` objects (OceanChatBot,
// ParameterDashboard, SpatialDistribution, allHeatMapsDashboard) with one
// source. Values are byte-identical to the originals; keys are the union of
// all four so migration is behavior-preserving. Phase 2 will gradually
// replace these inline palettes with Tailwind dark: variants + tokens.css
// vars, then this module shrinks to semantic helpers only.

const dashboardBase = {
  pageBg: "#eef6fd",
  mapBg: "#dbeafe",
  mapAreaBg: "#f8fafc",
  miniBg: "#ffffff",
  maskColor: "#dbeafe",
  loadingBg: "rgba(240,249,255,0.92)",
  loadingText: "#0284c7",
  loadingSub: "rgba(2,132,199,0.7)",
  labelBlue: "#0369a1",
  textMain: "#0f172a",
  textAccent: "#0284c7",
  muted: "#64748b",
  rowText: "#475569",
  cardBg: "linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(37, 99, 235, 0.05))",
  cardBorder: "1px solid #bae6fd",
  chipOn: "#0284c7",
  chipOff: "#ffffff",
  chipOffText: "#0369a1",
  selCardBg: "linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(20, 184, 166, 0.08))",
  selCardBorder: "1px solid rgba(34, 197, 94, 0.3)",
  tableBorder: "#e2e8f0",
  theadBg: "#f8fafc",
  theadText: "#475569",
  rowA: "#ffffff",
  rowB: "#f1f5f9",
  dotsBg: "#f8fafc",
  avgBg: "#f8fafc",
  avgBorder: "1px solid #e2e8f0",
  pagerBg: "#f8fafc",
};

const dashboardDark = {
  pageBg: "#0a0618",
  mapBg: "#0a0618",
  mapAreaBg: "#0a0618",
  miniBg: "#150b31",
  maskColor: "#0a0618",
  loadingBg: "rgba(10,6,24,0.88)",
  loadingText: "#f0abfc",
  loadingSub: "rgba(240,171,252,0.75)",
  labelBlue: "#67e8f9",
  textMain: "#f5f3ff",
  textAccent: "#f0abfc",
  muted: "#c4b5fd",
  rowText: "#e9d5ff",
  cardBg: "linear-gradient(135deg, rgba(76,29,149,0.45), rgba(112,26,117,0.28))",
  cardBorder: "1px solid rgba(217, 70, 239, 0.4)",
  chipOn: "#a855f7",
  chipOff: "rgba(30,16,64,0.9)",
  chipOffText: "#d8b4fe",
  selCardBg: "linear-gradient(135deg, rgba(76,29,149,0.35), rgba(34,211,238,0.12))",
  selCardBorder: "1px solid rgba(217, 70, 239, 0.4)",
  tableBorder: "#3b2a63",
  theadBg: "#170d33",
  theadText: "#c4b5fd",
  rowA: "#150b31",
  rowB: "#1c1140",
  dotsBg: "#150b31",
  avgBg: "rgba(30,16,64,0.9)",
  avgBorder: "1px solid rgba(168, 85, 247, 0.4)",
  pagerBg: "#150b31",
};

const chatBase = {
  fabBg: "linear-gradient(135deg, #0284c7, #2563eb)",
  fabShadow: "0 8px 24px rgba(2, 132, 199, 0.45)",
  panelBg: "rgba(255, 255, 255, 0.97)",
  panelBorder: "1px solid rgba(186, 230, 253, 0.9)",
  headerBg: "linear-gradient(135deg, #0284c7, #2563eb)",
  titleColor: "#ffffff",
  subColor: "rgba(255,255,255,0.85)",
  userBg: "linear-gradient(135deg, #0284c7, #2563eb)",
  botBg: "#f0f9ff",
  botBorder: "1px solid #bae6fd",
  botColor: "#0f172a",
  inputBg: "#ffffff",
  inputBorder: "1px solid #bae6fd",
  inputColor: "#0f172a",
  chipBg: "#e0f2fe",
  chipBorder: "1px solid #bae6fd",
  chipColor: "#0369a1",
};

const chatDark = {
  fabBg: "linear-gradient(135deg, #7c3aed, #d946ef)",
  fabShadow: "0 0 24px rgba(217, 70, 239, 0.6)",
  panelBg: "rgba(16, 10, 36, 0.97)",
  panelBorder: "1px solid rgba(168, 85, 247, 0.5)",
  headerBg: "linear-gradient(135deg, rgba(76,29,149,0.6), rgba(112,26,117,0.45))",
  titleColor: "#f0abfc",
  subColor: "#c4b5fd",
  userBg: "linear-gradient(135deg, #7c3aed, #d946ef)",
  botBg: "rgba(30, 16, 64, 0.9)",
  botBorder: "1px solid rgba(168, 85, 247, 0.35)",
  botColor: "#f5f3ff",
  inputBg: "rgba(10, 6, 24, 0.9)",
  inputBorder: "1px solid rgba(168, 85, 247, 0.45)",
  inputColor: "#f5f3ff",
  chipBg: "rgba(124, 58, 237, 0.2)",
  chipBorder: "1px solid rgba(168, 85, 247, 0.5)",
  chipColor: "#e9d5ff",
};

export function getPalette(isDark) {
  return isDark
    ? { ...dashboardDark, ...chatDark }
    : { ...dashboardBase, ...chatBase };
}

// Named z-index scale (mirrors tokens.css --z-*). Use these instead of
// ad-hoc numbers so new overlays slot into the stacking order safely.
export const zIndex = {
  mapPane: 400,
  mapControl: 1000,
  panel: 2000,
  dropdown: 3000,
  toast: 4000,
  modal: 5000,
  boot: 6000,
};
