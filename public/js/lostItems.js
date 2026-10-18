"use strict";

const AppUI = {
    showMessage(elementId, message, type = "info") {
        const element = document.getElementById(elementId);

        if (!element) {
            console.error(`Element not found: ${elementId}`);
            return;
        }

        element.textContent = message;
        element.className = `status-message ${type}`;
        element.hidden = false;
    },

    setText(elementId, value) {
        const element = document.getElementById(elementId);

        if (element) {
            element.textContent = value ?? "";
        }
    },

    escapeHTML(value) {
        const element = document.createElement("span");
        element.textContent = String(value ?? "");
        return element.innerHTML;
    },

    formatDate(value) {
        if (!value) return "Not specified";

        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? String(value)
            : date.toLocaleDateString();
    },

    setLoading(button, loading, text = "Please wait...") {
        if (!button) return;

        if (loading) {
            button.dataset.originalText = button.textContent;
            button.disabled = true;
            button.textContent = text;
        } else {
            button.disabled = false;
            button.textContent =
                button.dataset.originalText || "Submit";
        }
    }
};

window.AppUI = AppUI;
