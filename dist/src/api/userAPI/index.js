"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userServices_1 = require("../../services/userServices");
const router = express_1.default.Router();
router.route('/').get(userServices_1.allUsers).post(userServices_1.createUser);
router.route('/:id').get(userServices_1.getUserById).patch(userServices_1.updateUser).delete(userServices_1.deleteUser);
exports.default = router;
