const {
    calculateMatchScore
} = require("./matching.service");


// ============================================================
// TEST LOST ITEM
// ============================================================

const lostItem = {
    category_id: 1,
    item_name: "Black HP Laptop",
    description: "Black HP laptop with a UNZA sticker on the lid",
    brand: "HP",
    colour: "Black",
    identifying_features: "Small scratch near the touchpad and a UNZA sticker",
    location_lost: "UNZA Main Library",
    date_lost: "2026-09-04"
};


// ============================================================
// TEST FOUND ITEM
// ============================================================

const foundItem = {
    category_id: 1,
    item_name: "Black HP Laptop",
    description: "Black HP laptop with a UNZA sticker on the lid",
    brand: "HP",
    colour: "Black",
    identifying_features: "Small scratch near the touchpad and a UNZA sticker",
    location_found: "UNZA Main Library Entrance",
    date_found: "2026-09-05"
};

// ============================================================
// CALCULATE SCORE
// ============================================================

const score = calculateMatchScore(
    lostItem,
    foundItem
);


console.log("=================================");
console.log("MATCHING TEST");
console.log("=================================");

console.log("Lost Item:", lostItem.item_name);
console.log("Found Item:", foundItem.item_name);

console.log("---------------------------------");

console.log("Match Score:", score + "%");

console.log("=================================");