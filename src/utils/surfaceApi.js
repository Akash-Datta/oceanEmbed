// Central helper for live surface-point data (SST/SSS/SSH/UO/VO).
// Mirrors profileApi.js: same-origin /api in dev (Vite proxy), explicit
// VITE_BACKEND_API_URL in prod.

const RAW_BASE = (import.meta.env.VITE_BACKEND_API_URL || "").trim().replace(/\/+$/, "");

export function getBackendBase() {
  return RAW_BASE;
}

function toFiniteOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeSurface(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  return {
    sst: toFiniteOrNull(s.sst),
    sss: toFiniteOrNull(s.sss),
    // Backend already maps upstream `zos` -> `ssh`; accept either.
    ssh: toFiniteOrNull(s.ssh ?? s.zos),
    zos: toFiniteOrNull(s.zos ?? s.ssh),
    uo: toFiniteOrNull(s.uo),
    vo: toFiniteOrNull(s.vo),
  };
}

/**
 * Fetch live surface values for a lat/lng + date through the backend.
 * Backend snaps lat/lng to the 0.25° model grid (same as profile).
 */
export async function fetchSurfacePoint({ lat, lng, date, signal }) {
  if (!date) throw new Error("Please select the date first.");
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    throw new Error("Invalid coordinates for surface request.");
  }

  const base = getBackendBase();
  const url = `${base}/api/surface`;
  const payload = { lat: Number(lat), lng: Number(lng), date };
  console.log(`[surface] POST ${url}`, payload);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new Error(
      "Unable to reach the ocean model backend. " +
        "Start it with `npm start` in backend/ (port 5000) and check CORS. " +
        `Tried ${url}`,
      { cause: error }
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  data = data && typeof data === "object" ? data : {};

  if (!response.ok || data.status !== "success") {
    console.warn(`[surface] request failed (HTTP ${response.status})`, data);
    throw new Error(data.error || `Surface request failed (HTTP ${response.status}).`);
  }

  const surface = normalizeSurface(data.surface);
  if (!Number.isFinite(surface.sst) || !Number.isFinite(surface.sss) || !Number.isFinite(surface.ssh)) {
    console.warn("[surface] incomplete surface data", data);
    throw new Error("Backend returned incomplete surface data for this grid/date.");
  }
  console.log("[surface] live values", surface, { gridId: data.grid_id, date: data.date, source: data.source });

  return {
    surface,
    grid: data.grid || null,
    gridId: data.grid_id || "",
    date: data.date || date,
    units: data.units || {},
    source: data.source || "model",
  };
}
