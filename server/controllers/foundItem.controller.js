const { validationResult } = require("express-validator");

const {
    createFoundItem,
    getAllFoundItems,
    findFoundItemById
} = require("../models/foundItem.model");


// ============================================================
// REPORT FOUND ITEM
// ============================================================

const reportFoundItem = async (req, res) => {

    try {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array()
            });
        }

        const user_id = req.user.id;

        const {
            category_id,
            item_name,
            description,
            brand,
            colour,
            identifying_features,
            location_found,
            date_found
        } = req.body;

        const foundItemId = await createFoundItem({
            user_id,
            category_id,
            item_name,
            description,
            brand,
            colour,
            identifying_features,
            location_found,
            date_found
        });

        const foundItem = await findFoundItemById(foundItemId);

        return res.status(201).json({
            success: true,
            message: "Found item reported successfully",
            item: foundItem
        });

    } catch (error) {

        console.error("Report found item error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while reporting found item"
        });
    }
};


// ============================================================
// GET ALL FOUND ITEMS
// ============================================================

const getFoundItems = async (req, res) => {

    try {

        const {
            search,
            category_id,
            status,
            location,
            page,
            limit
        } = req.query;

        const result = await getAllFoundItems({
            search,
            category_id,
            status,
            location,
            page,
            limit
        });

        return res.status(200).json({
            success: true,
            count: result.items.length,
            pagination: result.pagination,
            items: result.items
        });

    } catch (error) {

        console.error("Get found items error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving found items"
        });
    }
};


// ============================================================
// GET ONE FOUND ITEM
// ============================================================

const getFoundItem = async (req, res) => {

    try {

        const { id } = req.params;

        const item = await findFoundItemById(id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Found item not found"
            });
        }

        return res.status(200).json({
            success: true,
            item
        });

    } catch (error) {

        console.error("Get found item error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving found item"
        });
    }
};


module.exports = {
    reportFoundItem,
    getFoundItems,
    getFoundItem
};