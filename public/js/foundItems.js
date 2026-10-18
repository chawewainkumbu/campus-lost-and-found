"use strict";

const LostItems = {
    API_URL: "http://localhost:5000/api/lost-items",

    async request(endpoint = "", options = {}) {
        const token = localStorage.getItem("token");

        const headers = {
            ...(options.headers || {})
        };

        if (options.body) {
            headers["Content-Type"] = "application/json";
        }

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(
            `${this.API_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );

        const contentType =
            response.headers.get("content-type") || "";

        const data = contentType.includes("application/json")
            ? await response.json()
            : await response.text();

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "login.html";

            throw new Error("Your session has expired.");
        }

        if (!response.ok) {
            throw new Error(
                typeof data === "object" && data !== null
                    ? data.message || data.error || "Lost-item request failed."
                    : data || "Lost-item request failed."
            );
        }

        return data;
    },

    async getAll() {
        return this.request();
    },

    async report(item) {
        if (!item || !item.item_name || !item.category_id) {
            throw new Error(
                "An item name and category are required."
            );
        }

        return this.request("", {
            method: "POST",
            body: JSON.stringify(item)
        });
    },

    async getById(id) {
        if (!id) {
            throw new Error("A lost-item ID is required.");
        }

        return this.request(`/${encodeURIComponent(id)}`);
    }
};

window.LostItems = LostItems;