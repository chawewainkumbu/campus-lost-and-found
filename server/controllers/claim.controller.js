const claimModel = require("../models/claim.model");
const matchModel = require("../models/match.model");
const lostItemModel = require("../models/lostItem.model");
const notificationService = require("../services/notification.service");


// ============================================================
// CREATE CLAIM
// ============================================================

const createClaim = async (req, res) => {
    try {
        const {
            found_item_id,
            match_id,
            claim_description
        } = req.body;

        const user_id = req.user.id;

await notificationService.notifyStaffAboutClaim({
    found_item_id,
    user_id: req.user.id,
    match_id
});
        
        // --------------------------------------------------------
        // Validate required fields
        // --------------------------------------------------------

        if (!found_item_id || !claim_description) {
            return res.status(400).json({
                success: false,
                message: "found_item_id and claim_description are required"
            });
        }


        // --------------------------------------------------------
        // Match ID required
        // --------------------------------------------------------

        if (!match_id) {
            return res.status(400).json({
                success: false,
                message: "match_id is required to submit a claim"
            });
        }


        // --------------------------------------------------------
        // Check match exists
        // --------------------------------------------------------

        const match = await matchModel.findMatchById(match_id);

        if (!match) {
            return res.status(404).json({
                success: false,
                message: "Match not found"
            });
        }


        // --------------------------------------------------------
        // Match must be accepted
        // --------------------------------------------------------

        if (match.status !== "accepted") {
            return res.status(400).json({
                success: false,
                message: "A claim can only be submitted for an accepted match"
            });
        }


        // --------------------------------------------------------
        // Verify found item belongs to match
        // --------------------------------------------------------

        if (Number(match.found_item_id) !== Number(found_item_id)) {
            return res.status(400).json({
                success: false,
                message: "The found item does not belong to this match"
            });
        }


        // --------------------------------------------------------
        // Get associated lost item
        // --------------------------------------------------------

        const lostItem = await lostItemModel.findLostItemById(
            match.lost_item_id
        );

        if (!lostItem) {
            return res.status(404).json({
                success: false,
                message: "Associated lost item not found"
            });
        }


        // --------------------------------------------------------
        // Verify ownership
        // --------------------------------------------------------

        if (Number(lostItem.user_id) !== Number(user_id)) {
            return res.status(403).json({
                success: false,
                message:
                    "You can only claim items that match your own lost-item report"
            });
        }


        // --------------------------------------------------------
        // Prevent duplicate active claims
        // --------------------------------------------------------

        const existingClaim = await claimModel.findExistingClaim(
            user_id,
            match_id
        );

        if (existingClaim) {
            return res.status(409).json({
                success: false,
                message:
                    "You already have an active claim for this match",
                claim_id: existingClaim.id,
                status: existingClaim.status
            });
        }


        // --------------------------------------------------------
        // Create claim
        // --------------------------------------------------------

        const claimId = await claimModel.createClaim({
            found_item_id,
            user_id,
            match_id,
            claim_description
        });


        // --------------------------------------------------------
        // Get created claim
        // --------------------------------------------------------

        const claim = await claimModel.findClaimById(claimId);


        return res.status(201).json({
            success: true,
            message: "Claim submitted successfully",
            claim
        });

    } catch (error) {

        console.error("Create Claim Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to submit claim"
        });
    }
};


// ============================================================
// GET ALL CLAIMS
// ============================================================

const getAllClaims = async (req, res) => {

    try {

        const claims = await claimModel.getAllClaims();

        return res.status(200).json({
            success: true,
            count: claims.length,
            data: claims
        });

    } catch (error) {

        console.error("Get All Claims Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve claims"
        });
    }
};


// ============================================================
// GET CLAIM BY ID
// ============================================================

const getClaimById = async (req, res) => {

    try {

        const { id } = req.params;

        const claim = await claimModel.findClaimById(id);

        if (!claim) {

            return res.status(404).json({
                success: false,
                message: "Claim not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: claim
        });

    } catch (error) {

        console.error("Get Claim Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve claim"
        });
    }
};


// ============================================================
// GET CURRENT USER CLAIMS
// ============================================================

const getMyClaims = async (req, res) => {

    try {

        const userId = req.user.id;

        const claims = await claimModel.getClaimsForUser(userId);

        return res.status(200).json({
            success: true,
            count: claims.length,
            data: claims
        });

    } catch (error) {

        console.error("Get My Claims Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve your claims"
        });
    }
};


// ============================================================
// UPDATE CLAIM STATUS
// ============================================================

const updateClaimStatus = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            status,
            verification_notes
        } = req.body;


        const allowedStatuses = [
            "pending",
            "approved",
            "rejected",
            "cancelled"
        ];


        if (!allowedStatuses.includes(status)) {

            return res.status(400).json({
                success: false,
                message: "Invalid claim status"
            });
        }


        const claim = await claimModel.findClaimById(id);

        if (!claim) {

            return res.status(404).json({
                success: false,
                message: "Claim not found"
            });
        }


        await claimModel.updateClaimStatus(
            id,
            status,
            req.user.id,
            verification_notes
        );
        await notificationService.notifyClaimStatus(claim, status);


        // --------------------------------------------------------
        // When approved, mark both items as claimed
        // --------------------------------------------------------

        if (status === "approved") {

            await claimModel.updateItemStatusesAfterApproval(
                claim.found_item_id
            );
        }


        const updatedClaim = await claimModel.findClaimById(id);


        return res.status(200).json({
            success: true,
            message: "Claim status updated successfully",
            claim: updatedClaim
        });

    } catch (error) {

        console.error("Update Claim Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update claim status"
        });
    }
};


// ============================================================
// COMPLETE ITEM RETURN
// ============================================================

const completeItemReturn = async (req, res) => {

    try {

        const { id } = req.params;

        const claim = await claimModel.findClaimById(id);


        if (!claim) {

            return res.status(404).json({
                success: false,
                message: "Claim not found"
            });
        }


        if (claim.status !== "approved") {

            return res.status(400).json({
                success: false,
                message: "Only approved claims can be returned"
            });
        }


        const result = await claimModel.completeItemReturn(id);
        

await notificationService.notifyItemReturned(claim);

        return res.status(200).json({
            success: true,
            message: "Item return completed successfully",
            data: result
        });

    } catch (error) {

        console.error("Complete Item Return Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to complete item return"
        });
    }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    createClaim,
    getAllClaims,
    getClaimById,
    getMyClaims,
    updateClaimStatus,
    completeItemReturn
};