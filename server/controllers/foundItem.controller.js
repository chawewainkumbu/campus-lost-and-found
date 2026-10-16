const { validationResult } = require("express-validator");
const matchingService = require("../services/matching.service");
const {
    createFoundItem,
    getAllFoundItems,
    findFoundItemById,
    getMyFoundItems
} = require("../models/foundItem.model");


// ============================================================
// REPORT FOUND ITEM
// ============================================================
const reportFoundItem = async (req, res) => {
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

try {
    const matches =
        await matchingService.findMatchesForFoundItem(foundItemId);

    console.log(
        `Automatic matching completed for found item ${foundItemId}:`,
        matches
    );
} catch (matchingError) {
    console.error(
        "Automatic matching for found item failed:",
        matchingError
    );
}

return res.status(201).json({
    success: true,
    message: "Found item reported successfully",
    item: foundItem
});
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


// ============================================================
// GET MY FOUND ITEMS
// ============================================================

const getMyFoundItemsController = async (req, res) => {
    try {
        const userId = req.user.id;

        const items = await getMyFoundItems(userId);

        return res.status(200).json({
            success: true,
            count: items.length,
            items
        });

    } catch (error) {
        console.error("Get my found items error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving your found items"
        });
    }
};


module.exports = {
    reportFoundItem,
    getFoundItems,
    getFoundItem,
    getMyFoundItemsController
};