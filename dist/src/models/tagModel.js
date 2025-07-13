"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tag = void 0;
const mongoose_1 = require("mongoose");
const slugify_1 = require("../Utils/slugify");
const tagSchema = new mongoose_1.Schema({
    tagName: {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            set: slugify_1.slugify,
            lowercase: true,
        },
    },
}, {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
});
exports.Tag = (0, mongoose_1.model)('Tag', tagSchema);
