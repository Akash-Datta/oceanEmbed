import React, { useState, useEffect, useMemo, useRef } from "react";
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

function DashboardMapController({ gridBounds, paddedBounds, isGeneratingGrid }) {
  const map = useMap();
  const boundsKey = gridBounds && paddedBounds
    ? `${gridBounds[0][0]},${gridBounds[0][1]},${gridBounds[1][0]},${gridBounds[1][1]}|${paddedBounds[0][0]},${paddedBounds[0][1]},${paddedBounds[1][0]},${paddedBounds[1][1]}`
    : null;

  useEffect(() => {
    if (isGeneratingGrid || !gridBounds || !paddedBounds) return;
    const container = map.getContainer();
    if (!container) return;
    const applyCorrectBounds = () => {
      map.setMinZoom(0);
      map.setMaxBounds(null);
      map.invalidateSize(true);
      map.fitBounds(gridBounds, { padding: [12, 12], animate: false });
      const minZoom = map.getBoundsZoom(paddedBounds, false);
      map.setMinZoom(minZoom);
      map.setMaxBounds(paddedBounds);
      map.options.maxBoundsViscosity = 1.0;
    };
    const resizeObserver = new ResizeObserver(() => setTimeout(applyCorrectBounds, 10));
    resizeObserver.observe(container);
    const fallbackTimer = setTimeout(applyCorrectBounds, 350);
    return () => { resizeObserver.disconnect(); clearTimeout(fallbackTimer); };
  }, [boundsKey, map, isGeneratingGrid]);

  return null;
}

function MapControlOverlay({ onZoomIn, onZoomOut, onReset, isDark }) {
  const btnStyle = {
    width: "38px", height: "38px", borderRadius: "10px",
    background: isDark ? "rgba(20, 10, 44, 0.9)" : "rgba(255, 255, 255, 0.92)",
    backdropFilter: "blur(10px)",
    border: isDark ? "1px solid rgba(168, 85, 247, 0.55)" : "1px solid rgba(186, 230, 253, 0.9)",
    color: isDark ? "#f0abfc" : "#0284c7",
    boxShadow: isDark ? "0 0 14px rgba(168,85,247,0.35)" : "0 4px 12px rgba(2,132,199,0.15)",
    fontSize: "18px", fontWeight: "700", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  return (
    <div style={{ position: "absolute", top: "16px", right: "16px", zIndex: 1000, display: "flex", flexDirection: "row", gap: "8px", filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))" }} onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={onZoomIn} title="Zoom In" style={btnStyle}>+</button>
      <button type="button" onClick={onZoomOut} title="Zoom Out" style={btnStyle}>−</button>
      <button type="button" onClick={onReset} title="Reset View" style={{ ...btnStyle, fontSize: "16px" }}>↻</button>
    </div>
  );
}

export default function ParameterDashboard({ parameter, date, gridData, onShowAllMaps, onBack, triggerNotification, activeResolution, userResolution, setUserResolution, isCurrentLocationOutside, isGeneratingGrid }) {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const tileUrl = getTileUrl(isDark);
  const [selectedCell, setSelectedCell] = useState(null);
  const [seaFilter, setSeaFilter] = useState(null);
  const [spanDays, setSpanDays] = useState(7);
  const [isMobile, setIsMobile] = useState(false);
  const [openResolutionDropdown, setOpenResolutionDropdown] = useState(false);
  
  const [isRendering, setIsRendering] = useState(true);
  const [renderGrid, setRenderGrid] = useState(false);

  const tableContainerRef = useRef(null);
  const selectedRowRef = useRef(null);
  const mapRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 700);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isGeneratingGrid) {
      setIsRendering(true);
      setRenderGrid(false);
    } else {
      const renderDelay = isMobile ? 300 : 100;
      const hideDelay = isMobile ? 900 : 700;
      const t1 = setTimeout(() => setRenderGrid(true), renderDelay); 
      const t2 = setTimeout(() => setIsRendering(false), hideDelay); 
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isGeneratingGrid, isMobile]);

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
    setSelectedCell(null);
  }, [gridData, activeResolution]);

  const filteredGridData = useMemo(() => {
    // Land grids are never shown in the table
    const oceanOnly = (gridData || []).filter((row) => !checkIfLand(row.lat, row.lng));
    if (!seaFilter) return oceanOnly;
    return oceanOnly.filter((row) => getWaterBodyName(row.lat, row.lng) === seaFilter);
  }, [gridData, seaFilter]);

  useEffect(() => {
    if (selectedCell && filteredGridData && filteredGridData.length > 0) {
      const cellIndex = filteredGridData.findIndex(c => c.lat === selectedCell.lat && c.lng === selectedCell.lng);
      if (cellIndex !== -1) {
        const targetPage = Math.floor(cellIndex / rowsPerPage) + 1;
        if (currentPage !== targetPage) setCurrentPage(targetPage);
      }
    }
  }, [selectedCell, filteredGridData, currentPage]);

  // THE FIX: Bulletproof exact-position scroll calculation
  useEffect(() => {
    if (selectedCell) {
      const timer = setTimeout(() => {
        if (selectedRowRef.current && tableContainerRef.current) {
          const container = tableContainerRef.current;
          const row = selectedRowRef.current;
          const headerHeight = container.querySelector("thead")?.offsetHeight || 38;
          
          // Using getBoundingClientRect guarantees we get the exact pixel distance 
          // regardless of CSS offsetParents.
          const rowRect = row.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          // Calculate the target scroll position exactly underneath the sticky header
          const targetScrollTop = container.scrollTop + (rowRect.top - containerRect.top) - headerHeight;
          
          container.scrollTo({ top: targetScrollTop, behavior: "smooth" });
        }
      }, 150); // 150ms gives React enough time to paint the row if pagination just changed
      return () => clearTimeout(timer);
    }
  }, [selectedCell, currentPage]);

  const resolutionOptions = [];
  for (let i = 0.20; i <= 1.001; i += 0.05) resolutionOptions.push(i.toFixed(2));
  resolutionOptions.push("1.50", "2.00", "2.50");

  const { gridBounds, paddedBounds, minLat, maxLat, minLng, maxLng } = useMemo(() => {
    if (!gridData || gridData.length === 0) return { gridBounds: [[-10, 50], [10, 70]], paddedBounds: [[-12, 48], [12, 72]], minLat: 0, maxLat: 24.75, minLng: 50, maxLng: 89.75 };
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
        const name = getWaterBodyName(cell.lat, cell.lng);
        if (name) uniqueBodies.add(name);
      }
    });
    return Array.from(uniqueBodies).sort();
  }, [gridData]);

  const averageValue = useMemo(() => {
    if (!filteredGridData || filteredGridData.length === 0 || !parameter) return "0.00";
    let sum = 0, count = 0;
    filteredGridData.forEach((cell) => {
      if (!checkIfLand(cell.lat, cell.lng)) {
        sum += (cell[parameter] || 0);
        count++;
      }
    });
    return count === 0 ? "0.00" : (sum / count).toFixed(2);
  }, [filteredGridData, parameter]);

  const paramLabel = t(`${parameter}Full`) || parameter.toUpperCase();

  // Theme palette — light = clean ocean blue/white, dark = deep violet neon
  const pal = isDark ? {
    pageBg: "#0a0618",
    mapBg: "#0a0618",
    maskColor: "#0a0618",
    loadingBg: "rgba(10,6,24,0.88)",
    loadingText: "#f0abfc",
    loadingSub: "rgba(240,171,252,0.75)",
    cardBg: "linear-gradient(135deg, rgba(76,29,149,0.45), rgba(112,26,117,0.28))",
    cardBorder: "1px solid rgba(217, 70, 239, 0.4)",
    labelBlue: "#67e8f9",
    textMain: "#f5f3ff",
    textAccent: "#f0abfc",
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
    rowText: "#e9d5ff",
    pagerBg: "#150b31",
  } : {
    pageBg: "#eef6fd",
    mapBg: "#dbeafe",
    maskColor: "#dbeafe",
    loadingBg: "rgba(240,249,255,0.92)",
    loadingText: "#0284c7",
    loadingSub: "rgba(2,132,199,0.7)",
    cardBg: "linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(37, 99, 235, 0.05))",
    cardBorder: "1px solid #bae6fd",
    labelBlue: "#0369a1",
    textMain: "#0f172a",
    textAccent: "#0284c7",
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
    rowText: "#475569",
    pagerBg: "#f8fafc",
  };

  const handleGridClick = async (cell) => {
    try {
      if (!cell) return;
      if (!checkIfLand(cell.lat, cell.lng)) {
        const rawSea = getWaterBodyName(cell.lat, cell.lng);
        if (seaFilter !== rawSea) setSeaFilter(rawSea);
        setSelectedCell(cell);
        return;
      }
      let matchingCell = null, minDistance = Infinity;
      gridData.forEach((current) => {
        if (!checkIfLand(current.lat, current.lng)) {
          const dist = Math.sqrt(Math.pow(current.lat - cell.lat, 2) + Math.pow(current.lng - cell.lng, 2));
          if (dist < minDistance) {
            minDistance = dist;
            matchingCell = current;
          }
        }
      });
      if (!matchingCell) return triggerNotification && triggerNotification(t("oceanLocFailed") || "No valid ocean grid available.");
      if (triggerNotification) {
        const targetBody = parseAndTranslateApiSeaName(getWaterBodyName(matchingCell.lat, matchingCell.lng), t);
        const template = t("landRedirectGrid") || "Land coordinate detected! Redirected to nearest {body} grid.";
        triggerNotification(template.replace("{body}", targetBody));
      }
      const rawSea = getWaterBodyName(matchingCell.lat, matchingCell.lng);
      if (seaFilter !== rawSea) setSeaFilter(rawSea);
      setSelectedCell(matchingCell);
    } catch (error) {}
  };

  const handleZoomIn = () => { if (mapRef.current) mapRef.current.zoomIn(); };
  const handleZoomOut = () => {
    if (mapRef.current && gridBounds && paddedBounds) {
      const minAllowedZoom = mapRef.current.getBoundsZoom(paddedBounds, false);
      if (mapRef.current.getZoom() > minAllowedZoom + 0.1) mapRef.current.zoomOut();
      else mapRef.current.fitBounds(gridBounds, { padding: [12, 12], animate: true });
    }
  };

  const handleReset = () => {
    if (mapRef.current && gridBounds && paddedBounds) {
      mapRef.current.setMinZoom(0);
      mapRef.current.setMaxBounds(null);
      mapRef.current.invalidateSize();
      mapRef.current.fitBounds(gridBounds, { padding: [12, 12], animate: true });
      setTimeout(() => {
         const minZoom = mapRef.current.getBoundsZoom(paddedBounds, false);
         mapRef.current.setMinZoom(minZoom);
         mapRef.current.setMaxBounds(paddedBounds);
      }, 400);
      setSelectedCell(null);
      setSeaFilter(null);
      if (triggerNotification) triggerNotification(t("mapRefreshed") || "Map view refreshed and recentered.");
    }
  };

  const totalPages = Math.ceil((filteredGridData?.length || 0) / rowsPerPage);
  const paginatedData = filteredGridData?.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage) || [];

  return (
    <div className={`parameter-dashboard-page ${isDark ? "dash-dark" : "dash-light"}`} style={isMobile ? {
      display: "flex", flexDirection: "column", gap: "12px", 
      padding: "8px 12px 16px 8px", 
      flex: 1, height: "auto", minHeight: "100%", 
      boxSizing: "border-box", overflowY: "visible", WebkitOverflowScrolling: "touch",
      background: pal.pageBg,
    } : {
      display: "flex", flexDirection: "row", gap: "16px", padding: "12px", flex: 1, minHeight: 0, height: "100%", boxSizing: "border-box",
      background: pal.pageBg,
    }}>
      
      <style>{`
        @keyframes fadeInScale {
          0% { opacity: 0; transform: translateY(-4px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .dash-corner-badge {
          background: #ffffff; border: 1px solid #bbf7d0; padding: 3px 8px; border-radius: 20px; 
          color: #166534; font-size: 9.5px; font-family: 'JetBrains Mono', monospace; font-weight: 700; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: transform 0.2s; display: inline-flex; gap: 4px;
        }
        .dash-corner-badge:hover { transform: translateY(-1px); box-shadow: 0 2px 5px rgba(0,0,0,0.08); }
        .matrix-table-row { transition: background 0.15s ease, transform 0.15s ease; cursor: pointer; }
        .matrix-table-row:hover:not(.selected-row) { background: #e0f2fe !important; }
      `}</style>

      {/* HEATMAP RENDERING AREA */}
      <div className="dashboard-map-area" style={isMobile ? {
        flex: "none", width: "100%", height: "45vh", minHeight: "350px", background: pal.mapBg, padding: 0, boxSizing: "border-box", position: "relative", borderRadius: "14px", overflow: "hidden", isolation: "isolate", transform: "translateZ(0)"
      } : {
        flex: "0 0 62%", background: pal.mapBg, position: "relative", borderRadius: "14px", overflow: "hidden", isolation: "isolate", height: "100%", minHeight: "0", boxShadow: isDark ? "0 0 28px rgba(168,85,247,0.3)" : "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
      }}>
        
        {(isGeneratingGrid || isRendering) && (
          <div className="dash-loading-overlay" style={{ position: "absolute", inset: 0, zIndex: 9999, background: pal.loadingBg, backdropFilter: "blur(6px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div className={isDark ? "ocean-spinner" : "spinner"}></div>
            <div style={{ color: pal.loadingText, marginTop: "16px", fontWeight: "bold", textAlign: "center", padding: "0 20px" }}>
              {t("loadingHeatmap") || "Processing High-Resolution Data..."}<br/>
              <span style={{fontSize: "12px", opacity: 0.8, fontWeight: "normal", color: pal.loadingSub}}>This may take a moment</span>
            </div>
          </div>
        )}

        <MapContainer preferCanvas={true} ref={mapRef} center={[centerLat, centerLng]} zoomSnap={0} style={{ height: "100%", width: "100%", backgroundColor: pal.mapBg, position: "absolute", inset: 0 }} zoomControl={false} attributionControl={false}>
          <TileLayer noWrap={true} url={tileUrl} />
          {!isGeneratingGrid && renderGrid && <GridOverlay gridData={gridData} parameter={parameter} selectedCell={selectedCell} onGridClick={handleGridClick} resolution={activeResolution} showTooltip={gridData && gridData.length < 1500} />}
          <MaskHole bounds={gridBounds} color={pal.maskColor} />
          <DashboardMapController gridBounds={gridBounds} paddedBounds={paddedBounds} isGeneratingGrid={isGeneratingGrid} />
        </MapContainer>
        <MapControlOverlay onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onReset={handleReset} isDark={isDark} />
      </div>

      {/* DATA AREA & SIDEPANEL FLOW */}
      <div className="dashboard-data-area custom-scrollbar" style={isMobile ? {
        position: "relative", display: "flex", flexDirection: "column", flex: "none", width: "100%", height: "auto", overflow: "visible"
      } : {
        position: "relative", display: "flex", flexDirection: "column", flex: "1", minWidth: 0, height: "100%", overflowY: "auto"
      }}>
        {isMobile && openResolutionDropdown && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setOpenResolutionDropdown(false)} />
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexShrink: 0, flexWrap: "wrap", gap: "10px" }}>
          
          <div style={isMobile ? { width: "100%", position: "relative", zIndex: 9999 } : { display: "flex", alignItems: "center", gap: "8px" }}>
            {!isMobile && <span style={{ fontSize: "10px", fontWeight: "800", color: "#0369a1", textTransform: "uppercase" }}>{t("changeResolution") || "Resolution"}:</span>}
            
            {isMobile ? (
              <>
                <button type="button" className="ocean-control" disabled={!isCurrentLocationOutside} onClick={(e) => { e.stopPropagation(); setOpenResolutionDropdown(!openResolutionDropdown); }} style={{ width: "100%", opacity: !isCurrentLocationOutside ? 0.6 : 1, textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{isCurrentLocationOutside && userResolution ? `${userResolution}°` : !isCurrentLocationOutside ? `0.25° (${t("fixed")})` : t("selectResolution")}</span>
                  <span>▾</span>
                </button>
                {openResolutionDropdown && isCurrentLocationOutside && (
                  <div className="mobile-inline-dropdown-list" style={{ maxHeight: "168px" }}>
                    {resolutionOptions.map((res) => (
                      <div key={res} className={`mobile-inline-dropdown-item ${Number(userResolution) === Number(res) ? "selected" : ""}`} onClick={(e) => { 
                        e.stopPropagation(); 
                        setOpenResolutionDropdown(false);
                        if (triggerNotification) triggerNotification((t("resUpdated") || "Resolution updated to {res}°").replace("{res}", res));
                        setTimeout(() => setUserResolution(Number(res)), 50); 
                      }}>
                        {res}°
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ minWidth: "120px" }}>
                <CustomDropdown
                  value={isCurrentLocationOutside ? userResolution : "0.25"}
                  placeholder={t("selectResolution") || "Select Resolution"}
                  options={
                    !isCurrentLocationOutside
                      ? [{ value: "0.25", label: `0.25° (${t("fixed") || "Fixed"})` }]
                      : resolutionOptions.map((res) => ({ value: res, label: `${res}°` }))
                  }
                  onChange={(val) => {
                    const num = Number(val);
                    if (triggerNotification) triggerNotification((t("resUpdated") || "Resolution updated to {res}°").replace("{res}", num));
                    setTimeout(() => setUserResolution(num), 50);
                  }}
                  disabled={!isCurrentLocationOutside}
                  height={34}
                  fontSize={12}
                  ariaLabel={t("changeResolution") || "Resolution"}
                />
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px", width: isMobile ? "100%" : "auto" }}>
            <button className="heatmap-action-btn outline" style={{flex: isMobile ? 1 : "auto"}} onClick={onShowAllMaps}>{t("allHeatMaps") || "All Heat Maps"}</button>
            <button className="heatmap-action-btn fill" style={{flex: isMobile ? 1 : "auto"}} onClick={onBack}>{t("back") || "Back to Map"}</button>
          </div>
        </div>

        <div className="dash-water-card" style={{ background: pal.cardBg, padding: "12px", borderRadius: "10px", border: pal.cardBorder, marginBottom: "12px", flexShrink: 0 }}>
          <span style={{ fontSize: "10px", color: pal.labelBlue, fontWeight: "800", textTransform: "uppercase" }}>
            {Array.isArray(t("waterBody")) ? "Water Bodies" : (t("waterBody") || "Water Bodies")} ({t("clickToFilter") || "Click to filter table"})
          </span>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
            <span 
              onClick={() => { setSeaFilter(null); setSelectedCell(null); setCurrentPage(1); }}
              style={{ cursor: "pointer", background: seaFilter === null ? pal.chipOn : pal.chipOff, color: seaFilter === null ? "#ffffff" : pal.chipOffText, padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", border: pal.cardBorder, transition: "all 0.2s ease" }}
            >
              🌍 {t("all") || "All"}
            </span>
            {waterBodiesArray.map((rawSea, idx) => {
              const displaySea = parseAndTranslateApiSeaName(rawSea, t);
              return (
                <span 
                  key={idx} 
                  onClick={() => { setSeaFilter(rawSea === seaFilter ? null : rawSea); setSelectedCell(null); setCurrentPage(1); }}
                  style={{ cursor: "pointer", background: seaFilter === rawSea ? pal.chipOn : pal.chipOff, color: seaFilter === rawSea ? "#ffffff" : pal.chipOffText, padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", border: pal.cardBorder, transition: "all 0.2s ease" }}
                >
                  🌊 {displaySea}
                </span>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", paddingTop: "10px", borderTop: pal.cardBorder }}>
            <div>
              <span style={{ fontSize: "9px", color: pal.labelBlue, fontWeight: "800", textTransform: "uppercase" }}>{t("selectedParameter") || "Parameter"}</span>
              <strong style={{ display: "block", color: pal.textMain, fontSize: "12px" }}>{paramLabel}</strong>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "9px", color: pal.labelBlue, fontWeight: "800", textTransform: "uppercase" }}>{seaFilter ? `${parseAndTranslateApiSeaName(seaFilter, t)} ${t("regionalAverage") || "Average"}` : (t("regionalAverage") || "Average")}</span>
              <strong style={{ display: "block", color: pal.textAccent, fontSize: "16px", fontWeight: "900" }}>{averageValue}</strong>
            </div>
          </div>
        </div>

        {selectedCell && (
          <div className="dash-selected-card" style={{ background: pal.selCardBg, border: pal.selCardBorder, padding: "10px", borderRadius: "10px", marginBottom: "12px", textAlign: "center", animation: "fadeInScale 0.3s ease-out", flexShrink: 0 }}>
            <div style={{ marginBottom: "8px", fontSize: "10px", color: isDark ? "#f0abfc" : "#14532d", fontWeight: "800", letterSpacing: "0.5px" }}>
              📍 {t("selectedGrid")?.toUpperCase()} ({
                checkIfLand(selectedCell.lat, selectedCell.lng)
                  ? (t("land") || "Land")
                  : parseAndTranslateApiSeaName(getWaterBodyName(selectedCell.lat, selectedCell.lng), t)
              }) ➔ <span style={{color: isDark ? "#67e8f9" : "#059669"}}>{selectedCell[parameter]}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px" }}>
              {(() => {
                const c = getGridCorners(selectedCell.lat, selectedCell.lng, activeResolution, t);
                return (
                  <>
                    <span className="dash-corner-badge"><span style={{color: "#22c55e", opacity: 0.8}}>{t("dirNW") || "NW"}</span>{c.nw.lat}, {c.nw.lng}</span>
                    <span className="dash-corner-badge"><span style={{color: "#22c55e", opacity: 0.8}}>{t("dirNE") || "NE"}</span>{c.ne.lat}, {c.ne.lng}</span>
                    <span className="dash-corner-badge"><span style={{color: "#22c55e", opacity: 0.8}}>{t("dirSW") || "SW"}</span>{c.sw.lat}, {c.sw.lng}</span>
                    <span className="dash-corner-badge"><span style={{color: "#22c55e", opacity: 0.8}}>{t("dirSE") || "SE"}</span>{c.se.lat}, {c.se.lng}</span>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px", padding: "0 2px", flexShrink: 0 }}>
          <h4 style={{ margin: 0, fontSize: "11px", fontWeight: "800", color: pal.labelBlue, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            📊 {seaFilter ? `${parseAndTranslateApiSeaName(seaFilter, t)} ${t("matrix") || "Matrix"}` : (t("regionalGridDataMatrix") || "Regional Grid Data Matrix")}
          </h4>
        </div>

        <div ref={tableContainerRef} className="custom-scrollbar dash-table-wrap" style={isMobile ? {
          flex: "none", height: "400px", overflowX: "auto", overflowY: "auto", border: `1px solid ${pal.tableBorder}`, borderTopLeftRadius: "10px", borderTopRightRadius: "10px", position: "relative", WebkitOverflowScrolling: "touch", paddingRight: "8px", background: pal.rowA,
        } : {
          flex: 1, minHeight: "220px", overflowX: "auto", overflowY: "auto", border: `1px solid ${pal.tableBorder}`, borderTopLeftRadius: "10px", borderTopRightRadius: "10px", position: "relative", background: pal.rowA,
        }}>
          <table className="dash-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "550px" }}>
            <thead style={{ position: "sticky", top: 0, background: pal.theadBg, zIndex: 10 }}>
              <tr>
                <th style={{ padding: "8px", borderBottom: `2px solid ${pal.tableBorder}`, color: pal.theadText, fontWeight: "700", textAlign: "left", width: "200px" }}>{t("gridCorners") || "Grid Corners"}</th>
                <th style={{ padding: "8px", borderBottom: `2px solid ${pal.tableBorder}`, color: pal.theadText, fontWeight: "700", textAlign: "left" }}>{t("startDate") || "Start Date"}</th>
                <th style={{ padding: "8px", borderBottom: `2px solid ${pal.tableBorder}`, color: pal.theadText, fontWeight: "700", textAlign: "left" }}>{t("endDate") || "End Date"}</th>
                <th style={{ padding: "8px", borderBottom: `2px solid ${pal.tableBorder}`, color: pal.theadText, fontWeight: "700", textAlign: "center" }}>{parameter.toUpperCase()}</th>
                <th style={{ padding: "8px", borderBottom: `2px solid ${pal.tableBorder}`, color: pal.theadText, fontWeight: "700", textAlign: "right" }}>{Array.isArray(t("waterBody")) ? "Water Body" : (t("waterBody") || "Water Body")}</th>
              </tr>
            </thead>
            {(!isGeneratingGrid && !isRendering) && filteredGridData && (
              <tbody>
                {paginatedData.map((row, idx) => {
                  const isSelected = selectedCell && selectedCell.lat === row.lat && selectedCell.lng === row.lng;
                  const isLand = checkIfLand(row.lat, row.lng);
                  const rowWaterBody = isLand ? (t("land") || "Land") : parseAndTranslateApiSeaName(getWaterBodyName(row.lat, row.lng), t);
                  const corners = getGridCorners(row.lat, row.lng, activeResolution, t);

                  return (
                    <tr 
                      key={idx} ref={isSelected ? selectedRowRef : null} onClick={() => handleGridClick(row)}
                      className={`matrix-table-row ${isSelected ? 'selected-row' : ''}`}
                      style={{ background: isSelected ? (isDark ? "rgba(168, 85, 247, 0.28)" : "rgba(14, 165, 233, 0.2)") : (idx % 2 === 0 ? pal.rowA : pal.rowB) }}
                    >
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${pal.tableBorder}`, whiteSpace: "nowrap" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "max-content max-content", gap: "2px 8px", fontSize: "8.5px", color: isSelected ? pal.textAccent : pal.rowText, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.2px" }}>
                           <span><b style={{opacity: 0.5, fontWeight: 800}}>{t("dirNW") || "NW"}</b> {corners.nw.lat}, {corners.nw.lng}</span>
                           <span><b style={{opacity: 0.5, fontWeight: 800}}>{t("dirNE") || "NE"}</b> {corners.ne.lat}, {corners.ne.lng}</span>
                           <span><b style={{opacity: 0.5, fontWeight: 800}}>{t("dirSW") || "SW"}</b> {corners.sw.lat}, {corners.sw.lng}</span>
                           <span><b style={{opacity: 0.5, fontWeight: 800}}>{t("dirSE") || "SE"}</b> {corners.se.lat}, {corners.se.lng}</span>
                        </div>
                      </td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${pal.tableBorder}`, whiteSpace: "nowrap", fontSize: "11px", color: pal.rowText }}>{startDateStr}</td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${pal.tableBorder}`, whiteSpace: "nowrap", fontSize: "11px", color: pal.rowText }}>{endDateStr}</td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${pal.tableBorder}`, textAlign: "center", fontWeight: isSelected ? "800" : "600", color: isSelected ? pal.textAccent : pal.textMain }}>{row[parameter]}</td>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${pal.tableBorder}`, color: isLand ? pal.rowText : pal.textAccent, fontWeight: "600", whiteSpace: "nowrap", fontSize: "11px", textAlign: "right" }}>{rowWaterBody}</td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>

        {(!isGeneratingGrid && !isRendering) && totalPages > 1 && (
          <div className="dash-pager" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: pal.pagerBg, border: `1px solid ${pal.tableBorder}`, borderTop: "none", borderBottomLeftRadius: "10px", borderBottomRightRadius: "10px", flexShrink: 0, marginTop: "0px" }}>
            <button className="heatmap-action-btn outline" style={{ padding: "4px 10px", fontSize: "11px", minHeight: "auto", opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Previous</button>
            <span style={{ fontSize: "11px", fontWeight: "700", color: pal.rowText }}>Page {currentPage} of {totalPages}</span>
            <button className="heatmap-action-btn outline" style={{ padding: "4px 10px", fontSize: "11px", minHeight: "auto", opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}