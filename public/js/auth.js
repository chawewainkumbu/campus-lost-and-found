/**
 * Campus Lost & Found Management System
 * Authentication helpers.
 */

const Auth = {
    /**
     * Retrieve the stored authentication token.
     */
    getToken() {
        return localStorage.getItem("token");
    },

    /**
     * Retrieve the logged-in user's information.
     */
    getUser() {
        try {
            const user = localStorage.getItem("user");
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error("Unable to read stored user information:", error);
            return null;
        }
    },

    /**
     * Check whether a user is logged in.
     */
    isAuthenticated() {
        return Boolean(this.getToken());
    },

    /**
     * Check whether the logged-in user has one of the specified roles.
     */
    hasRole(...roles) {
        const user = this.getUser();

        if (!user) {
            return false;
        }

        return roles.includes(user.role);
    },

    /**
     * Log out the current user.
     */
    logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "login.html";
    },

    /**
     * Redirect users to the appropriate dashboard.
     */
    redirectToDashboard() {
        const user = this.getUser();

        if (!user) {
            window.location.href = "login.html";
            return;
        }

        if (["admin", "super_admin"].includes(user.role)) {
            window.location.href = "admin-dashboard.html";
        } else {
            window.location.href = "dashboard.html";
        }
    }
};