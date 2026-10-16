const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/auth.middleware");

const {
    reportLostItem,
    getLostItems,
    getLostItem,
    getMyLostItemsController
} = require("../controllers/lostItem.controller");

const createLostItemValidator = require("../validators/lostItem.validator");


// ============================================================
// GET MY LOST ITEMS
// Must appear before GET /:id
// ============================================================

router.get(
    "/my-items",
    authenticate,
    getMyLostItemsController
);


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