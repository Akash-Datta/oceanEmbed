// Central helper for the ocean model backend.
//
// CORS strategy:
// - In dev, leave VITE_BACKEND_API_URL empty (or same-origin) and let the Vite
//   proxy forward /api -> http://localhost:5000, which avoids CORS entirely.
// - In prod, set VITE_BACKEND_API_URL to the backend origin; the backend's
//   explicit CORS allowlist covers the browser cross-origin request.

const RAW_BASE = (import.meta.env.VITE_BACKEND_API_URL || "").trim().replace(/\/+$/, "");

export function getBackendBase() {
  // Empty string => same-origin (Vite proxy in dev). Never return a trailing slash.
  return RAW_BASE;
}

export function buildGridId(lat, lng) {
  const swLat = Math.floor(Number(lat) / 0.25) * 0.25;
  const swLon = Math.floor(Number(lng) / 0.25) * 0.25;
  return `box_${swLat.toFixed(2)}_${swLon.toFixed(2)}`;
}

function normalizeProfile(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => ({
      depth: Number(item.depth ?? item.depth_m),
      argo: Number(item.argo ?? item.actual),
      transformer: Number(item.transformer ?? item.prediction),
      q10: item.q10 === undefined || item.q10 === null ? null : Number(item.q10),
      q90: item.q90 === undefined || item.q90 === null ? null : Number(item.q90),
    }))
    .filter(
      (item) =>
        Number.isFinite(item.depth) &&
        Number.isFinite(item.argo) &&
        Number.isFinite(item.transformer)
    )
    .sort((a, b) => a.depth - b.depth);
}

/**
 * Fetch a vertical temperature profile through the backend.
 * Throws a user-friendly Error on network/CORS/HTTP failures.
 * Pass an AbortSignal to cancel stale requests (rapid map clicks).
 */
export async function fetchVerticalProfile({ lat, lng, date, signal }) {
  if (!date) throw new Error("Please select the date first.");
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    throw new Error("Invalid coordinates for profile request.");
  }

  const gridId = buildGridId(lat, lng);
  const base = getBackendBase();
  const url = `${base}/api/profile`;

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grid_id: gridId, forecast_date: date }),
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error; // caller ignores aborts
    // TypeError = network down OR CORS blocked OR DNS — surface a clear hint.
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
    throw new Error(data.error || `Profile request failed (HTTP ${response.status}).`);
  }

  return {
    gridId: data.grid_id || gridId,
    forecastDate: data.forecast_date || date,
    profile: normalizeProfile(data.profile),
  };
}
