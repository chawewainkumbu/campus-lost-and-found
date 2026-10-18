/**
 * Campus Lost & Found Management System
 * Central API configuration and request handler.
 */

const API_BASE_URL = "http://localhost:5000/api";

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        ...(options.body instanceof FormData
            ? {}
            : { "Content-Type": "application/json" }),
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
    } catch (error) {
        console.error("API network error:", error);

        throw new Error(
            "Cannot reach the API. Check the server address and connection."
        );
    }

    const contentType = response.headers.get("content-type") || "";

    let data;

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (!response.ok) {
        const message =
            typeof data === "object" && data !== null
                ? data.message || data.error || "API request failed."
                : data || "API request failed.";

        throw new Error(
            `HTTP ${response.status}: ${message}`
        );
    }

    return data;
}

/**
 * GET request.
 */
async function apiGet(endpoint) {
    return apiRequest(endpoint, {
        method: "GET"
    });
}

/**
 * POST request.
 */
async function apiPost(endpoint, body) {
    return apiRequest(endpoint, {
        method: "POST",
        body: body instanceof FormData
            ? body
            : JSON.stringify(body)
    });
}

/**
 * PATCH request.
 */
async function apiPatch(endpoint, body) {
    return apiRequest(endpoint, {
        method: "PATCH",
        body: body instanceof FormData
            ? body
            : JSON.stringify(body)
    });
}

/**
 * PUT request.
 */
async function apiPut(endpoint, body) {
    return apiRequest(endpoint, {
        method: "PUT",
        body: body instanceof FormData
            ? body
            : JSON.stringify(body)
    });
}

/**
 * DELETE request.
 */
async function apiDelete(endpoint) {
    return apiRequest(endpoint, {
        method: "DELETE"
    });
}