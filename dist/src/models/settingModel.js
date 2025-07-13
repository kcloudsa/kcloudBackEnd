"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settings = void 0;
const mongoose_1 = require("mongoose");
const SettingsSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, unique: true },
    general: {
        currency: String,
        timezone: String,
        dateFormat: String,
        landingPage: String,
    },
    appearance: {
        language: String,
        theme: String,
        color: String,
        fontSize: String,
    },
    notifications: {
        email: Boolean,
        inApp: Boolean,
        sms: Boolean,
    },
    dataManagement: {
        autoBackup: Boolean,
    },
    branding: {
        logoUrl: String,
        subdomain: String,
    },
    legal: {
        termsAccepted: Boolean,
        cookiePrefs: Boolean,
    },
    dangerZone: {
        subscriptionStatus: String,
    },
});
exports.Settings = (0, mongoose_1.model)('Settings', SettingsSchema);
