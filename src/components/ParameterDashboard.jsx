import React, { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap, Polygon } from "react-leaflet";
import GridOverlay from "./GridOverlay";
import CustomDropdown from "./CustomDropdown";
import Icon from "./icons";
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

export default function ParameterDashboard({ parameter, date, gridData, onShowAllMaps, onBack, triggerNotification, activeResolution, userResolution, setUserResolution, isCurrentLocationOutside, isGeneratingGrid, isGridLive }) {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const tileUrl = getTileUrl(isDark);
  const maskColor = isDark ? "#132730" : "#F7F4ED";
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

  const chip = (active) =>
    `cursor-pointer rounded-lg border px-2.5 py-1 text-[12px] font-bold transition-colors
      ${active
        ? "border-transparent bg-accent text-white dark:bg-accent"
        : "border-ink/10 bg-paper text-accent hover:bg-ink/[0.06] dark:border-paper/15 dark:bg-paper/[0.05] dark:text-paper dark:hover:bg-paper/10"}`;

  const actionBtn = (primary) =>
    `oe-focus-visible rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors
      ${primary
        ? "bg-accent text-white hover:brightness-95"
        : "border border-ink/15 text-ink hover:bg-ink/[0.05] dark:border-paper/20 dark:text-paper dark:hover:bg-paper/10"}`;

  const th = "border-b-2 border-ink/10 p-2 font-bold dark:border-paper/10";
  const td = "border-b border-ink/10 p-1.5 dark:border-paper/10";

  return (
    <div className={isMobile
      ? "flex min-h-full flex-1 flex-col gap-3 overflow-y-visible bg-paper px-2 pb-4 pt-2 dark:bg-ink"
      : "flex h-full min-h-0 flex-1 flex-row gap-4 bg-paper p-3 dark:bg-ink"}>

      {/* HEATMAP RENDERING AREA */}
      <div className={isMobile
        ? "relative h-[max(350px,45dvh)] w-full flex-none overflow-hidden rounded-lg bg-ink/[0.06] dark:bg-ink"
        : "relative h-full min-h-0 flex-[0_0_62%] overflow-hidden rounded-lg border border-ink/10 bg-ink/[0.06] dark:border-paper/10 dark:bg-ink"}>

        {(isGeneratingGrid || isRendering) && (
          <div className="absolute inset-0 z-modal flex flex-col items-center justify-center bg-paper/90 px-5 text-center backdrop-blur-md dark:bg-ink/95">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-ink/10 border-t-accent dark:border-paper/15 dark:border-t-paper" />
            <div className="mt-4 font-bold text-accent dark:text-paper">
              {t("loadingHeatmap") || "Processing High-Resolution Data..."}<br/>
              <span className="text-[12px] font-normal opacity-80">This may take a moment</span>
            </div>
          </div>
        )}

        <MapContainer preferCanvas={true} ref={mapRef} center={[centerLat, centerLng]} zoomSnap={0} style={{ height: "100%", width: "100%", backgroundColor: isDark ? "#132730" : "#F7F4ED", position: "absolute", inset: 0 }} zoomControl={false} attributionControl={false}>
          <TileLayer noWrap={true} url={tileUrl} />
          {!isGeneratingGrid && renderGrid && <GridOverlay gridData={gridData} parameter={parameter} selectedCell={selectedCell} onGridClick={handleGridClick} resolution={activeResolution} showTooltip={gridData && gridData.length < 1500} />}
          <MaskHole bounds={gridBounds} color={maskColor} />
          <DashboardMapController gridBounds={gridBounds} paddedBounds={paddedBounds} isGeneratingGrid={isGeneratingGrid} />
        </MapContainer>
        <MapControlOverlay onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onReset={handleReset} />
      </div>

      {/* DATA AREA & SIDEPANEL FLOW */}
      <div className={isMobile
        ? "relative flex w-full flex-none flex-col"
        : "relative flex h-full min-w-0 flex-1 flex-col overflow-y-auto"}>
        {isMobile && openResolutionDropdown && (
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpenResolutionDropdown(false)} />
        )}

        <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2.5">
          <div className={isMobile ? "relative z-[9999] w-full" : "flex items-center gap-2"}>
            {!isMobile && <span className="text-[10px] font-bold text-accent dark:text-paper">{t("changeResolution") || "Resolution"}:</span>}

            {isMobile ? (
              <>
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={openResolutionDropdown}
                  disabled={!isCurrentLocationOutside}
                  onClick={(e) => { e.stopPropagation(); setOpenResolutionDropdown(!openResolutionDropdown); }}
                  className="oe-focus-visible flex w-full items-center justify-between rounded-lg border border-ink/10 bg-paper px-3 text-left text-[13px] font-semibold text-ink disabled:opacity-60
                    dark:border-paper/20 dark:bg-paper/[0.07] dark:text-paper"
                  style={{ height: 42 }}
                >
                  <span>{isCurrentLocationOutside && userResolution ? `${userResolution}°` : !isCurrentLocationOutside ? `0.25° (${t("fixed")})` : t("selectResolution")}</span>
                  <Icon name="chevronDown" size={13} className={`opacity-75 transition-transform ${openResolutionDropdown ? "rotate-180" : ""}`} />
                </button>
                {openResolutionDropdown && isCurrentLocationOutside && (
                  <div role="listbox" className="absolute inset-x-0 top-[calc(100%+4px)] z-dropdown max-h-44 overflow-y-auto rounded-lg border border-ink/10 bg-paper p-1.5 shadow-lift dark:border-paper/20 dark:bg-paper/[0.07]">
                    {resolutionOptions.map((res) => {
                      const isSel = Number(userResolution) === Number(res);
                      return (
                        <div
                          key={res}
                          role="option"
                          aria-selected={isSel}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenResolutionDropdown(false);
                            if (triggerNotification) triggerNotification((t("resUpdated") || "Resolution updated to {res}°").replace("{res}", res));
                            setTimeout(() => setUserResolution(Number(res)), 50);
                          }}
                          className={`cursor-pointer rounded-lg px-3 py-2 text-[13px] font-semibold ${isSel ? "bg-accent text-white dark:bg-accent" : "text-ink hover:bg-ink/[0.06] dark:text-paper dark:hover:bg-paper/10"}`}
                        >
                          {res}°
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="min-w-[120px]">
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

          <div className={`flex gap-2 ${isMobile ? "w-full" : ""}`}>
            <span className={`oe-live-badge self-center ${isGeneratingGrid ? "is-fallback" : isGridLive ? "is-live" : "is-fallback"}`}>
              {isGeneratingGrid ? "◌ Loading…" : isGridLive ? "● Live" : "○ Synthetic"}
            </span>
            <button type="button" onClick={onShowAllMaps} className={`${actionBtn(false)} ${isMobile ? "flex-1" : ""}`}>{t("allHeatMaps") || "All Heat Maps"}</button>
            <button type="button" onClick={onBack} className={`${actionBtn(true)} ${isMobile ? "flex-1" : ""}`}>{t("back") || "Back to Map"}</button>
          </div>
        </div>

        <div className="mb-3 shrink-0 rounded-lg border border-ink/10 bg-ink/[0.03] p-3 dark:border-paper/20 dark:bg-paper/[0.04]">
          <span className="text-[10px] font-bold text-accent dark:text-paper">
            {t("waterBody") || "Water Bodies"} ({t("clickToFilter") || "Click to filter table"})
          </span>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span onClick={() => { setSeaFilter(null); setSelectedCell(null); setCurrentPage(1); }} className={chip(seaFilter === null)}>
              <span className="mr-1 inline-flex align-[-2px]"><Icon name="globe" size={12} /></span>{t("all") || "All"}
            </span>
            {waterBodiesArray.map((rawSea, idx) => {
              const displaySea = parseAndTranslateApiSeaName(rawSea, t);
              return (
                <span key={idx} onClick={() => { setSeaFilter(rawSea === seaFilter ? null : rawSea); setSelectedCell(null); setCurrentPage(1); }} className={chip(seaFilter === rawSea)}>
                  <span className="mr-1 inline-flex align-[-2px]"><Icon name="waves" size={12} /></span>{displaySea}
                </span>
              );
            })}
          </div>
          <div className="mt-3 flex justify-between border-t border-ink/10 pt-2.5 dark:border-paper/20">
            <div>
              <span className="text-[9px] font-bold text-accent dark:text-paper">{t("selectedParameter") || "Parameter"}</span>
              <strong className="block text-[12px] text-ink dark:text-paper">{paramLabel}</strong>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-accent dark:text-paper">{seaFilter ? `${parseAndTranslateApiSeaName(seaFilter, t)} ${t("regionalAverage") || "Average"}` : (t("regionalAverage") || "Average")}</span>
              <strong className="block text-[16px] font-bold text-accent dark:text-paper">{averageValue}</strong>
            </div>
          </div>
        </div>

        {selectedCell && (
          <div className="mb-3 shrink-0 rounded-lg border border-accent/40 bg-accent/[0.07] p-2.5 text-center dark:border-paper/20 dark:bg-accent/15">
            <div className="mb-2 text-[10px] font-bold text-ink dark:text-paper">
              <span className="mr-1 inline-flex align-[-2px]"><Icon name="pin" size={12} /></span>
              {t("selectedGrid")} ({
                checkIfLand(selectedCell.lat, selectedCell.lng)
                  ? (t("land") || "Land")
                  : parseAndTranslateApiSeaName(getWaterBodyName(selectedCell.lat, selectedCell.lng), t)
              }) → <span className="text-accent dark:text-paper">{selectedCell[parameter]}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {(() => {
                const c = getGridCorners(selectedCell.lat, selectedCell.lng, activeResolution, t);
                return (
                  <>
                    <span className="inline-flex gap-1 rounded-lg border border-ink/10 bg-paper px-2 py-[3px] font-mono text-[11px] text-ink/70 dark:border-paper/10 dark:bg-paper/[0.05] dark:text-paper/70"><span className="opacity-60">{t("dirNW") || "NW"}</span>{c.nw.lat}, {c.nw.lng}</span>
                    <span className="inline-flex gap-1 rounded-lg border border-ink/10 bg-paper px-2 py-[3px] font-mono text-[11px] text-ink/70 dark:border-paper/10 dark:bg-paper/[0.05] dark:text-paper/70"><span className="opacity-60">{t("dirNE") || "NE"}</span>{c.ne.lat}, {c.ne.lng}</span>
                    <span className="inline-flex gap-1 rounded-lg border border-ink/10 bg-paper px-2 py-[3px] font-mono text-[11px] text-ink/70 dark:border-paper/10 dark:bg-paper/[0.05] dark:text-paper/70"><span className="opacity-60">{t("dirSW") || "SW"}</span>{c.sw.lat}, {c.sw.lng}</span>
                    <span className="inline-flex gap-1 rounded-lg border border-ink/10 bg-paper px-2 py-[3px] font-mono text-[11px] text-ink/70 dark:border-paper/10 dark:bg-paper/[0.05] dark:text-paper/70"><span className="opacity-60">{t("dirSE") || "SE"}</span>{c.se.lat}, {c.se.lng}</span>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        <div className="mb-1.5 flex shrink-0 items-center justify-between px-0.5">
          <h4 className="m-0 flex items-center gap-1 text-[11px] font-bold text-accent dark:text-paper">
            <Icon name="grid" size={13} />
            {seaFilter ? `${parseAndTranslateApiSeaName(seaFilter, t)} ${t("matrix") || "Matrix"}` : (t("regionalGridDataMatrix") || "Regional Grid Data Matrix")}
          </h4>
        </div>

        <div ref={tableContainerRef} className={isMobile
          ? "h-[400px] flex-none overflow-auto rounded-t-[10px] border border-ink/10 bg-paper pr-2 dark:border-paper/10 dark:bg-paper/[0.05]"
          : "min-h-[220px] flex-1 overflow-auto rounded-t-[10px] border border-ink/10 bg-paper dark:border-paper/10 dark:bg-paper/[0.05]"}>
          <table className="w-full min-w-[550px] border-collapse text-[12px]">
            <thead className="sticky top-0 z-[10] bg-ink/[0.03] dark:bg-ink">
              <tr className="text-left text-ink/60 dark:text-paper/60">
                <th className={`${th} w-[200px] font-bold`}>{t("gridCorners") || "Grid Corners"}</th>
                <th className={`${th} font-bold`}>{t("startDate") || "Start Date"}</th>
                <th className={`${th} font-bold`}>{t("endDate") || "End Date"}</th>
                <th className={`${th} text-center font-bold`}>{parameter.toUpperCase()}</th>
                <th className={`${th} text-right font-bold`}>{t("waterBody") || "Water Body"}</th>
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
                      <td className={`${td} whitespace-nowrap text-[11px] text-ink/60 dark:text-paper/60`}>{startDateStr}</td>
                      <td className={`${td} whitespace-nowrap text-[11px] text-ink/60 dark:text-paper/60`}>{endDateStr}</td>
                      <td className={`${td} text-center font-semibold ${isSelected ? "font-bold text-accent dark:text-paper" : "text-ink dark:text-paper"}`}>{row[parameter]}</td>
                      <td className={`${td} whitespace-nowrap text-right text-[11px] font-semibold ${isLand ? "text-ink/60 dark:text-paper/60" : "text-accent dark:text-paper"}`}>{rowWaterBody}</td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>

        {(!isGeneratingGrid && !isRendering) && totalPages > 1 && (
          <div className="flex shrink-0 items-center justify-between rounded-b-[10px] border border-t-0 border-ink/10 bg-ink/[0.03] px-3 py-2 dark:border-paper/10 dark:bg-paper/[0.05]">
            <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="oe-focus-visible rounded-lg border border-accent px-2.5 py-1 text-[11px] text-accent disabled:cursor-not-allowed disabled:opacity-50 dark:border-paper/20 dark:text-paper">Previous</button>
            <span className="text-[11px] font-bold text-ink/60 dark:text-paper/60">Page {currentPage} of {totalPages}</span>
            <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="oe-focus-visible rounded-lg border border-accent px-2.5 py-1 text-[11px] text-accent disabled:cursor-not-allowed disabled:opacity-50 dark:border-paper/20 dark:text-paper">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
