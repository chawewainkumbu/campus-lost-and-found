const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/auth.middleware");

const {
    reportFoundItem,
    getFoundItems,
    getFoundItem,
    getMyFoundItemsController
} = require("../controllers/foundItem.controller");

const createFoundItemValidator = require("../validators/foundItem.validator");


// ============================================================
// GET MY FOUND ITEMS
// Must appear before /:id
// ============================================================

router.get(
    "/my-items",
    authenticate,
    getMyFoundItemsController
);


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