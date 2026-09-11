<<<<<<< HEAD
import React, {
  useEffect,
  useState,
} from "react";

import {
  fetchSpatialMaps,
} from "../data/dummyOceanData";
=======
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, Polygon } from "react-leaflet";
import GridOverlay from "./GridOverlay";
import { arabianSeaTemperatureData, bayOfBengalTemperatureData } from "../data/dummyOceanData";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { getTileUrl } from "../utils/mapTiles";
import { checkIfLand, getWaterBodyName, parseAndTranslateApiSeaName } from "../utils/coordinateUtils";

// Fallback open-ocean profile (matches dummyOceanData global curve)
const globalFallbackProfile = [
  { depth: 0, argo: 15.2, transformer: 15.0 },
  { depth: 200, argo: 13.5, transformer: 13.1 },
  { depth: 400, argo: 9.1, transformer: 9.4 },
  { depth: 600, argo: 7.6, transformer: 7.9 },
  { depth: 1000, argo: 4.2, transformer: 4.5 },
];

const profileForCell = (lat, lng) => {
  const inArabian = lat >= 5 && lat <= 25 && lng >= 55 && lng <= 75;
  const inBay = lat >= 5 && lat <= 22 && lng >= 80 && lng <= 95;
  if (inArabian) return arabianSeaTemperatureData;
  if (inBay) return bayOfBengalTemperatureData;
  return globalFallbackProfile;
};

const interpAtDepth = (profile, depthNum) => {
  if (!profile || profile.length === 0) return { argo: 0, transformer: 0 };
  if (depthNum <= profile[0].depth) return { argo: profile[0].argo, transformer: profile[0].transformer };
  for (let i = 0; i < profile.length - 1; i++) {
    const a = profile[i];
    const b = profile[i + 1];
    if (depthNum >= a.depth && depthNum <= b.depth) {
      const f = (depthNum - a.depth) / Math.max(1e-6, b.depth - a.depth);
      return { argo: a.argo + (b.argo - a.argo) * f, transformer: a.transformer + (b.transformer - a.transformer) * f };
    }
  }
  const last = profile[profile.length - 1];
  return { argo: last.argo, transformer: last.transformer };
};

// Deterministic per-cell jitter so the table is stable across renders
const cellJitter = (lat, lng, salt) => {
  const x = Math.sin(lat * 12.9898 + lng * 78.233 + salt * 37.719) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 2; // -1..1
};

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
    se: { lat: formatDir(lat - half, true, t), lng: formatDir(lng + half, false, t) },
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

const MODELS = [
  { id: "argo", short: "Argo" },
  { id: "transformer", short: "Pred" },
  { id: "error", short: "Error" },
];
>>>>>>> origin/main

export default function SpatialDistribution({
  depth,
  initialFocus,
  onBack,
<<<<<<< HEAD
}) {
  const [maps, setMaps] = useState({
    argo: "",
    convformer: "",
    error: "",
  });

  const [loading, setLoading] = useState(true);
  const [focusedMap, setFocusedMap] = useState(initialFocus);

  useEffect(() => {
    setFocusedMap(initialFocus);
  }, [initialFocus]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    setMaps({
      argo: "",
      convformer: "",
      error: "",
    });

    fetchSpatialMaps(depth)
      .then((data) => {
        if (!isMounted) return;
        setMaps({
          argo: data?.argo || "",
          convformer: data?.convformer || "",
          error: data?.error || "",
        });
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load spatial maps:", error);
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [depth]);

  // Restores outside click functionality to outfocus selected map
  useEffect(() => {
    const handleOutsideClick = () => {
      setFocusedMap(null);
    };

    window.addEventListener("click", handleOutsideClick);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  const handleImageError = (event, name) => {
    console.error(`Failed to load ${name} image:`, event.currentTarget.src);
    event.currentTarget.style.display = "none";
  };

  return (
    <div className="spatial-dashboard-container" onClick={onBack}>
      <div 
        className="spatial-dashboard-inner" 
        onClick={(e) => {
          e.stopPropagation();
          setFocusedMap(null);
        }}
      >
        <div
          className="spatial-header"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="spatial-title">
            Spatial Temperature Distribution at{" "}
            {depth ? parseFloat(depth).toFixed(1) : "0.0"} m Depth
          </h3>

          <button className="back-to-map-btn" onClick={onBack}>
            ← Back to Interactive Map
          </button>
        </div>

        <div className={`spatial-grid ${focusedMap ? "has-focus" : ""}`}>
          {/* ARGO */}
          <div
            className={`spatial-card ${focusedMap === "argo" ? "focused" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setFocusedMap(focusedMap === "argo" ? null : "argo");
            }}
          >
            <div className="spatial-card-header">
              <h4>Independent ARGO (Ground Truth)</h4>
            </div>
            <div className="spatial-image-wrapper">
              {loading ? (
                <div className="loading-text">Fetching Map Data...</div>
              ) : maps.argo ? (
                <img
                  src={maps.argo}
                  alt="Independent ARGO"
                  className="heatmap-img"
                  onError={(event) => handleImageError(event, "ARGO")}
                />
              ) : (
                <div className="loading-text">ARGO map unavailable</div>
              )}
            </div>
          </div>

          {/* CONVFORMER */}
          <div
            className={`spatial-card ${focusedMap === "convformer" ? "focused" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setFocusedMap(focusedMap === "convformer" ? null : "convformer");
            }}
          >
            <div className="spatial-card-header">
              <h4>Convformer Prediction</h4>
              <div className="mock-toolbar">📷 🔍 ⛶</div>
            </div>
            <div className="spatial-image-wrapper">
              {loading ? (
                <div className="loading-text">Fetching Map Data...</div>
              ) : maps.convformer ? (
                <img
                  src={maps.convformer}
                  alt="Convformer Prediction"
                  className="heatmap-img"
                  onError={(event) => handleImageError(event, "Convformer")}
                />
              ) : (
                <div className="loading-text">Prediction map unavailable</div>
              )}
            </div>
          </div>

          {/* ERROR */}
          <div
            className={`spatial-card error-card ${focusedMap === "error" ? "focused" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setFocusedMap(focusedMap === "error" ? null : "error");
            }}
          >
            <div className="spatial-card-header">
              <h4>Absolute Error (|Pred - Actual|)</h4>
            </div>
            <div className="spatial-image-wrapper error-wrapper">
              {loading ? (
                <div className="loading-text">Fetching Map Data...</div>
              ) : maps.error ? (
                <img
                  src={maps.error}
                  alt="Absolute Error"
                  className="heatmap-img"
                  onError={(event) => handleImageError(event, "Error")}
                />
              ) : (
                <div className="loading-text">Error map unavailable</div>
              )}

              <div className="mock-colorbar">
                <span>14</span>
                <span>12</span>
                <span>10</span>
                <span>8</span>
                <span>6</span>
                <span>4</span>
                <span>2</span>
                <span>0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
=======
  gridData = null,
  activeResolution = 0.25,
  isGeneratingGrid = false,
}) {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const tileUrl = getTileUrl(isDark);
  const depthNum = Number.isFinite(parseFloat(depth)) ? parseFloat(depth) : 0;
  const res = parseFloat(activeResolution) || 0.25;

  // Active depth model — same role as `parameter` in surface maps
  const [model, setModel] = useState(initialFocus || "argo");

  // ---- same engine state as surface parameter maps ----
  const [selectedCell, setSelectedCell] = useState(null);
  const [seaFilter, setSeaFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;
  const tableContainerRef = useRef(null);
  const selectedRowRef = useRef(null);
  const mapRef = useRef(null);

  const [isRendering, setIsRendering] = useState(true);
  const [renderGrid, setRenderGrid] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 700);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => { if (initialFocus) setModel(initialFocus); }, [initialFocus]);

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
  }, [isGeneratingGrid, isMobile, depth]);

  // ---- depth grid: use provided gridData when available, else synthesize ----
  const depthGrid = useMemo(() => {
    if (gridData && gridData.length > 0) {
      return gridData.map((c) => {
        if (typeof c.argo === "number" && typeof c.transformer === "number") {
          const err = typeof c.error === "number" ? c.error : Math.abs((c.transformer || 0) - (c.argo || 0));
          return { lat: c.lat, lng: c.lng, argo: c.argo, transformer: c.transformer, error: err };
        }
        const base = interpAtDepth(profileForCell(c.lat, c.lng), depthNum);
        const spatial = 1.6 * Math.cos((c.lat * Math.PI) / 180) + 0.8 * Math.sin((c.lng * Math.PI) / 90);
        const argo = base.argo + spatial + cellJitter(c.lat, c.lng, 1) * 0.35;
        const transformer = base.transformer + spatial + cellJitter(c.lat, c.lng, 2) * 0.45;
        return {
          lat: c.lat,
          lng: c.lng,
          argo: parseFloat(argo.toFixed(2)),
          transformer: parseFloat(transformer.toFixed(2)),
          error: parseFloat(Math.abs(transformer - argo).toFixed(2)),
        };
      });
    }
    // Default Arabian Sea window (mirrors surface dashboards) at the exact
    // shared 0.25° step — same coordinates the surface engine generates.
    const step = res;
    const latMin = 0.0;
    const latMax = 24.75;
    const lngMin = 50.0;
    const lngMax = 89.75;
    const grid = [];
    for (let lat = latMin; lat <= latMax + 0.0001; lat += step) {
      for (let lng = lngMin; lng <= lngMax + 0.0001; lng += step) {
        const rLat = parseFloat(lat.toFixed(3));
        const rLng = parseFloat(lng.toFixed(3));
        const base = interpAtDepth(profileForCell(rLat, rLng), depthNum);
        const spatial = 1.6 * Math.cos((rLat * Math.PI) / 180) + 0.8 * Math.sin((rLng * Math.PI) / 90);
        const argo = base.argo + spatial + cellJitter(rLat, rLng, 1) * 0.35;
        const transformer = base.transformer + spatial + cellJitter(rLat, rLng, 2) * 0.45;
        grid.push({
          lat: rLat,
          lng: rLng,
          argo: parseFloat(argo.toFixed(2)),
          transformer: parseFloat(transformer.toFixed(2)),
          error: parseFloat(Math.abs(transformer - argo).toFixed(2)),
        });
      }
    }
    return grid;
  }, [gridData, depthNum, res]);

  const effectiveRes = useMemo(() => {
    if (gridData && gridData.length > 1) {
      const lats = Array.from(new Set(gridData.map((c) => c.lat))).sort((a, b) => a - b);
      if (lats.length > 1) {
        const diff = Math.abs(lats[1] - lats[0]);
        if (diff > 0.001 && diff < 10) return diff;
      }
    }
    return res;
  }, [gridData, res]);

  const { gridBounds, paddedBounds, minLat, maxLat, minLng, maxLng } = useMemo(() => {
    if (!depthGrid || depthGrid.length === 0) return { gridBounds: [[-10, 50], [10, 70]], paddedBounds: [[-12, 48], [12, 72]], minLat: 0, maxLat: 24.75, minLng: 50, maxLng: 89.75 };
    let mLat = Infinity, mxLat = -Infinity, mLng = Infinity, mxLng = -Infinity;
    depthGrid.forEach((cell) => {
      if (cell.lat < mLat) mLat = cell.lat;
      if (cell.lat > mxLat) mxLat = cell.lat;
      if (cell.lng < mLng) mLng = cell.lng;
      if (cell.lng > mxLng) mxLng = cell.lng;
    });
    const halfRes = effectiveRes / 2;
    const gBounds = [[mLat - halfRes, mLng - halfRes], [mxLat + halfRes, mxLng + halfRes]];
    const pad = effectiveRes * 1.5;
    const pBounds = [[mLat - halfRes - pad, mLng - halfRes - pad], [mxLat + halfRes + pad, mxLng + halfRes + pad]];
    return { gridBounds: gBounds, paddedBounds: pBounds, minLat: mLat, maxLat: mxLat, minLng: mLng, maxLng: mxLng };
  }, [depthGrid, effectiveRes]);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  useEffect(() => {
    setCurrentPage(1);
    setSeaFilter(null);
    setSelectedCell(null);
  }, [depth, depthGrid.length]);

  const waterBodiesArray = useMemo(() => {
    const set = new Set();
    depthGrid.forEach((cell) => {
      if (!checkIfLand(cell.lat, cell.lng)) {
        const name = parseAndTranslateApiSeaName(getWaterBodyName(cell.lat, cell.lng), t);
        if (name) set.add(name);
      }
    });
    return Array.from(set).sort();
  }, [depthGrid, t]);

  const filteredGridData = useMemo(() => {
    // Land grids are never shown in the table
    const oceanOnly = depthGrid.filter((row) => !checkIfLand(row.lat, row.lng));
    if (!seaFilter) return oceanOnly;
    return oceanOnly.filter((row) => {
      return parseAndTranslateApiSeaName(getWaterBodyName(row.lat, row.lng), t) === seaFilter;
    });
  }, [depthGrid, seaFilter, t]);

  const averages = useMemo(() => {
    const out = { argo: "0.00", transformer: "0.00", error: "0.00" };
    let n = 0;
    let sa = 0;
    let sp = 0;
    let se = 0;
    filteredGridData.forEach((cell) => {
      if (checkIfLand(cell.lat, cell.lng)) return;
      sa += cell.argo || 0;
      sp += cell.transformer || 0;
      se += cell.error || 0;
      n += 1;
    });
    if (n > 0) {
      out.argo = (sa / n).toFixed(2);
      out.transformer = (sp / n).toFixed(2);
      out.error = (se / n).toFixed(2);
    }
    return out;
  }, [filteredGridData]);

  const totalPages = Math.ceil((filteredGridData?.length || 0) / rowsPerPage);
  const paginatedData = filteredGridData?.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage) || [];

  useEffect(() => {
    if (selectedCell && filteredGridData && filteredGridData.length > 0) {
      const cellIndex = filteredGridData.findIndex((c) => c.lat === selectedCell.lat && c.lng === selectedCell.lng);
      if (cellIndex !== -1) {
        const targetPage = Math.floor(cellIndex / rowsPerPage) + 1;
        if (currentPage !== targetPage) setCurrentPage(targetPage);
      }
    }
  }, [selectedCell, filteredGridData, currentPage]);

  useEffect(() => {
    if (selectedCell) {
      const timer = setTimeout(() => {
        if (selectedRowRef.current && tableContainerRef.current) {
          const container = tableContainerRef.current;
          const row = selectedRowRef.current;
          const headerHeight = container.querySelector("thead")?.offsetHeight || 38;
          const rowRect = row.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const targetScrollTop = container.scrollTop + (rowRect.top - containerRect.top) - headerHeight;
          container.scrollTo({ top: targetScrollTop, behavior: "smooth" });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedCell, currentPage]);

  const selectCell = (cell) => {
    if (!cell) return;
    if (checkIfLand(cell.lat, cell.lng)) {
      // Mirror surface behaviour: redirect land clicks to nearest ocean cell
      let best = null;
      let bestDist = Infinity;
      depthGrid.forEach((c) => {
        if (checkIfLand(c.lat, c.lng)) return;
        const d = Math.sqrt(Math.pow(c.lat - cell.lat, 2) + Math.pow(c.lng - cell.lng, 2));
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      });
      if (!best) return;
      const sea = parseAndTranslateApiSeaName(getWaterBodyName(best.lat, best.lng), t);
      if (seaFilter !== sea) setSeaFilter(sea);
      setSelectedCell(best);
      return;
    }
    const sea = parseAndTranslateApiSeaName(getWaterBodyName(cell.lat, cell.lng), t);
    if (seaFilter !== sea) setSeaFilter(sea);
    setSelectedCell(cell);
  };

  const handleGridClick = (cell) => selectCell(cell);
  const handleRowClick = (cell) => selectCell(cell);

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
    }
  };

  // ---- theme palette (same tokens as surface dashboards) ----
  const pal = isDark ? {
    pageBg: "#0a0618",
    mapBg: "#0a0618",
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
    rowA: "#150b31",
    rowB: "#1c1140",
    dotsBg: "#150b31",
    avgBg: "rgba(30,16,64,0.9)",
    avgBorder: "1px solid rgba(168, 85, 247, 0.4)",
  } : {
    pageBg: "#eef6fd",
    mapBg: "#dbeafe",
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
    rowA: "#ffffff",
    rowB: "#f1f5f9",
    dotsBg: "#f8fafc",
    avgBg: "#f8fafc",
    avgBorder: "1px solid #e2e8f0",
  };

  return (
    <div className={`parameter-dashboard-page spatial-depth-dashboard ${isDark ? "dash-dark" : "dash-light"}`} style={isMobile ? {
      display: "flex", flexDirection: "column", gap: "12px",
      padding: "8px 12px 16px 8px",
      flex: 1, height: "auto", minHeight: "100%",
      boxSizing: "border-box", overflowY: "visible", WebkitOverflowScrolling: "touch", background: pal.pageBg,
    } : {
      display: "flex", flexDirection: "row", gap: "16px", padding: "12px", flex: 1, minHeight: 0, height: "100%", boxSizing: "border-box", background: pal.pageBg,
    }}>
      <style>{`
  .spatial-dashboard-titlebar { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px 6px; flex-wrap: wrap; flex-shrink: 0; }
  .spatial-dashboard-title { margin: 0; font-size: 12px; font-weight: 800; color: ${isDark ? "#f0abfc" : "#0c4a6e"}; display: flex; align-items: center; gap: 6px; }
  .spatial-depth-badge { background: ${isDark ? "rgba(168,85,247,0.25)" : "rgba(2,132,199,0.12)"}; color: ${isDark ? "#f0abfc" : "#0284c7"}; padding: 2px 10px; border-radius: 6px; font-size: 13px; border: 1px solid ${isDark ? "rgba(217,70,239,0.55)" : "rgba(2,132,199,0.35)"}; font-weight: 700; box-shadow: ${isDark ? "0 0 12px rgba(217,70,239,0.4)" : "none"}; }
  .spatial-model-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
  .spatial-model-tab { padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; cursor: pointer; transition: all 0.2s ease; border: ${isDark ? "1px solid rgba(168,85,247,0.45)" : "1px solid #bae6fd"}; background: transparent; color: ${isDark ? "#d8b4fe" : "#0369a1"}; }
  .spatial-model-tab.active-argo { background: #0284c7; color: #fff; border-color: transparent; box-shadow: ${isDark ? "0 0 14px rgba(34,211,238,0.5)" : "0 4px 12px rgba(2,132,199,0.3)"}; }
  .spatial-model-tab.active-transformer { background: #059669; color: #fff; border-color: transparent; box-shadow: ${isDark ? "0 0 14px rgba(52,211,153,0.5)" : "0 4px 12px rgba(5,150,105,0.3)"}; }
  .spatial-model-tab.active-error { background: ${isDark ? "#a21caf" : "#e11d48"}; color: #fff; border-color: transparent; box-shadow: ${isDark ? "0 0 14px rgba(217,70,239,0.5)" : "0 4px 12px rgba(225,29,72,0.3)"}; }
  .dash-corner-badge {
    background: ${isDark ? "rgba(10,6,24,0.9)" : "#ffffff"}; border: ${isDark ? "1px solid rgba(217,70,239,0.45)" : "1px solid #bbf7d0"}; padding: 3px 8px; border-radius: 20px;
    color: ${isDark ? "#f0abfc" : "#166534"}; font-size: 9.5px; font-family: 'JetBrains Mono', monospace; font-weight: 700;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04); display: inline-flex; gap: 4px;
  }
  .matrix-table-row { transition: background 0.15s ease; cursor: pointer; }
  .matrix-table-row:hover:not(.selected-row) { background: ${isDark ? "rgba(168,85,247,0.18)" : "#e0f2fe"} !important; }
`}</style>

      {/* LEFT: live map engine (same as surface maps) */}
      <div className="dashboard-map-area" style={isMobile ? {
        flex: "none", width: "100%", height: "45vh", minHeight: "350px", background: pal.mapBg, padding: 0,
        boxSizing: "border-box", position: "relative", borderRadius: "14px", overflow: "hidden", isolation: "isolate", transform: "translateZ(0)",
        display: "flex", flexDirection: "column",
      } : {
        flex: "0 0 62%", background: pal.mapBg, position: "relative", borderRadius: "14px",
        overflow: "hidden", isolation: "isolate", height: "100%", minHeight: 0,
        display: "flex", flexDirection: "column",
        boxShadow: isDark ? "0 0 28px rgba(168,85,247,0.3)" : "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      }}>
        <div className="spatial-dashboard-titlebar">
          <h3 className="spatial-dashboard-title">
            🌊 {t("spatialTitle")} <span className="spatial-depth-badge">{depthNum.toFixed(1)}m</span>
          </h3>
          <div className="spatial-model-tabs">
            {MODELS.map((m) => (
              <button
                key={m.id}
                className={`spatial-model-tab ${model === m.id ? `active-${m.id}` : ""}`}
                onClick={() => setModel(m.id)}
              >
                {m.short}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
          {(isGeneratingGrid || isRendering) && (
            <div className="dash-loading-overlay" style={{ position: "absolute", inset: 0, zIndex: 9999, background: pal.loadingBg, backdropFilter: "blur(6px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div className={isDark ? "ocean-spinner" : "spinner"}></div>
              <div style={{ color: pal.loadingText, marginTop: "16px", fontWeight: "bold", textAlign: "center", padding: "0 20px" }}>
                {t("loadingHeatmap") || "Processing High-Resolution Data..."}<br />
                <span style={{ fontSize: "12px", opacity: 0.8, fontWeight: "normal", color: pal.loadingSub }}>This may take a moment</span>
              </div>
            </div>
          )}

          <MapContainer preferCanvas={true} ref={mapRef} center={[centerLat, centerLng]} zoomSnap={0} style={{ height: "100%", width: "100%", backgroundColor: pal.mapBg, position: "absolute", inset: 0 }} zoomControl={false} attributionControl={false}>
            <TileLayer noWrap={true} url={tileUrl} />
            {!isGeneratingGrid && renderGrid && (
              <GridOverlay
                gridData={depthGrid}
                parameter={model}
                selectedCell={selectedCell}
                onGridClick={handleGridClick}
                resolution={effectiveRes}
                showTooltip={depthGrid && depthGrid.length < 1500}
              />
            )}
            <MaskHole bounds={gridBounds} color={pal.maskColor} />
            <DashboardMapController gridBounds={gridBounds} paddedBounds={paddedBounds} isGeneratingGrid={isGeneratingGrid} />
          </MapContainer>
          <MapControlOverlay onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onReset={handleReset} isDark={isDark} />
        </div>
      </div>

      {/* RIGHT: same data engine as surface parameter maps, per depth */}
      <div className="dashboard-data-area custom-scrollbar" style={isMobile ? {
        position: "relative", display: "flex", flexDirection: "column", flex: "none", width: "100%", height: "auto", overflow: "visible",
      } : {
        position: "relative", display: "flex", flexDirection: "column", flex: "1", minWidth: 0, height: "100%", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginBottom: "6px", flexShrink: 0 }}>
          <button className="heatmap-action-btn fill" style={isMobile ? { flex: 1 } : undefined} onClick={onBack}>{t("back") || "Back to Map"}</button>
        </div>

        <div className="dash-water-card" style={{ background: pal.cardBg, padding: "8px 10px", borderRadius: "10px", border: pal.cardBorder, marginBottom: "6px", flexShrink: 0 }}>
          <span style={{ fontSize: "10px", color: pal.labelBlue, fontWeight: "800", textTransform: "uppercase" }}>
            {t("coveredWaterBodies") || t("waterBody") || "Water Bodies"} ({t("clickToFilter") || "Click to filter table"}) · {depthNum.toFixed(0)}m
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "6px" }}>
            <span
              onClick={() => { setSeaFilter(null); setSelectedCell(null); setCurrentPage(1); }}
              style={{ cursor: "pointer", background: seaFilter === null ? pal.chipOn : pal.chipOff, color: seaFilter === null ? "#ffffff" : pal.chipOffText, padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", border: pal.cardBorder, transition: "all 0.2s ease" }}
            >
              🌍 {t("all") || "All"}
            </span>
            {waterBodiesArray.map((sea, idx) => (
              <span
                key={idx}
                onClick={() => { setSeaFilter(sea === seaFilter ? null : sea); setSelectedCell(null); setCurrentPage(1); }}
                style={{ cursor: "pointer", background: seaFilter === sea ? pal.chipOn : pal.chipOff, color: seaFilter === sea ? "#ffffff" : pal.chipOffText, padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", border: pal.cardBorder, transition: "all 0.2s ease" }}
              >
                🌊 {sea}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "6px", flexShrink: 0 }}>
          {[
            { id: "argo", label: "ARGO Avg", val: averages.argo },
            { id: "transformer", label: "PRED Avg", val: averages.transformer },
            { id: "error", label: "ERR Avg", val: averages.error },
          ].map((a) => (
            <div
              key={a.id}
              onClick={() => setModel(a.id)}
              className="dash-avg-card"
              style={{ background: pal.avgBg, padding: "5px 10px", borderRadius: "8px", border: model === a.id ? `2px solid ${pal.chipOn}` : pal.avgBorder, cursor: "pointer" }}
            >
              <span style={{ fontSize: "8.5px", color: pal.muted, fontWeight: "800", textTransform: "uppercase" }}>{a.label}</span>
              <div style={{ fontSize: "13px", fontWeight: "900", color: pal.textAccent }}>{a.val}°C</div>
            </div>
          ))}
        </div>

        {selectedCell && (
          <div className="dash-selected-card" style={{ background: pal.selCardBg, border: pal.selCardBorder, padding: "10px", borderRadius: "10px", marginBottom: "6px", textAlign: "center", flexShrink: 0 }}>
            <div style={{ marginBottom: "8px", fontSize: "10px", color: isDark ? "#f0abfc" : "#14532d", fontWeight: "800", letterSpacing: "0.5px" }}>
              📍 {t("selectedGrid")?.toUpperCase()} ({parseAndTranslateApiSeaName(getWaterBodyName(selectedCell.lat, selectedCell.lng), t)}) · {depthNum.toFixed(0)}m ➔{" "}
              <span style={{ color: isDark ? "#67e8f9" : "#059669" }}>ARGO {selectedCell.argo}°C / PRED {selectedCell.transformer}°C / ERR {selectedCell.error}°C</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px" }}>
              {(() => {
                const c = getGridCorners(selectedCell.lat, selectedCell.lng, effectiveRes, t);
                return (
                  <>
                    <span className="dash-corner-badge"><span style={{ color: "#22c55e", opacity: 0.8 }}>{t("dirNW") || "NW"}</span>{c.nw.lat}, {c.nw.lng}</span>
                    <span className="dash-corner-badge"><span style={{ color: "#22c55e", opacity: 0.8 }}>{t("dirNE") || "NE"}</span>{c.ne.lat}, {c.ne.lng}</span>
                    <span className="dash-corner-badge"><span style={{ color: "#22c55e", opacity: 0.8 }}>{t("dirSW") || "SW"}</span>{c.sw.lat}, {c.sw.lng}</span>
                    <span className="dash-corner-badge"><span style={{ color: "#22c55e", opacity: 0.8 }}>{t("dirSE") || "SE"}</span>{c.se.lat}, {c.se.lng}</span>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px", padding: "0 2px", flexShrink: 0 }}>
          <h4 style={{ margin: 0, fontSize: "11px", fontWeight: "800", color: pal.labelBlue, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            📊 {seaFilter ? `${seaFilter} ${t("matrix") || "Matrix"}` : (t("regionalGridDataMatrix") || "Regional Grid Data Matrix")} · {depthNum.toFixed(0)}m
          </h4>
          <span style={{ fontSize: "10px", fontWeight: "700", color: pal.muted }}>{filteredGridData.length} cells</span>
        </div>

        <div ref={tableContainerRef} className="custom-scrollbar dash-table-wrap" style={isMobile ? {
          flex: "none", height: "400px", overflowX: "auto", overflowY: "auto", border: `1px solid ${pal.tableBorder}`,
          borderTopLeftRadius: "10px", borderTopRightRadius: "10px", position: "relative", WebkitOverflowScrolling: "touch", paddingRight: "8px", background: pal.rowA,
        } : {
          flex: 1, minHeight: "220px", overflowX: "auto", overflowY: "auto", border: `1px solid ${pal.tableBorder}`,
          borderTopLeftRadius: "10px", borderTopRightRadius: "10px", position: "relative", background: pal.rowA,
        }}>
          <table className="dash-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "640px" }}>
            <thead style={{ position: "sticky", top: 0, background: pal.theadBg, zIndex: 10 }}>
              <tr>
                <th style={{ padding: "8px", borderBottom: `2px solid ${pal.tableBorder}`, color: pal.muted, fontWeight: "700", textAlign: "left", width: "200px" }}>{t("gridCorners") || "Grid Corners"}</th>
                <th style={{ padding: "8px", borderBottom: `2px solid ${pal.tableBorder}`, color: pal.muted, fontWeight: "700", textAlign: "left" }}>{t("depth") || "Depth"}</th>
                <th style={{ padding: "8px", borderBottom: `2px solid ${pal.tableBorder}`, color: pal.muted, fontWeight: "700", textAlign: "center" }}>ARGO °C</th>
                <th style={{ padding: "8px", borderBottom: `2px solid ${pal.tableBorder}`, color: pal.muted, fontWeight: "700", textAlign: "center" }}>PRED °C</th>
                <th style={{ padding: "8px", borderBottom: `2px solid ${pal.tableBorder}`, color: pal.muted, fontWeight: "700", textAlign: "center" }}>ERR °C</th>
                <th style={{ padding: "8px", borderBottom: `2px solid ${pal.tableBorder}`, color: pal.muted, fontWeight: "700", textAlign: "right" }}>{t("waterBody") || "Water Body"}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => {
                const isSelected = selectedCell && selectedCell.lat === row.lat && selectedCell.lng === row.lng;
                const isLand = checkIfLand(row.lat, row.lng);
                const rowWaterBody = isLand ? (t("land") || "Land") : parseAndTranslateApiSeaName(getWaterBodyName(row.lat, row.lng), t);
                const corners = getGridCorners(row.lat, row.lng, effectiveRes, t);
                return (
                  <tr
                    key={`${row.lat}-${row.lng}-${idx}`}
                    ref={isSelected ? selectedRowRef : null}
                    onClick={() => handleRowClick(row)}
                    className={`matrix-table-row ${isSelected ? "selected-row" : ""}`}
                    style={{ background: isSelected ? (isDark ? "rgba(168, 85, 247, 0.28)" : "rgba(14, 165, 233, 0.2)") : (idx % 2 === 0 ? pal.rowA : pal.rowB), cursor: "pointer" }}
                  >
                    <td style={{ padding: "6px 8px", borderBottom: `1px solid ${pal.tableBorder}`, whiteSpace: "nowrap" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "max-content max-content", gap: "2px 8px", fontSize: "8.5px", color: isSelected ? pal.textAccent : pal.rowText, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.2px" }}>
                        <span><b style={{ opacity: 0.5, fontWeight: 800 }}>{t("dirNW") || "NW"}</b> {corners.nw.lat}, {corners.nw.lng}</span>
                        <span><b style={{ opacity: 0.5, fontWeight: 800 }}>{t("dirNE") || "NE"}</b> {corners.ne.lat}, {corners.ne.lng}</span>
                        <span><b style={{ opacity: 0.5, fontWeight: 800 }}>{t("dirSW") || "SW"}</b> {corners.sw.lat}, {corners.sw.lng}</span>
                        <span><b style={{ opacity: 0.5, fontWeight: 800 }}>{t("dirSE") || "SE"}</b> {corners.se.lat}, {corners.se.lng}</span>
                      </div>
                    </td>
                    <td style={{ padding: "6px 8px", borderBottom: `1px solid ${pal.tableBorder}`, whiteSpace: "nowrap", fontSize: "11px", color: pal.rowText }}>{depthNum.toFixed(0)}m</td>
                    <td style={{ padding: "6px 8px", borderBottom: `1px solid ${pal.tableBorder}`, textAlign: "center", fontWeight: isSelected ? "800" : "600", color: isSelected ? pal.textAccent : pal.textMain }}>{row.argo}</td>
                    <td style={{ padding: "6px 8px", borderBottom: `1px solid ${pal.tableBorder}`, textAlign: "center", fontWeight: isSelected ? "800" : "600", color: isSelected ? pal.textAccent : pal.textMain }}>{row.transformer}</td>
                    <td style={{ padding: "6px 8px", borderBottom: `1px solid ${pal.tableBorder}`, textAlign: "center", fontWeight: isSelected ? "800" : "600", color: isSelected ? pal.textAccent : pal.textMain }}>{row.error}</td>
                    <td style={{ padding: "6px 8px", borderBottom: `1px solid ${pal.tableBorder}`, color: isLand ? pal.rowText : pal.textAccent, fontWeight: "600", whiteSpace: "nowrap", fontSize: "11px", textAlign: "right" }}>{rowWaterBody}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="dash-pager" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: pal.dotsBg, border: `1px solid ${pal.tableBorder}`, borderTop: "none", borderBottomLeftRadius: "10px", borderBottomRightRadius: "10px", flexShrink: 0 }}>
            <button className="heatmap-action-btn outline" style={{ padding: "4px 10px", fontSize: "11px", minHeight: "auto", opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }} disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Previous</button>
            <span style={{ fontSize: "11px", fontWeight: "700", color: pal.muted }}>Page {currentPage} of {totalPages}</span>
            <button className="heatmap-action-btn outline" style={{ padding: "4px 10px", fontSize: "11px", minHeight: "auto", opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }} disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
>>>>>>> origin/main
