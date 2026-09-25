const matchModel = require("../models/match.model");
const matchingService = require("../services/matching.service");
const notificationService = require("../services/notification.service");

// ============================================================
// CREATE MATCH
// ============================================================

const createMatch = async (req, res) => {
    try {
        const { lost_item_id, found_item_id } = req.body;

        // Validate required fields
        if (!lost_item_id || !found_item_id) {
            return res.status(400).json({
                success: false,
                message: "lost_item_id and found_item_id are required"
            });
        }

        // Calculate match
        const match = await matchingService.matchLostAndFoundItems(
            lost_item_id,
            found_item_id
        );

        // No sufficient match
        if (!match) {
            return res.status(200).json({
                success: true,
                matched: false,
                message: "The items do not meet the minimum match threshold"
            });
        }

        return res.status(201).json({
            success: true,
            matched: true,
            message: "Lost and found items matched successfully",
            data: match
        });

    } catch (error) {
        console.error("Create Match Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create match"
        });
    }
};


// ============================================================
// GET ALL MATCHES
// ============================================================

const getAllMatches = async (req, res) => {
    try {
        const matches = await matchModel.getAllMatches();

        return res.status(200).json({
            success: true,
            count: matches.length,
            data: matches
        });

    } catch (error) {
        console.error("Get All Matches Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve matches"
        });
    }
};


// ============================================================
// GET MATCH BY ID
// ============================================================

const getMatchById = async (req, res) => {
    try {
        const { id } = req.params;

        const match = await matchModel.findMatchById(id);

        if (!match) {
            return res.status(404).json({
                success: false,
                message: "Match not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: match
        });

    } catch (error) {
        console.error("Get Match Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve match"
        });
    }
};


// ============================================================
// UPDATE MATCH STATUS
// ============================================================

const updateMatchStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "pending",
            "accepted",
            "rejected"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid match status"
            });
        }

        // Get the match first
        const match = await matchModel.findMatchById(id);

        if (!match) {
            return res.status(404).json({
                success: false,
                message: "Match not found"
            });
        }

        // Update match status
        await matchModel.updateMatchStatus(id, status);

        // If the match is accepted,
        // update both item statuses
        if (status === "accepted") {
            await matchModel.updateItemStatusesAfterAcceptance(
                match.lost_item_id,
                match.found_item_id
            );
        }
        if (status === "accepted") {
    await notificationService.notifyMatchAccepted(match);
}

        return res.status(200).json({
            success: true,
            message: "Match status updated successfully"
        });

    } catch (error) {
        console.error("Update Match Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update match status"
        });
    }
};

// ============================================================
// GET MATCHES FOR LOST ITEM
// ============================================================

const getMatchesForLostItem = async (req, res) => {
    try {
        const { lostItemId } = req.params;

        const matches = await matchModel.getMatchesForLostItem(
            lostItemId
        );

        return res.status(200).json({
            success: true,
            count: matches.length,
            data: matches
        });

    } catch (error) {
        console.error("Get Lost Item Matches Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve matches for lost item"
        });
    }
};


// ============================================================
// GET MATCHES FOR FOUND ITEM
// ============================================================

const getMatchesForFoundItem = async (req, res) => {
    try {
        const { foundItemId } = req.params;

        const matches = await matchModel.getMatchesForFoundItem(
            foundItemId
        );

        return res.status(200).json({
            success: true,
            count: matches.length,
            data: matches
        });

    } catch (error) {
        console.error("Get Found Item Matches Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve matches for found item"
        });
    }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    createMatch,
    getAllMatches,
    getMatchById,
    updateMatchStatus,
    getMatchesForLostItem,
    getMatchesForFoundItem
};