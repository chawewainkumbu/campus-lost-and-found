const express = require("express");

const {
    getMyNotifications,
    getUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} = require("../controllers/notification.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();


// ============================================================
// NOTIFICATION ROUTES
// ============================================================

// Get all my notifications
router.get(
    "/",
    authMiddleware,
    getMyNotifications
);


// Get unread notifications
router.get(
    "/unread",
    authMiddleware,
    getUnreadNotifications
);


// Mark all notifications as read
router.patch(
    "/read-all",
    authMiddleware,
    markAllNotificationsAsRead
);


// Mark one notification as read
router.patch(
    "/:id/read",
    authMiddleware,
    markNotificationAsRead
);


module.exports = router;