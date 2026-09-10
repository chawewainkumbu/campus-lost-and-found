const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/auth.middleware");

const {
    reportFoundItem,
    getFoundItems,
    getFoundItem
} = require("../controllers/foundItem.controller");

const createFoundItemValidator = require("../validators/foundItem.validator");


// ============================================================
// GET ALL FOUND ITEMS
// ============================================================

router.get(
    "/",
    getFoundItems
);


// ============================================================
// GET ONE FOUND ITEM
// ============================================================

router.get(
    "/:id",
    getFoundItem
);


// ============================================================
// REPORT FOUND ITEM
// ============================================================

router.post(
    "/",
    authenticate,
    createFoundItemValidator,
    reportFoundItem
);


module.exports = router;