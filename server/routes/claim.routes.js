const express = require("express");

const {
    createClaim,
    getAllClaims,
    getClaimById,
    getMyClaims,
    updateClaimStatus,
    completeItemReturn
} = require("../controllers/claim.controller");

const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();


// ============================================================
// CLAIM ROUTES
// ============================================================

// Submit a claim
router.post(
    "/",
    authMiddleware,
    authorize("student", "staff", "admin", "super_admin"),
    createClaim
);


// Get current user's claims
router.get(
    "/my-claims",
    authMiddleware,
    authorize("student", "staff", "admin", "super_admin"),
    getMyClaims
);


// Get all claims
router.get(
    "/",
    authMiddleware,
    authorize("staff", "admin", "super_admin"),
    getAllClaims
);


// Get a specific claim
router.get(
    "/:id",
    authMiddleware,
    authorize("staff", "admin", "super_admin"),
    getClaimById
);


// Approve, reject or cancel a claim
router.patch(
    "/:id/status",
    authMiddleware,
    authorize("staff", "admin", "super_admin"),
    updateClaimStatus
);


// Complete item return
router.patch(
    "/:id/return",
    authMiddleware,
    authorize("staff", "admin", "super_admin"),
    completeItemReturn
);


module.exports = router;