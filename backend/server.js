require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

const profileRouter = require("./routes/profile");

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "OceanEmbed backend is running"
    });
});
app.get("/api/profile-test", (req, res) => {
    res.json({
        status: "success",
        message: "Profile backend is ready"
    });
});

app.use("/api/profile", profileRouter);

app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});