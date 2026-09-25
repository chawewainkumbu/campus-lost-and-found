const pool = require("../config/database");

// ============================================================
// CREATE NOTIFICATION
// ============================================================

const createNotification = async (notificationData) => {
    const {
        user_id,
        title,
        message,
        type = "system"
    } = notificationData;

    const [result] = await pool.execute(
        `
        INSERT INTO notifications
        (
            user_id,
            title,
            message,
            type
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            user_id,
            title,
            message,
            type
        ]
    );

    return result.insertId;
};


// ============================================================
// GET USER NOTIFICATIONS
// ============================================================

const getNotificationsForUser = async (userId) => {

    const [rows] = await pool.execute(
        `
        SELECT
            id,
            user_id,
            title,
            message,
            type,
            is_read,
            created_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        `,
        [userId]
    );

    return rows;
};


// ============================================================
// GET UNREAD NOTIFICATIONS
// ============================================================

const getUnreadNotifications = async (userId) => {

    const [rows] = await pool.execute(
        `
        SELECT
            id,
            user_id,
            title,
            message,
            type,
            is_read,
            created_at
        FROM notifications
        WHERE user_id = ?
          AND is_read = 0
        ORDER BY created_at DESC
        `,
        [userId]
    );

    return rows;
};


// ============================================================
// MARK NOTIFICATION AS READ
// ============================================================

const markNotificationAsRead = async (id, userId) => {

    const [result] = await pool.execute(
        `
        UPDATE notifications
        SET is_read = 1
        WHERE id = ?
          AND user_id = ?
        `,
        [id, userId]
    );

    return result.affectedRows;
};


// ============================================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================================

const markAllNotificationsAsRead = async (userId) => {

    const [result] = await pool.execute(
        `
        UPDATE notifications
        SET is_read = 1
        WHERE user_id = ?
          AND is_read = 0
        `,
        [userId]
    );

    return result.affectedRows;
};


module.exports = {
    createNotification,
    getNotificationsForUser,
    getUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};