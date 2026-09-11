const express = require("express");
const { getForecast } = require("../services/modelApi");

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { grid_id, forecast_date } = req.body;

        if (!grid_id || !forecast_date) {
            return res.status(400).json({
                error: "grid_id and forecast_date are required"
            });
        }

        // Temporary grid mapping
        const grids = {
            "box1_16.96N_63.21E": {
                sw_lat: 16.9583,
                sw_lon: 63.2083,
                ne_lat: 17.2083,
                ne_lon: 63.4583
            },

            // Dashboard test grid
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

        const grid = grids[grid_id];

        if (!grid) {
            return res.status(400).json({
                error: `Unknown grid_id: ${grid_id}`
            });
        }

        const data = await getForecast(
            grid.sw_lat,
            grid.sw_lon,
            grid.ne_lat,
            grid.ne_lon,
            forecast_date
        );

        // Combine actual + prediction + uncertainty
        const actualByDepth = data.evaluation?.by_depth || [];

        const profile = actualByDepth.map((item) => ({
            depth_m: item.depth_m,
            actual: item.actual,
            prediction: item.prediction,
            q10: item.q10,
            q90: item.q90
        }));

        res.json({
            status: "success",
            grid_id,
            forecast_date,
            profile
        });

    } catch (error) {
        console.error("Profile error:", error);

        res.status(500).json({
            error: "Failed to fetch forecast"
        });
    }
});

module.exports = router;