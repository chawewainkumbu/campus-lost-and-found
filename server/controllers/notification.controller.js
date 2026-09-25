const notificationModel = require("../models/notification.model");


// ============================================================
// GET MY NOTIFICATIONS
// ============================================================

const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const notifications =
            await notificationModel.getNotificationsForUser(userId);

        return res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });

    } catch (error) {
        console.error("Get Notifications Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve notifications"
        });
    }
};


// ============================================================
// GET UNREAD NOTIFICATIONS
// ============================================================

const getUnreadNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const notifications =
            await notificationModel.getUnreadNotifications(userId);

        return res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });

    } catch (error) {
        console.error("Get Unread Notifications Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve unread notifications"
        });
    }
};


// ============================================================
// MARK ONE NOTIFICATION AS READ
// ============================================================

const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const affectedRows =
            await notificationModel.markNotificationAsRead(
                id,
                userId
            );

        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification marked as read"
        });

    } catch (error) {
        console.error("Mark Notification Read Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to mark notification as read"
        });
    }
};


// ============================================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================================

const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const affectedRows =
            await notificationModel.markAllNotificationsAsRead(
                userId
            );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
            updated: affectedRows
        });

    } catch (error) {
        console.error("Mark All Notifications Read Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to mark notifications as read"
        });
    }
};


module.exports = {
    getMyNotifications,
    getUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};
