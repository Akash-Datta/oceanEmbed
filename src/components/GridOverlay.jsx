import React, { useMemo, useState, useEffect, useRef } from "react";
import { Rectangle, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { getViridisColor } from "../data/dummyOceanData";
import { checkIfLand } from "../utils/coordinateUtils";

const MAX_MOBILE_RECTS = 800;
const MOBILE_BUCKET_THRESHOLD = 600;

// Leaflet legend control showing the live viridis scale for the heatmap
function HeatLegend({ min, max, parameter }) {
  const map = useMap();
  const divRef = useRef(null);

  useEffect(() => {
    if (!map) return;
    const ctrl = L.control({ position: "bottomright" });
    ctrl.onAdd = () => {
      const div = L.DomUtil.create("div", "heat-legend");
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);
      divRef.current = div;
      return div;
    };
    ctrl.addTo(map);
    return () => {
      ctrl.remove();
      divRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    if (divRef.current && min !== null && max !== null) {
      divRef.current.innerHTML =
        `<div class="heat-legend-title">${parameter.toUpperCase()}</div>` +
        `<div class="heat-legend-bar"></div>` +
        `<div class="heat-legend-scale"><span>${min.toFixed(2)}</span><span>${max.toFixed(2)}</span></div>`;
    }
  }, [min, max, parameter]);

  return null;
}

function safeZoom(map, fallback = 5) {
  try {
    const z = map.getZoom();
    return Number.isFinite(z) ? z : fallback;
  } catch (e) {
    return fallback;
  }
}

function safeBounds(map) {
  try {
    return map.getBounds().pad(0.25);
  } catch (e) {
    return null;
  }
}

export default function GridOverlay({ gridData, parameter, onGridClick, selectedCell, resolution, showTooltip = true }) {
  const map = useMap();
  const [isMobile, setIsMobile] = useState(false);
  const [zoom, setZoom] = useState(() => safeZoom(map));
  const [viewBounds, setViewBounds] = useState(() => safeBounds(map));

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Track zoom + viewport so the mobile grid divides / recombines live
  useEffect(() => {
    if (!map) return;
    const onViewChange = () => {
      setZoom(safeZoom(map));
      setViewBounds(safeBounds(map));
    };
    map.on("zoomend", onViewChange);
    map.on("moveend", onViewChange);
    return () => {
      map.off("zoomend", onViewChange);
      map.off("moveend", onViewChange);
    };
  }, [map]);

  // Zoom-dynamic bucketing (mobile, large grids only):
  // zoomed in  -> step 1  -> true 0.25° cells (divided)
  // zoomed out -> step 2+ -> merged cells holding the 0.25° mean (recombined)
  // Only the visible viewport is rendered, so zooming in always reveals detail.
  const { renderCells, isCombined } = useMemo(() => {
    if (!gridData) return { renderCells: [], isCombined: false };

    const baseRes = resolution || 0.25;
    const half = baseRes / 2;
    const large = gridData.length > MOBILE_BUCKET_THRESHOLD;

    if (!isMobile || !large) {
      return {
        isCombined: false,
        renderCells: gridData.map((c) => ({
          minLat: c.lat,
          maxLat: c.lat,
          minLng: c.lng,
          maxLng: c.lng,
          lat: c.lat,
          lng: c.lng,
          value: c[parameter],
          land: checkIfLand(c.lat, c.lng),
          cells: [c],
        })),
      };
    }

    // Step relative to the fitted (min) zoom so division kicks in within
    // a few pinch/click zooms on any screen size.
    let minZoom = null;
    try {
      const mz = map.getMinZoom();
      if (typeof mz === "number" && Number.isFinite(mz)) minZoom = mz;
    } catch (e) {}
    const rel = minZoom !== null ? zoom - minZoom : null;
    let step;
    if (rel !== null) {
      step = rel >= 2.5 ? 1 : rel >= 1.5 ? 2 : rel >= 0.5 ? 3 : 4;
    } else {
      step = zoom >= 8 ? 1 : zoom >= 7 ? 2 : zoom >= 6 ? 3 : 4;
    }

    // Cull to the visible viewport (padded) before bucketing
    let visible = gridData;
    if (viewBounds) {
      try {
        const south = viewBounds.getSouth();
        const north = viewBounds.getNorth();
        const west = viewBounds.getWest();
        const east = viewBounds.getEast();
        visible = gridData.filter(
          (c) => c.lat >= south && c.lat <= north && c.lng >= west && c.lng <= east
        );
        if (visible.length === 0) visible = gridData;
      } catch (e) {
        visible = gridData;
      }
    }

    const uniqueLats = Array.from(new Set(visible.map((c) => c.lat))).sort((a, b) => a - b);
    const uniqueLngs = Array.from(new Set(visible.map((c) => c.lng))).sort((a, b) => a - b);
    if (uniqueLats.length === 0 || uniqueLngs.length === 0) {
      return { renderCells: [], isCombined: step > 1 };
    }
    const latIdx = new Map(uniqueLats.map((v, i) => [v, i]));
    const lngIdx = new Map(uniqueLngs.map((v, i) => [v, i]));

    // Safety: never render more than MAX_MOBILE_RECTS rectangles
    while (step <= 12) {
      const buckets = Math.ceil(uniqueLats.length / step) * Math.ceil(uniqueLngs.length / step);
      if (buckets <= MAX_MOBILE_RECTS) break;
      step += 1;
    }

    const buckets = new Map();
    visible.forEach((c) => {
      const bi = Math.floor(latIdx.get(c.lat) / step);
      const bj = Math.floor(lngIdx.get(c.lng) / step);
      const key = bi + "_" + bj;
      let b = buckets.get(key);
      if (!b) {
        b = { sum: 0, n: 0, oceanN: 0, minLat: Infinity, maxLat: -Infinity, minLng: Infinity, maxLng: -Infinity, cells: [] };
        buckets.set(key, b);
      }
      // Land cells never contribute color — average ocean cells only
      if (!checkIfLand(c.lat, c.lng)) {
        const v = Number(c[parameter]);
        if (Number.isFinite(v)) {
          b.sum += v;
          b.n += 1;
        }
        b.oceanN += 1;
      }
      if (c.lat < b.minLat) b.minLat = c.lat;
      if (c.lat > b.maxLat) b.maxLat = c.lat;
      if (c.lng < b.minLng) b.minLng = c.lng;
      if (c.lng > b.maxLng) b.maxLng = c.lng;
      b.cells.push(c);
    });

    const renderCells = Array.from(buckets.values()).map((b) => ({
      minLat: b.minLat,
      maxLat: b.maxLat,
      minLng: b.minLng,
      maxLng: b.maxLng,
      lat: (b.minLat + b.maxLat) / 2,
      lng: (b.minLng + b.maxLng) / 2,
      value: b.n > 0 ? b.sum / b.n : null,
      land: b.oceanN === 0,
      cells: b.cells,
    }));

    // Always keep the selected cell visible even if it was culled
    if (selectedCell) {
      const covered = renderCells.some(
        (cell) =>
          selectedCell.lat >= cell.minLat - half &&
          selectedCell.lat <= cell.maxLat + half &&
          selectedCell.lng >= cell.minLng - half &&
          selectedCell.lng <= cell.maxLng + half
      );
      if (!covered) {
        const match = gridData.find((c) => c.lat === selectedCell.lat && c.lng === selectedCell.lng);
        const src = match || selectedCell;
        renderCells.push({
          minLat: src.lat,
          maxLat: src.lat,
          minLng: src.lng,
          maxLng: src.lng,
          lat: src.lat,
          lng: src.lng,
          value: src[parameter],
          land: checkIfLand(src.lat, src.lng),
          cells: [src],
        });
      }
    }

    return { renderCells, isCombined: step > 1 };
  }, [gridData, isMobile, resolution, parameter, zoom, viewBounds, selectedCell, map]);

  // Viridis scale computed over ocean cells only so land dummy values
  // never skew the colors, and the scale stays stable while zooming
  const scale = useMemo(() => {
    if (!gridData || gridData.length === 0) return { min: null, max: null };
    let min = Infinity;
    let max = -Infinity;
    gridData.forEach((c) => {
      if (checkIfLand(c.lat, c.lng)) return;
      const v = Number(c[parameter]);
      if (Number.isFinite(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    });
    if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: null, max: null };
    return { min, max };
  }, [gridData, parameter]);

  if (!gridData || !parameter) return null;

  const half = (resolution || 0.25) / 2;

  return (
    <>
      {gridData.length > MOBILE_BUCKET_THRESHOLD && scale.min !== null && (
        <HeatLegend min={scale.min} max={scale.max} parameter={parameter} />
      )}
      {renderCells.map((cell, idx) => {
        const bounds = [
          [cell.minLat - half, cell.minLng - half],
          [cell.maxLat + half, cell.maxLng + half],
        ];

        const isSelected =
          selectedCell &&
          selectedCell.lat >= cell.minLat - half &&
          selectedCell.lat <= cell.maxLat + half &&
          selectedCell.lng >= cell.minLng - half &&
          selectedCell.lng <= cell.maxLng + half;

        const displayValue =
          typeof cell.value === "number" ? cell.value.toFixed(2) : "—";

        // Land grids are never colored
        const hasColor =
          !cell.land &&
          typeof cell.value === "number" &&
          Number.isFinite(cell.value) &&
          scale.min !== null;

        return (
          <Rectangle
            key={`${cell.lat}-${cell.lng}-${idx}`}
            bounds={bounds}
            pathOptions={{
              color: isSelected ? "#0284c7" : "#64748b",
              weight: isSelected ? 2 : 0.6,
              fillColor: hasColor ? getViridisColor(cell.value, scale.min, scale.max) : "transparent",
              fillOpacity: isSelected ? 0.9 : 0.62,
              opacity: 0.6,
            }}
            eventHandlers={{
              click: (e) => {
                if (!onGridClick) return;
                // Resolve back to the exact 0.25° cell nearest the tap
                let target = cell.cells[0];
                if (cell.cells.length > 1 && e && e.latlng) {
                  let best = Infinity;
                  cell.cells.forEach((c) => {
                    const d =
                      Math.pow(c.lat - e.latlng.lat, 2) +
                      Math.pow(c.lng - e.latlng.lng, 2);
                    if (d < best) {
                      best = d;
                      target = c;
                    }
                  });
                }
                onGridClick(target);
              },
            }}
          >
            {showTooltip && (
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div style={{ textAlign: "center", fontWeight: "bold", fontFamily: "Inter, sans-serif" }}>
                  <div>Lat: {cell.lat.toFixed(2)}°, Lng: {cell.lng.toFixed(2)}°</div>
                  <div style={{ color: "#0284c7" }}>
                    {parameter.toUpperCase()}: {displayValue}
                    {isCombined ? " (avg)" : ""}
                  </div>
                </div>
              </Tooltip>
            )}
          </Rectangle>
        );
      })}
    </>
  );
}
