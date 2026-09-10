const express = require("express");

const {
    createMatch,
    getAllMatches,
    getMatchById,
    updateMatchStatus,
    getMatchesForLostItem,
    getMatchesForFoundItem
} = require("../controllers/match.controller");

const router = express.Router();


// Create a match
router.post("/", createMatch);

// Get all matches
router.get("/", getAllMatches);

// Get matches for a lost item
router.get("/lost-item/:lostItemId", getMatchesForLostItem);

// Get matches for a found item
router.get("/found-item/:foundItemId", getMatchesForFoundItem);

// Get match by ID
router.get("/:id", getMatchById);

// Update match status
router.patch("/:id/status", updateMatchStatus);


module.exports = router;