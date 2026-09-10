const { body } = require("express-validator");

const createLostItemValidator = [

    body("category_id")
        .isInt({ min: 1 })
        .withMessage("A valid category is required"),

    body("item_name")
        .trim()
        .notEmpty()
        .withMessage("Item name is required")
        .isLength({ max: 150 })
        .withMessage("Item name cannot exceed 150 characters"),

    body("description")
        .trim()
        .notEmpty()
        .withMessage("Description is required"),

    body("brand")
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 100 })
        .withMessage("Brand cannot exceed 100 characters"),

    body("colour")
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 50 })
        .withMessage("Colour cannot exceed 50 characters"),

    body("identifying_features")
        .optional({ nullable: true })
        .trim(),

    body("location_lost")
        .trim()
        .notEmpty()
        .withMessage("Location lost is required")
        .isLength({ max: 255 })
        .withMessage("Location cannot exceed 255 characters"),

    body("date_lost")
        .isISO8601()
        .withMessage("A valid lost date is required")
];

module.exports = createLostItemValidator;