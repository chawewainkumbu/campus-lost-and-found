const notificationModel = require("../models/notification.model");
const pool = require("../config/database");

// Send notification to one user
const notifyUser = async (userId, title, message, type = "system") => {
    if (!userId) return;

    await notificationModel.createNotification({
        user_id: userId,
        title,
        message,
        type
    });
};


// Notify the owner when a match is accepted
const notifyMatchAccepted = async (match) => {
    const [rows] = await pool.execute(
        `
        SELECT 
            li.user_id,
            li.item_name
        FROM lost_items li
        WHERE li.id = ?
        `,
        [match.lost_item_id]
    );

    if (!rows.length) return;

    const lostItem = rows[0];

    await notifyUser(
        lostItem.user_id,
        "Match Found",
        `A possible match has been accepted for your lost item: ${lostItem.item_name}. You can now submit a claim.`,
        "match"
    );
};


// Notify staff and administrators about a new claim
const notifyStaffAboutClaim = async (claim) => {
    const [users] = await pool.execute(
        `
        SELECT id
        FROM users
        WHERE role IN ('staff', 'admin', 'super_admin')
          AND is_active = 1
        `
    );

    for (const user of users) {
        await notifyUser(
            user.id,
            "New Claim Submitted",
            `A new claim has been submitted for found item #${claim.found_item_id} and requires review.`,
            "claim"
        );
    }
};


// Notify claimant when claim status changes
const notifyClaimStatus = async (claim, status) => {
    let message;

    if (status === "approved") {
        message = "Your claim has been approved. Please follow the instructions to complete the item return.";
    } else if (status === "rejected") {
        message = "Your claim has been rejected. Please contact the Lost & Found office if you need further information.";
    } else {
        message = `Your claim status has been updated to ${status}.`;
    }

    await notifyUser(
        claim.user_id,
        `Claim ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message,
        "claim"
    );
};


// Notify claimant when the item has been returned
const notifyItemReturned = async (claim) => {
    await notifyUser(
        claim.user_id,
        "Item Returned",
        "Your claimed item has been successfully marked as returned.",
        "status_update"
    );
};


module.exports = {
    notifyUser,
    notifyMatchAccepted,
    notifyStaffAboutClaim,
    notifyClaimStatus,
    notifyItemReturned
};