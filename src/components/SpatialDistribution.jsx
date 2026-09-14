import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, Polygon } from "react-leaflet";
import GridOverlay from "./GridOverlay";
import { arabianSeaTemperatureData, bayOfBengalTemperatureData } from "../data/dummyOceanData";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { getTileUrl } from "../utils/mapTiles";
import Icon from "./icons";
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

function MapControlOverlay({ onZoomIn, onZoomOut, onReset }) {
  const btn = "oe-focus-visible flex h-[38px] w-[38px] items-center justify-center rounded-lg border text-[18px] font-bold backdrop-blur-md cursor-pointer border-ink/10 bg-paper/90 text-accent dark:border-paper/20 dark:bg-ink dark:text-paper";
  return (
    <div className="absolute right-4 top-4 z-[1000] flex flex-row gap-2" onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={onZoomIn} title="Zoom In" aria-label="Zoom in" className={btn}>+</button>
      <button type="button" onClick={onZoomOut} title="Zoom Out" aria-label="Zoom out" className={btn}>−</button>
      <button type="button" onClick={onReset} title="Reset View" aria-label="Reset view" className={`${btn} text-[16px]`}>
        <Icon name="reset" size={16} />
      </button>
    </div>
  );
}

const MODELS = [
  { id: "argo", short: "Argo" },
  { id: "transformer", short: "Pred" },
  { id: "error", short: "Error" },
];

export default function SpatialDistribution({
  depth,
  initialFocus,
  onBack,
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

  const maskColor = isDark ? "#132730" : "#F7F4ED";
  const mapBg = isDark ? "#132730" : "#F7F4ED";

  const chip = (active) =>
    `cursor-pointer rounded-lg border px-2 py-[3px] text-[11px] font-bold transition-colors
      ${active
        ? "border-transparent bg-accent text-white dark:bg-accent"
        : "border-ink/10 bg-paper text-accent hover:bg-ink/[0.06] dark:border-paper/15 dark:bg-paper/[0.05] dark:text-paper dark:hover:bg-paper/10"}`;

  const th = "border-b-2 border-ink/10 p-2 font-bold dark:border-paper/10";
  const td = "border-b border-ink/10 p-1.5 dark:border-paper/10";
  const cornerBadge = "inline-flex gap-1 rounded-lg border border-ink/10 bg-paper px-2 py-[3px] font-mono text-[11px] text-ink/70 dark:border-paper/10 dark:bg-paper/[0.05] dark:text-paper/70";

  const tabActive = {
    argo: "bg-ink text-paper border-transparent dark:bg-paper dark:text-ink",
    transformer: "bg-ink text-paper border-transparent dark:bg-paper dark:text-ink",
    error: "bg-ink text-paper border-transparent dark:bg-paper dark:text-ink",
  };

  return (
    <div className={isMobile
      ? "flex min-h-full flex-1 flex-col gap-3 bg-paper px-2 pb-4 pt-2 dark:bg-ink"
      : "flex h-full min-h-0 flex-1 flex-row gap-4 bg-paper p-3 dark:bg-ink"}>

      {/* LEFT: live map engine (same as surface maps) */}
      <div className={isMobile
        ? "flex w-full flex-none flex-col rounded-lg bg-ink/[0.06] dark:bg-ink"
        : "flex h-full min-h-0 flex-[0_0_62%] flex-col overflow-hidden rounded-lg border border-ink/10 bg-ink/[0.06] dark:border-paper/10 dark:bg-ink"}
        style={isMobile ? { height: "max(350px, 45dvh)", minHeight: 350 } : undefined}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-2.5 pb-1.5 pt-2">
          <h3 className="m-0 flex items-center gap-1.5 text-[12px] font-bold text-accent dark:text-paper">
            <Icon name="waves" size={14} />
            {t("spatialTitle")}
            <span className="rounded-lg border border-ink/15 bg-accent/10 px-2.5 py-0.5 text-[13px] font-bold text-accent dark:border-paper/20 dark:bg-accent/20 dark:text-paper">
              {depthNum.toFixed(1)}m
            </span>
          </h3>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Depth model">
            {MODELS.map((m) => (
              <button
                key={m.id}
                role="tab"
                aria-selected={model === m.id}
                className={`oe-focus-visible cursor-pointer rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors
                  ${model === m.id
                    ? tabActive[m.id]
                    : "border-ink/10 bg-transparent text-accent hover:bg-ink/[0.06] dark:border-paper/20 dark:bg-transparent dark:text-paper dark:hover:bg-paper/10"}`}
                onClick={() => setModel(m.id)}
              >
                {m.short}
              </button>
            ))}
          </div>
        </div>

        <div className="relative min-h-0 flex-1">
          {(isGeneratingGrid || isRendering) && (
            <div className="absolute inset-0 z-modal flex flex-col items-center justify-center bg-paper/90 px-5 text-center backdrop-blur-md dark:bg-ink/95">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-ink/10 border-t-accent dark:border-paper/15 dark:border-t-paper" />
              <div className="mt-4 font-bold text-accent dark:text-paper">
                {t("loadingHeatmap") || "Processing High-Resolution Data..."}<br />
                <span className="text-[12px] font-normal opacity-80">This may take a moment</span>
              </div>
            </div>
          )}

          <MapContainer preferCanvas={true} ref={mapRef} center={[centerLat, centerLng]} zoomSnap={0} style={{ height: "100%", width: "100%", backgroundColor: mapBg, position: "absolute", inset: 0 }} zoomControl={false} attributionControl={false}>
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
            <MaskHole bounds={gridBounds} color={maskColor} />
            <DashboardMapController gridBounds={gridBounds} paddedBounds={paddedBounds} isGeneratingGrid={isGeneratingGrid} />
          </MapContainer>
          <MapControlOverlay onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onReset={handleReset} />
        </div>
      </div>

      {/* RIGHT: same data engine as surface parameter maps, per depth */}
      <div className={isMobile
        ? "relative flex w-full flex-none flex-col"
        : "relative flex h-full min-w-0 flex-1 flex-col overflow-y-auto"}>
        <div className="mb-1.5 flex shrink-0 justify-end gap-2">
          <button
            type="button"
            onClick={onBack}
            className={`oe-focus-visible rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:brightness-95 ${isMobile ? "flex-1" : ""}`}
          >
            {t("back") || "Back to Map"}
          </button>
        </div>

        <div className="mb-1.5 shrink-0 rounded-lg border border-ink/10 bg-ink/[0.03] px-2.5 py-2 dark:border-paper/20 dark:bg-paper/[0.04]">
          <span className="text-[10px] font-bold text-accent dark:text-paper">
            {t("coveredWaterBodies") || t("waterBody") || "Water Bodies"} ({t("clickToFilter") || "Click to filter table"}) · {depthNum.toFixed(0)}m
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span onClick={() => { setSeaFilter(null); setSelectedCell(null); setCurrentPage(1); }} className={chip(seaFilter === null)}>
              <span className="mr-1 inline-flex align-[-2px]"><Icon name="globe" size={12} /></span>{t("all") || "All"}
            </span>
            {waterBodiesArray.map((sea, idx) => (
              <span
                key={idx}
                onClick={() => { setSeaFilter(sea === seaFilter ? null : sea); setSelectedCell(null); setCurrentPage(1); }}
                className={chip(seaFilter === sea)}
              >
                <span className="mr-1 inline-flex align-[-2px]"><Icon name="waves" size={12} /></span>{sea}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-1.5 grid shrink-0 grid-cols-3 gap-1.5">
          {[
            { id: "argo", label: "ARGO Avg", val: averages.argo },
            { id: "transformer", label: "PRED Avg", val: averages.transformer },
            { id: "error", label: "ERR Avg", val: averages.error },
          ].map((a) => (
            <div
              key={a.id}
              onClick={() => setModel(a.id)}
              className={`cursor-pointer rounded-lg border bg-ink/[0.03] px-2.5 py-1 dark:bg-paper/[0.05]
                ${model === a.id ? "border-2 border-accent dark:border-accent" : "border-ink/10 dark:border-paper/10"}`}
            >
              <span className="text-[11px] font-semibold text-ink/60 dark:text-paper/60">{a.label}</span>
              <div className="font-mono text-[13px] text-ink tabular-nums dark:text-paper">{a.val}°C</div>
            </div>
          ))}
        </div>

        {selectedCell && (
          <div className="mb-1.5 shrink-0 rounded-lg border border-accent/40 bg-accent/[0.07] p-2.5 text-center dark:border-paper/20 dark:bg-accent/15">
            <div className="mb-2 text-[10px] font-bold text-ink dark:text-paper">
              <span className="mr-1 inline-flex align-[-2px]"><Icon name="pin" size={12} /></span>
              {t("selectedGrid")} ({parseAndTranslateApiSeaName(getWaterBodyName(selectedCell.lat, selectedCell.lng), t)}) · {depthNum.toFixed(0)}m →{" "}
              <span className="text-accent dark:text-paper">ARGO {selectedCell.argo}°C / PRED {selectedCell.transformer}°C / ERR {selectedCell.error}°C</span>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {(() => {
                const c = getGridCorners(selectedCell.lat, selectedCell.lng, effectiveRes, t);
                return (
                  <>
                    <span className={cornerBadge}><span className="opacity-60">{t("dirNW") || "NW"}</span>{c.nw.lat}, {c.nw.lng}</span>
                    <span className={cornerBadge}><span className="opacity-60">{t("dirNE") || "NE"}</span>{c.ne.lat}, {c.ne.lng}</span>
                    <span className={cornerBadge}><span className="opacity-60">{t("dirSW") || "SW"}</span>{c.sw.lat}, {c.sw.lng}</span>
                    <span className={cornerBadge}><span className="opacity-60">{t("dirSE") || "SE"}</span>{c.se.lat}, {c.se.lng}</span>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        <div className="mb-1 flex shrink-0 items-center justify-between px-0.5">
          <h4 className="m-0 flex items-center gap-1 text-[11px] font-bold text-accent dark:text-paper">
            <Icon name="grid" size={13} />
            {seaFilter ? `${seaFilter} ${t("matrix") || "Matrix"}` : (t("regionalGridDataMatrix") || "Regional Grid Data Matrix")} · {depthNum.toFixed(0)}m
          </h4>
          <span className="text-[10px] font-bold text-ink/60 dark:text-paper/60">{filteredGridData.length} cells</span>
        </div>

        <div ref={tableContainerRef} className={isMobile
          ? "h-[400px] flex-none overflow-auto rounded-t-[10px] border border-ink/10 bg-paper pr-2 dark:border-paper/10 dark:bg-paper/[0.05]"
          : "min-h-[220px] flex-1 overflow-auto rounded-t-[10px] border border-ink/10 bg-paper dark:border-paper/10 dark:bg-paper/[0.05]"}>
          <table className="w-full min-w-[640px] border-collapse text-[12px]">
            <thead className="sticky top-0 z-[10] bg-ink/[0.03] dark:bg-ink">
              <tr className="text-left text-ink/60 dark:text-paper/60">
                <th className={`${th} w-[200px] font-bold`}>{t("gridCorners") || "Grid Corners"}</th>
                <th className={`${th} font-bold`}>{t("depth") || "Depth"}</th>
                <th className={`${th} text-center font-bold`}>ARGO °C</th>
                <th className={`${th} text-center font-bold`}>PRED °C</th>
                <th className={`${th} text-center font-bold`}>ERR °C</th>
                <th className={`${th} text-right font-bold`}>{t("waterBody") || "Water Body"}</th>
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
                    className={`cursor-pointer transition-colors ${isSelected ? "bg-accent/15 dark:bg-accent/25" : idx % 2 === 0 ? "bg-paper hover:bg-ink/[0.06] dark:bg-paper/[0.05] dark:hover:bg-paper/10" : "bg-ink/[0.03] hover:bg-ink/[0.06] dark:bg-paper/[0.02] dark:hover:bg-paper/10"}`}
                  >
                    <td className={`${td} whitespace-nowrap`}>
                      <div className={`grid grid-cols-[max-content_max-content] gap-x-2 gap-y-0.5 font-mono text-[8.5px] tracking-tight ${isSelected ? "text-accent dark:text-paper" : "text-ink/60 dark:text-paper/60"}`}>
                        <span><b className="font-bold opacity-50">{t("dirNW") || "NW"}</b> {corners.nw.lat}, {corners.nw.lng}</span>
                        <span><b className="font-bold opacity-50">{t("dirNE") || "NE"}</b> {corners.ne.lat}, {corners.ne.lng}</span>
                        <span><b className="font-bold opacity-50">{t("dirSW") || "SW"}</b> {corners.sw.lat}, {corners.sw.lng}</span>
                        <span><b className="font-bold opacity-50">{t("dirSE") || "SE"}</b> {corners.se.lat}, {corners.se.lng}</span>
                      </div>
                    </td>
                    <td className={`${td} whitespace-nowrap text-[11px] text-ink/60 dark:text-paper/60`}>{depthNum.toFixed(0)}m</td>
                    <td className={`${td} text-center font-semibold ${isSelected ? "font-bold text-accent dark:text-paper" : "text-ink dark:text-paper"}`}>{row.argo}</td>
                    <td className={`${td} text-center font-semibold ${isSelected ? "font-bold text-accent dark:text-paper" : "text-ink dark:text-paper"}`}>{row.transformer}</td>
                    <td className={`${td} text-center font-semibold ${isSelected ? "font-bold text-accent dark:text-paper" : "text-ink dark:text-paper"}`}>{row.error}</td>
                    <td className={`${td} whitespace-nowrap text-right text-[11px] font-semibold ${isLand ? "text-ink/60 dark:text-paper/60" : "text-accent dark:text-paper"}`}>{rowWaterBody}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex shrink-0 items-center justify-between rounded-b-[10px] border border-t-0 border-ink/10 bg-ink/[0.03] px-3 py-2 dark:border-paper/10 dark:bg-paper/[0.05]">
            <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="oe-focus-visible rounded-lg border border-accent px-2.5 py-1 text-[11px] text-accent disabled:cursor-not-allowed disabled:opacity-50 dark:border-paper/20 dark:text-paper">Previous</button>
            <span className="text-[11px] font-bold text-ink/60 dark:text-paper/60">Page {currentPage} of {totalPages}</span>
            <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="oe-focus-visible rounded-lg border border-accent px-2.5 py-1 text-[11px] text-accent disabled:cursor-not-allowed disabled:opacity-50 dark:border-paper/20 dark:text-paper">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
