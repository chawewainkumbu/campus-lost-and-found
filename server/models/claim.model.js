const pool = require("../config/database");


// ============================================================
// CREATE CLAIM
// ============================================================

const createClaim = async (claimData) => {
    const {
        found_item_id,
        user_id,
        match_id,
        claim_description
    } = claimData;

    const [result] = await pool.execute(
        `
        INSERT INTO claims
        (
            found_item_id,
            user_id,
            match_id,
            claim_description
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            found_item_id,
            user_id,
            match_id || null,
            claim_description
        ]
    );

    return result.insertId;
};


// ============================================================
// GET ALL CLAIMS
// ============================================================

const getAllClaims = async () => {
    const [rows] = await pool.execute(
        `
        SELECT
            c.id,
            c.found_item_id,
            c.user_id,
            c.match_id,
            c.claim_description,
            c.verification_notes,
            c.status,
            c.reviewed_by,
            c.reviewed_at,
            c.created_at,
            c.updated_at,

            fi.item_name AS found_item_name,

            u.full_name AS claimant_name,
            u.email AS claimant_email,

            reviewer.full_name AS reviewer_name

        FROM claims c

        INNER JOIN found_items fi
            ON c.found_item_id = fi.id

        INNER JOIN users u
            ON c.user_id = u.id

        LEFT JOIN users reviewer
            ON c.reviewed_by = reviewer.id

        ORDER BY c.created_at DESC
        `
    );

    return rows;
};


// ============================================================
// GET CLAIM BY ID
// ============================================================

const findClaimById = async (id) => {
    const [rows] = await pool.execute(
        `
        SELECT
            c.id,
            c.found_item_id,
            c.user_id,
            c.match_id,
            c.claim_description,
            c.verification_notes,
            c.status,
            c.reviewed_by,
            c.reviewed_at,
            c.created_at,
            c.updated_at,

            fi.item_name AS found_item_name,

            u.full_name AS claimant_name,
            u.email AS claimant_email,

            reviewer.full_name AS reviewer_name

        FROM claims c

        INNER JOIN found_items fi
            ON c.found_item_id = fi.id

        INNER JOIN users u
            ON c.user_id = u.id

        LEFT JOIN users reviewer
            ON c.reviewed_by = reviewer.id

        WHERE c.id = ?
        `,
        [id]
    );

    return rows[0];
};


// ============================================================
// GET CLAIMS FOR USER
// ============================================================

const getClaimsForUser = async (userId) => {
    const [rows] = await pool.execute(
        `
        SELECT
            c.id,
            c.found_item_id,
            c.user_id,
            c.match_id,
            c.claim_description,
            c.verification_notes,
            c.status,
            c.reviewed_by,
            c.reviewed_at,
            c.created_at,
            c.updated_at,

            fi.item_name AS found_item_name

        FROM claims c

        INNER JOIN found_items fi
            ON c.found_item_id = fi.id

        WHERE c.user_id = ?

        ORDER BY c.created_at DESC
        `,
        [userId]
    );

    return rows;
};


// ============================================================
// UPDATE CLAIM STATUS
// ============================================================

const updateClaimStatus = async (
    id,
    status,
    reviewedBy,
    verificationNotes
) => {
    const [result] = await pool.execute(
        `
        UPDATE claims
        SET
            status = ?,
            reviewed_by = ?,
            verification_notes = ?,
            reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [
            status,
            reviewedBy,
            verificationNotes || null,
            id
        ]
    );

    return result.affectedRows;
};

// ============================================================
// UPDATE ITEM STATUS AFTER CLAIM APPROVAL
// ============================================================

const updateItemStatusesAfterApproval = async (foundItemId) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Get the match associated with the found item
        const [matches] = await connection.execute(
            `
            SELECT lost_item_id
            FROM item_matches
            WHERE found_item_id = ?
              AND status = 'accepted'
            ORDER BY updated_at DESC
            LIMIT 1
            `,
            [foundItemId]
        );

        if (matches.length === 0) {
            throw new Error("No accepted match found for this found item");
        }

        const lostItemId = matches[0].lost_item_id;

        // Update lost item
        await connection.execute(
            `
            UPDATE lost_items
            SET status = 'claimed'
            WHERE id = ?
            `,
            [lostItemId]
        );

        // Update found item
        await connection.execute(
            `
            UPDATE found_items
            SET status = 'claimed'
            WHERE id = ?
            `,
            [foundItemId]
        );

        await connection.commit();

        return {
            lost_item_id: lostItemId,
            found_item_id: foundItemId
        };

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};
// ============================================================
// COMPLETE ITEM RETURN
// ============================================================

const completeItemReturn = async (claimId) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Get claim and related match
        const [claims] = await connection.execute(
            `
            SELECT
                c.id,
                c.found_item_id,
                c.match_id,
                c.status,
                im.lost_item_id
            FROM claims c
            LEFT JOIN item_matches im
                ON c.match_id = im.id
            WHERE c.id = ?
            `,
            [claimId]
        );

        if (claims.length === 0) {
            throw new Error("Claim not found");
        }

        const claim = claims[0];

        if (claim.status !== "approved") {
            throw new Error("Only approved claims can be returned");
        }

        if (!claim.lost_item_id) {
            throw new Error("No matching lost item found");
        }

        // Update found item
        await connection.execute(
            `
            UPDATE found_items
            SET status = 'returned'
            WHERE id = ?
            `,
            [claim.found_item_id]
        );

        // Close lost item
        await connection.execute(
            `
            UPDATE lost_items
            SET status = 'closed'
            WHERE id = ?
            `,
            [claim.lost_item_id]
        );

        await connection.commit();

        return {
            claim_id: claim.id,
            found_item_id: claim.found_item_id,
            lost_item_id: claim.lost_item_id
        };

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};
// ============================================================
// CHECK EXISTING CLAIM
// ============================================================

const findExistingClaim = async (userId, matchId) => {
    const [rows] = await pool.execute(
        `
        SELECT id, status
        FROM claims
        WHERE user_id = ?
          AND match_id = ?
          AND status IN ('pending', 'approved')
        LIMIT 1
        `,
        [userId, matchId]
    );

    return rows[0];
};
module.exports = {
    createClaim,
    getAllClaims,
    findClaimById,
    getClaimsForUser,
    updateClaimStatus,
    updateItemStatusesAfterApproval,
    completeItemReturn,
    findExistingClaim
};