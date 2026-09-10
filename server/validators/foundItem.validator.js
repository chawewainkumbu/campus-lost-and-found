const { body } = require("express-validator");

const createFoundItemValidator = [

    body("category_id")
        .isInt({ min: 1 })
        .withMessage("Category ID must be a valid number"),

    body("item_name")
        .trim()
        .notEmpty()
        .withMessage("Item name is required")
        .isLength({ max: 150 })
        .withMessage("Item name must not exceed 150 characters"),

    body("description")
        .trim()
        .notEmpty()
        .withMessage("Description is required"),

    body("brand")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Brand must not exceed 100 characters"),

    body("colour")
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage("Colour must not exceed 50 characters"),

    body("identifying_features")
        .optional()
        .trim(),

    body("location_found")
        .trim()
        .notEmpty()
        .withMessage("Location found is required")
        .isLength({ max: 255 })
        .withMessage("Location must not exceed 255 characters"),

    body("date_found")
        .isISO8601()
        .withMessage("Date found must be a valid date")

];

module.exports = createFoundItemValidator;