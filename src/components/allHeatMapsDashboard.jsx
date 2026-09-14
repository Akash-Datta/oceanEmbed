import React, { useMemo, useEffect, useState } from "react";
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

export default function AllHeatMapsDashboard({ gridData, date, onSelectParameter, onBack, activeResolution, isGeneratingGrid, isGridLive }) {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const tileUrl = getTileUrl(isDark);
  const maskColor = isDark ? "#132730" : "#F7F4ED";

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

  const chip = (active) =>
    `cursor-pointer rounded-lg border px-2 py-[3px] text-[11px] font-bold transition-colors
      ${active
        ? "border-transparent bg-accent text-white dark:bg-accent"
        : "border-ink/10 bg-paper text-accent hover:bg-ink/[0.06] dark:border-paper/15 dark:bg-paper/[0.05] dark:text-paper dark:hover:bg-paper/10"}`;

  const th = "border-b-2 border-ink/10 p-2 font-bold dark:border-paper/10";
  const td = "border-b border-ink/10 p-1.5 dark:border-paper/10";

  return (
    <div className={isMobile
      ? "flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden bg-paper p-1.5 dark:bg-ink"
      : "flex h-full min-h-0 flex-1 flex-row gap-4 bg-paper p-3 dark:bg-ink"}>
      {/* MAPS AREA / CAROUSEL ON MOBILE */}
      <div className={isMobile
        ? "relative w-full flex-[0_0_35%] overflow-hidden rounded-lg bg-ink/[0.03] p-1.5 dark:bg-ink"
        : "relative flex-[0_0_64%] overflow-hidden rounded-lg bg-ink/[0.03] p-3 dark:bg-ink"}>

        {(isGeneratingGrid || loadedMapsCount < parameters.length) && (
          <div className="absolute inset-0 z-modal flex flex-col items-center justify-center rounded-lg bg-ink/[0.03]/90 backdrop-blur-sm dark:bg-ink/95">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-ink/10 border-t-accent dark:border-paper/15 dark:border-t-paper" />
            <div className="mt-3 font-bold text-accent dark:text-paper">{t("optimizingView") || "Optimizing High-Res Grid..."}</div>
          </div>
        )}

        {isMobile ? (
          <div className="flex h-full flex-col overflow-hidden rounded-lg border border-ink/10 bg-paper dark:border-paper/10 dark:bg-paper/[0.05] dark:shadow-none">
            <div
              className="shrink-0 cursor-pointer border-b border-ink/10 bg-ink/[0.03] px-10 py-1.5 text-center text-[12px] font-bold text-accent dark:border-paper/10 dark:bg-transparent dark:text-paper"
              onClick={() => onSelectParameter(parameters[currentMapIndex].id)}
            >
              {parameters[currentMapIndex].label} →
            </div>

            {/* Clickable map wrapper to redirect to parameter dashboard */}
            <div
              onClick={() => onSelectParameter(parameters[currentMapIndex].id)}
              className="relative w-full flex-1 cursor-pointer overflow-hidden bg-paper dark:bg-ink"
            >
              <MapContainer preferCanvas={true} center={[centerLat, centerLng]} zoomSnap={0} zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} attributionControl={false} style={{ position: "absolute", inset: 0, backgroundColor: isDark ? "#132730" : "#F7F4ED" }}>
                <TileLayer noWrap={true} url={tileUrl} />
                <MaskHole bounds={gridBounds} color={maskColor} />
                {!isGeneratingGrid && <GridOverlay gridData={miniGridData} parameter={parameters[currentMapIndex].id} resolution={miniResolution} showTooltip={false} />}
                <MiniMapController gridBounds={gridBounds} paddedBounds={paddedBounds} />
              </MapContainer>

              {/* Styled Left Arrow Button */}
              {currentMapIndex > 0 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCurrentMapIndex(prev => prev - 1); }}
                  aria-label="Previous map"
                  className="oe-focus-visible absolute left-2.5 top-1/2 z-[10000] flex h-[38px] w-[38px] -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-ink/90 text-[24px] font-bold text-white shadow-lift backdrop-blur"
                >
                  ‹
                </button>
              )}

              {/* Styled Right Arrow Button */}
              {currentMapIndex < parameters.length - 1 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCurrentMapIndex(prev => prev + 1); }}
                  aria-label="Next map"
                  className="oe-focus-visible absolute right-2.5 top-1/2 z-[10000] flex h-[38px] w-[38px] -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-ink/90 text-[24px] font-bold text-white shadow-lift backdrop-blur"
                >
                  ›
                </button>
              )}
            </div>

            {/* Indicator Dots & Count */}
            <div className="flex shrink-0 items-center justify-between border-t border-ink/10 bg-ink/[0.03] px-3 py-1.5 dark:border-paper/10 dark:bg-paper/[0.05]">
              <span className="text-[10px] font-bold text-ink/60 dark:text-paper/60">{currentMapIndex + 1} / {parameters.length}</span>
              <div className="flex gap-1">
                {parameters.map((_, idx) => (
                  <span key={idx} className={`h-[5px] rounded-full ${idx === currentMapIndex ? "w-4 bg-accent" : "w-[5px] bg-ink/20 dark:bg-paper/20"}`} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid h-full grid-cols-2 grid-rows-3 gap-3">
            {parameters.map((param, index) => (
              <div key={param.id} onClick={() => onSelectParameter(param.id)} className="flex cursor-pointer flex-col overflow-hidden rounded-lg border border-ink/10 bg-paper transition-transform hover:-translate-y-0.5 dark:border-paper/10 dark:bg-paper/[0.05] dark:shadow-none">
                <div className="shrink-0 p-2 text-[12px] font-bold text-accent dark:text-paper">{param.label}</div>
                <div className="relative w-full flex-1 bg-paper dark:bg-ink">
                  {index < loadedMapsCount && (
                    <MapContainer preferCanvas={true} center={[centerLat, centerLng]} zoomSnap={0} zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} attributionControl={false} style={{ position: "absolute", inset: 0, backgroundColor: isDark ? "#132730" : "#F7F4ED" }}>
                      <TileLayer noWrap={true} url={tileUrl} />
                      <MaskHole bounds={gridBounds} color={maskColor} />
                      {!isGeneratingGrid && <GridOverlay gridData={miniGridData} parameter={param.id} resolution={miniResolution} showTooltip={false} />}
                      <MiniMapController gridBounds={gridBounds} paddedBounds={paddedBounds} />
                    </MapContainer>
                  )}
                </div>
              </div>
            ))}
            {/* 6th cell: live badge */}
            <div className="flex items-center justify-center rounded-lg border border-dashed border-ink/20 bg-ink/[0.02] p-2 text-center dark:border-paper/20 dark:bg-paper/[0.03]">
              <span className={`oe-live-badge ${isGeneratingGrid ? "is-fallback" : isGridLive ? "is-live" : "is-fallback"}`}>
                {isGeneratingGrid ? "◌ Loading grid…" : isGridLive ? "● Live · model heatmaps" : "○ Synthetic grid"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* DATA SIDE PANEL */}
      <div className={isMobile
        ? "relative flex min-h-0 w-full flex-1 flex-col overflow-hidden pr-0.5"
        : "relative flex h-full min-w-0 flex-1 flex-col overflow-y-auto"}>

        <div className="mb-1.5 flex shrink-0 items-center justify-end gap-2.5">
          <span className={`oe-live-badge ${isGeneratingGrid ? "is-fallback" : isGridLive ? "is-live" : "is-fallback"}`}>
            {isGeneratingGrid ? "◌ Loading grid…" : isGridLive ? "● Live · model heatmaps" : "○ Synthetic grid"}
          </span>
          <button
            type="button"
            onClick={onBack}
            className="oe-focus-visible rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:brightness-95"
          >
            {t("back") || "Back to Map"}
          </button>
        </div>

        <div className="mb-1.5 shrink-0 rounded-lg border border-ink/10 bg-ink/[0.03] px-2.5 py-2 dark:border-paper/20 dark:bg-paper/[0.04]">
          <span className="text-[10px] font-bold text-accent dark:text-paper">{t("coveredWaterBodies") || "Water Bodies"} ({t("clickToFilter") || "Click to filter table"})</span>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span onClick={() => { setSeaFilter(null); setCurrentPage(1); }} className={chip(seaFilter === null)}>
              <span className="mr-1 inline-flex align-[-2px]"><Icon name="globe" size={12} /></span>{t("all") || "All"}
            </span>
            {waterBodiesArray.map((sea, idx) => (
              <span key={idx} onClick={() => { setSeaFilter(sea === seaFilter ? null : sea); setCurrentPage(1); }} className={chip(seaFilter === sea)}>
                <span className="mr-1 inline-flex align-[-2px]"><Icon name="waves" size={12} /></span>{sea}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-1.5 grid shrink-0 grid-cols-2 gap-1.5">
          {parameters.map((p) => (
            <div key={p.id} className="rounded-lg border border-ink/10 bg-ink/[0.03] px-2.5 py-1 dark:border-paper/10 dark:bg-paper/[0.05]">
              <span className="text-[11px] font-semibold text-ink/60 dark:text-paper/60">{p.id.toUpperCase()} {seaFilter ? `${seaFilter} Avg` : "Avg"}</span>
              <div className="text-[13px] font-bold text-accent dark:text-paper">{averages[p.id]}</div>
            </div>
          ))}
        </div>

        <div className="mb-1 flex shrink-0 items-center justify-between px-0.5">
          <h4 className="m-0 flex items-center gap-1 text-[11px] font-bold text-accent dark:text-paper">
            <Icon name="grid" size={13} />
            {seaFilter ? `${seaFilter} ${t("matrix") || "Matrix"}` : (t("regionalGridDataMatrix") || "Regional Grid Data Matrix")}
          </h4>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-ink/60 dark:text-paper/60">{t("timeSpan") || "Time Span"}:</span>
            <div className="min-w-[130px]">
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

        <div className={isMobile
          ? "relative min-h-0 flex-1 overflow-auto rounded-t-[10px] border border-ink/10 bg-paper pr-2 dark:border-paper/10 dark:bg-paper/[0.05]"
          : "relative min-h-[220px] flex-1 overflow-auto rounded-t-[10px] border border-ink/10 bg-paper dark:border-paper/10 dark:bg-paper/[0.05]"}>
          <table className="w-full min-w-[700px] border-collapse text-[12px]">
            <thead className="sticky top-0 z-[10] bg-ink/[0.03] dark:bg-ink">
              <tr className="text-left text-ink/60 dark:text-paper/60">
                <th className={`${th} w-[200px] font-bold`}>{t("gridCorners") || "Grid Corners"}</th>
                <th className={`${th} font-bold`}>{t("startDate") || "Start Date"}</th>
                <th className={`${th} font-bold`}>{t("endDate") || "End Date"}</th>
                <th className={`${th} text-center font-bold`}>SST</th>
                <th className={`${th} text-center font-bold`}>SSH</th>
                <th className={`${th} text-center font-bold`}>SSS</th>
                <th className={`${th} text-center font-bold`}>SSCU</th>
                <th className={`${th} text-center font-bold`}>SSCV</th>
                <th className={`${th} text-right font-bold`}>{t("waterBody") || "Water Body"}</th>
              </tr>
            </thead>
            {(!isGeneratingGrid && loadedMapsCount >= parameters.length) && filteredGridData && (
              <tbody>
                {paginatedData.map((row, idx) => {
                  const isLand = checkIfLand(row.lat, row.lng);
                  const rowWaterBody = isLand ? (t("land") || "Land") : parseAndTranslateApiSeaName(getWaterBodyName(row.lat, row.lng), t);
                  const corners = getGridCorners(row.lat, row.lng, activeResolution, t);

                  return (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-paper dark:bg-paper/[0.05]" : "bg-ink/[0.03] dark:bg-paper/[0.02]"}>
                      <td className={`${td} whitespace-nowrap`}>
                        <div className="grid grid-cols-[max-content_max-content] gap-x-2 gap-y-0.5 font-mono text-[8.5px] tracking-tight text-ink/60 dark:text-paper/60">
                           <span><b className="font-bold opacity-50">{t("dirNW") || "NW"}</b> {corners.nw.lat}, {corners.nw.lng}</span>
                           <span><b className="font-bold opacity-50">{t("dirNE") || "NE"}</b> {corners.ne.lat}, {corners.ne.lng}</span>
                           <span><b className="font-bold opacity-50">{t("dirSW") || "SW"}</b> {corners.sw.lat}, {corners.sw.lng}</span>
                           <span><b className="font-bold opacity-50">{t("dirSE") || "SE"}</b> {corners.se.lat}, {corners.se.lng}</span>
                        </div>
                      </td>
                      <td className={`${td} whitespace-nowrap text-[11px] text-ink/60 dark:text-paper/60`}>{startDateStr}</td>
                      <td className={`${td} whitespace-nowrap text-[11px] text-ink/60 dark:text-paper/60`}>{endDateStr}</td>
                      <td className={`${td} text-center text-ink dark:text-paper`}>{row.sst}</td>
                      <td className={`${td} text-center text-ink dark:text-paper`}>{row.ssh}</td>
                      <td className={`${td} text-center text-ink dark:text-paper`}>{row.sss}</td>
                      <td className={`${td} text-center text-ink dark:text-paper`}>{row.sscu}</td>
                      <td className={`${td} text-center text-ink dark:text-paper`}>{row.sscv}</td>
                      <td className={`${td} whitespace-nowrap text-right text-[11px] font-semibold ${isLand ? "text-ink/60 dark:text-paper/60" : "text-accent dark:text-paper"}`}>{rowWaterBody}</td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>

        {(!isGeneratingGrid && loadedMapsCount >= parameters.length) && totalPages > 1 && (
          <div className="flex shrink-0 items-center justify-between rounded-b-[10px] border border-t-0 border-ink/10 bg-ink/[0.03] px-3 py-1.5 dark:border-paper/10 dark:bg-paper/[0.05]">
            <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="oe-focus-visible rounded-lg border border-accent px-2.5 py-1 text-[11px] text-accent disabled:cursor-not-allowed disabled:opacity-50 dark:border-paper/20 dark:text-paper">Previous</button>
            <span className="text-[11px] font-bold text-ink/60 dark:text-paper/60">Page {currentPage} of {totalPages}</span>
            <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="oe-focus-visible rounded-lg border border-accent px-2.5 py-1 text-[11px] text-accent disabled:cursor-not-allowed disabled:opacity-50 dark:border-paper/20 dark:text-paper">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
