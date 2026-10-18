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
    try {
        // Check validation errors.
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Please correct the submitted information.",
                errors: errors.array()
            });
        }

        // Obtain the authenticated user's ID.
        // Your authentication middleware should populate req.user.
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please log in again."
            });
        }

        // Extract the submitted form data.
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

        // Validate required fields.
        if (
            !category_id ||
            !item_name?.trim() ||
            !description?.trim() ||
            !location_found?.trim() ||
            !date_found
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required found-item details."
            });
        }

        // Create the found-item record.
        const foundItemId = await createFoundItem({
            user_id: userId,
            category_id: Number(category_id),
            item_name: item_name.trim(),
            description: description.trim(),
            brand: brand?.trim() || null,
            colour: colour?.trim() || null,
            identifying_features:
                identifying_features?.trim() || null,
            location_found: location_found.trim(),
            date_found
        });

        // Retrieve the newly created item.
        const foundItem = await findFoundItemById(foundItemId);

        if (!foundItem) {
            console.error(
                "Found item was created but could not be retrieved:",
                foundItemId
            );

            return res.status(500).json({
                success: false,
                message: "The item was submitted, but its details could not be retrieved."
            });
        }

        // Automatically search for possible matches.
        // Matching failure should not invalidate a successful report.
        try {
            const matches =
                await matchingService.findMatchesForFoundItem(foundItemId);

            console.log(
                `Automatic matching completed for found item ${foundItemId}.`,
                matches
            );

        } catch (matchingError) {
            console.error(
                "Automatic matching for found item failed:",
                matchingError
            );
        }

        // Return success.
        return res.status(201).json({
            success: true,
            message: "Found item reported successfully.",
            item: foundItem
        });

    } catch (error) {
        console.error("Report found item error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while reporting found item.",
            ...(process.env.NODE_ENV !== "production" && {
                error: error.message
            })
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
            message: "Server error while retrieving found items."
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
                message: "Found item not found."
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
            message: "Server error while retrieving found item."
        });
    }
};


// ============================================================
// GET MY FOUND ITEMS
// ============================================================

const getMyFoundItemsController = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

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
            message: "Server error while retrieving your found items."
        });
    }
};


// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
    reportFoundItem,
    getFoundItems,
    getFoundItem,
    getMyFoundItemsController
};