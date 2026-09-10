const { validationResult } = require("express-validator");

const {
    createLostItem,
    getAllLostItems,
    findLostItemById
} = require("../models/lostItem.model");


// ============================================================
// REPORT LOST ITEM
// ============================================================

const reportLostItem = async (req, res) => {

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
            location_lost,
            date_lost
        } = req.body;

        const lostItemId = await createLostItem({
            user_id,
            category_id,
            item_name,
            description,
            brand,
            colour,
            identifying_features,
            location_lost,
            date_lost
        });

        const lostItem = await findLostItemById(lostItemId);

        return res.status(201).json({
            success: true,
            message: "Lost item reported successfully",
            item: lostItem
        });

    } catch (error) {

        console.error("Report lost item error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while reporting lost item"
        });
    }
};


// ============================================================
// GET ALL LOST ITEMS
// ============================================================

const getLostItems = async (req, res) => {

    try {

        const {
            search,
            category_id,
            status,
            location,
            page,
            limit
        } = req.query;


        const result = await getAllLostItems({
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

        console.error("Get lost items error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving lost items"
        });
    }
};

// ============================================================
// GET ONE LOST ITEM
// ============================================================

const getLostItem = async (req, res) => {

    try {

        const { id } = req.params;

        const item = await findLostItemById(id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Lost item not found"
            });
        }

        return res.status(200).json({
            success: true,
            item
        });

    } catch (error) {

        console.error("Get lost item error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving lost item"
        });
    }
};


module.exports = {
    reportLostItem,
    getLostItems,
    getLostItem
};