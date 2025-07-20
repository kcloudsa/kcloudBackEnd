"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userServices_1 = require("../../services/userServices");
const rentalSevices_1 = require("../../services/rentalSevices");
const moveTypeServices_1 = require("../../services/rentalSevices/moveTypeServices");
const rentalSource_1 = require("../../services/rentalSevices/rentalSource");
const router = express_1.default.Router();
router.route('/').get(rentalSevices_1.getAllRentals).post(rentalSevices_1.createRental);
router.route('/movetype').get(moveTypeServices_1.getmoveTypes).post(moveTypeServices_1.createMoveType);
router.route('/rentalsource').get(rentalSource_1.getRentalSources).post(rentalSource_1.createRentalSource);
router.route('/:id').get(userServices_1.getUserById).patch(userServices_1.updateUser).delete(userServices_1.deleteUser);
exports.default = router;
