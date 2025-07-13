"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactsModel = void 0;
const mongoose_1 = require("mongoose");
const slugify_1 = require("../Utils/slugify");
const contactSchema = new mongoose_1.Schema({
    name: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        displayName: { type: String, required: true },
        slug: {
            type: String,
            required: true,
            unique: true,
            set: slugify_1.slugify,
            lowercase: true,
        },
    },
    description: { type: String, default: '' },
    phone: {
        number: { type: String, required: true },
        countryCode: { type: String, required: true },
    },
    tagID: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tag', required: true },
    userID: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true,
});
exports.ContactsModel = (0, mongoose_1.model)('Contact', contactSchema);
