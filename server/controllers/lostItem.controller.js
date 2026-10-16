const { validationResult } = require("express-validator");
const matchingService = require("../services/matching.service");
const {
    createLostItem,
    getAllLostItems,
    findLostItemById,
    getMyLostItems
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
// Generate potential matches without failing the report itself
// if matching encounters an unexpected error.
try {
    await matchingService.findMatchesForLostItem(lostItemId);
} catch (matchingError) {
    console.error("Automatic matching for lost item failed:", matchingError);
}
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

// ============================================================
// GET MY LOST ITEMS
// ============================================================

const getMyLostItemsController = async (req, res) => {
    try {
        const userId = req.user.id;

        const items = await getMyLostItems(userId);

        return res.status(200).json({
            success: true,
            count: items.length,
            items
        });

    } catch (error) {
        console.error("Get my lost items error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving your lost items"
        });
    }
};

module.exports = {
    reportLostItem,
    getLostItems,
    getLostItem,
    getMyLostItemsController
};