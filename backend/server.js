require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// Frontend expects the backend on :5000 by default (VITE_BACKEND_API_URL).
// Allow override via PORT env var.
const PORT = Number(process.env.PORT) || 5000;

// ---- CORS ----
// Vite dev server runs on http://localhost:5173 (and sometimes 127.0.0.1 / other ports).
// Browsers block cross-origin POST /api/profile with JSON unless the backend
// explicitly allows the origin + Content-Type header + preflight (OPTIONS).
// Using cors() with no args works, but being explicit avoids silent breakage
// when credentials/headers change, and documents intent.
const defaultOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
];
const envOrigins = (process.env.FRONTEND_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const corsOptions = {
    // Reflect whitelisted origins; allow requests with no Origin (curl, server-to-server).
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // In dev, allow any localhost/127.0.0.1 port so Vite HMR port changes don't break CORS.
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
    maxAge: 86400,
};

app.use(cors(corsOptions));
// Express 5: use a regex-free preflight path. `app.use(cors())` already handles
// OPTIONS, but an explicit handler guarantees preflight never 404s.
app.use((req, res, next) => {
    if (req.method === "OPTIONS") return cors(corsOptions)(req, res, next);
    return next();
});
app.use(express.json({ limit: "256kb" }));

// Simple request log (helps diagnose CORS/network issues quickly)
app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} origin=${req.headers.origin || "-"}`);
    next();
});

const profileRouter = require("./routes/profile");
const surfaceRouter = require("./routes/surface");

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "OceanEmbed backend is running",
        port: PORT,
        modelApiConfigured: Boolean(process.env.MODEL_API_URL),
        // Route manifest — bump `build` whenever routes change so the
        // frontend console can tell a stale backend from a fresh one.
        build: "surface-map-1",
        routes: ["GET /api/profile", "POST /api/profile", "GET /api/surface", "POST /api/surface", "GET /api/surface/map", "POST /api/surface/map"],
        corsAllowedOrigins: allowedOrigins,
        time: new Date().toISOString(),
    });
});
app.get("/api/profile-test", (req, res) => {
    res.json({
        status: "success",
        message: "Profile backend is ready",
    });
});

app.use("/api/profile", profileRouter);
app.use("/api/surface", surfaceRouter);

// 404 for unknown /api routes (helps frontend distinguish bad URL vs backend down)
app.use("/api", (req, res) => {
    res.status(404).json({ error: `Unknown API route: ${req.method} ${req.originalUrl}` });
});

// CORS errors surface as plain Errors from the origin callback — return JSON, not HTML.
app.use((err, req, res, _next) => {
    if (err && String(err.message || "").startsWith("CORS blocked")) {
        return res.status(403).json({ error: err.message });
    }
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

if (!process.env.MODEL_API_URL) {
    console.warn(
        "WARNING: MODEL_API_URL is not set. /api/profile will return 502 until it is configured. " +
        "Set it in backend/.env (e.g. MODEL_API_URL=https://your-model-host)."
    );
}

app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
    console.log(`CORS allowed origins: ${allowedOrigins.join(", ")} (+ any localhost port)`);
    if (envOrigins.length) console.log(`Extra FRONTEND_ORIGIN: ${envOrigins.join(", ")}`);
});
