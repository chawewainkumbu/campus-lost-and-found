const pool = require("../config/database");


// ============================================================
// TEXT NORMALIZATION
// ============================================================

const normalizeText = (value) => {

    if (!value) {
        return "";
    }

    return value
        .toString()
        .toLowerCase()
        .trim();
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

    // Check whether one value contains the other
    if (a.includes(b) || b.includes(a)) {
        return 0.8;
    }

    // Compare individual words
    const wordsA = new Set(a.split(/\s+/));
    const wordsB = new Set(b.split(/\s+/));

    const intersection = [...wordsA].filter(word =>
        wordsB.has(word)
    );

    const union = new Set([
        ...wordsA,
        ...wordsB
    ]);

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


    // Same day
    if (differenceDays === 0) {
        return 1;
    }

    // Within 1 week
    if (differenceDays <= 7) {
        return 0.8;
    }

    // Within 30 days
    if (differenceDays <= 30) {
        return 0.5;
    }

    // More than 30 days apart
    return 0;
};


// ============================================================
// CALCULATE MATCH SCORE
// ============================================================

const calculateMatchScore = (lostItem, foundItem) => {

    let score = 0;


    // --------------------------------------------------------
    // CATEGORY — 20%
    // --------------------------------------------------------

    if (
        lostItem.category_id &&
        foundItem.category_id &&
        lostItem.category_id === foundItem.category_id
    ) {
        score += 20;
    }


    // --------------------------------------------------------
    // ITEM NAME — 20%
    // --------------------------------------------------------

    score +=
        textSimilarity(
            lostItem.item_name,
            foundItem.item_name
        ) * 20;


    // --------------------------------------------------------
    // BRAND — 15%
    // --------------------------------------------------------

    if (
        lostItem.brand &&
        foundItem.brand
    ) {
        score +=
            textSimilarity(
                lostItem.brand,
                foundItem.brand
            ) * 15;
    }


    // --------------------------------------------------------
    // COLOUR — 10%
    // --------------------------------------------------------

    if (
        lostItem.colour &&
        foundItem.colour
    ) {
        score +=
            textSimilarity(
                lostItem.colour,
                foundItem.colour
            ) * 10;
    }


    // --------------------------------------------------------
    // DESCRIPTION — 15%
    // --------------------------------------------------------

    score +=
        textSimilarity(
            lostItem.description,
            foundItem.description
        ) * 15;


    // --------------------------------------------------------
    // IDENTIFYING FEATURES — 10%
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // LOCATION — 5%
    // --------------------------------------------------------

    score +=
        textSimilarity(
            lostItem.location_lost,
            foundItem.location_found
        ) * 5;


    // --------------------------------------------------------
    // DATE — 5%
    // --------------------------------------------------------

    score +=
        dateSimilarity(
            lostItem.date_lost,
            foundItem.date_found
        ) * 5;


    return Number(
        Math.min(score, 100).toFixed(2)
    );
};


// ============================================================
// GET LOST ITEM
// ============================================================

const getLostItemForMatching = async (lostItemId) => {

    const [rows] = await pool.execute(
        `
        SELECT
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

        WHERE id = ?
        `,
        [lostItemId]
    );

    return rows[0];
};


// ============================================================
// GET FOUND ITEM
// ============================================================

const getFoundItemForMatching = async (foundItemId) => {

    const [rows] = await pool.execute(
        `
        SELECT
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

        WHERE id = ?
        `,
        [foundItemId]
    );

    return rows[0];
};


// ============================================================
// CREATE MATCH FOR TWO ITEMS
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


    const matchScore =
        calculateMatchScore(
            lostItem,
            foundItem
        );


    // Only create a match if score is at least 40%
    if (matchScore < 40) {
        return null;
    }


    const [existingMatch] = await pool.execute(
        `
        SELECT id
        FROM item_matches

        WHERE lost_item_id = ?
        AND found_item_id = ?
        `,
        [
            lostItemId,
            foundItemId
        ]
    );


    if (existingMatch.length > 0) {

        await pool.execute(
            `
            UPDATE item_matches

            SET match_score = ?

            WHERE lost_item_id = ?
            AND found_item_id = ?
            `,
            [
                matchScore,
                lostItemId,
                foundItemId
            ]
        );

        return existingMatch[0].id;
    }


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
            lostItemId,
            foundItemId,
            matchScore
        ]
    );


    return result.insertId;
};


// ============================================================
// FIND MATCHES FOR LOST ITEM
// ============================================================

const findMatchesForLostItem = async (lostItemId) => {

    const lostItem =
        await getLostItemForMatching(lostItemId);


    if (!lostItem) {
        throw new Error("Lost item not found");
    }


    const [foundItems] = await pool.execute(
        `
        SELECT
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

        WHERE status = 'found'
        `
    );


    const matches = [];


    for (const foundItem of foundItems) {

        const matchScore =
            calculateMatchScore(
                lostItem,
                foundItem
            );


        if (matchScore >= 40) {

            matches.push({
                lost_item_id: lostItem.id,
                found_item_id: foundItem.id,
                match_score: matchScore
            });
        }
    }


    // Highest scores first
    matches.sort(
        (a, b) =>
            b.match_score - a.match_score
    );


    return matches;
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    calculateMatchScore,
    matchLostAndFoundItems,
    findMatchesForLostItem
};