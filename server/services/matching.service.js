const pool = require("../config/database");
const matchModel = require("../models/match.model");

// ============================================================
// TEXT NORMALIZATION
// ============================================================

const normalizeText = (value) => {
    if (!value) {
        return "";
    }

    return value.toString().toLowerCase().trim();
};

// ============================================================
// TEXT SIMILARITY
// ============================================================

const textSimilarity = (text1, text2) => {
    const a = normalizeText(text1);
    const b = normalizeText(text2);

    if (!a || !b) {
        return 0;
    }

    if (a === b) {
        return 1;
    }

    if (a.includes(b) || b.includes(a)) {
        return 0.8;
    }

    const wordsA = new Set(a.split(/\s+/));
    const wordsB = new Set(b.split(/\s+/));

    const intersection = [...wordsA].filter((word) =>
        wordsB.has(word)
    );

    const union = new Set([...wordsA, ...wordsB]);

    if (union.size === 0) {
        return 0;
    }

    return intersection.length / union.size;
};

// ============================================================
// DATE SIMILARITY
// ============================================================

const dateSimilarity = (date1, date2) => {
    if (!date1 || !date2) {
        return 0;
    }

    const firstDate = new Date(date1);
    const secondDate = new Date(date2);

    if (
        Number.isNaN(firstDate.getTime()) ||
        Number.isNaN(secondDate.getTime())
    ) {
        return 0;
    }

    const differenceMilliseconds = Math.abs(
        firstDate.getTime() - secondDate.getTime()
    );

    const differenceDays =
        differenceMilliseconds / (1000 * 60 * 60 * 24);

    if (differenceDays === 0) {
        return 1;
    }

    if (differenceDays <= 7) {
        return 0.8;
    }

    if (differenceDays <= 30) {
        return 0.5;
    }

    return 0;
};

// ============================================================
// CALCULATE MATCH SCORE
// ============================================================

const calculateMatchScore = (lostItem, foundItem) => {
    let score = 0;

    // Category: 20%
    if (
        lostItem.category_id != null &&
        foundItem.category_id != null &&
        Number(lostItem.category_id) === Number(foundItem.category_id)
    ) {
        score += 20;
    }

    // Item name: 20%
    score +=
        textSimilarity(
            lostItem.item_name,
            foundItem.item_name
        ) * 20;

    // Brand: 15%
    if (lostItem.brand && foundItem.brand) {
        score +=
            textSimilarity(
                lostItem.brand,
                foundItem.brand
            ) * 15;
    }

    // Colour: 10%
    if (lostItem.colour && foundItem.colour) {
        score +=
            textSimilarity(
                lostItem.colour,
                foundItem.colour
            ) * 10;
    }

    // Description: 15%
    score +=
        textSimilarity(
            lostItem.description,
            foundItem.description
        ) * 15;

    // Identifying features: 10%
    if (
        lostItem.identifying_features &&
        foundItem.identifying_features
    ) {
        score +=
            textSimilarity(
                lostItem.identifying_features,
                foundItem.identifying_features
            ) * 10;
    }

    // Location: 5%
    score +=
        textSimilarity(
            lostItem.location_lost,
            foundItem.location_found
        ) * 5;

    // Date: 5%
    score +=
        dateSimilarity(
            lostItem.date_lost,
            foundItem.date_found
        ) * 5;

    return Number(Math.min(score, 100).toFixed(2));
};

// ============================================================
// GET LOST ITEM
// ============================================================

const getLostItemForMatching = async (lostItemId) => {
    const [rows] = await pool.execute(
        `SELECT
            id,
            user_id,
            category_id,
            item_name,
            description,
            brand,
            colour,
            identifying_features,
            location_lost,
            date_lost,
            status
         FROM lost_items
         WHERE id = ?`,
        [lostItemId]
    );

    return rows[0] || null;
};

// ============================================================
// GET FOUND ITEM
// ============================================================

const getFoundItemForMatching = async (foundItemId) => {
    const [rows] = await pool.execute(
        `SELECT
            id,
            user_id,
            category_id,
            item_name,
            description,
            brand,
            colour,
            identifying_features,
            location_found,
            date_found,
            status
         FROM found_items
         WHERE id = ?`,
        [foundItemId]
    );

    return rows[0] || null;
};

// ============================================================
// CREATE OR UPDATE A MATCH
// ============================================================

const matchLostAndFoundItems = async (
    lostItemId,
    foundItemId
) => {
    const lostItem =
        await getLostItemForMatching(lostItemId);

    const foundItem =
        await getFoundItemForMatching(foundItemId);

    if (!lostItem || !foundItem) {
        throw new Error("Lost item or found item not found");
    }

    // A user should not match their own lost and found reports.
    if (
        Number(lostItem.user_id) ===
        Number(foundItem.user_id)
    ) {
        return null;
    }

    // Do not match reports that are no longer eligible.
    if (
        !["lost", "matched"].includes(lostItem.status) ||
        !["found", "matched"].includes(foundItem.status)
    ) {
        return null;
    }

    const matchScore = calculateMatchScore(
        lostItem,
        foundItem
    );

    // Minimum match threshold: 40%.
    if (matchScore < 40) {
        return null;
    }

    // Use the model to update an existing pair or create a new one.
    return await matchModel.createOrUpdateMatch({
        lost_item_id: lostItem.id,
        found_item_id: foundItem.id,
        match_score: matchScore
    });
};

// ============================================================
// FIND AND SAVE MATCHES FOR A LOST ITEM
// ============================================================

const findMatchesForLostItem = async (lostItemId) => {
    const lostItem =
        await getLostItemForMatching(lostItemId);

    if (!lostItem) {
        throw new Error("Lost item not found");
    }

    const [foundItems] = await pool.execute(
        `SELECT id
         FROM found_items
         WHERE status IN ('found', 'matched')
           AND user_id <> ?`,
        [lostItem.user_id]
    );

    const matches = [];

    for (const foundItem of foundItems) {
        const matchId = await matchLostAndFoundItems(
            lostItemId,
            foundItem.id
        );

        if (matchId !== null) {
            matches.push({
                match_id: matchId,
                lost_item_id: Number(lostItemId),
                found_item_id: foundItem.id
            });
        }
    }

    return matches;
};

// ============================================================
// FIND AND SAVE MATCHES FOR A FOUND ITEM
// ============================================================

const findMatchesForFoundItem = async (foundItemId) => {
    const foundItem =
        await getFoundItemForMatching(foundItemId);

    if (!foundItem) {
        throw new Error("Found item not found");
    }

    const [lostItems] = await pool.execute(
        `SELECT id
         FROM lost_items
         WHERE status IN ('lost', 'matched')
           AND user_id <> ?`,
        [foundItem.user_id]
    );

    const matches = [];

    for (const lostItem of lostItems) {
        const matchId = await matchLostAndFoundItems(
            lostItem.id,
            foundItemId
        );

        if (matchId !== null) {
            matches.push({
                match_id: matchId,
                lost_item_id: lostItem.id,
                found_item_id: Number(foundItemId)
            });
        }
    }

    return matches;
};

// ============================================================
// EXPORT FUNCTIONS
// ============================================================

module.exports = {
    calculateMatchScore,
    matchLostAndFoundItems,
    findMatchesForLostItem,
    findMatchesForFoundItem
};