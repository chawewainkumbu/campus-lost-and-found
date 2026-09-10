const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/auth.middleware");

const {
    reportLostItem,
    getLostItems,
    getLostItem
} = require("../controllers/lostItem.controller");

const createLostItemValidator = require("../validators/lostItem.validator");


// ============================================================
// GET ALL LOST ITEMS
// ============================================================

router.get(
    "/",
    getLostItems
);


// ============================================================
// GET ONE LOST ITEM
// ============================================================

router.get(
    "/:id",
    getLostItem
);


// ============================================================
// REPORT LOST ITEM
// ============================================================

router.post(
    "/",
    authenticate,
    createLostItemValidator,
    reportLostItem
);


module.exports = router;