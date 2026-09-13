const express = require("express");
const { getSurfacePoint, getSurfaceMap } = require("../services/modelApi");
const { getGridFromLatLng } = require("../utils/gridUtils");

const router = express.Router();

function isValidDate(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function resolveBounds(source) {
    const swLat = toFiniteNumber(source.sw_lat);
    const swLon = toFiniteNumber(source.sw_lon);
    const neLat = toFiniteNumber(source.ne_lat);
    const neLon = toFiniteNumber(source.ne_lon);
    if (swLat !== null && swLon !== null && neLat !== null && neLon !== null) {
        return { sw_lat: swLat, sw_lon: swLon, ne_lat: neLat, ne_lon: neLon, gridId: null };
    }

    // Fallback: accept raw lat/lng and snap to the 0.25° model grid
    // (same convention as /api/profile).
    const lat = toFiniteNumber(source.lat);
    const lng = toFiniteNumber(source.lng ?? source.lon);
    if (lat !== null && lng !== null) {
        const g = getGridFromLatLng(lat, lng);
        return { sw_lat: g.sw_lat, sw_lon: g.sw_lon, ne_lat: g.ne_lat, ne_lon: g.ne_lon, gridId: g.gridId };
    }

    return null;
}

function normalizeSurface(raw) {
    const s = raw && typeof raw === "object" ? raw : {};
    const out = {
        // Upstream calls sea-surface height `zos`; UI historically calls it `ssh`.
        sst: Number(s.sst),
        sss: Number(s.sss),
        ssh: Number(s.zos ?? s.ssh),
        zos: Number(s.zos ?? s.ssh),
        uo: Number(s.uo),
        vo: Number(s.vo),
    };
    return out;
}

async function handleSurface(req, res) {
    try {
        const source = req.method === "GET" ? req.query : req.body || {};
        const dateRaw = source.date ?? source.forecast_date;
        const date = typeof dateRaw === "string" ? dateRaw.trim() : dateRaw;

        if (!isValidDate(date)) {
            return res.status(400).json({
                error: "date is required in YYYY-MM-DD format (or forecast_date)",
            });
        }

        const bounds = resolveBounds(source);
        if (!bounds) {
            return res.status(400).json({
                error: "sw_lat + sw_lon + ne_lat + ne_lon (or lat + lng) are required",
            });
        }

        let data;
        try {
            data = await getSurfacePoint(
                bounds.sw_lat,
                bounds.sw_lon,
                bounds.ne_lat,
                bounds.ne_lon,
                date
            );
        } catch (modelError) {
            console.error("Surface model API error:", modelError);
            return res.status(502).json({
                error: modelError.message || "Failed to fetch surface data from model API",
                code: modelError.code || "MODEL_API_ERROR",
                date,
            });
        }

        if (!data || data.status !== "success") {
            return res.status(502).json({
                error: (data && data.error) || "Model API returned an unsuccessful surface response",
                code: "MODEL_API_ERROR",
                date,
            });
        }

        const surface = normalizeSurface(data.surface);
        const hasCore =
            Number.isFinite(surface.sst) &&
            Number.isFinite(surface.sss) &&
            Number.isFinite(surface.ssh);

        if (!hasCore) {
            return res.status(502).json({
                error: "Model API returned incomplete surface data",
                code: "MODEL_API_INCOMPLETE",
                date,
            });
        }

        res.json({
            status: "success",
            grid: data.grid || {
                sw_lat: bounds.sw_lat,
                sw_lon: bounds.sw_lon,
                ne_lat: bounds.ne_lat,
                ne_lon: bounds.ne_lon,
            },
            grid_id: bounds.gridId || data.grid_id || null,
            date: data.date || date,
            surface,
            units: data.units || { zos: "m", sst: "degC", sss: "psu", uo: "m/s", vo: "m/s" },
            source: data.source || "model",
        });
    } catch (error) {
        console.error("Surface error:", error);
        res.status(500).json({ error: "Failed to fetch surface data" });
    }
}

router.post("/", handleSurface);
router.get("/", handleSurface);

// Whole-domain heatmap for one surface parameter.
// Proxies upstream GET /surface/map (no coordinates — covers the whole map).
// Accepts UI aliases (ssh/sscu/sscv) and normalizes to the upstream
// canonical names (zos/uo/vo).
const SURFACE_MAP_ALIASES = {
    sst: "sst",
    sss: "sss",
    zos: "zos",
    ssh: "zos",
    uo: "uo",
    sscu: "uo",
    vo: "vo",
    sscv: "vo",
};

async function handleSurfaceMap(req, res) {
    try {
        const source = req.method === "GET" ? req.query : req.body || {};
        const dateRaw = source.date ?? source.forecast_date;
        const date = typeof dateRaw === "string" ? dateRaw.trim() : dateRaw;

        if (!isValidDate(date)) {
            return res.status(400).json({
                error: "date is required in YYYY-MM-DD format (or forecast_date)",
            });
        }

        const paramRaw = source.parameter ?? source.param;
        const alias = String(paramRaw || "").trim().toLowerCase();
        const parameter = SURFACE_MAP_ALIASES[alias];
        if (!parameter) {
            return res.status(400).json({
                error: `parameter is required (one of ${Object.keys(SURFACE_MAP_ALIASES).join(", ")})`,
            });
        }

        let data;
        try {
            data = await getSurfaceMap(date, parameter);
        } catch (modelError) {
            console.error("Surface map model API error:", modelError);
            return res.status(502).json({
                error: modelError.message || "Failed to fetch surface map from model API",
                code: modelError.code || "MODEL_API_ERROR",
                date,
                parameter,
            });
        }

        const cells = Array.isArray(data?.cells) ? data.cells : [];
        if (!data || data.status !== "success" || cells.length === 0) {
            return res.status(502).json({
                error: (data && data.error) || "Model API returned an empty surface map",
                code: "MODEL_API_EMPTY",
                date,
                parameter,
            });
        }

        res.json({
            status: "success",
            date: data.date || date,
            parameter,
            unit: data.unit || "",
            count: data.count ?? cells.length,
            cells,
            source: data.source || "model",
        });
    } catch (error) {
        console.error("Surface map error:", error);
        res.status(500).json({ error: "Failed to fetch surface map" });
    }
}

router.post("/map", handleSurfaceMap);
router.get("/map", handleSurfaceMap);

module.exports = router;
