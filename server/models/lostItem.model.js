const pool = require("../config/database");


// ============================================================
// CREATE LOST ITEM
// ============================================================

const createLostItem = async (lostItemData) => {

    const {
        user_id,
        category_id,
        item_name,
        description,
        brand,
        colour,
        identifying_features,
        location_lost,
        date_lost
    } = lostItemData;

    const [result] = await pool.execute(
        `INSERT INTO lost_items
        (
            user_id,
            category_id,
            item_name,
            description,
            brand,
            colour,
            identifying_features,
            location_lost,
            date_lost
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            user_id,
            category_id,
            item_name,
            description,
            brand || null,
            colour || null,
            identifying_features || null,
            location_lost,
            date_lost
        ]
    );

    return result.insertId;
};


// ============================================================
// GET ALL LOST ITEMS
// ============================================================

const getAllLostItems = async (filters = {}) => {

    const {
        search,
        category_id,
        status,
        location,
        page = 1,
        limit = 10
    } = filters;


    // --------------------------------------------------------
    // Pagination
    // --------------------------------------------------------

    const currentPage = Math.max(parseInt(page) || 1, 1);
    const itemsPerPage = Math.min(
        Math.max(parseInt(limit) || 10, 1),
        100
    );

    const offset = (currentPage - 1) * itemsPerPage;


    // --------------------------------------------------------
    // Build WHERE conditions
    // --------------------------------------------------------

    const conditions = [];
    const values = [];


    // Search item name, description, brand and identifying
    // features

    if (search) {

        conditions.push(`
            (
                li.item_name LIKE ?
                OR li.description LIKE ?
                OR li.brand LIKE ?
                OR li.identifying_features LIKE ?
            )
        `);

        const searchValue = `%${search}%`;

        values.push(
            searchValue,
            searchValue,
            searchValue,
            searchValue
        );
    }


    // Filter by category

    if (category_id) {

        conditions.push(`li.category_id = ?`);

        values.push(category_id);
    }


    // Filter by status

    if (status) {

        conditions.push(`li.status = ?`);

        values.push(status);
    }


    // Filter by location

    if (location) {

        conditions.push(`li.location_lost LIKE ?`);

        values.push(`%${location}%`);
    }


    // --------------------------------------------------------
    // WHERE clause
    // --------------------------------------------------------

    const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";


    // --------------------------------------------------------
    // Get total number of matching records
    // --------------------------------------------------------

    const [countRows] = await pool.execute(
        `
        SELECT COUNT(*) AS total
        FROM lost_items li
        ${whereClause}
        `,
        values
    );

    const total = countRows[0].total;


   // --------------------------------------------------------
// Get actual items
// --------------------------------------------------------

const [rows] = await pool.query(
    `
    SELECT
        li.id,
        li.user_id,
        li.category_id,
        c.name AS category_name,
        li.item_name,
        li.description,
        li.brand,
        li.colour,
        li.identifying_features,
        li.location_lost,
        li.date_lost,
        li.status,
        li.created_at,
        li.updated_at

    FROM lost_items li

    INNER JOIN categories c
        ON li.category_id = c.id

    ${whereClause}

    ORDER BY li.created_at DESC

    LIMIT ${itemsPerPage} OFFSET ${offset}
    `,
    values
);

    // --------------------------------------------------------
    // Pagination information
    // --------------------------------------------------------

    const totalPages = Math.ceil(total / itemsPerPage);


    return {
        items: rows,

        pagination: {
            current_page: currentPage,
            items_per_page: itemsPerPage,
            total_items: total,
            total_pages: totalPages,
            has_next_page: currentPage < totalPages,
            has_previous_page: currentPage > 1
        }
    };
};

// ============================================================
// GET LOST ITEM BY ID
// ============================================================

const findLostItemById = async (id) => {

    const [rows] = await pool.execute(
        `SELECT
            li.id,
            li.user_id,
            li.category_id,
            c.name AS category_name,
            li.item_name,
            li.description,
            li.brand,
            li.colour,
            li.identifying_features,
            li.location_lost,
            li.date_lost,
            li.status,
            li.created_at,
            li.updated_at
        FROM lost_items li
        INNER JOIN categories c
            ON li.category_id = c.id
        WHERE li.id = ?`,
        [id]
    );

    return rows[0];
};


module.exports = {
    createLostItem,
    getAllLostItems,
    findLostItemById
};