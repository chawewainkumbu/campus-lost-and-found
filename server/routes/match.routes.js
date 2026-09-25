const express = require("express");

const {
    createMatch,
    getAllMatches,
    getMatchById,
    updateMatchStatus,
    getMatchesForLostItem,
    getMatchesForFoundItem
} = require("../controllers/match.controller");

const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();


// ============================================================
// MATCH ROUTES
// ============================================================

// Create a match
// Admin and Super Admin only
router.post(
    "/",
    authMiddleware,
    authorize("admin", "super_admin"),
    createMatch
);


// Get all matches
// Authenticated users
router.get(
    "/",
    authMiddleware,
    getAllMatches
);


// Get matches for a lost item
// Authenticated users
router.get(
    "/lost-item/:lostItemId",
    authMiddleware,
    getMatchesForLostItem
);


// Get matches for a found item
// Authenticated users
router.get(
    "/found-item/:foundItemId",
    authMiddleware,
    getMatchesForFoundItem
);


// Get a specific match
// Authenticated users
router.get(
    "/:id",
    authMiddleware,
    getMatchById
);


// Accept or reject a match
// Admin and Super Admin only
router.patch(
    "/:id/status",
    authMiddleware,
    authorize("admin", "super_admin"),
    updateMatchStatus
);


module.exports = router;