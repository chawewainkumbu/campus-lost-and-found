const pool = require("../config/database");


// ============================================================
// CREATE FOUND ITEM
// ============================================================

const createFoundItem = async (foundItemData) => {

    const {
        user_id,
        category_id,
        item_name,
        description,
        brand,
        colour,
        identifying_features,
        location_found,
        date_found
    } = foundItemData;

    const [result] = await pool.execute(
        `INSERT INTO found_items
        (
            user_id,
            category_id,
            item_name,
            description,
            brand,
            colour,
            identifying_features,
            location_found,
            date_found
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
            location_found,
            date_found
        ]
    );

    return result.insertId;
};


// ============================================================
// GET ALL FOUND ITEMS
// ============================================================

const getAllFoundItems = async (filters = {}) => {

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


    // Search
    if (search) {

        conditions.push(`
            (
                fi.item_name LIKE ?
                OR fi.description LIKE ?
                OR fi.brand LIKE ?
                OR fi.identifying_features LIKE ?
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


    // Category filter
    if (category_id) {

        conditions.push(`fi.category_id = ?`);

        values.push(category_id);
    }


    // Status filter
    if (status) {

        conditions.push(`fi.status = ?`);

        values.push(status);
    }


    // Location filter
    if (location) {

        conditions.push(`fi.location_found LIKE ?`);

        values.push(`%${location}%`);
    }


    // --------------------------------------------------------
    // WHERE clause
    // --------------------------------------------------------

    const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";


    // --------------------------------------------------------
    // Count matching items
    // --------------------------------------------------------

    const [countRows] = await pool.execute(
        `
        SELECT COUNT(*) AS total
        FROM found_items fi
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
            fi.id,
            fi.user_id,
            fi.category_id,
            c.name AS category_name,
            fi.item_name,
            fi.description,
            fi.brand,
            fi.colour,
            fi.identifying_features,
            fi.location_found,
            fi.date_found,
            fi.status,
            fi.created_at,
            fi.updated_at

        FROM found_items fi

        INNER JOIN categories c
            ON fi.category_id = c.id

        ${whereClause}

        ORDER BY fi.created_at DESC

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
// GET FOUND ITEM BY ID
// ============================================================

const findFoundItemById = async (id) => {

    const [rows] = await pool.execute(
        `
        SELECT
            fi.id,
            fi.user_id,
            fi.category_id,
            c.name AS category_name,
            fi.item_name,
            fi.description,
            fi.brand,
            fi.colour,
            fi.identifying_features,
            fi.location_found,
            fi.date_found,
            fi.status,
            fi.created_at,
            fi.updated_at

        FROM found_items fi

        INNER JOIN categories c
            ON fi.category_id = c.id

        WHERE fi.id = ?
        `,
        [id]
    );

    return rows[0];
};


// ============================================================
// EXPORT FUNCTIONS
// ============================================================

module.exports = {
    createFoundItem,
    getAllFoundItems,
    findFoundItemById
};