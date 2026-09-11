import React, { useEffect, useMemo, useState } from "react";
import TemperatureProfile from "./TemperatureProfile";
import { getLocationMetrics } from "../data/dummyOceanData";
import { useLanguage } from "../context/LanguageContext";

const formatDir = (val, isLat, t) => {
  const snapped = Math.round(val * 4) / 4;
  const absVal = Math.abs(snapped).toFixed(2);
  if (snapped === 0) return `${absVal}°`;
  if (isLat) return snapped > 0 ? `${absVal}°${t("dirN") || "N"}` : `${absVal}°${t("dirS") || "S"}`;
  return snapped > 0 ? `${absVal}°${t("dirE") || "E"}` : `${absVal}°${t("dirW") || "W"}`;
};

const getGridCorners = (lat, lng, resolution, t) => {
  const res = parseFloat(resolution) || 0.25;
  const half = res / 2;
  return {
    ne: { lat: formatDir(lat + half, true, t), lng: formatDir(lng + half, false, t) },
    sw: { lat: formatDir(lat - half, true, t), lng: formatDir(lng - half, false, t) }
  };
};

export default function DataSidePanel({
  position,
  depth,
  setDepth,           
  seaName,
  activeResolution,
  onClose,
  isMobile = false,
  onExpand,           
}) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileDepthOpen, setIsMobileDepthOpen] = useState(false);
  const [isPanelLoading, setIsPanelLoading] = useState(true);

  // Simulated scan/fetch delay — shows cyberpunk skeleton before real data
  useEffect(() => {
    setIsPanelLoading(true);
    const timer = setTimeout(() => setIsPanelLoading(false), 1100);
    return () => clearTimeout(timer);
  }, [position?.lat, position?.lng]);

  const { snappedLat, snappedLng, metrics } = useMemo(() => {
    if (!position) {
      return { snappedLat: 0, snappedLng: 0, metrics: null };
    }
    const sLat = Math.round(position.lat / 0.25) * 0.25;
    const sLng = Math.round(position.lng / 0.25) * 0.25;
    const data = getLocationMetrics(sLat, sLng);
    return { snappedLat: sLat, snappedLng: sLng, metrics: data };
  }, [position?.lat, position?.lng]);

  const corners = useMemo(() => {
    return getGridCorners(snappedLat, snappedLng, activeResolution, t);
  }, [snappedLat, snappedLng, activeResolution, t]);

  if (!position || !metrics) {
    return null;
  }

  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    if (onExpand) onExpand(newExpandedState);
  };

  const getTranslatedSeaName = (name) => {
    if (!name || name === "Loading sea name...") return t("loadingSeaName");
    const lower = name.toLowerCase();
    if (lower.includes("bengal")) return t("bayOfBengal");
    if (lower.includes("arabian")) return t("arabianSea");
    if (lower.includes("indian")) return t("indianOcean");
    return name;
  };

  const displaySeaName = getTranslatedSeaName(seaName);
  const isLoading = !seaName || seaName === "Loading sea name...";

  const depthOptions = [];
  for (let value = 0; value <= 1000; value += 50) {
    depthOptions.push(value);
  }

  return (
    <div className={`side-data-panel ${isExpanded ? "expanded" : ""}`}>
      
      <style>{`
        @keyframes slideInUpFade {
          0% { opacity: 0; transform: translateY(12px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .grid-corner-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        
        .grid-corner-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 16px rgba(14, 165, 233, 0.12);
          border-color: #7dd3fc;
        }

        .gcc-inner-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
          padding: 5px 8px;
          border-radius: 6px;
          transition: background 0.3s ease;
        }

        .grid-corner-card:hover .gcc-inner-row {
          background: #f0f9ff;
        }

        .gcc-dot {
          height: 6px; width: 6px; border-radius: 50%;
        }
        .gcc-dot.ne { background: #38bdf8; box-shadow: 0 0 6px #38bdf8; }
        .gcc-dot.sw { background: #10b981; box-shadow: 0 0 6px #10b981; }
      `}</style>

      <div className="panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>📊</span>
          <h4>{t("gridLocationData")}</h4>
        </div>

        <div className="panel-actions">
          {!isMobile && (
            <button
              onClick={toggleExpand}
              className="action-btn expand-btn"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? "🗗" : "⛶"}
            </button>
          )}
          <button onClick={onClose} className="action-btn close-btn" title="Close">
            ×
          </button>
        </div>
      </div>

      <div className="panel-content">
        {isPanelLoading ? (
          <div className="sidepanel-loader">
            <div className="cyber-loader-text">◈ Scanning grid sector ◈</div>
            <div className="cyber-loader-bar" />
            <div className="skeleton-block" style={{ height: "64px", animationDelay: "0s" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="skeleton-block" style={{ height: "110px", animationDelay: "0.1s" }} />
              <div className="skeleton-block" style={{ height: "110px", animationDelay: "0.2s" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="skeleton-block" style={{ height: "74px", animationDelay: "0.3s" }} />
              <div className="skeleton-block" style={{ height: "74px", animationDelay: "0.4s" }} />
              <div className="skeleton-block" style={{ height: "74px", animationDelay: "0.5s" }} />
              <div className="skeleton-block" style={{ height: "74px", animationDelay: "0.6s" }} />
            </div>
            <div className="skeleton-block" style={{ height: "180px", animationDelay: "0.7s" }} />
            <div className="cyber-loader-text" style={{ fontSize: "10px", opacity: 0.8 }}>
              UPLINK {snappedLat.toFixed(2)}° / {snappedLng.toFixed(2)}° …
            </div>
          </div>
        ) : (
        <>
        <div
          className="water-body-card"
          style={{
            marginBottom: "16px",
            padding: "12px 14px",
            background: "linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(37, 99, 235, 0.06))",
            borderRadius: "12px",
            border: "1px solid rgba(14, 165, 233, 0.25)",
            boxShadow: "0 4px 15px rgba(14, 165, 233, 0.08)",
          }}
        >
          <span
            className="water-body-label"
            style={{
              fontSize: "10px",
              color: "#0369a1",
              display: "block",
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: "3px",
            }}
          >
            {t("waterBody")}
          </span>

          <strong
            className="water-body-value"
            style={{
              color: isLoading ? "#64748b" : "#0f172a",
              fontSize: "14px",
              letterSpacing: "0.3px",
            }}
          >
            {displaySeaName}
          </strong>
        </div>

        <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          
          <div className="grid-boundaries-card" style={{ 
            background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240, 249, 255, 0.6))", 
            padding: "12px", 
            borderRadius: "14px", 
            border: "1px solid rgba(186, 230, 253, 0.8)", 
            animation: "slideInUpFade 0.4s ease-out",
            boxShadow: "0 4px 12px rgba(14, 165, 233, 0.06), inset 0 2px 4px rgba(255, 255, 255, 0.8)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="grid-corners-icon" style={{ background: "#e0f2fe", color: "#0284c7", padding: "4px", borderRadius: "8px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>🧭</span>
                <span className="grid-corners-title" style={{ fontSize: "10px", color: "#0369a1", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.6px" }}>{t("gridCorners") || "Grid Boundaries"}</span>
              </div>
              <div className="res-badge" style={{ fontSize: "9px", color: "#64748b", fontWeight: "800", background: "#f1f5f9", padding: "3px 6px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>±{activeResolution}°</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              
              <div className="grid-corner-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: "8px", padding: "0 2px" }}>
                  <span className="corner-title-ne" style={{ fontSize: "10px", fontWeight: "800", color: "#0284c7", letterSpacing: "0.5px" }}>{t("dirNE") || "NE"} {t("corner") || "CORNER"}</span>
                  <span className="gcc-dot ne"></span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
                  <div className="gcc-inner-row">
                    <span className="gcc-label" style={{ fontSize: "9px", color: "#64748b", fontWeight: "800", letterSpacing: "0.5px" }}>LAT</span>
                    <span className="gcc-value" style={{ fontSize: "11px", color: "#0f172a", fontFamily: "'JetBrains Mono', monospace", fontWeight: "700" }}>{corners.ne.lat}</span>
                  </div>
                  <div className="gcc-inner-row">
                    <span className="gcc-label" style={{ fontSize: "9px", color: "#64748b", fontWeight: "800", letterSpacing: "0.5px" }}>LNG</span>
                    <span className="gcc-value" style={{ fontSize: "11px", color: "#0f172a", fontFamily: "'JetBrains Mono', monospace", fontWeight: "700" }}>{corners.ne.lng}</span>
                  </div>
                </div>
              </div>

              <div className="grid-corner-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: "8px", padding: "0 2px" }}>
                  <span className="corner-title-sw" style={{ fontSize: "10px", fontWeight: "800", color: "#059669", letterSpacing: "0.5px" }}>{t("dirSW") || "SW"} {t("corner") || "CORNER"}</span>
                  <span className="gcc-dot sw"></span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
                  <div className="gcc-inner-row">
                    <span className="gcc-label" style={{ fontSize: "9px", color: "#64748b", fontWeight: "800", letterSpacing: "0.5px" }}>LAT</span>
                    <span className="gcc-value" style={{ fontSize: "11px", color: "#0f172a", fontFamily: "'JetBrains Mono', monospace", fontWeight: "700" }}>{corners.sw.lat}</span>
                  </div>
                  <div className="gcc-inner-row">
                    <span className="gcc-label" style={{ fontSize: "9px", color: "#64748b", fontWeight: "800", letterSpacing: "0.5px" }}>LNG</span>
                    <span className="gcc-value" style={{ fontSize: "11px", color: "#0f172a", fontFamily: "'JetBrains Mono', monospace", fontWeight: "700" }}>{corners.sw.lng}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {depth && (
            <div className="depth-card" style={{ background: "rgba(14, 165, 233, 0.1)", padding: "10px", borderRadius: "12px", textAlign: "center", border: "1px solid rgba(14, 165, 233, 0.3)" }}>
              <span className="depth-card-label" style={{ fontSize: "10px", color: "#0369a1", display: "block", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("depth")}</span>
              <span className="depth-card-value" style={{ fontSize: "14px", fontWeight: "800", color: "#0284c7" }}>{depth} m</span>
            </div>
          )}
        </div>

        {isMobile && setDepth && (
          <div className="mobile-depth-selector" style={{ marginBottom: "16px", position: "relative" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#0369a1", marginBottom: "6px" }}>
              {t("depth") || "Depth (m)"}
            </label>
            <button
              type="button"
              className="ocean-control"
              onClick={() => setIsMobileDepthOpen(!isMobileDepthOpen)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #bae6fd",
                background: "#ffffff", fontSize: "14px", fontWeight: "600", color: "#0f172a", display: "flex",
                alignItems: "center", justifyContent: "space-between", textAlign: "left", cursor: "pointer",
                boxShadow: "0 2px 8px rgba(14, 165, 233, 0.1)",
              }}
            >
              <span>{depth !== "" && depth !== undefined ? `${depth} m` : (t("selectDepth") || "Select depth")}</span>
              <span>▾</span>
            </button>

            {isMobileDepthOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setIsMobileDepthOpen(false)} />
                <div className="mobile-inline-dropdown-list">
                  <div className={`mobile-inline-dropdown-item ${depth === "" ? "selected" : ""}`} onClick={() => { setDepth(""); setIsMobileDepthOpen(false); }}>
                    {t("selectDepth") || "Select depth"}
                  </div>
                  {depthOptions.map((d) => (
                    <div key={d} className={`mobile-inline-dropdown-item ${depth !== "" && Number(depth) === d ? "selected" : ""}`} onClick={() => { setDepth(d); setIsMobileDepthOpen(false); }}>
                      {d} m
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <hr className="panel-divider" style={{ border: "none", borderTop: "1px solid rgba(226, 232, 240, 0.8)", margin: "16px 0" }} />
        <h5 className="panel-section-title" style={{ margin: "0 0 12px", fontSize: "12px", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.6px" }}>{t("surfaceParameters")}</h5>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
          {/* Surface Parameters */}
          <div className="metric-card m-sst" style={{ background: "linear-gradient(135deg, rgba(254, 243, 199, 0.6), rgba(254, 226, 226, 0.4))", padding: "12px", borderRadius: "12px", border: "1px solid rgba(252, 211, 77, 0.4)", transition: "transform 0.2s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}><span className="metric-label" style={{ fontSize: "10px", color: "#92400e", fontWeight: "800", textTransform: "uppercase" }}>{t("sstLabel")}</span><span style={{ fontSize: "14px" }}>🌡️</span></div>
            <strong className="metric-value" style={{ color: "#78350f", fontSize: "16px", fontWeight: "850" }}>{metrics.surfaceData.sst} °C</strong>
          </div>
          <div className="metric-card m-sss" style={{ background: "linear-gradient(135deg, rgba(224, 242, 254, 0.7), rgba(186, 230, 253, 0.4))", padding: "12px", borderRadius: "12px", border: "1px solid rgba(125, 211, 252, 0.4)", transition: "transform 0.2s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}><span className="metric-label" style={{ fontSize: "10px", color: "#0369a1", fontWeight: "800", textTransform: "uppercase" }}>{t("sssLabel")}</span><span style={{ fontSize: "14px" }}>💧</span></div>
            <strong className="metric-value" style={{ color: "#03698e", fontSize: "16px", fontWeight: "850" }}>{metrics.surfaceData.sss} PSU</strong>
          </div>
          <div className="metric-card m-ssh" style={{ background: "linear-gradient(135deg, rgba(236, 253, 245, 0.7), rgba(209, 250, 229, 0.4))", padding: "12px", borderRadius: "12px", border: "1px solid rgba(110, 231, 183, 0.4)", transition: "transform 0.2s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}><span className="metric-label" style={{ fontSize: "10px", color: "#047857", fontWeight: "800", textTransform: "uppercase" }}>{t("sshLabel")}</span><span style={{ fontSize: "14px" }}>🌊</span></div>
            <strong className="metric-value" style={{ color: "#065f46", fontSize: "16px", fontWeight: "850" }}>{metrics.surfaceData.ssh} m</strong>
          </div>
          <div className="metric-card m-uo" style={{ background: "linear-gradient(135deg, rgba(243, 232, 255, 0.7), rgba(233, 213, 255, 0.4))", padding: "12px", borderRadius: "12px", border: "1px solid rgba(216, 180, 254, 0.4)", transition: "transform 0.2s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}><span className="metric-label" style={{ fontSize: "10px", color: "#6b21a8", fontWeight: "800", textTransform: "uppercase" }}>{t("uoLabel")}</span><span style={{ fontSize: "14px" }}>🧭</span></div>
            <strong className="metric-value" style={{ color: "#581c87", fontSize: "16px", fontWeight: "850" }}>{metrics.surfaceData.uo} m/s</strong>
          </div>
          <div className="metric-card m-vo" style={{ background: "linear-gradient(135deg, rgba(253, 230, 138, 0.2), rgba(254, 215, 170, 0.3))", padding: "12px", borderRadius: "12px", border: "1px solid rgba(252, 211, 77, 0.4)", gridColumn: "span 2", transition: "transform 0.2s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}><span className="metric-label" style={{ fontSize: "10px", color: "#b45309", fontWeight: "800", textTransform: "uppercase" }}>{t("voLabel")}</span><span style={{ fontSize: "14px" }}>↗️</span></div>
            <strong className="metric-value" style={{ color: "#92400e", fontSize: "16px", fontWeight: "850" }}>{metrics.surfaceData.vo} m/s</strong>
          </div>
        </div>

        <hr className="panel-divider" style={{ border: "none", borderTop: "1px solid rgba(226, 232, 240, 0.8)", margin: "16px 0" }} />
        <h5 className="panel-section-title" style={{ margin: "0 0 12px", fontSize: "12px", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.6px" }}>{t("verticalProfile")}</h5>
        <div className="profile-chart-box" style={{ height: isExpanded ? "420px" : "230px", transition: "height 0.35s cubic-bezier(0.16, 1, 0.3, 1)", background: "rgba(255, 255, 255, 0.6)", borderRadius: "14px", padding: "8px", border: "1px solid #e2e8f0", boxShadow: "inset 0 2px 6px rgba(0, 0, 0, 0.02)", animation: "slideInUpFade 0.5s ease-out" }}>
          <TemperatureProfile selectedDepth={depth} profileData={metrics.profileData} isExpanded={isExpanded} />
        </div>
        </>
        )}
      </div>
    </div>
  );
}