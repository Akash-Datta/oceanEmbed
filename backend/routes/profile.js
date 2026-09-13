const express = require("express");
const { getForecast } = require("../services/modelApi");
const { getGridFromLatLng } = require("../utils/gridUtils");

const router = express.Router();

const legacyGrids = {
    "box1_16.96N_63.21E": {
        sw_lat: 16.9583,
        sw_lon: 63.2083,
        ne_lat: 17.2083,
        ne_lon: 63.4583
    },
    "box_2.00_55.00": {
        sw_lat: 2.0,
        sw_lon: 55.0,
        ne_lat: 2.25,
        ne_lon: 55.25
    },
    "box_1.75_54.50": {
        sw_lat: 1.75,
        sw_lon: 54.5,
        ne_lat: 2.0,
        ne_lon: 54.75
    },
    "box_6.00_55.00": {
        sw_lat: 6.0,
        sw_lon: 55.0,
        ne_lat: 6.25,
        ne_lon: 55.25
    }
};

function resolveGrid({ grid_id, lat, lng }) {
    if (grid_id && legacyGrids[grid_id]) {
        return { gridId: grid_id, ...legacyGrids[grid_id] };
    }

    if (grid_id) {
        const match = /^box_(-?\d+(?:\.\d+)?)_(-?\d+(?:\.\d+)?)$/.exec(String(grid_id).trim());
        if (match) {
            const sw_lat = Number(match[1]);
            const sw_lon = Number(match[2]);
            if (Number.isFinite(sw_lat) && Number.isFinite(sw_lon)) {
                return {
                    gridId: `box_${sw_lat.toFixed(2)}_${sw_lon.toFixed(2)}`,
                    sw_lat,
                    sw_lon,
                    ne_lat: sw_lat + 0.25,
                    ne_lon: sw_lon + 0.25
                };
            }
        }
    }

    // Fallback: accept raw coordinates so the side panel works even if the
    // frontend sends lat/lng instead of a grid id.
    if (lat !== undefined && lng !== undefined) {
        const flat = Number(lat);
        const flng = Number(lng);
        if (Number.isFinite(flat) && Number.isFinite(flng)) {
            const g = getGridFromLatLng(flat, flng);
            return {
                gridId: g.gridId,
                sw_lat: g.sw_lat,
                sw_lon: g.sw_lon,
                ne_lat: g.ne_lat,
                ne_lon: g.ne_lon
            };
        }
    }

    return null;
}

function isValidDate(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

async function handleProfile(req, res) {
    try {
        const source = req.method === "GET" ? req.query : req.body || {};
        const { grid_id, forecast_date, lat, lng } = source;

        if (!forecast_date || !isValidDate(forecast_date)) {
            return res.status(400).json({
                error: "forecast_date is required in YYYY-MM-DD format"
            });
        }

        const grid = resolveGrid({ grid_id, lat, lng });

        if (!grid) {
            return res.status(400).json({
                error: grid_id
                    ? `Unknown grid_id: ${grid_id}. Expected box_<sw_lat>_<sw_lon> or lat/lng.`
                    : "grid_id (or lat + lng) is required"
            });
        }

        let data;
        try {
            data = await getForecast(
                grid.sw_lat,
                grid.sw_lon,
                grid.ne_lat,
                grid.ne_lon,
                forecast_date
            );
        } catch (modelError) {
            console.error("Model API error:", modelError);
            const status = modelError.code === "MODEL_API_NOT_CONFIGURED" ? 502 : 502;
            return res.status(status).json({
                error: modelError.message || "Failed to fetch forecast from model API",
                code: modelError.code || "MODEL_API_ERROR",
                grid_id: grid.gridId,
                forecast_date,
            });
        }

        // Combine actual + prediction + uncertainty
        const actualByDepth = data.evaluation?.by_depth || [];

        const profile = actualByDepth
            .map((item) => ({
                depth_m: Number(item.depth_m),
                actual: Number(item.actual),
                prediction: Number(item.prediction),
                q10: item.q10 === undefined || item.q10 === null ? null : Number(item.q10),
                q90: item.q90 === undefined || item.q90 === null ? null : Number(item.q90)
            }))
            .filter((item) =>
                Number.isFinite(item.depth_m) &&
                Number.isFinite(item.actual) &&
                Number.isFinite(item.prediction)
            )
            .sort((a, b) => a.depth_m - b.depth_m);

        res.json({
            status: "success",
            grid_id: grid.gridId,
            forecast_date,
            count: profile.length,
            profile
        });

    } catch (error) {
        console.error("Profile error:", error);

        res.status(500).json({
            error: "Failed to fetch forecast"
        });
    }
}

router.post("/", handleProfile);
router.get("/", handleProfile);

module.exports = router;
