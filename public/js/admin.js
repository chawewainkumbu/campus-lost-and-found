/*
 * Campus Lost & Found Management System
 * Administrator JavaScript
 */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const API_BASE_URL = "http://localhost:5000/api";

    // --------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------

    function getToken() {
        return localStorage.getItem("token");
    }

    function getUser() {
        try {
            const storedUser = localStorage.getItem("user");
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            console.error("Unable to read user information:", error);
            return null;
        }
    }

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "login.html";
    }

    function requireAdmin() {
        const token = getToken();
        const user = getUser();

        if (!token || !user) {
            window.location.href = "login.html";
            return false;
        }

        const permittedRoles = ["admin", "super_admin"];

        if (!permittedRoles.includes(user.role)) {
            window.location.href = "dashboard.html";
            return false;
        }

        return true;
    }

    // --------------------------------------------------
    // API REQUESTS
    // --------------------------------------------------

    async function apiRequest(endpoint, options = {}) {
        const token = getToken();

        const headers = {
            ...(options.headers || {}),
            ...(options.body ? {
                "Content-Type": "application/json"
            } : {}),
            ...(token ? {
                "Authorization": `Bearer ${token}`
            } : {})
        };

        let response;

        try {
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers
            });
        } catch (error) {
            console.error("API connection failed:", error);
            throw new Error(
                "Unable to connect to the server. Check that the API is running."
            );
        }

        const contentType = response.headers.get("content-type") || "";
        let data;

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (response.status === 401) {
            logout();
            throw new Error("Your session has expired. Please log in again.");
        }

        if (response.status === 403) {
            throw new Error("You do not have permission to perform this action.");
        }

        if (!response.ok) {
            const message =
                typeof data === "object" && data !== null
                    ? data.message || data.error || "The request failed."
                    : data || "The request failed.";

            throw new Error(message);
        }

        return data;
    }

    // --------------------------------------------------
    // USER INTERFACE HELPERS
    // --------------------------------------------------

    function showMessage(message, type = "info") {
        let messageElement = document.getElementById("admin-message");

        if (!messageElement) {
            messageElement = document.createElement("div");
            messageElement.id = "admin-message";
            messageElement.setAttribute("role", "status");
            messageElement.style.margin = "12px 0";
            messageElement.style.padding = "12px";
            messageElement.style.borderRadius = "6px";

            const main = document.querySelector("main") ||
                         document.querySelector(".content") ||
                         document.body;

            main.prepend(messageElement);
        }

        messageElement.textContent = message;
        messageElement.dataset.type = type;
        messageElement.style.display = "block";
    }

    function setText(elementId, value) {
        const element = document.getElementById(elementId);

        if (element) {
            element.textContent = value;
        }
    }

    // --------------------------------------------------
    // ADMIN DASHBOARD
    // --------------------------------------------------

    async function loadDashboard() {
        /*
         * Do not guess dashboard endpoints.
         * The dashboard HTML may already load its statistics
         * through existing scripts. This function only displays
         * the current administrator's identity when matching
         * elements are present.
         */

        const user = getUser();

        if (!user) {
            return;
        }

        const displayName =
            user.full_name ||
            user.name ||
            user.email ||
            "Administrator";

        setText("admin-name", displayName);
        setText("welcome-name", displayName);
        setText("admin-email", user.email || "");
        setText("admin-role", user.role || "admin");
    }

    // --------------------------------------------------
    // LOGOUT BUTTONS
    // --------------------------------------------------

    function setupLogoutButtons() {
        const logoutButtons = document.querySelectorAll(
            "#logoutBtn, #logout-button, [data-action='logout']"
        );

        logoutButtons.forEach(button => {
            button.addEventListener("click", event => {
                event.preventDefault();
                logout();
            });
        });
    }

    // --------------------------------------------------
    // INITIALISATION
    // --------------------------------------------------

    const currentPage = window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    const adminPages = [
        "admin-dashboard.html",
        "admin-claims.html",
        "admin-users.html"
    ];

    if (adminPages.includes(currentPage)) {
        if (!requireAdmin()) {
            return;
        }
    }

    setupLogoutButtons();
    loadDashboard();

    // --------------------------------------------------
    // PUBLIC ADMIN HELPERS
    // --------------------------------------------------

    window.Admin = {
        getToken,
        getUser,
        logout,
        apiRequest,
        showMessage,
        loadDashboard
    };

    console.log("Administrator JavaScript initialised.");
});
