// Live whole-domain heatmaps via backend /api/surface-map
// (proxies upstream GET /surface/map — no coordinates, covers the whole map).
//
// UI parameter ids (sst/ssh/sss/sscu/sscv) map to upstream canonical names
// (sst/zos/sss/uo/vo). Merged output keeps the exact gridData cell shape the
// heatmap engine already consumes: { lat, lng, sst, ssh, sss, sscu, sscv }.

const RAW_BASE = (import.meta.env.VITE_BACKEND_API_URL || "").trim().replace(/\/+$/, "");

export const UI_TO_API_PARAM = {
  sst: "sst",
  ssh: "zos",
  sss: "sss",
  sscu: "uo",
  sscv: "vo",
};

const API_TO_UI_PARAM = {
  sst: "sst",
  zos: "ssh",
  sss: "sss",
  uo: "sscu",
  vo: "sscv",
};

// Decimal precision per UI field (matches the previous synthetic generator).
const UI_PRECISION = { sst: 2, ssh: 2, sss: 2, sscu: 3, sscv: 3 };

const roundTo = (value, digits) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Number(n.toFixed(digits));
};

/**
 * Fetch one whole-domain parameter map through the backend.
 * `parameter` is the upstream canonical name (sst/sss/zos/uo/vo).
 */
export async function fetchSurfaceMap({ date, parameter, signal }) {
  if (!date) throw new Error("Please select the date first.");
  if (!API_TO_UI_PARAM[parameter]) {
    throw new Error(`Unknown surface parameter: ${parameter}`);
  }

  const base = RAW_BASE;
  const url = `${base}/api/surface/map`;
  const payload = { date, parameter };
  console.log(`[surface-map] POST ${url}`, payload);

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

  if (!response.ok || data.status !== "success" || !Array.isArray(data.cells)) {
    console.warn(`[surface-map] request failed (HTTP ${response.status})`, {
      parameter,
      error: data.error,
    });
    throw new Error(data.error || `Surface map request failed (HTTP ${response.status}).`);
  }

  console.log(`[surface-map] live ${parameter}: ${data.cells.length} cells`, {
    unit: data.unit,
    source: data.source,
  });
  return data;
}

// Merged gridData cache per date so switching between the 5 heatmap views
// and the all-maps view reuses one fetch round-trip set.
const mergedCache = new Map();

export function clearSurfaceMapCache(date) {
  if (date) mergedCache.delete(date);
  else mergedCache.clear();
}

/**
 * Fetch all 5 parameter maps for a date and merge them into heatmap-engine
 * gridData cells: { lat, lng, sst, ssh, sss, sscu, sscv }.
 * Results are cached per date. Throws on first failing parameter.
 */
export async function fetchAllSurfaceMaps({ date, signal }) {
  if (!date) throw new Error("Please select the date first.");
  const cached = mergedCache.get(date);
  if (cached) {
    console.log(`[surface-map] cache hit for ${date} (${cached.length} cells)`);
    return cached;
  }

  const apiParams = Object.keys(API_TO_UI_PARAM);
  const results = await Promise.all(
    apiParams.map((apiParam) => fetchSurfaceMap({ date, parameter: apiParam, signal }))
  );

  const byKey = new Map();
  results.forEach((result) => {
    const uiKey = API_TO_UI_PARAM[result.parameter] || API_TO_UI_PARAM[String(result.parameter || "").toLowerCase()];
    if (!uiKey) return;
    const digits = UI_PRECISION[uiKey] ?? 2;
    (result.cells || []).forEach((cell) => {
      const swLat = Number(cell.sw_lat);
      const swLon = Number(cell.sw_lon);
      if (!Number.isFinite(swLat) || !Number.isFinite(swLon)) return;
      const lat = roundTo(swLat + 0.125, 3);
      const lng = roundTo(swLon + 0.125, 3);
      if (lat === null || lng === null) return;
      const key = `${lat},${lng}`;
      let entry = byKey.get(key);
      if (!entry) {
        entry = { lat, lng };
        byKey.set(key, entry);
      }
      const v = roundTo(cell.value, digits);
      if (v !== null) entry[uiKey] = v;
    });
  });

  const merged = Array.from(byKey.values()).filter(
    (c) =>
      Number.isFinite(c.sst) ||
      Number.isFinite(c.ssh) ||
      Number.isFinite(c.sss) ||
      Number.isFinite(c.sscu) ||
      Number.isFinite(c.sscv)
  );

  if (merged.length === 0) {
    throw new Error("Backend returned an empty surface map for this date.");
  }

  console.log(`[surface-map] merged ${merged.length} live cells for ${date}`);
  mergedCache.set(date, merged);
  return merged;
}
