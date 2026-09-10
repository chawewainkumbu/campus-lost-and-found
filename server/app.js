const foundItemRoutes = require("./routes/foundItem.routes");
const lostItemRoutes = require("./routes/lostItem.routes");
const express = require("express");
const cors = require("cors");
const matchRoutes = require("./routes/match.routes");

const authRoutes = require("./routes/auth.routes");

const app = express();


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());

app.use(express.json());


// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Campus Lost & Found API is running"
    });
});


// ============================================================
// AUTHENTICATION ROUTES
// ============================================================

app.use("/api/auth", authRoutes);
app.use("/api/lost-items", lostItemRoutes);
app.use("/api/found-items", foundItemRoutes);
app.use("/api/matches", matchRoutes);


// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found",
        path: req.originalUrl,
        method: req.method
    });
});


module.exports = app;