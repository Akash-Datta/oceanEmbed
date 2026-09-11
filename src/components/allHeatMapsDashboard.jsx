import React, { useMemo, useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap, Polygon } from "react-leaflet";
import GridOverlay from "./GridOverlay";
import CustomDropdown from "./CustomDropdown";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { getTileUrl } from "../utils/mapTiles";
import { checkIfLand, getWaterBodyName, parseAndTranslateApiSeaName } from "../utils/coordinateUtils";

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
    nw: { lat: formatDir(lat + half, true, t), lng: formatDir(lng - half, false, t) },
    ne: { lat: formatDir(lat + half, true, t), lng: formatDir(lng + half, false, t) },
    sw: { lat: formatDir(lat - half, true, t), lng: formatDir(lng - half, false, t) },
    se: { lat: formatDir(lat - half, true, t), lng: formatDir(lng + half, false, t) }
  };
};

const MaskHole = ({ bounds, color }) => {
  if (!bounds) return null;
  const outerRing = [[-90, -360], [90, -360], [90, 360], [-90, 360]];
  const innerRing = [[bounds[0][0], bounds[0][1]], [bounds[1][0], bounds[0][1]], [bounds[1][0], bounds[1][1]], [bounds[0][0], bounds[1][1]]];
  return <Polygon positions={[outerRing, innerRing]} pathOptions={{ fillColor: color, fillOpacity: 1, stroke: false, interactive: false }} />;
};

function MiniMapController({ gridBounds, paddedBounds }) {
  const map = useMap();
  useEffect(() => {
    if (gridBounds && paddedBounds) {
      map.setMinZoom(0);
      map.setMaxBounds(null);
      const timer = setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(gridBounds, { padding: [12, 12], animate: false });
        map.setMaxBounds(paddedBounds);
        map.setMinZoom(map.getBoundsZoom(paddedBounds));
        map.options.maxBoundsViscosity = 1.0;
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [gridBounds, paddedBounds, map]);
  return null;
}

export default function AllHeatMapsDashboard({ gridData, date, onSelectParameter, onBack, activeResolution, isGeneratingGrid }) {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const tileUrl = getTileUrl(isDark);

  const pal = isDark ? {
    pageBg: "#0a0618",
    mapAreaBg: "#0a0618",
    miniBg: "#150b31",
    maskColor: "#0a0618",
    loadingBg: "rgba(10,6,24,0.88)",
    loadingText: "#f0abfc",
    cardBg: "linear-gradient(135deg, rgba(76,29,149,0.45), rgba(112,26,117,0.28))",
    cardBorder: "1px solid rgba(217, 70, 239, 0.4)",
    labelBlue: "#67e8f9",
    textMain: "#f5f3ff",
    textAccent: "#f0abfc",
    muted: "#c4b5fd",
    chipOn: "#a855f7",
    chipOff: "rgba(30,16,64,0.9)",
    chipOffText: "#d8b4fe",
    avgBg: "rgba(30,16,64,0.9)",
    avgBorder: "1px solid rgba(168, 85, 247, 0.4)",
    tableBorder: "#3b2a63",
    theadBg: "#170d33",
    rowA: "#150b31",
    rowB: "#1c1140",
    dotsBg: "#150b31",
  } : {
    pageBg: "#eef6fd",
    mapAreaBg: "#f8fafc",
    miniBg: "#ffffff",
    maskColor: "#ffffff",
    loadingBg: "rgba(248,250,252,0.88)",
    loadingText: "#0284c7",
    cardBg: "linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(37, 99, 235, 0.05))",
    cardBorder: "1px solid #bae6fd",
    labelBlue: "#0369a1",
    textMain: "#0f172a",
    textAccent: "#0284c7",
    muted: "#64748b",
    chipOn: "#0284c7",
    chipOff: "#ffffff",
    chipOffText: "#0369a1",
    avgBg: "#f8fafc",
    avgBorder: "1px solid #e2e8f0",
    tableBorder: "#e2e8f0",
    theadBg: "#f8fafc",
    rowA: "#ffffff",
    rowB: "#f1f5f9",
    dotsBg: "#f8fafc",
  };
  const [spanDays, setSpanDays] = useState(7);
  const [seaFilter, setSeaFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const rowsPerPage = 50;

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 700);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const parameters = [
    { id: "sst", label: t("sstFull") || "Sea Surface Temperature (SST)" },
    { id: "ssh", label: t("sshFull") || "Sea Surface Height (SSH)" },
    { id: "sss", label: t("sssFull") || "Sea Surface Salinity (SSS)" },
    { id: "sscu", label: t("sscuFull") || "Eastward Current (SSCU)" },
    { id: "sscv", label: t("sscvFull") || "Northward Current (SSCV)" },
  ];

  const { startDateStr, endDateStr } = useMemo(() => {
    if (!date) return { startDateStr: "-", endDateStr: "-" };
    const endObj = new Date(date);
    endObj.setHours(12, 0, 0, 0); 
    const startObj = new Date(endObj);
    startObj.setDate(endObj.getDate() - spanDays);
    return {
      startDateStr: startObj.toISOString().split("T")[0],
      endDateStr: endObj.toISOString().split("T")[0],
    };
  }, [date, spanDays]);

  useEffect(() => { 
    setCurrentPage(1); 
    setSeaFilter(null);
  }, [gridData]);

  const filteredGridData = useMemo(() => {
    // Land grids are never shown in the table
    const oceanOnly = (gridData || []).filter((row) => !checkIfLand(row.lat, row.lng));
    if (!seaFilter) return oceanOnly;
    return oceanOnly.filter((row) => {
      const rowWaterBody = parseAndTranslateApiSeaName(getWaterBodyName(row.lat, row.lng), t);
      return rowWaterBody === seaFilter;
    });
  }, [gridData, seaFilter, t]);

  const { miniGridData, miniResolution } = useMemo(() => {
    if (!gridData || gridData.length === 0) return { miniGridData: [], miniResolution: activeResolution };
    if (gridData.length <= 600) return { miniGridData: gridData, miniResolution: activeResolution };
    const stepFactor = Math.ceil(Math.sqrt(gridData.length / 400));
    const uniqueLats = Array.from(new Set(gridData.map((c) => c.lat))).sort((a, b) => a - b);
    const uniqueLngs = Array.from(new Set(gridData.map((c) => c.lng))).sort((a, b) => a - b);
    const sampledLats = new Set(uniqueLats.filter((_, i) => i % stepFactor === 0));
    const sampledLngs = new Set(uniqueLngs.filter((_, i) => i % stepFactor === 0));
    const sampled = gridData.filter((c) => sampledLats.has(c.lat) && sampledLngs.has(c.lng));
    return { miniGridData: sampled, miniResolution: activeResolution * stepFactor };
  }, [gridData, activeResolution]);

  const { gridBounds, paddedBounds, minLat, maxLat, minLng, maxLng } = useMemo(() => {
    if (!gridData || gridData.length === 0) {
      return { gridBounds: [[-10, 50], [10, 70]], paddedBounds: [[-12, 48], [12, 72]], minLat: 0, maxLat: 24.75, minLng: 50, maxLng: 89.75 };
    }
    let mLat = Infinity, mxLat = -Infinity, mLng = Infinity, mxLng = -Infinity;
    gridData.forEach((cell) => {
      if (cell.lat < mLat) mLat = cell.lat;
      if (cell.lat > mxLat) mxLat = cell.lat;
      if (cell.lng < mLng) mLng = cell.lng;
      if (cell.lng > mxLng) mxLng = cell.lng;
    });
    
    const halfRes = activeResolution / 2;
    const gBounds = [[mLat - halfRes, mLng - halfRes], [mxLat + halfRes, mxLng + halfRes]];
    const pad = activeResolution * 1.5;
    const pBounds = [[mLat - halfRes - pad, mLng - halfRes - pad], [mxLat + halfRes + pad, mxLng + halfRes + pad]];

    return { gridBounds: gBounds, paddedBounds: pBounds, minLat: mLat, maxLat: mxLat, minLng: mLng, maxLng: mxLng };
  }, [gridData, activeResolution]);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  const waterBodiesArray = useMemo(() => {
    if (!gridData || gridData.length === 0) return [];
    const uniqueBodies = new Set();
    gridData.forEach((cell) => {
      if (!checkIfLand(cell.lat, cell.lng)) {
        const rawName = getWaterBodyName(cell.lat, cell.lng);
        const translatedName = parseAndTranslateApiSeaName(rawName, t);
        if (translatedName) uniqueBodies.add(translatedName);
      }
    });
    return Array.from(uniqueBodies).sort();
  }, [gridData, t]);

  const averages = useMemo(() => {
    if (!filteredGridData || filteredGridData.length === 0) return {};
    const avgs = {};
    parameters.forEach((param) => {
      let sum = 0, count = 0;
      filteredGridData.forEach((cell) => {
        if (!checkIfLand(cell.lat, cell.lng)) {
          sum += (cell[param.id] || 0);
          count++;
        }
      });
      avgs[param.id] = count === 0 ? "0.00" : (sum / count).toFixed(2);
    });
    return avgs;
  }, [filteredGridData, parameters]);

  const totalPages = Math.ceil((filteredGridData?.length || 0) / rowsPerPage);
  const paginatedData = filteredGridData?.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage) || [];

  const [loadedMapsCount, setLoadedMapsCount] = useState(0);

  useEffect(() => {
    if (!isGeneratingGrid && gridData) {
      setLoadedMapsCount(0);
      const interval = setInterval(() => {
        setLoadedMapsCount((prev) => {
          if (prev >= parameters.length) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isGeneratingGrid, gridData, parameters.length]);

  return (
    <div className={`parameter-dashboard-page ${isDark ? "dash-dark" : "dash-light"}`} style={isMobile ? {
      display: "flex", flexDirection: "column", gap: "8px", padding: "6px", flex: 1, 
      height: "100%", minHeight: 0, 
      boxSizing: "border-box", overflow: "hidden", background: pal.pageBg,
    } : {
      display: "flex", flexDirection: "row", gap: "16px", padding: "12px", flex: 1, minHeight: 0, height: "100%", boxSizing: "border-box", background: pal.pageBg,
    }}>
      
      {/* MAPS AREA / CAROUSEL ON MOBILE */}
      <div className="dashboard-map-area" style={isMobile ? {
        flex: "0 0 35vh", width: "100%", background: pal.mapAreaBg, padding: "6px", boxSizing: "border-box", position: "relative", borderRadius: "14px", overflow: "hidden", isolation: "isolate", transform: "translateZ(0)"
      } : {
        flex: "0 0 64%", background: pal.mapAreaBg, padding: "12px", boxSizing: "border-box", position: "relative", borderRadius: "14px", overflow: "hidden", isolation: "isolate", transform: "translateZ(0)"
      }}>
        
        {(isGeneratingGrid || loadedMapsCount < parameters.length) && (
          <div className="dash-loading-overlay" style={{ position: "absolute", inset: 0, zIndex: 9999, background: pal.loadingBg, backdropFilter: "blur(4px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: "14px" }}>
            <div className={isDark ? "ocean-spinner" : "spinner"}></div>
            <div style={{ color: pal.loadingText, marginTop: "12px", fontWeight: "bold" }}>{t("optimizingView") || "Optimizing High-Res Grid..."}</div>
          </div>
        )}

        {isMobile ? (
          <div className="mini-map-card" style={{ padding: 0, overflow: "hidden", background: pal.miniBg, display: "flex", flexDirection: "column", height: "100%", position: "relative", borderRadius: "12px", border: pal.cardBorder, boxShadow: isDark ? "0 0 20px rgba(168,85,247,0.25)" : "0 4px 12px rgba(0,0,0,0.06)" }}>
            <div className="mini-map-header" onClick={() => onSelectParameter(parameters[currentMapIndex].id)} style={{ padding: "6px 40px", textAlign: "center", flexShrink: 0, fontWeight: "800", fontSize: "12px", cursor: "pointer", color: isDark ? "#ffffff" : "#0369a1", background: isDark ? "linear-gradient(135deg, #7c3aed, #d946ef)" : "#f8fafc", borderBottom: pal.cardBorder }}>
              {parameters[currentMapIndex].label} ➔
            </div>
            
            {/* Clickable map wrapper to redirect to parameter dashboard */}
            <div 
              onClick={() => onSelectParameter(parameters[currentMapIndex].id)} 
              style={{ flex: 1, position: "relative", background: pal.miniBg, width: "100%", overflow: "hidden", cursor: "pointer" }}
            >
              <MapContainer preferCanvas={true} center={[centerLat, centerLng]} zoomSnap={0} zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} attributionControl={false} style={{ position: "absolute", inset: 0, backgroundColor: pal.miniBg }}>
                <TileLayer noWrap={true} url={tileUrl} />
                <MaskHole bounds={gridBounds} color={pal.maskColor} />
                {!isGeneratingGrid && <GridOverlay gridData={miniGridData} parameter={parameters[currentMapIndex].id} resolution={miniResolution} showTooltip={false} />}
                <MiniMapController gridBounds={gridBounds} paddedBounds={paddedBounds} />
              </MapContainer>

              {/* Styled Left Arrow Button */}
              {currentMapIndex > 0 && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCurrentMapIndex(prev => prev - 1); }}
                  style={{
                    position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)",
                    zIndex: 10000, width: "38px", height: "38px", borderRadius: "50%",
                    background: "rgba(15, 23, 42, 0.88)", backdropFilter: "blur(8px)",
                    color: "#ffffff", border: "1px solid rgba(255,255,255,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "24px", fontWeight: "800", cursor: "pointer",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.35)", transition: "transform 0.15s ease"
                  }}
                  title="Previous Map"
                >
                  ‹
                </button>
              )}

              {/* Styled Right Arrow Button */}
              {currentMapIndex < parameters.length - 1 && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCurrentMapIndex(prev => prev + 1); }}
                  style={{
                    position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
                    zIndex: 10000, width: "38px", height: "38px", borderRadius: "50%",
                    background: "rgba(15, 23, 42, 0.88)", backdropFilter: "blur(8px)",
                    color: "#ffffff", border: "1px solid rgba(255,255,255,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "24px", fontWeight: "800", cursor: "pointer",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.35)", transition: "transform 0.15s ease"
                  }}
                  title="Next Map"
                >
                  ›
                </button>
              )}
            </div>
            
            {/* Indicator Dots & Count */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px", background: pal.dotsBg, borderTop: pal.cardBorder, flexShrink: 0 }}>
              <span style={{ fontSize: "10px", fontWeight: "700", color: pal.muted }}>{currentMapIndex + 1} / {parameters.length}</span>
              <div style={{ display: "flex", gap: "5px" }}>
                {parameters.map((_, idx) => (
                  <span key={idx} style={{ width: idx === currentMapIndex ? "16px" : "5px", height: "5px", borderRadius: "3px", background: idx === currentMapIndex ? (isDark ? "#d946ef" : "#0284c7") : (isDark ? "#4c2a85" : "#cbd5e1"), transition: "all 0.2s" }} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="all-maps-grid">
            {parameters.map((param, index) => (
              <div key={param.id} className="mini-map-card" onClick={() => onSelectParameter(param.id)} style={{ padding: 0, overflow: "hidden", background: pal.miniBg, display: "flex", flexDirection: "column", cursor: "pointer" }}>
                <div className="mini-map-header" style={{ padding: "8px", flexShrink: 0 }}>{param.label}</div>
                <div style={{ flex: 1, position: "relative", background: pal.miniBg, width: "100%" }}>
                  {index < loadedMapsCount && (
                    <MapContainer preferCanvas={true} center={[centerLat, centerLng]} zoomSnap={0} zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} attributionControl={false} style={{ position: "absolute", inset: 0, backgroundColor: pal.miniBg }}>
                      <TileLayer noWrap={true} url={tileUrl} />
                      <MaskHole bounds={gridBounds} color={pal.maskColor} />
                      {!isGeneratingGrid && <GridOverlay gridData={miniGridData} parameter={param.id} resolution={miniResolution} showTooltip={false} />}
                      <MiniMapController gridBounds={gridBounds} paddedBounds={paddedBounds} />
                    </MapContainer>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DATA SIDE PANEL */}
      <div className="dashboard-data-area custom-scrollbar" style={isMobile ? {
        position: "relative", display: "flex", flexDirection: "column", flex: 1, minHeight: 0, width: "100%", overflow: "hidden", 
        paddingRight: "2px"
      } : {
        position: "relative", display: "flex", flexDirection: "column", flex: "1", minWidth: 0, height: "100%", overflowY: "auto"
      }}>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginBottom: "6px", flexShrink: 0 }}>
          <button className="heatmap-action-btn fill" onClick={onBack}>{t("back") || "Back to Map"}</button>
        </div>

        <div className="dash-water-card" style={{ background: pal.cardBg, padding: "8px 10px", borderRadius: "10px", border: pal.cardBorder, marginBottom: "6px", flexShrink: 0 }}>
          <span style={{ fontSize: "10px", color: pal.labelBlue, fontWeight: "800", textTransform: "uppercase" }}>{t("coveredWaterBodies") || "Water Bodies"} ({t("clickToFilter") || "Click to filter table"})</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "6px" }}>
            <span 
              onClick={() => { setSeaFilter(null); setCurrentPage(1); }}
              style={{ cursor: "pointer", background: seaFilter === null ? pal.chipOn : pal.chipOff, color: seaFilter === null ? "#ffffff" : pal.chipOffText, padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", border: pal.cardBorder, transition: "all 0.2s ease" }}
            >
              🌍 {t("all") || "All"}
            </span>
            {waterBodiesArray.map((sea, idx) => (
              <span 
                key={idx} 
                onClick={() => { setSeaFilter(sea === seaFilter ? null : sea); setCurrentPage(1); }}
                style={{ cursor: "pointer", background: seaFilter === sea ? pal.chipOn : pal.chipOff, color: seaFilter === sea ? "#ffffff" : pal.chipOffText, padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", border: pal.cardBorder, transition: "all 0.2s ease" }}
              >
                🌊 {sea}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "6px", flexShrink: 0 }}>
          {parameters.map((p) => (
            <div key={p.id} className="dash-avg-card" style={{ background: pal.avgBg, padding: "5px 10px", borderRadius: "8px", border: pal.avgBorder }}>
              <span style={{ fontSize: "8.5px", color: pal.muted, fontWeight: "800", textTransform: "uppercase" }}>{p.id.toUpperCase()} {seaFilter ? `${seaFilter} Avg` : "Avg"}</span>
              <div style={{ fontSize: "13px", fontWeight: "900", color: pal.textAccent }}>{averages[p.id]}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px", padding: "0 2px", flexShrink: 0 }}>
          <h4 style={{ margin: 0, fontSize: "11px", fontWeight: "800", color: pal.labelBlue, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            📊 {seaFilter ? `${seaFilter} ${t("matrix") || "Matrix"}` : (t("regionalGridDataMatrix") || "Regional Grid Data Matrix")}
          </h4>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", color: pal.muted }}>{t("timeSpan") || "Time Span"}:</span>
            <div style={{ minWidth: "130px" }}>
              <CustomDropdown
                value={String(spanDays)}
                placeholder={t("timeSpan") || "Time Span"}
                options={[
                  { value: "7", label: t("last7Days") || "Last 7 Days" },
                  { value: "14", label: t("last14Days") || "Last 14 Days" },
                ]}
                onChange={(val) => setSpanDays(Number(val))}
                height={28}
                fontSize={10}
                ariaLabel={t("timeSpan") || "Time Span"}
              />
            </div>
          </div>
        </div>

        <div className="custom-scrollbar dash-table-wrap" style={isMobile ? {
          flex: 1, minHeight: 0, overflowX: "auto", overflowY: "auto", border: `1px solid ${pal.tableBorder}`, borderTopLeftRadius: "10px", borderTopRightRadius: "10px", borderBottomLeftRadius: totalPages > 1 ? 0 : "10px", borderBottomRightRadius: totalPages > 1 ? 0 : "10px", position: "relative", WebkitOverflowScrolling: "touch", paddingRight: "8px", background: pal.rowA,
        } : {
          flex: 1, minHeight: "220px", overflowX: "auto", overflowY: "auto", border: `1px solid ${pal.tableBorder}`, borderTopLeftRadius: "10px", borderTopRightRadius: "10px", position: "relative", background: pal.rowA,
        }}>
          <table className="dash-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "700px" }}>
            <thead style={{ position: "sticky", top: 0, background: pal.theadBg, zIndex: 10 }}>
              <tr>
                <th style={{ padding: "8px", borderBottom: `2px solid ${pal.tableBorder}`, color: pal.muted, fontWeight: "700", textAlign: "left", width: "200px" }}>{t("gridCorners") || "Grid Corners"}</th>
                <th style={{ padding: "8px", borderBottom: `2px solid ${pal.tableBorder}`, color: pal.muted, fontWeight: "700", textAlign: "left" }}>{t("startDate") || "Start Date"}</th>
                <th style={{ padding: "8px", borderBottom: `2px solid ${pal.tableBorder}`, color: pal.muted, fontWeight: "700", textAlign: "left" }}>{t("endDate") || "End Date"}</th>
                <th style={{ padding: "8px", borderBottom: `2px solid ${pal.tableBorder}`, color: pal.muted, fontWeight: "700", textAlign: "center" }}>SST</th>
                <th style={{ padding: "8px", borderBottom: `2px solid ${pal.tableBorder}`, color: pal.muted, fontWeight: "700", textAlign: "center" }}>SSH</th>
                <th style={{ padding: "8px", borderBottom: `2px solid ${pal.tableBorder}`, color: pal.muted, fontWeight: "700", textAlign: "center" }}>SSS</th>
                <th style={{ padding: "8px", borderBottom: `2px solid ${pal.tableBorder}`, color: pal.muted, fontWeight: "700", textAlign: "center" }}>SSCU</th>
                <th style={{ padding: "8px", borderBottom: `2px solid ${pal.tableBorder}`, color: pal.muted, fontWeight: "700", textAlign: "center" }}>SSCV</th>
                <th style={{ padding: "8px", borderBottom: `2px solid ${pal.tableBorder}`, color: pal.muted, fontWeight: "700", textAlign: "right" }}>{t("waterBody") || "Water Body"}</th>
              </tr>
            </thead>
            {(!isGeneratingGrid && loadedMapsCount >= parameters.length) && filteredGridData && (
              <tbody>
                {paginatedData.map((row, idx) => {
                  const isLand = checkIfLand(row.lat, row.lng);
                  const rowWaterBody = isLand ? (t("land") || "Land") : parseAndTranslateApiSeaName(getWaterBodyName(row.lat, row.lng), t);
                  const corners = getGridCorners(row.lat, row.lng, activeResolution, t);

                  return (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? pal.rowA : pal.rowB }}>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${pal.tableBorder}`, whiteSpace: "nowrap" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "max-content max-content", gap: "2px 8px", fontSize: "8.5px", color: pal.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.2px" }}>
                           <span><b style={{opacity: 0.5, fontWeight: 800}}>{t("dirNW") || "NW"}</b> {corners.nw.lat}, {corners.nw.lng}</span>
                           <span><b style={{opacity: 0.5, fontWeight: 800}}>{t("dirNE") || "NE"}</b> {corners.ne.lat}, {corners.ne.lng}</span>
                           <span><b style={{opacity: 0.5, fontWeight: 800}}>{t("dirSW") || "SW"}</b> {corners.sw.lat}, {corners.sw.lng}</span>
                           <span><b style={{opacity: 0.5, fontWeight: 800}}>{t("dirSE") || "SE"}</b> {corners.se.lat}, {corners.se.lng}</span>
                        </div>
                      </td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${pal.tableBorder}`, whiteSpace: "nowrap", fontSize: "11px", color: pal.muted }}>{startDateStr}</td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${pal.tableBorder}`, whiteSpace: "nowrap", fontSize: "11px", color: pal.muted }}>{endDateStr}</td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${pal.tableBorder}`, textAlign: "center", color: pal.textMain }}>{row.sst}</td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${pal.tableBorder}`, textAlign: "center", color: pal.textMain }}>{row.ssh}</td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${pal.tableBorder}`, textAlign: "center", color: pal.textMain }}>{row.sss}</td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${pal.tableBorder}`, textAlign: "center", color: pal.textMain }}>{row.sscu}</td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${pal.tableBorder}`, textAlign: "center", color: pal.textMain }}>{row.sscv}</td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${pal.tableBorder}`, color: isLand ? pal.muted : pal.textAccent, fontWeight: "600", whiteSpace: "nowrap", fontSize: "11px", textAlign: "right" }}>{rowWaterBody}</td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>

        {(!isGeneratingGrid && loadedMapsCount >= parameters.length) && totalPages > 1 && (
          <div className="dash-pager" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px", background: pal.dotsBg, border: `1px solid ${pal.tableBorder}`, borderTop: "none", borderBottomLeftRadius: "10px", borderBottomRightRadius: "10px", flexShrink: 0, marginTop: "0px" }}>
            <button className="heatmap-action-btn outline" style={{ padding: "4px 10px", fontSize: "11px", minHeight: "auto", opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Previous</button>
            <span style={{ fontSize: "11px", fontWeight: "700", color: pal.muted }}>Page {currentPage} of {totalPages}</span>
            <button className="heatmap-action-btn outline" style={{ padding: "4px 10px", fontSize: "11px", minHeight: "auto", opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}