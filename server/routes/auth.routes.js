const express = require("express");

const router = express.Router();

const {
    register,
    login,
    getMe
} = require("../controllers/auth.controller");

const authenticate = require("../middleware/auth.middleware");

// ============================================================
// PUBLIC ROUTES
// ============================================================

// Register
router.post("/register", register);

// Login
router.post("/login", login);


// ============================================================
// PROTECTED ROUTES
// ============================================================

// Get currently authenticated user
router.get("/me", authenticate, getMe);


module.exports = router;