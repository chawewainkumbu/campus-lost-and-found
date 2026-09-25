const pool = require("../config/database");


// ============================================================
// CREATE MATCH
// ============================================================

const createMatch = async (matchData) => {

    const {
        lost_item_id,
        found_item_id,
        match_score
    } = matchData;


    const [result] = await pool.execute(
        `
        INSERT INTO item_matches
        (
            lost_item_id,
            found_item_id,
            match_score
        )
        VALUES (?, ?, ?)
        `,
        [
            lost_item_id,
            found_item_id,
            match_score
        ]
    );


    return result.insertId;
};


// ============================================================
// GET ALL MATCHES
// ============================================================

const getAllMatches = async () => {

    const [rows] = await pool.execute(
        `
        SELECT
            im.id,
            im.lost_item_id,
            im.found_item_id,
            im.match_score,
            im.status,
            im.created_at,
            im.updated_at,

            li.item_name AS lost_item_name,
            li.description AS lost_item_description,
            li.location_lost,
            li.date_lost,

            fi.item_name AS found_item_name,
            fi.description AS found_item_description,
            fi.location_found,
            fi.date_found

        FROM item_matches im

        INNER JOIN lost_items li
            ON im.lost_item_id = li.id

        INNER JOIN found_items fi
            ON im.found_item_id = fi.id

        ORDER BY im.match_score DESC
        `
    );


    return rows;
};


// ============================================================
// GET MATCH BY ID
// ============================================================

const findMatchById = async (id) => {

    const [rows] = await pool.execute(
        `
        SELECT
            im.id,
            im.lost_item_id,
            im.found_item_id,
            im.match_score,
            im.status,
            im.created_at,
            im.updated_at,

            li.item_name AS lost_item_name,
            li.description AS lost_item_description,
            li.brand AS lost_item_brand,
            li.colour AS lost_item_colour,
            li.location_lost,
            li.date_lost,

            fi.item_name AS found_item_name,
            fi.description AS found_item_description,
            fi.brand AS found_item_brand,
            fi.colour AS found_item_colour,
            fi.location_found,
            fi.date_found

        FROM item_matches im

        INNER JOIN lost_items li
            ON im.lost_item_id = li.id

        INNER JOIN found_items fi
            ON im.found_item_id = fi.id

        WHERE im.id = ?
        `,
        [id]
    );


    return rows[0];
};


// ============================================================
// UPDATE MATCH STATUS
// ============================================================

const updateMatchStatus = async (id, status) => {

    const [result] = await pool.execute(
        `
        UPDATE item_matches
        SET status = ?
        WHERE id = ?
        `,
        [
            status,
            id
        ]
    );


    return result.affectedRows;
};


// ============================================================
// GET MATCHES FOR A LOST ITEM
// ============================================================

const getMatchesForLostItem = async (lostItemId) => {

    const [rows] = await pool.execute(
        `
        SELECT
            im.id,
            im.lost_item_id,
            im.found_item_id,
            im.match_score,
            im.status,
            im.created_at,

            fi.item_name AS found_item_name,
            fi.description AS found_item_description,
            fi.brand AS found_item_brand,
            fi.colour AS found_item_colour,
            fi.location_found,
            fi.date_found

        FROM item_matches im

        INNER JOIN found_items fi
            ON im.found_item_id = fi.id

        WHERE im.lost_item_id = ?

        ORDER BY im.match_score DESC
        `,
        [lostItemId]
    );


    return rows;
};


// ============================================================
// GET MATCHES FOR A FOUND ITEM
// ============================================================

const getMatchesForFoundItem = async (foundItemId) => {

    const [rows] = await pool.execute(
        `
        SELECT
            im.id,
            im.lost_item_id,
            im.found_item_id,
            im.match_score,
            im.status,
            im.created_at,

            li.item_name AS lost_item_name,
            li.description AS lost_item_description,
            li.brand AS lost_item_brand,
            li.colour AS lost_item_colour,
            li.location_lost,
            li.date_lost

        FROM item_matches im

        INNER JOIN lost_items li
            ON im.lost_item_id = li.id

        WHERE im.found_item_id = ?

        ORDER BY im.match_score DESC
        `,
        [foundItemId]
    );


    return rows;
};
const updateItemStatusesAfterAcceptance = async (
    lostItemId,
    foundItemId
) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Update lost item
        await connection.execute(
            `
            UPDATE lost_items
            SET status = 'matched'
            WHERE id = ?
            `,
            [lostItemId]
        );

        // Update found item
        await connection.execute(
            `
            UPDATE found_items
            SET status = 'matched'
            WHERE id = ?
            `,
            [foundItemId]
        );

        await connection.commit();

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};

// ============================================================
// EXPORT FUNCTIONS
// ============================================================

module.exports = {
    createMatch,
    getAllMatches,
    findMatchById,
    updateMatchStatus,
    updateItemStatusesAfterAcceptance,
    getMatchesForLostItem,
    getMatchesForFoundItem
};