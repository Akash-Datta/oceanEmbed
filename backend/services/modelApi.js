// Calls the upstream ocean model API and returns the parsed forecast JSON.
const MODEL_API_URL = (process.env.MODEL_API_URL || "").trim().replace(/\/+$/, "");
const MODEL_TIMEOUT_MS = Number(process.env.MODEL_TIMEOUT_MS) || 20000;

function validateNumber(value, name) {
    const n = Number(value);
    if (!Number.isFinite(n)) throw new Error(`${name} must be a finite number (got ${value})`);
    return n;
}

function validateDate(date) {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error(`date must be YYYY-MM-DD (got ${date})`);
    }
    return date;
}

async function callModelApi(path, params) {
    if (!MODEL_API_URL) {
        const err = new Error(
            "MODEL_API_URL is not configured on the backend. Set MODEL_API_URL in backend/.env"
        );
        err.code = "MODEL_API_NOT_CONFIGURED";
        throw err;
    }

    const url = `${MODEL_API_URL}${path}?${params.toString()}`;

    console.log("Calling model API:", url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
    try {
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
            const body = await response.text().catch(() => "");
            const err = new Error(
                `Model API failed: ${response.status} ${response.statusText}${body ? ` — ${body.slice(0, 300)}` : ""}`
            );
            err.code = "MODEL_API_HTTP_ERROR";
            err.status = response.status;
            throw err;
        }

        return await response.json();
    } catch (error) {
        if (error.name === "AbortError") {
            const err = new Error(`Model API timed out after ${MODEL_TIMEOUT_MS}ms`);
            err.code = "MODEL_API_TIMEOUT";
            throw err;
        }
        throw error;
    } finally {
        clearTimeout(timer);
    }
}

async function getForecast(sw_lat, sw_lon, ne_lat, ne_lon, date) {
    const swLat = validateNumber(sw_lat, "sw_lat");
    const swLon = validateNumber(sw_lon, "sw_lon");
    const neLat = validateNumber(ne_lat, "ne_lat");
    const neLon = validateNumber(ne_lon, "ne_lon");
    const cleanDate = validateDate(date);

    const params = new URLSearchParams({
        sw_lat: String(swLat),
        sw_lon: String(swLon),
        ne_lat: String(neLat),
        ne_lon: String(neLon),
        date: cleanDate,
        evaluate: "yes",
    });
    return callModelApi("/forecast", params);
}

async function getSurfacePoint(sw_lat, sw_lon, ne_lat, ne_lon, date) {
    const swLat = validateNumber(sw_lat, "sw_lat");
    const swLon = validateNumber(sw_lon, "sw_lon");
    const neLat = validateNumber(ne_lat, "ne_lat");
    const neLon = validateNumber(ne_lon, "ne_lon");
    const cleanDate = validateDate(date);

    const params = new URLSearchParams({
        sw_lat: String(swLat),
        sw_lon: String(swLon),
        ne_lat: String(neLat),
        ne_lon: String(neLon),
        date: cleanDate,
    });
    return callModelApi("/surface/point", params);
}

const SURFACE_MAP_PARAMS = ["sst", "sss", "zos", "uo", "vo"];

function validateSurfaceMapParameter(parameter) {
    const clean = String(parameter || "").trim().toLowerCase();
    if (!SURFACE_MAP_PARAMS.includes(clean)) {
        throw new Error(
            `parameter must be one of ${SURFACE_MAP_PARAMS.join(", ")} (got ${parameter})`
        );
    }
    return clean;
}

async function getSurfaceMap(date, parameter) {
    const cleanDate = validateDate(date);
    const cleanParameter = validateSurfaceMapParameter(parameter);

    const params = new URLSearchParams({
        date: cleanDate,
        parameter: cleanParameter,
    });
    return callModelApi("/surface/map", params);
}

module.exports = {
    getForecast,
    getSurfacePoint,
    getSurfaceMap,
    SURFACE_MAP_PARAMS,
};
