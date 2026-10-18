"use strict";

const Claims = {
    API_URL: "http://localhost:5000/api/claims",

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

        if (!response.ok) {
            throw new Error(
                typeof data === "object" && data !== null
                    ? data.message || data.error || "Claim request failed."
                    : data || "Claim request failed."
            );
        }

        return data;
    },

    async getMine() {
        return this.request("/my-claims");
    },

    async getAll() {
        return this.request();
    },

    async submit(claim) {
        if (!claim || !claim.found_item_id) {
            throw new Error("A found-item ID is required.");
        }

        return this.request("", {
            method: "POST",
            body: JSON.stringify(claim)
        });
    },

    async updateStatus(claimId, status, notes = "") {
        if (!claimId) {
            throw new Error("A claim ID is required.");
        }

        if (!["approved", "rejected"].includes(status)) {
            throw new Error(
                "Status must be approved or rejected."
            );
        }

        return this.request(
            `/${encodeURIComponent(claimId)}/status`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    status,
                    verification_notes: notes
                })
            }
        );
    }
};

window.Claims = Claims;